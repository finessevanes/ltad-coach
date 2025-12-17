import React from 'react';
import { Box, Chip, Stack } from '@mui/material';
import { LTADCategory, categoryLabels } from '../config/assessments';

interface CategoryFilterProps {
  selectedCategory: LTADCategory | null;
  onCategoryChange: (category: LTADCategory | null) => void;
}

const categories: LTADCategory[] = ['anthropometric', 'musculoskeletal', 'fiveS'];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ alignItems: 'flex-start' }}>
        {/* Show All button */}
        <Chip
          label="All Categories"
          onClick={() => onCategoryChange(null)}
          variant={selectedCategory === null ? 'filled' : 'outlined'}
          color={selectedCategory === null ? 'primary' : 'default'}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: selectedCategory === null ? 'primary.main' : 'action.hover',
            },
          }}
        />

        {/* Category chips */}
        {categories.map((category) => (
          <Chip
            key={category}
            label={categoryLabels[category]}
            onClick={() => onCategoryChange(selectedCategory === category ? null : category)}
            variant={selectedCategory === category ? 'filled' : 'outlined'}
            color={selectedCategory === category ? 'primary' : 'default'}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor:
                  selectedCategory === category ? 'primary.main' : 'action.hover',
              },
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default CategoryFilter;
