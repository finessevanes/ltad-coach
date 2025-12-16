import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  InputAdornment,
  Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { Athlete } from '../../../types/athlete';
import { getCurrentSeason } from '../../../utils/dateUtils';

interface AthletesPanelProps {
  athletes: Athlete[];
  loading?: boolean;
}

type FilterStatus = 'all' | 'active' | 'pending' | 'declined';

const filterOptions: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Declined', value: 'declined' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'pending':
      return 'warning';
    case 'declined':
      return 'error';
    default:
      return 'default';
  }
};

const getAvatarBgColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success.main';
    case 'pending':
      return 'warning.main';
    case 'declined':
      return 'error.main';
    default:
      return 'grey.400';
  }
};

export function AthletesPanel({ athletes, loading = false }: AthletesPanelProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // Filter athletes based on search and status
  const filteredAthletes = useMemo(() => {
    return athletes.filter((athlete) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        athlete.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        athlete.consentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [athletes, searchQuery, statusFilter]);

  const handleAthleteClick = (athleteId: string) => {
    navigate(`/athletes/${athleteId}`);
  };

  if (loading) {
    return (
      <Card
        sx={{
          height: '100%',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.100',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Season Header Skeleton */}
          <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />

          {/* Athletes Header with Add Button Skeleton */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="text" width={80} height={32} />
            <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 2 }} />
          </Box>

          {/* Search Field Skeleton */}
          <Skeleton variant="rectangular" height={40} sx={{ mb: 2, borderRadius: 2 }} />

          {/* Filter Chips Skeleton */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Skeleton variant="rectangular" width={50} height={24} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" width={75} height={24} sx={{ borderRadius: 2 }} />
          </Box>

          {/* Athlete List Skeleton */}
          <List sx={{ mx: -1 }}>
            {[1, 2, 3].map((i) => (
              <ListItem key={i} disablePadding>
                <Box sx={{ display: 'flex', gap: 2, width: '100%', py: 1, px: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={20} />
                  </Box>
                  <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 2 }} />
                </Box>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'grey.100',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Season Header */}
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 600, letterSpacing: 1 }}
        >
          {getCurrentSeason()}
        </Typography>

        {/* Athletes Header with Add Button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            mt: 0.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Athletes
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/athletes/new')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Add
          </Button>
        </Box>

        {/* Search Field */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search roster..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        {/* Filter Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {filterOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              size="small"
              onClick={() => setStatusFilter(option.value)}
              color={statusFilter === option.value ? 'primary' : 'default'}
              variant={statusFilter === option.value ? 'filled' : 'outlined'}
              sx={{
                borderRadius: 2,
                fontWeight: 500,
              }}
            />
          ))}
        </Box>

        {/* Athlete List */}
        <List
          sx={{
            maxHeight: 300,
            overflow: 'auto',
            mx: -1,
          }}
        >
          {filteredAthletes.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', py: 3 }}
            >
              No athletes found
            </Typography>
          ) : (
            filteredAthletes.map((athlete) => (
              <ListItem key={athlete.id} disablePadding>
                <ListItemButton
                  onClick={() => handleAthleteClick(athlete.id)}
                  sx={{ borderRadius: 2, py: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: getAvatarBgColor(athlete.consentStatus),
                        width: 40,
                        height: 40,
                        fontSize: '1rem',
                      }}
                    >
                      {athlete.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {athlete.name}
                      </Typography>
                    }
                    secondary={`Age ${athlete.age} ${athlete.gender}`}
                  />
                  <Chip
                    label={
                      athlete.consentStatus.charAt(0).toUpperCase() +
                      athlete.consentStatus.slice(1)
                    }
                    size="small"
                    color={getStatusColor(athlete.consentStatus)}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 500,
                      fontSize: '0.7rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </CardContent>
    </Card>
  );
}
