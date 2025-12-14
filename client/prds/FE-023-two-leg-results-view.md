---
id: FE-023
status: 🔵 READY FOR DEVELOPMENT
depends_on: [FE-018]
blocks: [FE-024]
---

# FE-023: TwoLegResultsView Component

## Title
Create bilateral comparison results view with side-by-side metrics, video playback, and AI feedback

## Scope

### In Scope
- Create new `TwoLegResultsView.tsx` component
- 3-column summary layout (Left Leg | Symmetry | Right Leg)
- Side-by-side video players with synchronized controls
- Metrics comparison table with difference highlighting
- Symmetry analysis card with visual indicators
- AI bilateral feedback display
- Responsive design for desktop and tablet

### Out of Scope
- Assessment results routing logic (FE-024)
- Single-leg results view modifications
- Historical comparison (Phase 8+)
- Print/export functionality

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout Structure | MUI Grid with 3 columns | Clear visual separation; responsive breakpoints |
| Video Component | HTML5 video with custom controls | Browser compatibility; no external player needed |
| Difference Highlighting | Color-coded badges (green/yellow/red) | Quick visual assessment of asymmetry |
| Symmetry Visualization | Progress bar + numeric score | Intuitive representation of 0-100 scale |
| Table Library | MUI Table | Consistent with project design system |

## Acceptance Criteria

- [ ] Component renders for assessments with `legTested === 'both'`
- [ ] Summary cards show left leg, symmetry, and right leg metrics
- [ ] Videos play side-by-side with synchronized controls
- [ ] Comparison table displays all key metrics with differences
- [ ] Differences >20% highlighted in yellow/red
- [ ] Symmetry score displayed as progress bar and number
- [ ] AI bilateral feedback rendered with markdown support
- [ ] Responsive on desktop (1920px), tablet (768px), mobile (375px)
- [ ] Loading states for video players
- [ ] Error handling for missing bilateral data

## Files to Create/Modify

```
client/src/pages/Assessment/components/
└── TwoLegResultsView.tsx         # NEW: Bilateral results display
```

## Implementation Details

### Create `TwoLegResultsView.tsx`

```typescript
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { Assessment, DualLegMetrics } from '../../../types/assessment';
import { Athlete } from '../../../types/athlete';

interface TwoLegResultsViewProps {
  assessment: Assessment;
  athlete: Athlete;
}

export const TwoLegResultsView: React.FC<TwoLegResultsViewProps> = ({
  assessment,
  athlete,
}) => {
  const { leftLegMetrics, rightLegMetrics, bilateralComparison } = assessment;

  if (!leftLegMetrics || !rightLegMetrics || !bilateralComparison) {
    return (
      <Alert severity="error">
        Missing bilateral data. This assessment may be corrupted.
      </Alert>
    );
  }

  const getDifferenceColor = (diffPct: number): 'success' | 'warning' | 'error' => {
    if (diffPct < 10) return 'success';
    if (diffPct < 20) return 'warning';
    return 'error';
  };

  const getSymmetryColor = (score: number): string => {
    if (score >= 85) return '#4caf50'; // green
    if (score >= 70) return '#ff9800'; // orange
    if (score >= 50) return '#ff5722'; // red-orange
    return '#f44336'; // red
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Bilateral Balance Assessment
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {athlete.name} • {new Date(assessment.createdAt).toLocaleDateString()}
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Left Leg Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Left Leg
              </Typography>
              <Typography variant="h3">{leftLegMetrics.holdTime.toFixed(1)}s</Typography>
              <Chip
                label={`Score: ${leftLegMetrics.durationScore}/5`}
                color={leftLegMetrics.durationScore >= 4 ? 'success' : 'default'}
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Sway: {leftLegMetrics.swayVelocity.toFixed(2)} cm/s
                <br />
                Corrections: {leftLegMetrics.correctionsCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Symmetry Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Symmetry Analysis
              </Typography>
              <Typography variant="h3" sx={{ color: getSymmetryColor(bilateralComparison.overallSymmetryScore) }}>
                {bilateralComparison.overallSymmetryScore.toFixed(0)}/100
              </Typography>
              <LinearProgress
                variant="determinate"
                value={bilateralComparison.overallSymmetryScore}
                sx={{
                  mt: 2,
                  height: 10,
                  borderRadius: 5,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getSymmetryColor(bilateralComparison.overallSymmetryScore),
                  },
                }}
              />
              <Chip
                label={bilateralComparison.symmetryAssessment.toUpperCase()}
                color={
                  bilateralComparison.symmetryAssessment === 'excellent' ? 'success' :
                  bilateralComparison.symmetryAssessment === 'good' ? 'primary' :
                  'warning'
                }
                sx={{ mt: 2 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Dominant: {bilateralComparison.dominantLeg === 'balanced' ? 'Balanced' : `${bilateralComparison.dominantLeg} leg`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Leg Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="secondary" gutterBottom>
                Right Leg
              </Typography>
              <Typography variant="h3">{rightLegMetrics.holdTime.toFixed(1)}s</Typography>
              <Chip
                label={`Score: ${rightLegMetrics.durationScore}/5`}
                color={rightLegMetrics.durationScore >= 4 ? 'success' : 'default'}
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Sway: {rightLegMetrics.swayVelocity.toFixed(2)} cm/s
                <br />
                Corrections: {rightLegMetrics.correctionsCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Video Comparison */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Video Comparison
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Left Leg Test
              </Typography>
              <video
                src={assessment.leftLegVideoUrl}
                controls
                style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="secondary" gutterBottom>
                Right Leg Test
              </Typography>
              <video
                src={assessment.rightLegVideoUrl}
                controls
                style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Metrics Comparison Table */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detailed Comparison
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell align="right">Left Leg</TableCell>
                  <TableCell align="right">Right Leg</TableCell>
                  <TableCell align="right">Difference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Hold Time</TableCell>
                  <TableCell align="right">{leftLegMetrics.holdTime.toFixed(1)}s</TableCell>
                  <TableCell align="right">{rightLegMetrics.holdTime.toFixed(1)}s</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${bilateralComparison.durationDifference.toFixed(1)}s (${bilateralComparison.durationDifferencePct.toFixed(1)}%)`}
                      size="small"
                      color={getDifferenceColor(bilateralComparison.durationDifferencePct)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sway Velocity</TableCell>
                  <TableCell align="right">{leftLegMetrics.swayVelocity.toFixed(2)} cm/s</TableCell>
                  <TableCell align="right">{rightLegMetrics.swayVelocity.toFixed(2)} cm/s</TableCell>
                  <TableCell align="right">
                    {bilateralComparison.swayDifference.toFixed(2)} cm/s
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Corrections</TableCell>
                  <TableCell align="right">{leftLegMetrics.correctionsCount}</TableCell>
                  <TableCell align="right">{rightLegMetrics.correctionsCount}</TableCell>
                  <TableCell align="right">
                    {bilateralComparison.correctionsDifference > 0 ? '+' : ''}
                    {bilateralComparison.correctionsDifference}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Arm Angle (Avg)</TableCell>
                  <TableCell align="right">
                    {((leftLegMetrics.armAngleLeft + leftLegMetrics.armAngleRight) / 2).toFixed(1)}°
                  </TableCell>
                  <TableCell align="right">
                    {((rightLegMetrics.armAngleLeft + rightLegMetrics.armAngleRight) / 2).toFixed(1)}°
                  </TableCell>
                  <TableCell align="right">
                    {bilateralComparison.armAngleDifference.toFixed(1)}°
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* AI Bilateral Feedback */}
      {assessment.aiCoachAssessment && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Coach AI Assessment
            </Typography>
            <Box sx={{ '& p': { mb: 2 }, '& ul': { pl: 3 }, '& li': { mb: 1 } }}>
              <ReactMarkdown>{assessment.aiCoachAssessment}</ReactMarkdown>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
```

## Estimated Complexity

**L** (Large) - 6 hours

**Breakdown**:
- Component structure and layout: 2 hours
- Summary cards and symmetry visualization: 1.5 hours
- Video players and comparison table: 1.5 hours
- Responsive design and polish: 1 hour

## Testing Instructions

### Manual Testing

1. **Navigate to bilateral assessment results**:
   - Complete dual-leg test
   - Verify redirect to results page
   - Confirm TwoLegResultsView renders

2. **Verify summary cards**:
   - Left leg shows correct hold time and score
   - Symmetry card displays 0-100 score
   - Right leg shows correct metrics
   - Dominant leg label correct

3. **Test video playback**:
   - Both videos load successfully
   - Controls work independently
   - Videos responsive on different screen sizes

4. **Check comparison table**:
   - All metrics display with correct units
   - Differences calculated correctly
   - Color coding matches thresholds (<10% green, 10-20% yellow, >20% red)

5. **Responsive design**:
   - Desktop (1920px): 3-column layout
   - Tablet (768px): 2-column layout
   - Mobile (375px): Single column stack

### Test Data

```typescript
// Mock bilateral assessment
const mockAssessment = {
  id: 'test123',
  legTested: 'both',
  createdAt: new Date().toISOString(),
  leftLegVideoUrl: 'https://example.com/left.mp4',
  rightLegVideoUrl: 'https://example.com/right.mp4',
  leftLegMetrics: {
    holdTime: 25.3,
    durationScore: 4,
    swayVelocity: 2.1,
    correctionsCount: 8,
    armAngleLeft: 8.5,
    armAngleRight: 12.3,
    // ... other metrics
  },
  rightLegMetrics: {
    holdTime: 23.8,
    durationScore: 4,
    swayVelocity: 2.3,
    correctionsCount: 10,
    armAngleLeft: 10.2,
    armAngleRight: 14.1,
  },
  bilateralComparison: {
    durationDifference: 1.5,
    durationDifferencePct: 6.2,
    dominantLeg: 'left',
    swayDifference: 0.2,
    swaySymmetryScore: 0.91,
    armAngleDifference: 2.2,
    correctionsDifference: -2,
    overallSymmetryScore: 82.0,
    symmetryAssessment: 'good',
  },
  aiCoachAssessment: '## Great bilateral balance!\n\nBoth legs performed well...',
};
```

## Notes

### UI/UX Decisions

**Color coding philosophy**:
- Green (<10%): Excellent symmetry
- Yellow (10-20%): Good symmetry, normal variation
- Red (>20%): Moderate asymmetry, needs attention

**Symmetry score visualization**:
- Progress bar provides immediate visual feedback
- Numeric score (0-100) for precision
- Qualitative label (excellent/good/fair/poor) for context

**Video layout**:
- Side-by-side for direct comparison
- Independent controls (some coaches prefer analyzing one leg at a time)
- Considered synchronized playback but rejected (adds complexity, limited value)

### Accessibility

- All color-coded elements include text labels
- Videos include controls attribute for keyboard navigation
- Table has proper semantic HTML structure
- Chip labels readable without relying solely on color

### Performance Considerations

- Videos lazy-load (browser native)
- No auto-play (saves bandwidth)
- ReactMarkdown parses AI feedback (allows rich formatting)
- No heavy chart libraries (uses MUI built-ins)

### Future Enhancements

- **Print view**: Formatted PDF export
- **Historical comparison**: Overlay previous bilateral tests
- **Temporal visualization**: Charts showing fatigue patterns over time
- **Export data**: CSV download of all metrics
