import Cycle from '@cycle/core'
import {div, h1, button, video, makeDOMDriver} from '@cycle/dom'
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

function main(sources) {
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

  const recordedBlobs$ = sources.mediaRecorder.events('start')
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
    .scan( (records, blob) => {
      records.push(blob)
      return records
    }, [])
    .startWith(null) // Start with a null value so state$ exists from the beginning

  const state$ = Rx.Observable.combineLatest(
    userMediaURL$,
    recorderState$,
    recordedBlobs$,
    (url, state, blobs) => {
      console.log('State Changed:', {url, state, blobs})
      return {url, state, blobs}
    }
  )

  const vtree$ = state$
    .map( ({url, state, blob}) => {
      return div('.app-container', [
        div('.header', [
          h1('Photo Booth')
        ]),
        div('.content', [
          video({src: url, autoplay: true, controls: false, muted: true}),
        ]),
        div('.footer', [
          button('.toggle-record-btn', {innerHTML: videocamSvg})
        ])
      ])
    })

  const sinks = {
    DOM: vtree$,
    mediaRecorder: userMediaStream$
  }
  return sinks
}

const drivers = {
  DOM           : makeDOMDriver('#app'),
  userMedia     : makeUserMediaDriver({audio: true, video: true}),
  mediaRecorder : makeMediaRecorderDriver()
};

Cycle.run(main, drivers);