import { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
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
import assessmentsService from '../../services/assessments';
import { Assessment } from '../../types/assessment';

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

interface ChartDataPoint {
  date: string;
  leftLeg?: number;
  rightLeg?: number;
}

export function ProgressChart({ assessments }: ProgressChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const fetchFullAssessments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch full assessment details for each assessment
        const fullAssessments = await Promise.all(
          assessments.map((a) => assessmentsService.getById(a.id))
        );

        // Sort by date and prepare chart data
        const data = fullAssessments
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .map((assessment: Assessment) => {
            const dataPoint: ChartDataPoint = {
              date: new Date(assessment.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
            };

            // Extract hold times from the appropriate metrics
            if (assessment.legTested === 'both') {
              // Dual-leg assessment: use leftLegMetrics and rightLegMetrics
              dataPoint.leftLeg = assessment.leftLegMetrics?.holdTime;
              dataPoint.rightLeg = assessment.rightLegMetrics?.holdTime;
            } else if (assessment.legTested === 'left') {
              // Single left leg: use metrics.holdTime
              dataPoint.leftLeg = assessment.metrics?.holdTime;
            } else if (assessment.legTested === 'right') {
              // Single right leg: use metrics.holdTime
              dataPoint.rightLeg = assessment.metrics?.holdTime;
            }

            return dataPoint;
          });

        setChartData(data);
      } catch (err: any) {
        console.error('Failed to fetch full assessments for chart:', err);
        setError(err.message || 'Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    if (assessments.length > 0) {
      fetchFullAssessments();
    } else {
      setLoading(false);
    }
  }, [assessments]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ py: 4, textAlign: 'center' }}>
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            domain={[0, 30]}
            label={{ value: 'Duration (s)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <Legend />
          <ReferenceLine
            y={20}
            stroke="#4caf50"
            strokeDasharray="5 5"
            label="Target"
          />
          <Line
            type="monotone"
            dataKey="leftLeg"
            stroke="#1976d2"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Left Leg"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="rightLeg"
            stroke="#ff6f00"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Right Leg"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
