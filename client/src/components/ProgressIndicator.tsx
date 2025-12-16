import { LinearProgress, CircularProgress, Box, Typography, Stepper, Step, StepLabel } from '@mui/material';

interface BaseProgressIndicatorProps {
  message?: string;
  showPercentage?: boolean;
}

interface LinearProgressIndicatorProps extends BaseProgressIndicatorProps {
  variant: 'linear';
  progress: number; // 0-100
}

interface CircularProgressIndicatorProps extends BaseProgressIndicatorProps {
  variant: 'circular';
  progress?: number; // 0-100 or undefined for indeterminate
}

interface StepperProgressIndicatorProps extends BaseProgressIndicatorProps {
  variant: 'stepper';
  steps: string[];
  activeStep: number;
}

type ProgressIndicatorProps =
  | LinearProgressIndicatorProps
  | CircularProgressIndicatorProps
  | StepperProgressIndicatorProps;

/**
 * Flexible progress indicator with three variants.
 *
 * **Variants:**
 * - **linear**: File uploads, downloads, or any operation with measurable progress (0-100%)
 * - **circular**: Indeterminate operations like API calls, or determinate with progress value
 * - **stepper**: Multi-step workflows (e.g., wizard forms, multi-stage uploads)
 *
 * @example
 * // Linear progress for file upload
 * const { isLoading, progress, setProgress } = useLoading('upload-video');
 * return (
 *   <ProgressIndicator
 *     variant="linear"
 *     progress={progress}
 *     message="Uploading video..."
 *     showPercentage
 *   />
 * );
 *
 * @example
 * // Circular indeterminate for API call
 * const { isLoading } = useLoading('fetch-data');
 * return isLoading ? <ProgressIndicator variant="circular" message="Loading..." /> : null;
 *
 * @example
 * // Stepper for multi-step workflow
 * const [activeStep, setActiveStep] = useState(0);
 * return (
 *   <ProgressIndicator
 *     variant="stepper"
 *     steps={['Upload Left Leg', 'Upload Right Leg', 'Analyze Results']}
 *     activeStep={activeStep}
 *     message="Step 2 of 3"
 *   />
 * );
 */
export function ProgressIndicator(props: ProgressIndicatorProps) {
  if (props.variant === 'linear') {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, Math.max(0, props.progress))}
          sx={{ height: 8, borderRadius: 4, mb: props.message ? 1 : 0 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {props.message && (
            <Typography variant="body2" color="textSecondary">
              {props.message}
            </Typography>
          )}
          {props.showPercentage && (
            <Typography variant="caption" color="textSecondary">
              {Math.round(props.progress)}%
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  if (props.variant === 'circular') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <CircularProgress
          variant={props.progress !== undefined ? 'determinate' : 'indeterminate'}
          value={props.progress ?? 0}
        />
        {props.message && (
          <Typography variant="body2" color="textSecondary">
            {props.message}
          </Typography>
        )}
        {props.showPercentage && props.progress !== undefined && (
          <Typography variant="caption" color="textSecondary">
            {Math.round(props.progress)}%
          </Typography>
        )}
      </Box>
    );
  }

  if (props.variant === 'stepper') {
    return (
      <Box>
        <Stepper activeStep={props.activeStep} sx={{ mb: 2 }}>
          {props.steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {props.message && (
          <Typography variant="body2" color="textSecondary" align="center">
            {props.message}
          </Typography>
        )}
      </Box>
    );
  }

  return null;
}
