import { FaceReco } from './facereco.js';
import { faces as facesAlastair } from './face_at.js';
import { FaceView } from './faceview.js';
let _currentVideoDevice = '';
let _faceViewer = null;
let _faceReco = null;
const _faceViewerOptions = {
    onlyShowHalfFace: true, // Draw only half the face.
};
let _sourcesElement = null;
let _loaderElement = null;
let _sceneElement = null;
const faceViewerInit = (sceneElement, options) => {
    if (!_faceViewer) {
        // _stats.showPanel(0)
        // document.body.appendChild( _stats.dom );
        let size = { width: 640, height: 480 };
        if (document.body.clientWidth < size.width) {
            size.width = document.body.clientWidth - 40;
        }
        _faceViewer = new FaceView(sceneElement, size.width, size.height, options);
        _faceViewer.animate();
    }
    return _faceViewer;
};
const faceRecoInit = (videoElement, previewElement) => {
    if (!_faceReco) {
        _faceReco = new FaceReco(videoElement, previewElement);
    }
    return _faceReco;
};
const setLoading = (isLoading) => {
    if (_loaderElement) {
        if (isLoading) {
            _loaderElement.classList.remove('hide');
        }
        else {
            _loaderElement.classList.add('hide');
        }
    }
};
const populateSourceSelector = (sources) => {
    return navigator.mediaDevices.enumerateDevices().then((devices) => {
        //console.log('populateSourceSelector', devices)
        if (sources) {
            while (sources.firstChild) {
                sources.removeChild(sources.firstChild);
            }
        }
        devices.forEach((device) => {
            if (device.kind == "videoinput") {
                // Set the current video device to the first one we find.
                if (!_currentVideoDevice) {
                    _currentVideoDevice = device.deviceId;
                }
                // Add options for all the other devices.
                if (sources) {
                    const optionElement = document.createElement("option");
                    optionElement.setAttribute("value", device.deviceId);
                    if (_currentVideoDevice == device.deviceId) {
                        optionElement.setAttribute("selected", "1");
                    }
                    optionElement.innerText = device.label;
                    sources.appendChild(optionElement);
                }
            }
        });
    });
};
let firstPredictions = null;
const restartRecognition = (faceReco, faceViewer) => {
    if (faceReco && faceViewer) {
        faceReco.start((predictions) => {
            setLoading(false);
            if (!firstPredictions) {
                firstPredictions = predictions;
                console.log('Prediction:', firstPredictions);
            }
            if (faceViewer) {
                faceViewer.updateFaceWithPredictions(predictions);
            }
        });
    }
};
export const onCaptureDownload = () => {
    if (_faceViewer) {
        _faceViewer.capture((dataURL) => {
            console.log(dataURL);
            const link = document.querySelector('#downloadLink');
            link.download = 'image.png';
            link.href = dataURL;
            link.click();
        });
    }
};
export const onStopRecognition = () => {
    if (_faceReco) {
        _faceReco.stop();
    }
};
export const onStartRecognition = async () => {
    setLoading(true);
    if (_faceReco && _faceViewer) {
        _faceReco.setup();
        faceViewerInit(_sceneElement, _faceViewerOptions);
        _faceReco.startVideo(_currentVideoDevice).then(({ video, deviceId }) => {
            //console.log({ video, deviceId })
            if (deviceId) {
                _currentVideoDevice = video.deviceId;
            }
            populateSourceSelector(_sourcesElement);
            restartRecognition(_faceReco, _faceViewer);
        });
    }
};
export const onSelectDevice = (e) => {
    if (_sourcesElement) {
        _currentVideoDevice = _sourcesElement.value;
        // Changing video device is a little convulted because we need to stop
        // the recognition and restart it.
        console.log('select device', _currentVideoDevice);
        if (_faceReco && _faceReco.running) {
            _faceReco.stop();
            _faceReco.startVideo(_currentVideoDevice).then(() => {
                restartRecognition(_faceReco, _faceViewer);
            });
        }
    }
};
export const initPhotoBooth = (elements) => {
    _loaderElement = elements.loaderElement;
    _sourcesElement = elements.sourcesElement;
    _sceneElement = elements.sceneElement;
    if (elements.videoElement && elements.previewElement) {
        const faceViewer = faceViewerInit(_sceneElement, _faceViewerOptions);
        faceRecoInit(elements.videoElement, elements.previewElement);
        populateSourceSelector(_sourcesElement);
        if (facesAlastair && facesAlastair.length > 0) {
            faceViewer.updateFaceWithPredictions(facesAlastair);
        }
    }
};
