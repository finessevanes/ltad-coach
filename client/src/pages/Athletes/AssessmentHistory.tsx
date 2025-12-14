import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box,
} from '@mui/material';

interface AssessmentListItem {
  id: string;
  athleteId: string;
  athleteName: string;
  testType: string;
  legTested: string;
  createdAt: string;
  status: string;
  durationSeconds?: number;
  stabilityScore?: number;
}

interface AssessmentHistoryProps {
  assessments: AssessmentListItem[];
  onAssessmentClick: (id: string) => void;
}

const SCORE_COLORS: Record<number, 'error' | 'warning' | 'info' | 'success' | 'secondary'> = {
  1: 'error',
  2: 'warning',
  3: 'info',
  4: 'success',
  5: 'secondary',
};

function getScore(duration: number): number {
  if (duration >= 25) return 5;
  if (duration >= 20) return 4;
  if (duration >= 15) return 3;
  if (duration >= 10) return 2;
  return 1;
}

export function AssessmentHistory({ assessments, onAssessmentClick }: AssessmentHistoryProps) {
  if (assessments.length === 0) {
    return (
      <Box py={4} textAlign="center">
        <Typography color="text.secondary">
          No assessments yet
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Test</TableCell>
            <TableCell>Leg</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>Stability</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assessments.map((assessment) => {
            const score = assessment.durationSeconds
              ? getScore(assessment.durationSeconds)
              : null;

            return (
              <TableRow
                key={assessment.id}
                hover
                onClick={() => onAssessmentClick(assessment.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  {new Date(assessment.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>One-Leg Balance</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>
                  {assessment.legTested}
                </TableCell>
                <TableCell>
                  {assessment.durationSeconds
                    ? `${assessment.durationSeconds.toFixed(1)}s`
                    : '-'}
                </TableCell>
                <TableCell>
                  {score && (
                    <Chip
                      label={score}
                      size="small"
                      color={SCORE_COLORS[score]}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {assessment.stabilityScore
                    ? `${assessment.stabilityScore.toFixed(0)}/100`
                    : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
