import { Box, Typography, Paper } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { ReportGraphDataPoint } from '../../services/reports';

interface ReportProgressChartProps {
  graphData: ReportGraphDataPoint[];
}

/**
 * Progress chart for parent reports with bilateral visualization.
 * Displays separate lines for left and right leg to show asymmetry over time.
 *
 * Uses:
 * - Athletic Blue (#2563EB) for left leg line
 * - Orange (#ff6f00) for right leg line
 * - Reference line at 20 seconds (target threshold)
 * - Y-axis fixed at [0, 30] for consistency
 */
export function ReportProgressChart({ graphData }: ReportProgressChartProps) {
  if (graphData.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E5E5',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: '#2D2D2D',
          mb: 3,
          fontSize: '1.125rem',
        }}
      >
        Balance Hold Time
      </Typography>

      <Box sx={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <LineChart
            data={graphData}
            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B6B6B', fontSize: 12 }}
              tickLine={{ stroke: '#E5E5E5' }}
              axisLine={{ stroke: '#E5E5E5' }}
            />
            <YAxis
              domain={[0, 30]}
              tick={{ fill: '#6B6B6B', fontSize: 12 }}
              tickLine={{ stroke: '#E5E5E5' }}
              axisLine={{ stroke: '#E5E5E5' }}
              label={{
                value: 'Duration (s)',
                angle: -90,
                position: 'insideLeft',
                fill: '#6B6B6B',
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
              labelStyle={{ color: '#2D2D2D', fontWeight: 600 }}
              formatter={(value: number) => [`${value.toFixed(1)}s`]}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '10px',
              }}
            />
            <ReferenceLine
              y={20}
              stroke="#10B981"
              strokeDasharray="5 5"
              label={{
                value: 'Target (20s)',
                position: 'insideTopRight',
                fill: '#10B981',
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="leftLeg"
              stroke="#2563EB"
              strokeWidth={3}
              dot={{
                r: 6,
                fill: '#2563EB',
                stroke: '#FFFFFF',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 8,
                fill: '#2563EB',
                stroke: '#FFFFFF',
                strokeWidth: 2,
              }}
              name="Left Leg"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="rightLeg"
              stroke="#ff6f00"
              strokeWidth={3}
              dot={{
                r: 6,
                fill: '#ff6f00',
                stroke: '#FFFFFF',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 8,
                fill: '#ff6f00',
                stroke: '#FFFFFF',
                strokeWidth: 2,
              }}
              name="Right Leg"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: '#6B6B6B',
          display: 'block',
          mt: 2,
          textAlign: 'center',
        }}
      >
        Green dashed line shows the 20-second target for balance tests
      </Typography>
    </Paper>
  );
}
