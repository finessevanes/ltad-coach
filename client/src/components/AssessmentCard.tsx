import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { AssessmentConfig, getImageOrPlaceholder } from '../config/assessments';

interface AssessmentCardProps {
  assessment: AssessmentConfig;
  onClick: (assessmentId: string) => void;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  onClick,
}) => {
  const imageOrPlaceholder = getImageOrPlaceholder(assessment);

  return (
    <Card
      onClick={() => onClick(assessment.id)}
      sx={{
        cursor: 'pointer',
        position: 'relative',
        overflow: 'visible',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        transition: 'all 0.2s ease',
      }}
    >
      {/* Image or Text Placeholder Container with spacing */}
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '4/3',
          overflow: 'visible',
          p: 1.5,
        }}
      >
        <Box
          sx={{
            width: 'calc(100% - 24px)',
            height: 'calc(100% - 24px)',
            position: 'absolute',
            top: 12,
            left: 12,
            overflow: 'hidden',
            borderRadius: 1,
            backgroundColor: imageOrPlaceholder.type === 'placeholder' ? 'grey.200' : 'transparent',
          }}
        >
          {imageOrPlaceholder.type === 'image' ? (
            <img
              src={imageOrPlaceholder.value}
              alt={assessment.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: assessment.id === 'balance' ? 'center 25%' : 'center center',
                display: 'block',
              }}
              onError={() => {
                console.error('Image failed to load:', imageOrPlaceholder.value);
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'grey.200',
                padding: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  textAlign: 'center',
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                {imageOrPlaceholder.value}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Coming Soon Badge - Top-right, straight, lime green with black text, aligned with card edge */}
        {!assessment.isActive && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: '#D4FF00',
              color: '#000000',
              padding: '6px 16px',
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              zIndex: 2,
            }}
          >
            Coming Soon
          </Box>
        )}
      </Box>

      {/* Card Content - Title, Description, Frequency */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
          {assessment.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1, flexGrow: 1 }}
        >
          {assessment.description}
        </Typography>

        {/* Frequency Badge */}
        <Chip
          label={assessment.frequency}
          size="small"
          variant="outlined"
          sx={{ alignSelf: 'flex-start', mt: 1 }}
        />
      </CardContent>
    </Card>
  );
};

export default AssessmentCard;
