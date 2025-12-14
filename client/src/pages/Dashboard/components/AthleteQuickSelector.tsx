import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Button,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Athlete {
  id: string;
  name: string;
  age: number;
  gender: string;
  consentStatus: 'pending' | 'declined' | 'active';
}

interface AthleteQuickSelectorProps {
  athletes: Athlete[];
  selectedAthleteId?: string;
}

export const AthleteQuickSelector: React.FC<AthleteQuickSelectorProps> = ({
  athletes,
  selectedAthleteId,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAthletes = athletes.filter((athlete) => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || athlete.consentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Athletes
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/athletes/new')}
          >
            Add
          </Button>
        </Box>

        {/* Search */}
        <TextField
          placeholder="Search roster..."
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* Status Filter */}
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_, newValue) => {
            if (newValue !== null) {
              setStatusFilter(newValue);
            }
          }}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="pending">Pending</ToggleButton>
          <ToggleButton value="declined">Declined</ToggleButton>
        </ToggleButtonGroup>

        {/* Athletes List */}
        <Box sx={{ flex: 1, overflowY: 'auto', mx: -2, px: 2 }}>
          {filteredAthletes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No athletes found
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredAthletes.map((athlete) => (
                <ListItem
                  key={athlete.id}
                  sx={{
                    px: 2,
                    py: 1.5,
                    mb: 1,
                    borderRadius: 2,
                    cursor: 'pointer',
                    backgroundColor:
                      selectedAthleteId === athlete.id ? '#EFF6FF' : 'transparent',
                    border: '1px solid',
                    borderColor:
                      selectedAthleteId === athlete.id ? 'primary.main' : 'divider',
                    '&:hover': {
                      backgroundColor:
                        selectedAthleteId === athlete.id ? '#EFF6FF' : 'action.hover',
                    },
                  }}
                  onClick={() => navigate(`/athletes/${athlete.id}`)}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          athlete.consentStatus === 'active'
                            ? 'success.main'
                            : athlete.consentStatus === 'pending'
                            ? 'warning.main'
                            : 'error.main',
                      }}
                    >
                      {athlete.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        {athlete.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Age {athlete.age} • {athlete.gender}
                      </Typography>
                    }
                  />
                  <Chip
                    label={athlete.consentStatus}
                    size="small"
                    color={getStatusColor(athlete.consentStatus) as any}
                    sx={{ textTransform: 'capitalize', ml: 1 }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
