import { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';

const AthleteForm = ({ initialData = {}, onSubmit, submitLabel = 'Save' }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    age: initialData.age || '',
    gender: initialData.gender || '',
    parent_email: initialData.parent_email || '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.age || formData.age < 1 || formData.age > 100) {
      newErrors.age = 'Please enter a valid age (1-100)';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.parent_email.trim()) {
      newErrors.parent_email = 'Parent email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent_email)) {
      newErrors.parent_email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null,
      });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <TextField
        fullWidth
        label="Athlete Name"
        value={formData.name}
        onChange={handleChange('name')}
        error={!!errors.name}
        helperText={errors.name}
        margin="normal"
        required
      />

      <TextField
        fullWidth
        label="Age"
        type="number"
        value={formData.age}
        onChange={handleChange('age')}
        error={!!errors.age}
        helperText={errors.age}
        margin="normal"
        required
        inputProps={{ min: 1, max: 100 }}
      />

      <FormControl fullWidth margin="normal" error={!!errors.gender} required>
        <InputLabel>Gender</InputLabel>
        <Select
          value={formData.gender}
          onChange={handleChange('gender')}
          label="Gender"
        >
          <MenuItem value="male">Male</MenuItem>
          <MenuItem value="female">Female</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </Select>
        {errors.gender && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {errors.gender}
          </Alert>
        )}
      </FormControl>

      <TextField
        fullWidth
        label="Parent Email"
        type="email"
        value={formData.parent_email}
        onChange={handleChange('parent_email')}
        error={!!errors.parent_email}
        helperText={errors.parent_email}
        margin="normal"
        required
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        size="large"
        fullWidth
        sx={{ mt: 3 }}
      >
        {submitLabel}
      </Button>
    </Box>
  );
};

export default AthleteForm;
