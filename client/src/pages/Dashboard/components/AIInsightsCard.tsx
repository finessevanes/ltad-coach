import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';

interface Insight {
  type: 'improvement' | 'achievement' | 'alert';
  message: string;
  athleteName?: string;
}

interface AIInsightsCardProps {
  insights: Insight[];
  loading?: boolean;
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({
  insights,
}) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement':
        return <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />;
      case 'achievement':
        return <TrophyIcon sx={{ color: 'warning.main', fontSize: 20 }} />;
      case 'alert':
        return <PsychologyIcon sx={{ color: 'info.main', fontSize: 20 }} />;
      default:
        return <PsychologyIcon sx={{ color: 'info.main', fontSize: 20 }} />;
    }
  };

  // Default insights if none provided
  const displayInsights = insights.length > 0 ? insights : [
    {
      type: 'alert' as const,
      message: 'Start testing athletes to see AI-powered insights here.',
    }
  ];

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PsychologyIcon sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="h2">
            AI Insights
          </Typography>
          <Chip
            label="Powered by Claude"
            size="small"
            sx={{
              ml: 'auto',
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 600,
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {displayInsights.map((insight, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box sx={{ mt: 0.5 }}>{getInsightIcon(insight.type)}</Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.6 }}>
                  {insight.message}
                </Typography>
                {insight.athleteName && (
                  <Chip
                    label={insight.athleteName}
                    size="small"
                    sx={{
                      mt: 1,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontSize: '0.75rem',
                    }}
                  />
                )}
              </Box>
            </Box>
          ))}
        </Box>

        {insights.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Insights updated in real-time as you conduct assessments
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
