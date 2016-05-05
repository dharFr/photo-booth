import Cycle from '@cycle/core'
import {div, h1, button, video, makeDOMDriver} from '@cycle/dom'
import {makeUserMediaDriver} from './drivers/userMediaDriver.js'
import videocamSvg from './svg/ic_videocam_48px.svg'

function main(sources) {
  const userStreamURL$ = sources.userMedia
    .startWith(null)
    .map(stream => {
      return stream ? URL.createObjectURL(stream) : ''
    })

  const recordBtnClick$ = sources.DOM
    .select('.toggle-record-btn').events('click')

  const sinks = {
    DOM: userStreamURL$
      .map(url => {
        return div('.app-container', [
          div('.header', [
            h1('Photo Booth')
          ]),
          div('.content', [
            video({autoplay: true, controls: false, muted: true, src:url}),
          ]),
          div('.footer', [
            button('.toggle-record-btn', {innerHTML: videocamSvg})
          ])
        ])
      })
  }
  return sinks
}

const drivers = {
  DOM: makeDOMDriver('#app'),
  userMedia: makeUserMediaDriver({audio: true, video: true})
};

Cycle.run(main, drivers);