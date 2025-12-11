import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Skeleton,
  Box,
  Typography,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Athlete } from '../../types/athlete';
import { StatusBadge } from '../../components/StatusBadge';

interface AthletesTableProps {
  athletes: Athlete[];
  loading: boolean;
}

/**
 * AthletesTable component
 * Displays athletes in a table with sortable columns and action buttons
 */
export const AthletesTable: React.FC<AthletesTableProps> = ({
  athletes,
  loading,
}) => {
  const navigate = useNavigate();

  const handleViewAthlete = (athleteId: string) => {
    navigate(`/athletes/${athleteId}`);
  };

  // Show skeleton loading state
  if (loading) {
    return (
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton variant="text" width={150} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={40} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={60} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rounded" width={100} height={24} />
                </TableCell>
                <TableCell align="right">
                  <Skeleton variant="circular" width={40} height={40} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Show message if no athletes found
  if (athletes.length === 0) {
    return (
      <TableContainer component={Paper} elevation={1}>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No athletes found matching your criteria.
          </Typography>
        </Box>
      </TableContainer>
    );
  }

  return (
    <TableContainer component={Paper} elevation={1}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Age</TableCell>
            <TableCell>Gender</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {athletes.map((athlete) => (
            <TableRow
              key={athlete.id}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => handleViewAthlete(athlete.id)}
            >
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {athlete.name}
                </Typography>
              </TableCell>
              <TableCell>{athlete.age}</TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>
                {athlete.gender}
              </TableCell>
              <TableCell>
                <StatusBadge status={athlete.consentStatus} />
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewAthlete(athlete.id);
                  }}
                  aria-label={`View ${athlete.name}`}
                >
                  <Visibility />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
