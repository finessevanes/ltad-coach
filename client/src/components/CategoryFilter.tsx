import React from 'react';
import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material';
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
        Category
      </Typography>
      <FormControl fullWidth size="small">
        <Select
          value={selectedCategory || 'all'}
          onChange={(e) => {
            const value = e.target.value;
            onCategoryChange(value === 'all' ? null : value as LTADCategory);
          }}
          sx={{ bgcolor: 'background.paper' }}
        >
          <MenuItem value="all">All Categories</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category} value={category}>
              {categoryLabels[category]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default CategoryFilter;
