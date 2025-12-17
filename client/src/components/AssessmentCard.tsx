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
        overflow: 'hidden',
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
      {/* Image or Text Placeholder Container - 3:4 Aspect Ratio */}
      <Box
        sx={{
          position: 'relative',
          paddingTop: '133.33%',
          overflow: 'hidden',
          backgroundColor: imageOrPlaceholder.type === 'placeholder' ? 'grey.100' : 'transparent',
        }}
      >
        {imageOrPlaceholder.type === 'image' ? (
          <Box
            component="img"
            src={imageOrPlaceholder.value}
            alt={assessment.name}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
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

        {/* Coming Soon Ribbon - Only show if not active */}
        {!assessment.isActive && (
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              right: -35,
              backgroundColor: 'warning.main',
              color: 'white',
              padding: '4px 40px',
              transform: 'rotate(45deg)',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: 2,
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
