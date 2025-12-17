import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';

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
    <Box sx={{ mb: 3 }}>
      {/* Filter Label */}
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1.5,
          fontWeight: 600,
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.5px',
          color: 'text.secondary',
        }}
      >
        Availability
      </Typography>

      {/* Filter Chips */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {/* Active (Default) */}
        <Chip
          label="Active Now"
          onClick={() => onStatusChange('active')}
          variant={selectedStatus === 'active' ? 'filled' : 'outlined'}
          color={selectedStatus === 'active' ? 'success' : 'default'}
          sx={{
            cursor: 'pointer',
            fontWeight: selectedStatus === 'active' ? 600 : 500,
            '&:hover': {
              backgroundColor:
                selectedStatus === 'active' ? 'success.main' : 'action.hover',
            },
          }}
        />

        {/* Coming Soon */}
        <Chip
          label="Coming Soon"
          onClick={() => onStatusChange('coming-soon')}
          variant={selectedStatus === 'coming-soon' ? 'filled' : 'outlined'}
          color={selectedStatus === 'coming-soon' ? 'warning' : 'default'}
          sx={{
            cursor: 'pointer',
            fontWeight: selectedStatus === 'coming-soon' ? 600 : 500,
            '&:hover': {
              backgroundColor:
                selectedStatus === 'coming-soon' ? 'warning.main' : 'action.hover',
            },
          }}
        />

        {/* All */}
        <Chip
          label="All"
          onClick={() => onStatusChange(null)}
          variant={selectedStatus === null ? 'filled' : 'outlined'}
          color={selectedStatus === null ? 'default' : 'default'}
          sx={{
            cursor: 'pointer',
            fontWeight: selectedStatus === null ? 600 : 500,
            '&:hover': {
              backgroundColor: selectedStatus === null ? 'action.selected' : 'action.hover',
            },
          }}
        />
      </Stack>
    </Box>
  );
};

export default AvailabilityFilter;
