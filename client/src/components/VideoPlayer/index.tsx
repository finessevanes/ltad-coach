import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { PlaybackCache } from '../../utils/playbackCache';
import { fetchVideoWithCache } from '../../utils/videoCache';

interface VideoPlayerProps {
  videoUrl: string;
  videoId: string;
  label?: string;
  onError?: (err: string) => void;
}

type PlayerState = 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  videoId,
  label,
  onError,
}) => {
  const [playerState, setPlayerState] = useState<PlayerState>('loading');
  const [bufferProgress, setBufferProgress] = useState(0);
  const [canPlay, setCanPlay] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cachedVideoUrl, setCachedVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check readiness and buffer threshold
  const checkReadiness = () => {
    const video = videoRef.current;
    if (!video) return;

    // Require HAVE_FUTURE_DATA minimum (readyState >= 3)
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      const buffered = video.buffered;
      if (buffered.length > 0) {
        const bufferedEnd = buffered.end(buffered.length - 1);
        const bufferedAhead = bufferedEnd - video.currentTime;
        const totalDuration = isFinite(video.duration) ? video.duration : 0;

        // Calculate buffer progress percentage
        if (totalDuration > 0) {
          setBufferProgress((bufferedEnd / totalDuration) * 100);
        }

        // Adaptive threshold: use 2 seconds OR 25% of duration, whichever is smaller
        // For Infinity duration (WebM without metadata), fall back to simple buffer check
        let requiredBuffer = 2;
        if (totalDuration > 0 && totalDuration < 8) {
          // For videos shorter than 8 seconds, use 25% of duration (min 0.5s)
          requiredBuffer = Math.max(0.5, totalDuration * 0.25);
        } else if (video.duration === Infinity) {
          // For videos with unknown duration, just require any reasonable buffer
          requiredBuffer = 1;
        }

        // Enable play if we have sufficient buffer
        if (bufferedAhead >= requiredBuffer) {
          setCanPlay(true);
          if (playerState === 'loading') {
            setPlayerState('ready');
          }
        }
      }
    }
  };

  // Initialize video and set up event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Event handlers
    const handleLoadStart = () => {
      setPlayerState('loading');
      setCanPlay(false);
    };

    const handleLoadedMetadata = () => {
      // Metadata loaded
    };

    const handleLoadedData = () => {
      checkReadiness();
    };

    const handleCanPlay = () => {
      checkReadiness();
    };

    const handleCanPlayThrough = () => {
      setCanPlay(true);
      if (playerState === 'loading') {
        setPlayerState('ready');
      }
    };

    const handleProgress = () => {
      checkReadiness();
    };

    const handlePlay = () => {
      setPlayerState('playing');
    };

    const handlePlaying = () => {
      setPlayerState('playing');
    };

    const handlePause = () => {
      setPlayerState('paused');
    };

    const handleEnded = () => {
      setPlayerState('ended');
    };

    const handleWaiting = () => {
      // Video is waiting for more data
    };

    const handleStalled = () => {
      console.warn(`Video stalled - network issue or insufficient buffer`);
    };

    const handleError = () => {
      const error = video.error;
      let message = 'Unknown video error';

      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            message = 'Video playback aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            message = 'Network error while loading video';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            message = 'Video decoding error - codec may not be supported';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = 'Video format not supported by this browser';
            break;
        }
        message += `: ${error.message}`;
      }

      console.error('Video error:', message, error);
      setErrorMessage(message);
      setPlayerState('error');
      onError?.(message);
    };

    const handleSeeking = () => {
      // Video is seeking
    };

    const handleSeeked = () => {
      checkReadiness();
    };

    const handleTimeUpdate = () => {
      // Save playback position periodically (throttled by browser to ~4 times/sec)
      PlaybackCache.save(videoId, video.currentTime);
    };

    // Restore saved playback position on mount
    const savedPosition = PlaybackCache.get(videoId);
    if (savedPosition !== null && video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      video.currentTime = savedPosition;
    }

    // Attach event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('error', handleError);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('timeupdate', handleTimeUpdate);

    // Cleanup
    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('error', handleError);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoUrl, videoId, playerState, onError]);

  // Load video from cache or network
  useEffect(() => {
    let objectUrl: string | null = null;

    async function loadVideo() {
      try {
        setPlayerState('loading');

        // Fetch with IndexedDB cache
        const url = await fetchVideoWithCache(videoId, videoUrl);
        objectUrl = url;
        setCachedVideoUrl(url);
      } catch (err) {
        console.error('Failed to load video:', err);
        const message = err instanceof Error ? err.message : 'Failed to load video';
        setErrorMessage(message);
        setPlayerState('error');
        onError?.(message);
      }
    }

    loadVideo();

    // Cleanup object URL on unmount
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [videoUrl, videoId, onError]);

  // Check codec support on mount
  useEffect(() => {
    const video = document.createElement('video');
    const vp9 = video.canPlayType('video/webm; codecs="vp9"') !== '';
    const vp8 = video.canPlayType('video/webm; codecs="vp8"') !== '';

    if (!vp9 && !vp8) {
      const message = 'WebM playback not supported in this browser. Please use Chrome, Edge, or Firefox.';
      setErrorMessage(message);
      setPlayerState('error');
      onError?.(message);
    }
  }, [onError]);

  if (errorMessage) {
    return (
      <Alert severity="error" sx={{ borderRadius: '8px' }}>
        <Typography variant="body2" fontWeight="bold">
          {label ? `${label} - ` : ''}Video Error
        </Typography>
        <Typography variant="body2">{errorMessage}</Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {playerState === 'loading' && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            zIndex: 1,
          }}
        >
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="body2" color="white">
            Loading video...
          </Typography>
          {bufferProgress > 0 && (
            <Typography variant="caption" color="white" sx={{ mt: 1 }}>
              {Math.round(bufferProgress)}% buffered
            </Typography>
          )}
        </Box>
      )}

      <video
        ref={videoRef}
        src={cachedVideoUrl || undefined}
        controls={canPlay}
        preload="metadata"
        aria-label={label}
        style={{
          width: '100%',
          maxHeight: '400px',
          borderRadius: '8px',
          backgroundColor: '#000',
          opacity: canPlay ? 1 : 0.7,
        }}
      />

      {!canPlay && playerState !== 'loading' && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 1,
            color: 'text.secondary',
            fontStyle: 'italic',
          }}
        >
          Buffering video... Please wait
        </Typography>
      )}
    </Box>
  );
};
