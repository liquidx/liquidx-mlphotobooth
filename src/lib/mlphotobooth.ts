import { FaceReco } from './facereco.js'
import { face as faceAlastair } from './face_at.js'
import { FaceView } from './faceview.js'

let _currentVideoDevice: string = '';

let _faceViewer: null | FaceView = null
let _faceReco: null | FaceReco = null
let _options = {
  debug: false,
  showPreview: false
}

let _sourcesElement: null | HTMLSelectElement = null;
let _loaderElement: null | HTMLDivElement = null;
let _sceneElement: null | HTMLCanvasElement = null;

const faceViewerInit = (sceneElement: null | HTMLCanvasElement) => {
  if (!_faceViewer) {
    // _stats.showPanel(0)
    // document.body.appendChild( _stats.dom );
    let size = { width: 640, height: 480 }
    if (document.body.clientWidth < size.width) {
      size.width = document.body.clientWidth - 40;
    }
    _faceViewer = new FaceView(sceneElement, size.width, size.height)
    _faceViewer.animate()
  }
  return _faceViewer;
}

const faceRecoInit = (videoElement: HTMLVideoElement, previewElement: HTMLCanvasElement) => {
  if (!_faceReco) {
    _faceReco = new FaceReco(videoElement, previewElement);
  }
  return _faceReco;
}

const setLoading = (isLoading: boolean) => {
  if (_loaderElement) {
    if (isLoading) {
      _loaderElement.classList.remove('hide')
    } else {
      _loaderElement.classList.add('hide')
    }
  }
}

const populateSourceSelector = (sources: HTMLSelectElement | null) => {
  if (sources) {
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
}

const restartRecognition = (faceReco: null | FaceReco, faceViewer: null | FaceView) => {
  if (faceReco && faceViewer) {
    faceReco.start((predictions: any) => {
      setLoading(false)
      if (faceViewer) {
        faceViewer.updateFaceWithPredictions(predictions)
      }
    })
  }
}

export const onCaptureDownload = () => {
  if (_faceViewer) {
    _faceViewer.capture((dataURL: string) => {
      console.log(dataURL)
      const link = document.querySelector('#downloadLink') as HTMLAnchorElement
      link.download = 'image.png'
      link.href = dataURL
      link.click()

    })
  }
}

export const onStopRecognition = () => {
  if (_faceReco) {
    _faceReco.stop()
  }
}

export const onStartRecognition = () => {
  setLoading(true)
  if (_faceReco && _faceViewer) {
    _faceReco.setup()
    faceViewerInit()
    _faceViewer.computeMeshIndex(_faceReco.getUVCoords())
    _faceReco.startVideo(_currentVideoDevice).then(() => {
      restartRecognition(_faceReco, _faceViewer)

    })
  }
}

export const onSelectDevice = (e: Event) => {
  if (_sourcesElement) {
    _currentVideoDevice = _sourcesElement.value
    // Changing video device is a little convulted because we need to stop
    // the recognition and restart it.
    console.log('select device', sources.value)
    if (_faceReco && _faceReco.running) {
      _faceReco.stop()
      _faceReco.startVideo(_currentVideoDevice).then(() => {
        restartRecognition(_faceReco, _faceViewer)
      })
    }
  }
}

export const initPhotoBooth = (elements: {
  loaderElement: HTMLDivElement | null,
  sourcesElement: HTMLSelectElement | null,
  videoElement: HTMLVideoElement | null,
  previewElement: HTMLCanvasElement | null,
  sceneElement: HTMLCanvasElement | null
}) => {
  _loaderElement = elements.loaderElement;
  _sourcesElement = elements.sourcesElement
  _sceneElement = elements.sceneElement
  if (elements.videoElement && elements.previewElement) {
    const faceViewer = faceViewerInit(_sceneElement)
    const faceReco = faceRecoInit(elements.videoElement, elements.previewElement)
    populateSourceSelector(_sourcesElement)
    faceViewer.computeMeshIndex(faceReco.getUVCoords())
    faceViewer.updateFaceWithPredictions([faceAlastair])
  }
}
