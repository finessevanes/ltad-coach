import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { athleteSchema, AthleteFormData } from '../../utils/validation';
import athletesService from '../../services/athletes';
import { Athlete } from '../../types/athlete';
import { useSnackbar } from '../../contexts/SnackbarContext';

interface EditAthleteModalProps {
  open: boolean;
  athlete: Athlete | null;
  onClose: () => void;
  onSuccess: () => void;
  onDelete?: () => void;
}

export const EditAthleteModal: React.FC<EditAthleteModalProps> = ({
  open,
  athlete,
  onClose,
  onSuccess,
  onDelete,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { showSnackbar } = useSnackbar();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<AthleteFormData>({
    resolver: yupResolver(athleteSchema),
  });

  const watchedParentEmail = watch('parentEmail');
  const emailChanged = athlete && watchedParentEmail !== athlete.parentEmail;

  // Reset form when athlete changes or modal opens
  useEffect(() => {
    if (athlete && open) {
      reset({
        name: athlete.name,
        age: athlete.age,
        gender: athlete.gender,
        parentEmail: athlete.parentEmail,
      });
      setError('');
    }
  }, [athlete, open, reset]);

  const onSubmit = async (data: AthleteFormData) => {
    if (!athlete) return;

    setError('');
    setLoading(true);
    try {
      await athletesService.update(athlete.id, data);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update athlete';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!athlete) return;
    try {
      await athletesService.delete(athlete.id);
      showSnackbar('Athlete deleted successfully', 'success');
      setDeleteDialogOpen(false);
      onClose();
      onDelete?.();
    } catch (err: unknown) {
      const errorMessage =
        (err as { message?: string })?.message || 'Failed to delete athlete';
      showSnackbar(errorMessage, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Athlete</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {emailChanged && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Changing the parent email will reset consent status and send a new consent request to the new email.
            </Alert>
          )}

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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(true)}
            color="error"
            startIcon={<DeleteIcon />}
            disabled={loading}
            sx={{ mr: 'auto' }}
          >
            Delete
          </Button>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Athlete?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {athlete?.name} from your roster?
            This will also delete all their assessment history. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};
