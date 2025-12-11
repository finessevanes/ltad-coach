import { useEffect } from 'react';
import { Box, Typography } from '@mui/material';

const CameraPreview = ({ videoRef, stream, showFramingGuide = true }) => {
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 800,
        margin: '0 auto',
        backgroundColor: '#000',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      />

      {showFramingGuide && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
          }}
        >
          {/* Framing guide overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60%',
              height: '85%',
              border: '2px dashed rgba(255, 255, 255, 0.5)',
              borderRadius: 2,
            }}
          >
            <Typography
              sx={{
                position: 'absolute',
                top: -30,
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.875rem',
              }}
            >
              Position athlete within this frame
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CameraPreview;
