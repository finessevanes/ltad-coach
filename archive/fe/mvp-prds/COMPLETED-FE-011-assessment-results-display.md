---
id: FE-011
depends_on: [FE-009, FE-010]
blocks: [FE-012, FE-013]
---

# FE-011: Assessment Results Display

> ## ⚠️ Implementation Note
>
> The polling logic described below is no longer needed. With client-side metrics
> calculation, assessments are stored as "completed" immediately - no "processing"
> state exists. Assessments load synchronously without polling.

## Title
Implement assessment results page with metrics, AI feedback, and peer comparison

## Scope

### In Scope
- Results page at `/assessments/:id`
- Duration score badge (1-5 with label)
- Quality metrics display
- AI feedback section
- Team ranking display
- Coach notes editor
- Video playback

### Out of Scope
- Progress charts (FE-012)
- Parent report generation (FE-013)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Score Display | Large badge + label | Visual hierarchy, quick understanding |
| Metrics | Cards with icons | Scannable, organized |
| AI Feedback | Markdown rendering | Support formatting from AI |

## Acceptance Criteria

- [x] Page displays duration score as prominent badge
- [x] Score label shows (e.g., "Proficient")
- [x] Age comparison shown (meets/above/below expected)
- [x] Quality metrics displayed in organized cards
- [x] Team ranking shown (e.g., "3rd of 12")
- [x] AI feedback rendered with formatting
- [x] Coach notes editable with save
- [x] Video playback available
- [x] Loading state while fetching assessment data
- [x] ~~Polling continues while status is "processing"~~ **❌ NOT NEEDED** - Assessments complete immediately with no "processing" state

**Status: ✅ COMPLETED**

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Assessment/
│       ├── Results.tsx              # Main results page
│       ├── ScoreBadge.tsx           # Duration score display
│       ├── MetricsCards.tsx         # Quality metrics grid
│       └── FeedbackSection.tsx      # AI feedback + notes
├── services/
│   └── assessments.ts               # API calls
└── types/
    └── assessment.ts                # Add result types (modify)
```

## Implementation Details

### types/assessment.ts (additions)

> **Type Convention**: `testType` is the assessment type (e.g., `"one_leg_balance"`) and `legTested`
> indicates which leg was used (e.g., `"left"` or `"right"`). This separation allows for future test
> types while keeping leg selection distinct.

```typescript
export interface AssessmentMetrics {
  durationSeconds: number;
  stabilityScore: number;
  swayStdX: number;
  swayStdY: number;
  swayPathLength: number;
  swayVelocity: number;
  armExcursionLeft: number;
  armExcursionRight: number;
  armAsymmetryRatio: number;
  correctionsCount: number;
  failureReason: string;
}

export interface AssessmentDetail {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteAge: number;
  testType: string;
  legTested: string;
  createdAt: string;
  status: 'completed' | 'failed';  // Always 'completed' - no "processing" state (synchronous)
  videoUrl?: string;
  metrics?: AssessmentMetrics;
  aiFeedback?: string;
  coachNotes?: string;
  teamRank?: number;
  teamTotal?: number;
}

/**
 * Lightweight assessment type for lists (FE-012 Athlete Profile, FE-015 Dashboard)
 * Used when displaying assessment history without full metrics details
 */
export interface AssessmentListItem {
  id: string;
  athleteId: string;
  athleteName: string;
  testType: string;
  legTested: string;
  createdAt: string;
  status: 'completed' | 'failed';  // Always 'completed' - no "processing" state (synchronous)
  durationSeconds?: number;
  stabilityScore?: number;
}
```

### services/assessments.ts
```typescript
import { api } from './api';
import { AssessmentDetail } from '../types/assessment';

// Note: The api client (defined in FE-001) uses camelcase-keys interceptor
// to automatically transform snake_case responses to camelCase.
// No manual mapping is needed.

export const assessmentsApi = {
  getById: async (id: string): Promise<AssessmentDetail> => {
    const response = await api.get(`/assessments/${id}`);
    return response.data;  // Already transformed by interceptor
  },

  updateNotes: async (id: string, notes: string): Promise<void> => {
    await api.put(`/assessments/${id}/notes`, { notes });
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/assessments/${id}`);
  },
};
```

### Field Mapping Reference

The `camelcase-keys` interceptor (configured in FE-001) automatically converts all backend snake_case fields to frontend camelCase. Here's the complete mapping for assessment endpoints:

| Backend (snake_case) | Frontend (camelCase) |
|---------------------|---------------------|
| `id` | `id` |
| `athlete_id` | `athleteId` |
| `athlete_name` | `athleteName` |
| `athlete_age` | `athleteAge` |
| `test_type` | `testType` |
| `leg_tested` | `legTested` |
| `created_at` | `createdAt` |
| `status` | `status` |
| `video_url` | `videoUrl` |
| `metrics.duration_seconds` | `metrics.durationSeconds` |
| `metrics.stability_score` | `metrics.stabilityScore` |
| `metrics.sway_std_x` | `metrics.swayStdX` |
| `metrics.sway_std_y` | `metrics.swayStdY` |
| `metrics.sway_path_length` | `metrics.swayPathLength` |
| `metrics.sway_velocity` | `metrics.swayVelocity` |
| `metrics.arm_excursion_left` | `metrics.armExcursionLeft` |
| `metrics.arm_excursion_right` | `metrics.armExcursionRight` |
| `metrics.arm_asymmetry_ratio` | `metrics.armAsymmetryRatio` |
| `metrics.corrections_count` | `metrics.correctionsCount` |
| `metrics.failure_reason` | `metrics.failureReason` |
| `ai_feedback` | `aiFeedback` |
| `coach_notes` | `coachNotes` |
| `team_total` | `teamTotal` |

### pages/Assessment/Results.tsx
```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Description as ReportIcon,
} from '@mui/icons-material';
import { assessmentsApi } from '../../services/assessments';
import { AssessmentDetail } from '../../types/assessment';
import { ScoreBadge } from './ScoreBadge';
import { MetricsCards } from './MetricsCards';
import { FeedbackSection } from './FeedbackSection';

export default function Results() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  const loadAssessment = async () => {
    if (!assessmentId) return;
    try {
      const data = await assessmentsApi.getById(assessmentId);
      setAssessment(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load assessment');
      setLoading(false);
    }
  };

  const handleNotesUpdate = async (notes: string) => {
    if (!assessmentId) return;
    await assessmentsApi.updateNotes(assessmentId, notes);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !assessment) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Assessment not found'}</Alert>
      </Container>
    );
  }

  if (assessment.status === 'failed') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Analysis Failed
          </Alert>
          <Typography color="text.secondary">
            {assessment.aiFeedback || 'An error occurred during analysis.'}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate(`/athletes/${assessment.athleteId}`)}
            sx={{ mt: 2 }}
          >
            Back to Athlete
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(`/athletes/${assessment.athleteId}`)}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h5">Assessment Results</Typography>
            <Typography variant="body2" color="text.secondary">
              {assessment.athleteName} • {new Date(assessment.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<ReportIcon />}
          onClick={() => navigate(`/athletes/${assessment.athleteId}/report`)}
        >
          Generate Parent Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Main Score */}
        <Grid item xs={12} md={4}>
          <ScoreBadge
            duration={assessment.metrics?.durationSeconds || 0}
            age={assessment.athleteAge}
            teamRank={assessment.teamRank}
            teamTotal={assessment.teamTotal}
          />
        </Grid>

        {/* Quality Metrics */}
        <Grid item xs={12} md={8}>
          {assessment.metrics && (
            <MetricsCards metrics={assessment.metrics} />
          )}
        </Grid>

        {/* Video */}
        {assessment.videoUrl && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recording
              </Typography>
              <Box sx={{ maxWidth: 600 }}>
                <video
                  src={assessment.videoUrl}
                  controls
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Box>
            </Paper>
          </Grid>
        )}

        {/* AI Feedback & Notes */}
        <Grid item xs={12}>
          <FeedbackSection
            aiFeedback={assessment.aiFeedback}
            coachNotes={assessment.coachNotes}
            onNotesUpdate={handleNotesUpdate}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
```

### pages/Assessment/ScoreBadge.tsx
```typescript
import { Paper, Typography, Box, Chip } from '@mui/material';
import { EmojiEvents as TrophyIcon } from '@mui/icons-material';

interface ScoreBadgeProps {
  duration: number;
  age: number;
  teamRank?: number;
  teamTotal?: number;
}

const SCORE_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'Beginning', color: '#f44336' },
  2: { label: 'Developing', color: '#ff9800' },
  3: { label: 'Competent', color: '#2196f3' },
  4: { label: 'Proficient', color: '#4caf50' },
  5: { label: 'Advanced', color: '#9c27b0' },
};

function getScore(duration: number): number {
  if (duration >= 25) return 5;
  if (duration >= 20) return 4;
  if (duration >= 15) return 3;
  if (duration >= 10) return 2;
  return 1;
}

/**
 * Get expected score based on Jeremy Frisch LTAD benchmarks
 * Ages 5-6: Expected score 1
 * Age 7: Expected score 2
 * Ages 8-9: Expected score 3
 * Ages 10-11: Expected score 4
 * Ages 12-13: Expected score 5
 */
function getExpectedScore(age: number): number {
  if (age <= 6) return 1;
  if (age === 7) return 2;
  if (age <= 9) return 3;
  if (age <= 11) return 4;
  return 5; // Ages 12-13
}

function getAgeExpectation(age: number, score: number): string {
  const expected = getExpectedScore(age);
  if (score > expected) return 'Above expected';
  if (score < expected) return 'Below expected';
  return 'Meets expected';
}

export function ScoreBadge({ duration, age, teamRank, teamTotal }: ScoreBadgeProps) {
  const score = getScore(duration);
  const config = SCORE_CONFIG[score];
  const ageComparison = getAgeExpectation(age, score);

  return (
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      {/* Score Circle */}
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          bgcolor: config.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        <Typography variant="h2" color="white" fontWeight="bold">
          {score}
        </Typography>
      </Box>

      <Typography variant="h6" gutterBottom>
        {config.label}
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        {duration.toFixed(1)} seconds
      </Typography>

      <Chip
        label={ageComparison}
        color={ageComparison.includes('Above') ? 'success' : ageComparison.includes('Below') ? 'warning' : 'default'}
        size="small"
        sx={{ mb: 2 }}
      />

      {teamRank && teamTotal && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <TrophyIcon color="action" />
            <Typography variant="body2">
              #{teamRank} of {teamTotal} athletes
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Team ranking by stability
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
```

### pages/Assessment/MetricsCards.tsx
```typescript
import { Paper, Typography, Grid, Box } from '@mui/material';
import {
  Speed as SpeedIcon,
  SwapHoriz as SwayIcon,
  PanTool as ArmIcon,
  Refresh as CorrectionIcon,
} from '@mui/icons-material';
import { AssessmentMetrics } from '../../types/assessment';

interface MetricsCardsProps {
  metrics: AssessmentMetrics;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      icon: <SpeedIcon />,
      label: 'Stability Score',
      value: `${metrics.stabilityScore.toFixed(0)}/100`,
      description: 'Overall balance quality',
    },
    {
      icon: <SwayIcon />,
      label: 'Sway Velocity',
      value: `${metrics.swayVelocity.toFixed(1)} cm/s`,
      description: 'Lower is better',
    },
    {
      icon: <ArmIcon />,
      label: 'Arm Excursion',
      value: `${((metrics.armExcursionLeft + metrics.armExcursionRight) / 2).toFixed(0)}°`,
      description: 'Average arm movement',
    },
    {
      icon: <CorrectionIcon />,
      label: 'Corrections',
      value: metrics.correctionsCount.toString(),
      description: 'Balance recoveries',
    },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Quality Metrics
      </Typography>
      <Grid container spacing={2}>
        {cards.map((card, index) => (
          <Grid item xs={6} key={index}>
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              <Box sx={{ color: 'primary.main', mb: 1 }}>{card.icon}</Box>
              <Typography variant="h5" fontWeight="bold">
                {card.value}
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {card.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {card.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
```

### pages/Assessment/FeedbackSection.tsx
```typescript
import { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Divider,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface FeedbackSectionProps {
  aiFeedback?: string;
  coachNotes?: string;
  onNotesUpdate: (notes: string) => Promise<void>;
}

export function FeedbackSection({
  aiFeedback,
  coachNotes,
  onNotesUpdate,
}: FeedbackSectionProps) {
  const [notes, setNotes] = useState(coachNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onNotesUpdate(notes);
    setSaving(false);
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* AI Feedback */}
      <Typography variant="h6" gutterBottom>
        AI Analysis
      </Typography>
      <Box sx={{ mb: 3, '& p': { mb: 1 }, '& ul': { pl: 2 } }}>
        {aiFeedback ? (
          <ReactMarkdown>{aiFeedback}</ReactMarkdown>
        ) : (
          <Typography color="text.secondary">No feedback available</Typography>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Coach Notes */}
      <Typography variant="h6" gutterBottom>
        Coach Notes
      </Typography>
      <TextField
        multiline
        rows={4}
        fullWidth
        placeholder="Add your observations and notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button
        variant="outlined"
        onClick={handleSave}
        disabled={saving || notes === coachNotes}
      >
        {saving ? 'Saving...' : 'Save Notes'}
      </Button>
    </Paper>
  );
}
```

## Dependencies to Add

```json
{
  "dependencies": {
    "react-markdown": "^9.0.0"
  }
}
```

## Estimated Complexity
**M** (Medium) - 4 hours

## Testing Instructions

1. Complete an assessment and navigate to results
2. Verify results display immediately (no "processing" state - synchronous)
3. Verify all metrics display correctly
4. Verify AI feedback renders with markdown formatting
5. Edit coach notes and save
6. Verify video playback works
7. Verify team ranking displays if data available
8. Click "Generate Parent Report" button

## UI Reference

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back                                [Generate Parent Report]  │
│ Assessment Results                                              │
│ John Smith • Jan 15, 2024                                      │
├───────────────────┬─────────────────────────────────────────────┤
│                   │  Quality Metrics                            │
│    ┌─────┐        │  ┌────────────┐  ┌────────────┐            │
│    │  4  │        │  │   78/100   │  │  2.1 cm/s  │            │
│    └─────┘        │  │ Stability  │  │   Sway     │            │
│   Proficient      │  └────────────┘  └────────────┘            │
│   18.5 seconds    │  ┌────────────┐  ┌────────────┐            │
│                   │  │    15°     │  │     3      │            │
│ [Meets expected]  │  │    Arms    │  │Corrections │            │
│                   │  └────────────┘  └────────────┘            │
│ 🏆 #3 of 12       │                                             │
└───────────────────┴─────────────────────────────────────────────┤
│ AI Analysis                                                     │
│ **Score Summary**                                               │
│ John achieved a score of 4/5 (Proficient)...                   │
├─────────────────────────────────────────────────────────────────┤
│ Coach Notes                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Great focus today. Work on arm control next session.       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ [Save Notes]                                                    │
└─────────────────────────────────────────────────────────────────┘
```
