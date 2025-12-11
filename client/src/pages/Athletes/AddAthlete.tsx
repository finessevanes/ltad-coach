import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { athleteSchema, AthleteFormData } from '../../utils/validation';
import athletesService from '../../services/athletes';

export default function AddAthlete() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AthleteFormData>({
    resolver: yupResolver(athleteSchema),
    defaultValues: {
      gender: 'male',
    },
  });

  const onSubmit = async (data: AthleteFormData) => {
    setError('');
    setLoading(true);
    try {
      await athletesService.create(data);
      navigate('/athletes');
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create athlete';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/athletes');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" align="center" gutterBottom>
            Add New Athlete
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Enter athlete information to get started
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('name')}
              label="Athlete Name"
              fullWidth
              margin="normal"
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={loading}
              required
            />

            <TextField
              {...register('age', { valueAsNumber: true })}
              label="Age"
              type="number"
              fullWidth
              margin="normal"
              error={!!errors.age}
              helperText={errors.age?.message}
              disabled={loading}
              required
              inputProps={{ min: 5, max: 13 }}
            />

            <FormControl
              component="fieldset"
              margin="normal"
              error={!!errors.gender}
              disabled={loading}
              fullWidth
              required
            >
              <FormLabel component="legend">Gender</FormLabel>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <RadioGroup {...field} row>
                    <FormControlLabel value="male" control={<Radio />} label="Male" />
                    <FormControlLabel value="female" control={<Radio />} label="Female" />
                    <FormControlLabel value="other" control={<Radio />} label="Other" />
                  </RadioGroup>
                )}
              />
              {errors.gender && <FormHelperText>{errors.gender.message}</FormHelperText>}
            </FormControl>

            <TextField
              {...register('parentEmail')}
              label="Parent/Guardian Email"
              type="email"
              fullWidth
              margin="normal"
              error={!!errors.parentEmail}
              helperText={errors.parentEmail?.message}
              disabled={loading}
              required
            />

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Athlete'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
