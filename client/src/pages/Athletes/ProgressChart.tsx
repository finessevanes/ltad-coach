import { Box } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface AssessmentListItem {
  id: string;
  athleteId: string;
  athleteName: string;
  testType: string;
  legTested: string;
  createdAt: string;
  status: string;
  durationSeconds?: number;
}

interface ProgressChartProps {
  assessments: AssessmentListItem[];
}

export function ProgressChart({ assessments }: ProgressChartProps) {
  // Sort by date and prepare chart data
  const data = [...assessments]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((a) => ({
      date: new Date(a.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      duration: a.durationSeconds || 0,
    }));

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            domain={[0, 30]}
            label={{ value: 'Duration (s)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <ReferenceLine
            y={20}
            stroke="#4caf50"
            strokeDasharray="5 5"
            label="Target"
          />
          <Line
            type="monotone"
            dataKey="duration"
            stroke="#1976d2"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Duration (s)"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
