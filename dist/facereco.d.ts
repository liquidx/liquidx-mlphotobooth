export class FaceReco {
    constructor(videoCameraElement: any, previewCanvasElement: any);
    videoCameraElement: any;
    previewCanvasElement: any;
    backend: string;
    maxFaces: number;
    canvasSize: number;
    videoSize: number;
    videoLoaded: boolean;
    running: boolean;
    model: import("@tensorflow-models/face-landmarks-detection").FaceLandmarksDetector | null;
    setup(): Promise<void>;
    setupCamera(video: any, videoSize: any, deviceId: any): Promise<any>;
    start(predictionCallback: any): boolean;
    predictionCallback: any;
    stop(): void;
    stopVideo(): void;
    startVideo(deviceId: any): Promise<any>;
    renderPrediction(): Promise<void>;
}
