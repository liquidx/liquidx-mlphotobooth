import { FaceReco } from './facereco'
import { face as faceAlastair } from './face_at'
import { points as facePatricia } from './face_pp'
import { FaceView } from './faceview'
import { GUI } from 'dat.gui'
import * as Stats from 'stats.js'

let _currentVideoDevice = null;

let _faceViewer = null
let _faceReco = null
let _datgui = new GUI()
let _stats = new Stats()
let _options = {
  debug: false,
  showPreview: false
}

const faceViewerInit = () => {
  if (!_faceViewer) {
    // _stats.showPanel(0)
    // document.body.appendChild( _stats.dom );
    const scene = document.querySelector('#scene')
    let size = { width: 640, height: 480 }
    if (document.body.clientWidth < size.width) {
      size.width = document.body.clientWidth - 40;
    }
    _faceViewer = new FaceView(scene, size.width, size.height, _datgui, _stats)
    document.querySelector('#faceViewer').appendChild(_faceViewer.canvas)
    _faceViewer.animate()
  }
}

const faceRecoInit = () => {
  if (!_faceReco) {
    _faceReco = new FaceReco(
      document.querySelector('#video'),
      document.querySelector('canvas#preview')
    )
  }
}

const setLoading = (isLoading) => {
  let loader = document.querySelector('#loader')
  if (isLoading) {
    loader.classList.remove('hide')
  } else {
    loader.classList.add('hide')
  }
}

const debugInit = () => {
  _datgui.add(_options, 'showPreview').onFinishChange(() => {
    let preview = document.querySelector('#preview')
    if (_options.showPreview) {
      preview.classList.remove('hide')
    } else {
      preview.classList.add('hide')
    }
  })
  _datgui.add(_options, 'debug').onFinishChange(() => {
    let elem = document.querySelector('#debugConsole')
    if (_options.debug) {
      elem.classList.remove('hide')
    } else {
      elem.classList.add('hide')
    }
  }) 
  
  _datgui.close()
}

const populateSourceSelector = () => {
  const sources = document.querySelector("#sources");

  navigator.mediaDevices.enumerateDevices().then((devices) => {
    devices.forEach((device) => {
      if (device.kind == "videoinput") {
        const optionElement = document.createElement("option");
        optionElement.setAttribute("value", device.deviceId);
        if (_currentVideoDevice == device.deviceId) {
          optionElement.setAttribute("selected", "1");
        }
        optionElement.innerText = device.label;
        sources.appendChild(optionElement);
      }
    });
  });
}

const initDemos = () => {
  debugInit()
  faceViewerInit()
  faceRecoInit()
  populateSourceSelector()
  _faceViewer.computeMeshIndex(_faceReco.getUVCoords())
  _faceViewer.updateFaceWithPredictions([faceAlastair])

  document.querySelector('#faceDemoStart').addEventListener('click', e => {
    e.preventDefault()
    setLoading(true)
    _faceReco.setup()
    faceViewerInit()
    _faceViewer.computeMeshIndex(_faceReco.getUVCoords())
    _faceReco.startVideo(_currentVideoDevice).then(() => {
      _faceReco.start((predictions) => {
        setLoading(false)
        _faceViewer.updateFaceWithPredictions(predictions)
      })
    })
   
  })

  document.querySelector('#faceDemoStop').addEventListener('click', e => {
    e.preventDefault()
    _faceReco.stop()
  })

  document.querySelector('#faceDemoCapture').addEventListener('click', e => {
    e.preventDefault()
    _faceViewer.capture((dataURL) => {
      console.log(dataURL)
      const link = document.querySelector('#downloadLink')
      link.download = 'image.png'
      link.href = dataURL
      link.click()
    })
  })

  const sources = document.querySelector('#sources')
  sources.addEventListener('change', () => {
    _currentVideoDevice = sources.value
    // Changing video device is a little convulted because we need to stop
    // the recognition and restart it.
    if (_faceReco.running) {
      _faceReco.stop()
      _faceReco.startVideo(_currentVideoDevice).then(() => {
        _faceReco.start((predictions) => {
          setLoading(false)
          _faceViewer.updateFaceWithPredictions(predictions)
        })
      })
    }
  })
}

const main = () => {
  initDemos()
}

document.addEventListener('DOMContentLoaded', main)