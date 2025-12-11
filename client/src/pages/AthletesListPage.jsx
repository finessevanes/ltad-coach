import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ROUTES } from '../utils/routes';
import AthleteCard from '../components/Athletes/AthleteCard';

const AthletesListPage = () => {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAthletes();
  }, []);

  const fetchAthletes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/athletes');
      setAthletes(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load athletes');
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = athletes.filter((athlete) =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Athletes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate(ROUTES.ADD_ATHLETE)}
        >
          Add Athlete
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search athletes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && filteredAthletes.length === 0 && (
        <Alert severity="info">
          {searchQuery
            ? 'No athletes found matching your search.'
            : 'No athletes yet. Click "Add Athlete" to get started.'}
        </Alert>
      )}

      {!loading && !error && filteredAthletes.map((athlete) => (
        <AthleteCard key={athlete.id} athlete={athlete} />
      ))}
    </Container>
  );
};

export default AthletesListPage;
