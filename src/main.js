import Cycle from '@cycle/core';
import {div, h1, video, makeDOMDriver} from '@cycle/dom';
import {makeUserMediaDriver} from './drivers/userMediaDriver.js';

function main(sources) {
  const userStreamURL$ = sources.userMedia
    .startWith(null)
    .map(stream => {
      return stream ? URL.createObjectURL(stream) : ''
    })
  const sinks = {
    DOM: userStreamURL$
      .map(url => {
        return div('.app-container', [
          div('.head', [
            h1('Photo Booth')
          ]),
          div('.content', [
            video({autoplay: true, controls: false, muted: true, src:url})
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