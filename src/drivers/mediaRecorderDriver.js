import Rx from 'rx'

function fromRecorderEvent(recorder, eventName) {
  return Rx.Observable.fromEventPattern(
    function addListener (h) {
      recorder.addEventListener(eventName, h);
    },
    function removeListener (h) {
      recorder.removeEventListener(eventName, h);
    }
  );
}

function makeEventsSelector(recorder$) {
  return function events(eventName, options = {}) {
    if (typeof eventName !== `string`) {
      throw new Error(`MediaRecorder driver's events() expects argument to ` +
        `be a string representing the event type to listen for.`)
    }

    return recorder$
      .flatMap(recorder => {
        return Rx.Observable.if(
          (_ => recorder !== null),
          fromRecorderEvent(recorder, eventName),
          Rx.Observable.just(null)
        )
      })
  }
}

export function makeMediaRecorderDriver() {

  return function mediaRecorderDriver(userMedia$) {

    const recorder$ = userMedia$.map(stream => {
      if (stream) {
        console.log(`>>> Creating a new MediaRecorder instance`)
      }
      return stream ? new MediaRecorder(stream) : null
    })
    .shareReplay() // MediaRecorder must be created once
    // Use `shareReplay()` instead of `share()` so the Observables produced by
    // events() will be able to work even when called long time after the
    // recorder has been created.

    return {
      observable : recorder$,
      events     : makeEventsSelector(recorder$)
    }
  }
}