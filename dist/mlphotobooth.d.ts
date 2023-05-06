export declare const onCaptureDownload: () => void;
export declare const onStopRecognition: () => void;
export declare const onStartRecognition: () => Promise<void>;
export declare const onSelectDevice: (e: Event) => void;
export declare const initPhotoBooth: (elements: {
    loaderElement: HTMLDivElement | null;
    sourcesElement: HTMLSelectElement | null;
    videoElement: HTMLVideoElement | null;
    previewElement: HTMLCanvasElement | null;
    sceneElement: HTMLCanvasElement | null;
}) => void;
