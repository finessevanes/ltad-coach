import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Alert,
  FormControl,
  InputLabel,
  InputAdornment,
  Stack,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import athletesService from '../../services/athletes';
import { Athlete } from '../../types/athlete';
import { AthletesTable } from './AthletesTable';
import { EmptyState } from '../../components/EmptyState';
import { ConsentAlert } from '../../components/ConsentAlert';
import { useSnackbar } from '../../contexts/SnackbarContext';

/**
 * AthletesList component
 * Main page for displaying and managing athletes list
 * Includes search, filter by status, and add athlete functionality
 */
export default function AthletesList() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    // Load dismissed alerts from localStorage
    const stored = localStorage.getItem('dismissedConsentAlerts');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  // Function to fetch athletes
  const fetchAthletes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await athletesService.getAll(statusFilter || undefined);
      setAthletes(data);
    } catch (err) {
      console.error('Error fetching athletes:', err);
      setError('Failed to load athletes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch athletes when component mounts or status filter changes
  useEffect(() => {
    fetchAthletes();
  }, [statusFilter]);

  // Callback for when an athlete is updated
  const handleAthleteUpdated = () => {
    fetchAthletes();
    showSnackbar('Athlete updated successfully', 'success');
  };

  // Filter athletes by search query (client-side)
  const filteredAthletes = athletes.filter((athlete) =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle navigation to add athlete page
  const handleAddAthlete = () => {
    navigate('/athletes/new');
  };

  // Handle resend consent email
  const handleResendConsent = async (athleteId: string, athleteName: string) => {
    try {
      await athletesService.resendConsent(athleteId);
      showSnackbar(`Consent email resent successfully to ${athleteName}'s parent`, 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to resend consent email';
      showSnackbar(errorMessage, 'error');
    }
  };

  // Handle dismiss consent alert
  const handleDismissAlert = (athleteId: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(athleteId);
    setDismissedAlerts(newDismissed);
    // Persist to localStorage
    localStorage.setItem('dismissedConsentAlerts', JSON.stringify([...newDismissed]));
  };

  // Show empty state if no athletes exist at all
  if (!loading && athletes.length === 0 && !statusFilter && !searchQuery) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <EmptyState
          title="No Athletes Yet"
          description="Get started by adding your first athlete to the roster."
          actionLabel="Add Athlete"
          onAction={handleAddAthlete}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Athletes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your athlete roster and track consent status
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Consent Alerts for pending/declined athletes */}
      {!loading && filteredAthletes.some((a) => (a.consentStatus === 'pending' || a.consentStatus === 'declined') && !dismissedAlerts.has(a.id)) && (
        <Stack spacing={2} sx={{ mb: 3 }}>
          {filteredAthletes
            .filter((a) => (a.consentStatus === 'pending' || a.consentStatus === 'declined') && !dismissedAlerts.has(a.id))
            .map((athlete) => (
              <ConsentAlert
                key={athlete.id}
                athlete={athlete}
                onResend={() => handleResendConsent(athlete.id, athlete.name)}
                onDismiss={() => handleDismissAlert(athlete.id)}
              />
            ))}
        </Stack>
      )}

      {/* Toolbar - Search, Filter, Add Button */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3 }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        {/* Search Field */}
        <TextField
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            flexGrow: 1,
            minWidth: { xs: '100%', sm: 200 },
            '& .MuiOutlinedInput-root': {
              bgcolor: '#FFFFFF',
              borderRadius: '12px',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        {/* Status Filter */}
        <FormControl
          size="small"
          sx={{
            minWidth: { xs: '100%', sm: 150 },
            '& .MuiOutlinedInput-root': {
              bgcolor: '#FFFFFF',
              borderRadius: '12px',
            },
          }}
        >
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="declined">Declined</MenuItem>
          </Select>
        </FormControl>

        {/* Add Athlete Button */}
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddAthlete}
          sx={{
            minWidth: { xs: '100%', sm: 150 },
            bgcolor: '#D4FF00',
            color: '#000000',
            '&:hover': {
              bgcolor: '#C4EF00',
            },
          }}
        >
          Add Athlete
        </Button>
      </Stack>

      {/* Athletes Table */}
      <AthletesTable
        athletes={filteredAthletes}
        loading={loading}
        onAthleteUpdated={handleAthleteUpdated}
      />

      {/* Show info message if search/filter yields no results but athletes exist */}
      {!loading &&
        filteredAthletes.length === 0 &&
        athletes.length > 0 &&
        (searchQuery || statusFilter) && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info">
              No athletes found matching your search criteria. Try adjusting
              your filters.
            </Alert>
          </Box>
        )}
    </Container>
  );
}
