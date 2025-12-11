import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Chip,
  Box,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import {
  ChevronRight as ChevronRightIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { generateRoute } from '../../utils/routes';

const AssessmentHistoryList = ({ assessments, athleteId }) => {
  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!assessments || assessments.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No assessments yet. Complete your first assessment to see results here.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedAssessments = [...assessments].sort((a, b) => {
    let aValue = a[orderBy];
    let bValue = b[orderBy];

    // Handle nested properties like metrics.durationSeconds
    if (orderBy === 'durationSeconds') {
      aValue = a.metrics?.durationSeconds || 0;
      bValue = b.metrics?.durationSeconds || 0;
    } else if (orderBy === 'score') {
      aValue = a.metrics?.durationScore?.score || 0;
      bValue = b.metrics?.durationScore?.score || 0;
    }

    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleRowClick = (assessmentId) => {
    navigate(generateRoute.assessmentResults(assessmentId));
  };

  const getScoreColor = (score) => {
    if (!score) return 'default';
    if (score >= 4) return 'success';
    if (score >= 3) return 'info';
    if (score >= 2) return 'warning';
    return 'error';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0.0s';
    return `${seconds.toFixed(1)}s`;
  };

  const getLegLabel = (leg) => {
    return leg === 'left' ? 'Left' : 'Right';
  };

  // Calculate summary stats
  const stats = {
    total: assessments.length,
    avgDuration: (assessments.reduce((sum, a) => sum + (a.metrics?.durationSeconds || 0), 0) / assessments.length).toFixed(1),
    avgScore: (assessments.reduce((sum, a) => sum + (a.metrics?.durationScore?.score || 0), 0) / assessments.length).toFixed(1),
    bestScore: Math.max(...assessments.map(a => a.metrics?.durationScore?.score || 0)),
  };

  if (isMobile) {
    // Mobile view - List layout
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Assessment History
          </Typography>

          {/* Summary Stats */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`${stats.total} Total`} size="small" color="primary" />
            <Chip label={`Avg: ${stats.avgDuration}s`} size="small" />
            <Chip
              icon={<TrophyIcon />}
              label={`Best: ${stats.bestScore}`}
              size="small"
              color="success"
            />
          </Box>

          <List sx={{ pt: 0 }}>
            {sortedAssessments.map((assessment, index) => (
              <Box key={assessment.id}>
                <ListItemButton
                  onClick={() => handleRowClick(assessment.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {format(new Date(assessment.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                        <Chip
                          label={assessment.metrics?.durationScore?.score || '-'}
                          size="small"
                          color={getScoreColor(assessment.metrics?.durationScore?.score)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" display="block">
                          Duration: {formatDuration(assessment.metrics?.durationSeconds)} • Leg: {getLegLabel(assessment.legTested)}
                        </Typography>
                        {assessment.metrics?.durationScore?.label && (
                          <Typography variant="caption" color="text.secondary">
                            {assessment.metrics.durationScore.label}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <IconButton edge="end">
                    <ChevronRightIcon />
                  </IconButton>
                </ListItemButton>
                {index < sortedAssessments.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }

  // Desktop view - Table layout
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Assessment History
          </Typography>

          {/* Summary Stats */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={`${stats.total} Total`} size="small" color="primary" />
            <Chip label={`Avg: ${stats.avgDuration}s`} size="small" />
            <Chip
              icon={<TrophyIcon />}
              label={`Best: ${stats.bestScore}`}
              size="small"
              color="success"
            />
          </Box>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'createdAt'}
                    direction={orderBy === 'createdAt' ? order : 'asc'}
                    onClick={() => handleSort('createdAt')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>Leg Tested</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'durationSeconds'}
                    direction={orderBy === 'durationSeconds' ? order : 'asc'}
                    onClick={() => handleSort('durationSeconds')}
                  >
                    Duration
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'score'}
                    direction={orderBy === 'score' ? order : 'asc'}
                    onClick={() => handleSort('score')}
                  >
                    Score
                  </TableSortLabel>
                </TableCell>
                <TableCell>Level</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAssessments.map((assessment) => (
                <TableRow
                  key={assessment.id}
                  hover
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                  onClick={() => handleRowClick(assessment.id)}
                >
                  <TableCell>
                    {format(new Date(assessment.createdAt), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getLegLabel(assessment.legTested)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDuration(assessment.metrics?.durationSeconds)}</TableCell>
                  <TableCell>
                    <Chip
                      label={assessment.metrics?.durationScore?.score || '-'}
                      size="small"
                      color={getScoreColor(assessment.metrics?.durationScore?.score)}
                    />
                  </TableCell>
                  <TableCell>
                    {assessment.metrics?.durationScore?.label || '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleRowClick(assessment.id)}>
                      <ChevronRightIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default AssessmentHistoryList;
