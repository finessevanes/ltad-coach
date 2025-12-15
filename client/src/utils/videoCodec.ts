/**
 * Video Codec Detection Utilities
 *
 * Provides browser compatibility checks for WebM/VP9/VP8 codecs
 * used by MediaRecorder in the application.
 */

export interface CodecSupport {
  vp9: boolean;
  vp8: boolean;
  message?: string;
}

/**
 * Check WebM video codec support in the current browser
 * @returns Object with VP9 and VP8 support flags, and optional error message
 */
export function checkWebMSupport(): CodecSupport {
  const video = document.createElement('video');

  const vp9 = video.canPlayType('video/webm; codecs="vp9"') !== '';
  const vp8 = video.canPlayType('video/webm; codecs="vp8"') !== '';

  if (!vp9 && !vp8) {
    return {
      vp9: false,
      vp8: false,
      message: 'WebM playback not supported in this browser. Please use Chrome, Edge, or Firefox.',
    };
  }

  return { vp9, vp8 };
}

/**
 * Get detailed codec support information for debugging
 * @returns Object with detailed codec support strings
 */
export function getCodecDetails(): {
  vp9: string;
  vp8: string;
  vp9Profile0: string;
  h264: string;
  av1: string;
} {
  const video = document.createElement('video');

  return {
    vp9: video.canPlayType('video/webm; codecs="vp9"'),
    vp8: video.canPlayType('video/webm; codecs="vp8"'),
    vp9Profile0: video.canPlayType('video/webm; codecs="vp09.00.10.08"'),
    h264: video.canPlayType('video/mp4; codecs="avc1.42E01E"'),
    av1: video.canPlayType('video/mp4; codecs="av01.0.05M.08"'),
  };
}

/**
 * Check if the browser supports MediaRecorder with WebM
 * @returns true if MediaRecorder and WebM recording are supported
 */
export function checkRecordingSupport(): boolean {
  if (!window.MediaRecorder) {
    return false;
  }

  return (
    MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ||
    MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ||
    MediaRecorder.isTypeSupported('video/webm')
  );
}

/**
 * Get user-friendly browser name for error messages
 * @returns Browser name string
 */
export function getBrowserName(): string {
  const ua = navigator.userAgent;

  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    return 'Chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    return 'Safari';
  } else if (ua.includes('Firefox')) {
    return 'Firefox';
  } else if (ua.includes('Edg')) {
    return 'Edge';
  } else {
    return 'Unknown Browser';
  }
}

