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
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import { Edit as EditIcon, Videocam as VideocamIcon, CloudUpload, Assessment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Athlete } from '../../types/athlete';
import { StatusBadge } from '../../components/StatusBadge';
import { EditAthleteModal } from './EditAthleteModal';

interface AthletesTableProps {
  athletes: Athlete[];
  loading: boolean;
  onAthleteUpdated?: () => void;
}

/**
 * AthletesTable component
 * Displays athletes in a table with sortable columns and action buttons
 */
export const AthletesTable: React.FC<AthletesTableProps> = ({
  athletes,
  loading,
  onAthleteUpdated,
}) => {
  const navigate = useNavigate();
  const [assessmentMenuAnchor, setAssessmentMenuAnchor] = useState<{
    [athleteId: string]: HTMLElement | null;
  }>({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  const handleEditAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedAthlete(null);
  };

  const handleEditSuccess = () => {
    if (onAthleteUpdated) {
      onAthleteUpdated();
    }
  };

  const handleOpenAssessmentMenu = (
    event: React.MouseEvent<HTMLElement>,
    athleteId: string
  ) => {
    event.stopPropagation();
    setAssessmentMenuAnchor((prev) => ({
      ...prev,
      [athleteId]: event.currentTarget,
    }));
  };

  const handleCloseAssessmentMenu = (athleteId: string) => {
    setAssessmentMenuAnchor((prev) => ({
      ...prev,
      [athleteId]: null,
    }));
  };

  const handleRecordVideo = (athleteId: string) => {
    handleCloseAssessmentMenu(athleteId);
    navigate(`/assess/${athleteId}`);
  };

  const handleUploadVideo = (athleteId: string) => {
    handleCloseAssessmentMenu(athleteId);
    navigate(`/assess/${athleteId}/upload`);
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
    <>
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
              onClick={() => navigate(`/athletes/${athlete.id}`)}
              sx={{ cursor: 'pointer' }}
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
                {athlete.consentStatus === 'active' && (
                  <>
                    <Tooltip title="Assess Athlete">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => handleOpenAssessmentMenu(e, athlete.id)}
                        aria-label={`Assess ${athlete.name}`}
                      >
                        <Assessment />
                      </IconButton>
                    </Tooltip>
                    <Menu
                      anchorEl={assessmentMenuAnchor[athlete.id]}
                      open={Boolean(assessmentMenuAnchor[athlete.id])}
                      onClose={() => handleCloseAssessmentMenu(athlete.id)}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                    >
                      <MenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleRecordVideo(athlete.id);
                      }}>
                        <VideocamIcon sx={{ mr: 1 }} fontSize="small" />
                        Record Live Video
                      </MenuItem>
                      <MenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleUploadVideo(athlete.id);
                      }}>
                        <CloudUpload sx={{ mr: 1 }} fontSize="small" />
                        Upload Video
                      </MenuItem>
                    </Menu>
                  </>
                )}
                <Tooltip title="Edit Athlete">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAthlete(athlete);
                    }}
                    aria-label={`Edit ${athlete.name}`}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </TableContainer>

      <EditAthleteModal
        open={editModalOpen}
        athlete={selectedAthlete}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};
