import Rx from 'rx'

// see https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
export function makeUserMediaDriver (constraints = {audio: true}) {
  return function() {
    return Rx.Observable.fromPromise(navigator.mediaDevices.getUserMedia(constraints))
  }
}