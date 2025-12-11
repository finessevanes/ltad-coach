export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseResult {
  landmarks: PoseLandmark[];
  worldLandmarks: PoseLandmark[];
}

export interface DrawingOptions {
  radius?: number;
  color?: string;
  lineWidth?: number;
}
