import React from 'react';
import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material';

export type AvailabilityStatus = 'active' | 'coming-soon' | null;

interface AvailabilityFilterProps {
  selectedStatus: AvailabilityStatus;
  onStatusChange: (status: AvailabilityStatus) => void;
}

export const AvailabilityFilter: React.FC<AvailabilityFilterProps> = ({
  selectedStatus,
  onStatusChange,
}) => {
  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1,
          fontWeight: 600,
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.5px',
          color: 'text.secondary',
        }}
      >
        Availability
      </Typography>
      <FormControl fullWidth size="small">
        <Select
          value={selectedStatus || 'all'}
          onChange={(e) => {
            const value = e.target.value;
            onStatusChange(value === 'all' ? null : value as AvailabilityStatus);
          }}
          sx={{ bgcolor: 'background.paper' }}
        >
          <MenuItem value="active">Active Now</MenuItem>
          <MenuItem value="coming-soon">Coming Soon</MenuItem>
          <MenuItem value="all">All</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default AvailabilityFilter;
