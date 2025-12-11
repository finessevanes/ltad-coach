import { Chip, Box, Typography, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const ScoreChip = styled(Chip)(({ theme, scorevalue }) => {
  let bgcolor, color;

  if (scorevalue === 5) {
    bgcolor = theme.palette.success.main;
    color = theme.palette.success.contrastText;
  } else if (scorevalue === 4) {
    bgcolor = theme.palette.info.main;
    color = theme.palette.info.contrastText;
  } else if (scorevalue === 3) {
    bgcolor = theme.palette.warning.main;
    color = theme.palette.warning.contrastText;
  } else if (scorevalue === 2) {
    bgcolor = theme.palette.error.light;
    color = theme.palette.error.contrastText;
  } else {
    bgcolor = theme.palette.error.main;
    color = theme.palette.error.contrastText;
  }

  return {
    backgroundColor: bgcolor,
    color: color,
    fontSize: '2rem',
    height: '80px',
    width: '80px',
    borderRadius: '50%',
    fontWeight: 700,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    transition: 'transform 0.3s ease-in-out',
    '&:hover': {
      transform: 'scale(1.1)',
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.5rem',
      height: '60px',
      width: '60px',
    },
  };
});

const ScoreBadge = ({ durationScore }) => {
  if (!durationScore) return null;

  const { score, label, expectationStatus, expectedScore } = durationScore;

  const getExpectationText = () => {
    if (!expectationStatus || !expectedScore) return '';

    if (expectationStatus === 'above') {
      return `Exceeds expectations (Expected: ${expectedScore})`;
    } else if (expectationStatus === 'at') {
      return `Meets expectations`;
    } else {
      return `Below expectations (Expected: ${expectedScore})`;
    }
  };

  const getLabelDescription = () => {
    const descriptions = {
      'Advanced': 'Exceptional balance control for age group',
      'Proficient': 'Above average performance',
      'Competent': 'Age-appropriate skill level',
      'Developing': 'Needs improvement with practice',
      'Beginner': 'Beginning skill development',
    };
    return descriptions[label] || '';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: 3,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 2,
      }}
    >
      <Tooltip title={getLabelDescription()} arrow>
        <ScoreChip
          label={score}
          scorevalue={score}
          icon={score >= 4 ? <EmojiEventsIcon sx={{ fontSize: '2rem !important', color: 'inherit' }} /> : undefined}
          data-testid="score-badge"
        />
      </Tooltip>

      <Typography
        variant="h5"
        fontWeight={600}
        sx={{
          textAlign: 'center',
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}
      >
        {label}
      </Typography>

      {getExpectationText() && (
        <Typography
          variant="body2"
          color={
            expectationStatus === 'above' ? 'success.main' :
            expectationStatus === 'at' ? 'info.main' :
            'error.main'
          }
          sx={{
            textAlign: 'center',
            fontWeight: 500,
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          {getExpectationText()}
        </Typography>
      )}
    </Box>
  );
};

export default ScoreBadge;
