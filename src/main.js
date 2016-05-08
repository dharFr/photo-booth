import Cycle from '@cycle/core'
import {div, h1, ul, li, button, video, makeDOMDriver} from '@cycle/dom'
import {makeUserMediaDriver}     from './drivers/userMediaDriver.js'
import {makeMediaRecorderDriver} from './drivers/mediaRecorderDriver.js'
import videocamSvg from './svg/ic_videocam_48px.svg'
import Rx from 'rx'

// Utility function
function getSupportedMimeType () {
  let options
  if (typeof MediaRecorder.isTypeSupported === `function`) {
    if (MediaRecorder.isTypeSupported(`video/webm;codecs=vp9`)) {
      options = {type: `video/webm, codecs=vp9`};
    } else if (MediaRecorder.isTypeSupported(`video/webm;codecs=vp8`)) {
       options = {type: `video/webm, codecs=vp8`};
    } else {
      console.warn(`Couldn't find any supported Mime Type.`)
    }
  } else {
    console.warn(`MediaRecorder.isTypeSupported() is not defined.`)
  }
  return options;
}

function renderVideoView(url) {
  return div('.video-container', [
    video({src: url, autoplay: true, controls: false, muted: true})
  ])
}

function renderRecordsView(records) {
  return (records && records.length) ? div('.records', [
    div('.records-list-wrapper', [
      ul('.records-list', records.map( ({idx}) =>
        li('.records-item', `${idx}`)
      ))
    ])
  ]) : null
}

function renderControlBar() {
  return div('.footer', [
    button('.toggle-record-btn', {innerHTML: videocamSvg})
  ])
}

function intent(sources) {

  const userMediaStream$ = sources.userMedia
  const userMediaURL$    = userMediaStream$
    .map(stream => URL.createObjectURL(stream))
    .startWith('')

  const recorderState$ =  sources.mediaRecorder.observable
    .flatMap( recorder => {
      return sources.DOM
        .select(`.toggle-record-btn`).events(`click`)
        .map( _ => {
          if (recorder.state === `recording`) {
            console.log(`Stop Recorder`)
            recorder.stop()
          }
          else {
            console.log('Start Recorder')
            recorder.start()
          }
          return recorder.state
        })
    })
    .startWith('inactive')

  const records$ = sources.mediaRecorder.events('start')
    .flatMap( _ => {
      return sources.mediaRecorder.events('dataavailable')
        .takeUntil(sources.mediaRecorder.events('stop'))
        .map( ({data}) => data)
        .reduce( (recordedChunks, data) => {
          if (data && data.size > 0) {
            recordedChunks.push(data)
          }
          return recordedChunks
          }, [])
        .map( recordedChunks => new Blob(recordedChunks, getSupportedMimeType()))
    })
    .scan( (records, blob, idx) => {
      records.push({idx, blob})
      return records
    }, [])
    .startWith(null) // Start with a null value so state$ exists from the beginning

  return {
    userMediaStream$,
    userMediaURL$,
    recorderState$,
    records$
  }
}

function model({userMediaURL$, recorderState$, records$}) {
  return Rx.Observable.combineLatest(
    userMediaURL$,
    recorderState$,
    records$,
    (url, state, records) => {
      console.log('State Changed:', {url, state, records})
      return {url, state, records}
    }
  )
}

function view(state$) {
  return state$.map( ({url, state, records}) =>
    div('.app-container', [
      div('.header', [
        h1('Photo Booth')
      ]),
      renderVideoView(url),
      renderRecordsView(records),
      renderControlBar()
    ])
  )
}

function main(sources) {
  const actions = intent(sources)
  const state$  = model(actions);
  const sinks   = {
    DOM: view(state$),
    mediaRecorder: actions.userMediaStream$
  }
  return sinks
}

const drivers = {
  DOM           : makeDOMDriver('#app'),
  userMedia     : makeUserMediaDriver({
    audio: true,
    video: {
      mandatory: {
        minWidth: 1280,
        minHeight: 720
      },
      optionnal: {
        facingMode: "user"
      }
    }
  }),
  mediaRecorder : makeMediaRecorderDriver()
};

Cycle.run(main, drivers);