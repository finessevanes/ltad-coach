import React from 'react';
import { Box, Typography } from '@mui/material';

interface VideoThumbnailProps {
  videoUrl?: string | null;
  altText?: string;
}

/**
 * Video thumbnail component that displays a camera emoji (📷) when no video URL is provided,
 * or renders a video player when a URL exists.
 *
 * Used for displaying assessment videos in the UI, especially useful for demo data
 * where actual videos may not be available.
 */
export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoUrl,
  altText = 'Video assessment'
}) => {
  if (!videoUrl) {
    // Show camera emoji when no video
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: 200,
          bgcolor: 'grey.100',
          borderRadius: 1,
        }}
      >
        <Typography variant="h1" sx={{ fontSize: 80 }}>
          📷
        </Typography>
      </Box>
    );
  }

  // Show video player when URL exists
  return (
    <video
      src={videoUrl}
      controls
      style={{ width: '100%', borderRadius: 4 }}
      aria-label={altText}
    />
  );
};
