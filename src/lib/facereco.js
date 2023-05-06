// @ts-nocheck
import { createDetector, SupportedModels } from '@tensorflow-models/face-landmarks-detection';
import * as tf from "@tensorflow/tfjs";
import '@mediapipe/face_mesh';
import '@tensorflow/tfjs-core';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';

export class FaceReco {
  constructor(videoCameraElement, previewCanvasElement) {
    this.videoCameraElement = videoCameraElement;
    this.previewCanvasElement = previewCanvasElement;
    this.backend = "webgl";
    this.maxFaces = 1;
    this.canvasSize = 100;
    this.videoSize = 500;
    this.videoLoaded = false;
    this.running = false;
    this.model = null;
    const model = SupportedModels.MediaPipeFaceMesh
    const config = {
      runtime: 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
      maxFaces: this.maxFaces,
    }

    createDetector(model, config)
      .then((model) => {
        this.model = model;
      });
  }

  async setup() {
    await tf.setBackend(this.backend);

    let canvas = this.previewCanvasElement;
    canvas.width = this.canvasSize;
    canvas.height = this.canvasSize;

    let ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.fillStyle = "#32EEDB";
    ctx.strokeStyle = "#32EEDB";
    ctx.lineWidth = 0.5;
  }

  async setupCamera(video, videoSize, deviceId) {
    const cameraOptions = {
      audio: false,
      video: {
        facingMode: "user",
        width: videoSize,
        height: videoSize,
      },
    };

    if (deviceId) {
      cameraOptions.video.deviceId = deviceId;
    }

    const stream = await navigator.mediaDevices.getUserMedia(cameraOptions);
    video.srcObject = stream;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        console.log(`loaded: ${deviceId}`);
        this.videoLoaded = true;
        resolve(video);
      };
    });
  }

  start(predictionCallback) {
    if (this.videoLoaded) {
      this.running = true;
      this.predictionCallback = predictionCallback;
      this.renderPrediction();
      return true;
    }
    return false;
  }

  stop() {
    this.running = false;
    this.stopVideo();
  }

  stopVideo() {
    if (this.videoLoaded) {
      const player = this.videoCameraElement;
      if (player && player.srcObject) {
        player.srcObject.getVideoTracks().forEach((track) => track.stop());
      }
      this.videoLoaded = false;
    }
  }

  async startVideo(deviceId) {
    if (!deviceId) {
      console.error('Device ID is not defined')
      return;
    }
    return this.setupCamera(
      this.videoCameraElement,
      this.videoSize,
      deviceId
    ).then((video) => {
      video.play();
      let videoWidth = video.videoWidth;
      let videoHeight = video.videoHeight;
      video.width = videoWidth;
      video.height = videoHeight;
      return video;
    });
  }

  async renderPrediction() {
    const ctx = this.previewCanvasElement.getContext("2d");
    const video = this.videoCameraElement;
    const canvas = this.previewCanvasElement;
    const model = this.model;

    if (model && this.videoLoaded) {
      const predictions = await model.estimateFaces(video, { flipHorizontal: false });

      let mixAmount = 1.0;

      ctx.drawImage(
        video,
        0,
        0,
        video.videoWidth,
        video.videoHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
      ctx.fillStyle = "#888"; // gray colour
      ctx.globalAlpha = mixAmount; // amount of FX
      ctx.globalCompositeOperation = "color"; // The comp setting to do BLACK/WHITE
      ctx.fillRect(0, 0, canvas.width, canvas.height); // Draw gray over the video
      ctx.globalAlpha = 1; // reset alpha
      ctx.globalCompositeOperation = "source-over"; // reset comp

      if (predictions.length > 0) {
        let videoCanvasScale = this.canvasSize / this.videoSize;
        ctx.fillStyle = "#dddddd";

        predictions.forEach((prediction) => {
          const keypoints = prediction.keypoints;
          for (let i = 0; i < keypoints.length; i++) {
            const x = keypoints[i].x * videoCanvasScale;
            const y = keypoints[i].y * videoCanvasScale;

            ctx.beginPath();
            ctx.arc(x, y, 1 /* radius */, 0, 1 * Math.PI);
            ctx.fill();
          }
        });

        if (this.predictionCallback) {
          this.predictionCallback(predictions);
        }

        if (!this.running) {
          // last frame, dump points out to console.
          console.log(JSON.stringify(predictions[0]));
        }
      }
    }

    if (this.running) {
      requestAnimationFrame(this.renderPrediction.bind(this));
    }
  }
}
