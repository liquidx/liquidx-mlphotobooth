export const faces: {
    keypoints: ({
        x: number;
        y: number;
        z: number;
        name: string;
    } | {
        x: number;
        y: number;
        z: number;
        name?: undefined;
    })[];
    box: {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
        width: number;
        height: number;
    };
}[];
