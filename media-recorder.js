
let startBtn  = document.querySelector('#startBtn')
let stopBtn   = document.querySelector('#stopBtn')
let replayBtn = document.querySelector('#replayBtn')
let uploadBtn = document.querySelector('#uploadBtn')
let saveBtn   = document.querySelector('#saveBtn')
let video     = document.querySelector('#video')
let recordedChunks = []
let recorder

function visualize (stream) {
  video.src = URL.createObjectURL(stream)
}

function getSupportedMimeType () {
  let options
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
    options = {type: 'video/webm, codecs=vp9'};
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
     options = {type: 'video/webm, codecs=vp8'};
  } else {
    console.warn('Couldn\'t find any supported Mime Type.')
  }
  return options;
}

function createRecorder (stream) {
  recorder = new MediaRecorder(stream, getSupportedMimeType())
  startBtn.disabled = false

  recorder.addEventListener('start', (e) => {
    console.log('start:', e)
    visualize(stream)
    recordedChunks = []
    startBtn.disabled  = true
    replayBtn.disabled = true
    uploadBtn.disabled = true
    saveBtn.disabled   = true
    stopBtn.disabled   = false
  })

  recorder.addEventListener('stop', (e) => {
    console.log('stop:', e)
    stopBtn.disabled   = true
    replayBtn.disabled = false
    uploadBtn.disabled = false
    saveBtn.disabled   = false
    startBtn.disabled  = false
  })

  recorder.addEventListener('dataavailable', (e) => {
      // e.data contains the audio data! let's associate it to an <audio> element
      // video.src = URL.createObjectURL(e.data)
    console.log('dataavailable:', e.data)
    if (e.data.size > 0) {
      recordedChunks.push(e.data)
    } else {
      console.log('empty chunk')
    }
  })
}

function upload () {
  const API_KEY = '217ec1f4e64a97631f78'

  DM.init({
    apiKey: API_KEY,
    status: true, // check login status
    cookie: true // enable cookies to allow the server to access the session
  });

  DM.login((resp) => {
    if (resp.session)
    {
      if (resp.session.scope)
      {
        // user is logged in and granted some permissions.
        // perms is a comma separated list of granted permissions
        console.log('user is logged in and granted some permissions')
        DM.api('/file/upload', ({upload_url, progress_url}) => {
          console.log('>>>> Got upload URL', upload_url)

          let formData = new FormData
          formData.append('file', new Blob(recordedChunks, getSupportedMimeType()), "upload.webm")

          fetch(upload_url, {
            method: 'POST',
            body: formData
          })
            .then( (response) => {
              console.log('>>> File uploaded:', response)
              return response
            })
            .catch( (err) => {
              console.log('>>> Upload error:', err)
            })
            .then( response => {
              DM.api('/videos', 'POST', {
                url: response.url,
                title: 'Test Upload',
                channel: 'news',
                published: true
              }, (resp) => {
                console.log('>>>>> Created Video:', resp)
              })
            })
        })
      }
      else
      {
        // user is logged in, but did not grant any permissions
        console.log('user is logged in, but did not grant any permissions')
      }
    }
    else
    {
      // user is not logged in
      console.log('user is not logged in')
    }
  }, {scope: 'read write manage_videos'})
}

function save () {
  blob = new Blob(recordedChunks, getSupportedMimeType())
  url = window.URL.createObjectURL(blob)

  var a = document.createElement('a')
  document.body.appendChild(a)
  a.style = 'display: none'
  a.href = url
  a.download = 'test.webm'
  a.click()

  window.URL.revokeObjectURL(url)
}

startBtn.addEventListener('click',  _ => recorder.start())
stopBtn.addEventListener('click',   _ => recorder.stop())
replayBtn.addEventListener('click', _ => {
  blob = new Blob(recordedChunks, getSupportedMimeType())
  video.src = window.URL.createObjectURL(blob)
})
uploadBtn.addEventListener('click', _ => upload())
saveBtn.addEventListener('click',   _ => save())

startBtn.disabled  = true
stopBtn.disabled   = true
replayBtn.disabled = true
uploadBtn.disabled = true
saveBtn.disabled   = true

navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true
}).then((stream) => {
  // do something with the stream
  console.log('>>> Got a stream :', stream)
  visualize(stream)
  createRecorder(stream)
}).catch( (err) => {
  console.error('Something went wrong:', err);
});