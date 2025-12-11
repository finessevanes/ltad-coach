import { Card, CardContent, Typography, Box, useTheme, useMediaQuery, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { useState } from 'react';
import { ShowChart, Timeline } from '@mui/icons-material';

const ProgressChart = ({ assessments }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [metric, setMetric] = useState('duration');

  if (!assessments || assessments.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Progress Over Time
          </Typography>
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            Complete at least 2 assessments to see progress trends.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart
  const chartData = [...assessments]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((assessment) => ({
      date: format(new Date(assessment.createdAt), isMobile ? 'MM/dd' : 'MMM dd, yyyy'),
      fullDate: new Date(assessment.createdAt),
      duration: assessment.metrics?.durationSeconds || 0,
      stability: assessment.metrics?.stabilityScore || 0,
      score: assessment.metrics?.durationScore?.score || 0,
      leg: assessment.legTested === 'left' ? 'L' : 'R',
    }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {format(data.fullDate, 'MMM dd, yyyy')}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Leg: {data.leg === 'L' ? 'Left' : 'Right'}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color, mt: 0.5 }}>
              {entry.name}: {entry.value.toFixed(1)}{entry.name === 'Duration' ? 's' : entry.name === 'Stability' ? '%' : ''}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const handleMetricChange = (event, newMetric) => {
    if (newMetric !== null) {
      setMetric(newMetric);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Progress Over Time
          </Typography>

          <ToggleButtonGroup
            value={metric}
            exclusive
            onChange={handleMetricChange}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                px: { xs: 1, sm: 2 }
              }
            }}
          >
            <ToggleButton value="duration">
              <Timeline sx={{ mr: 0.5, fontSize: '1rem' }} />
              Duration
            </ToggleButton>
            <ToggleButton value="stability">
              <ShowChart sx={{ mr: 0.5, fontSize: '1rem' }} />
              Stability
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: isMobile ? 10 : 30,
              left: isMobile ? -10 : 0,
              bottom: 10,
            }}
          >
            <defs>
              <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorStability" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: isMobile ? 10 : 12 }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
            />
            <YAxis
              tick={{ fontSize: isMobile ? 10 : 12 }}
              label={{
                value: metric === 'duration' ? 'Duration (seconds)' : 'Stability Score (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: isMobile ? 10 : 12, fill: theme.palette.text.secondary },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: isMobile ? '11px' : '14px' }}
              iconSize={isMobile ? 10 : 14}
            />

            {metric === 'duration' && (
              <Area
                type="monotone"
                dataKey="duration"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                fill="url(#colorDuration)"
                name="Duration"
                dot={{ fill: theme.palette.primary.main, r: isMobile ? 3 : 4 }}
                activeDot={{ r: isMobile ? 5 : 6 }}
              />
            )}

            {metric === 'stability' && (
              <Area
                type="monotone"
                dataKey="stability"
                stroke={theme.palette.success.main}
                strokeWidth={2}
                fill="url(#colorStability)"
                name="Stability"
                dot={{ fill: theme.palette.success.main, r: isMobile ? 3 : 4 }}
                activeDot={{ r: isMobile ? 5 : 6 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* Trend Indicator */}
        {chartData.length >= 2 && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Trend Analysis
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {(() => {
                const firstValue = metric === 'duration' ? chartData[0].duration : chartData[0].stability;
                const lastValue = metric === 'duration' ? chartData[chartData.length - 1].duration : chartData[chartData.length - 1].stability;
                const change = ((lastValue - firstValue) / firstValue) * 100;
                const isImprovement = change > 0;

                return (
                  <span style={{ color: isImprovement ? theme.palette.success.main : theme.palette.error.main }}>
                    {isImprovement ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% {isImprovement ? 'improvement' : 'decline'} from first assessment
                  </span>
                );
              })()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
