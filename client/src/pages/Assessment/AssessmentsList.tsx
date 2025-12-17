import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Skeleton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  getAllAssessments,
  getAssessmentsByCategory,
  categoryLabels,
  LTADCategory,
  AssessmentConfig,
} from '../../config/assessments';
import { AssessmentCard } from '../../components/AssessmentCard';
import { CategoryFilter } from '../../components/CategoryFilter';
import { AvailabilityFilter, AvailabilityStatus } from '../../components/AvailabilityFilter';

export default function AssessmentsList() {
  const [selectedCategory, setSelectedCategory] = useState<LTADCategory | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>('active'); // Active by default
  const [loading, setLoading] = useState(true);
  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading delay for consistent UX
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAssessmentClick = (assessmentId: string) => {
    const assessment = getAllAssessments().find((a) => a.id === assessmentId);
    if (!assessment) return;

    if (assessment.isActive) {
      navigate('/athletes');
    } else {
      setComingSoonModalOpen(true);
    }
  };

  /**
   * Get all assessments to display
   * Filter by selected category and availability status
   */
  const getDisplayAssessments = (): AssessmentConfig[] => {
    let assessments = getAllAssessments();

    // Filter by category
    if (selectedCategory) {
      assessments = getAssessmentsByCategory(selectedCategory);
    }

    // Filter by availability status
    if (selectedStatus === 'active') {
      assessments = assessments.filter((a) => a.isActive);
    } else if (selectedStatus === 'coming-soon') {
      assessments = assessments.filter((a) => !a.isActive);
    }

    return assessments;
  };

  /**
   * Group assessments by category and sub-category
   */
  const getGroupedAssessments = (): Record<
    string,
    Record<string, AssessmentConfig[]>
  > => {
    const assessments = getDisplayAssessments();
    const grouped: Record<string, Record<string, AssessmentConfig[]>> = {};

    assessments.forEach((assessment) => {
      if (!grouped[assessment.category]) {
        grouped[assessment.category] = {};
      }

      const subCat = assessment.subCategory || 'General';
      if (!grouped[assessment.category][subCat]) {
        grouped[assessment.category][subCat] = [];
      }

      grouped[assessment.category][subCat].push(assessment);
    });

    return grouped;
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Page Header Skeleton */}
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" height={42} width="200px" sx={{ mb: 1 }} />
          <Skeleton variant="text" height={24} width="350px" />
        </Box>

        {/* Filter Skeleton */}
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rounded" height={36} width="100%" />
        </Box>

        {/* Assessments Grid Skeleton */}
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
              <Box
                sx={{
                  position: 'relative',
                  paddingTop: '133.33%',
                  overflow: 'hidden',
                  mb: 2,
                }}
              >
                <Skeleton variant="rectangular" sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
              </Box>
              <Skeleton variant="text" height={24} width="80%" sx={{ mb: 1 }} />
              <Skeleton variant="text" height={16} width="100%" sx={{ mb: 0.5 }} />
              <Skeleton variant="rounded" height={24} width="60%" />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  const groupedAssessments = getGroupedAssessments();
  const displayAssessments = getDisplayAssessments();
  const hasNoResults = displayAssessments.length === 0;

  // Main content
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Assessments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select an assessment to get started, organized by LTAD tracking categories
        </Typography>
      </Box>

      {/* Filters Section */}
      <Box sx={{ mb: 4 }}>
        {/* Availability Filter */}
        <AvailabilityFilter
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />

        {/* Divider */}
        <Divider sx={{ my: 2 }} />

        {/* Category Filter */}
        <Box sx={{ mt: 2 }}>
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
            Category
          </Typography>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </Box>

        {/* Active Filters Summary */}
        {(selectedCategory || selectedStatus) && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: 'info.lighter',
              borderLeft: '4px solid',
              borderColor: 'info.main',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              <strong>Showing:</strong>{' '}
              {selectedStatus === 'active'
                ? 'Active assessments'
                : selectedStatus === 'coming-soon'
                  ? 'Coming soon assessments'
                  : 'All availability'}
              {selectedCategory && ` in ${categoryLabels[selectedCategory]}`}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Empty State */}
      {hasNoResults ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            backgroundColor: 'grey.50',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'grey.300',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
            No assessments found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedStatus === 'coming-soon'
              ? "We don't have any coming soon assessments in your current filter."
              : 'No assessments match your current filters.'}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSelectedCategory(null);
              setSelectedStatus('active');
            }}
            sx={{ mt: 1 }}
          >
            Reset Filters
          </Button>
        </Box>
      ) : (
        <>
          {/* Assessments organized by category and sub-category */}
          {Object.entries(groupedAssessments).map(([category, subCategoryGroup]) => (
            <Box key={category} sx={{ mb: 5 }}>
              {/* Category Header */}
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  borderBottom: '2px solid',
                  borderColor: 'primary.main',
                  pb: 1,
                }}
              >
                {categoryLabels[category as LTADCategory]}
              </Typography>

              {/* Sub-categories within category */}
              {Object.entries(subCategoryGroup).map(([subCategory, assessments]) => (
                <Box key={subCategory} sx={{ mb: 4 }}>
                  {/* Sub-category Header - only show if there are sub-categories in this category */}
                  {Object.keys(subCategoryGroup).length > 1 && (
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 2,
                        fontWeight: 500,
                        color: 'text.secondary',
                      }}
                    >
                      {subCategory}
                    </Typography>
                  )}

                  {/* Assessment Cards Grid */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {assessments.map((assessment) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={assessment.id}>
                        <AssessmentCard
                          assessment={assessment}
                          onClick={handleAssessmentClick}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Box>
          ))}
        </>
      )}

      {/* Coming Soon Modal */}
      <Dialog
        open={comingSoonModalOpen}
        onClose={() => setComingSoonModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Coming Soon!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This assessment is coming soon! We're working hard to bring you more
            assessment types.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setComingSoonModalOpen(false)}
            variant="contained"
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
