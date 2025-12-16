import { Box, Skeleton, Card, CardContent } from '@mui/material';

type SkeletonLoaderType = 'text' | 'card' | 'table' | 'list' | 'paragraph';

interface SkeletonLoaderProps {
  type: SkeletonLoaderType;
  count?: number;
  height?: number | string;
  sx?: any;
}

/**
 * Standardized skeleton loaders for content placeholders.
 * Improves perceived performance by showing placeholder UI while content loads.
 *
 * **When to use:**
 * - Loading dashboard data, lists, or cards
 * - Initial page load before data arrives
 * - Better UX than blank screens or generic spinners
 *
 * **Types:**
 * - **text**: Single or multiple text lines
 * - **paragraph**: Full paragraph blocks (3 lines each)
 * - **card**: Card-shaped placeholders with header and content
 * - **list**: List items with avatar and text
 * - **table**: Table row placeholders
 *
 * @param type - The skeleton variant to render
 * @param count - Number of skeleton items to show (default: 1)
 * @param height - Custom height for text skeletons
 * @param sx - MUI sx prop for additional styling
 *
 * @example
 * // Dashboard with card skeletons
 * const { isLoading } = useLoading('fetch-dashboard');
 * if (isLoading) return <SkeletonLoader type="card" count={3} />;
 * return <DashboardCards data={data} />;
 *
 * @example
 * // List with skeleton items
 * const { isLoading } = useLoading('fetch-athletes');
 * if (isLoading) return <SkeletonLoader type="list" count={5} />;
 * return <AthleteList athletes={athletes} />;
 *
 * @example
 * // Table loading state
 * if (isLoading) return <SkeletonLoader type="table" count={10} />;
 * return <AssessmentTable data={data} />;
 */
export function SkeletonLoader({ type, count = 1, height, sx }: SkeletonLoaderProps) {
  const skeletons = Array.from({ length: count });

  if (type === 'text') {
    return (
      <Box sx={sx}>
        {skeletons.map((_, i) => (
          <Skeleton key={i} variant="text" height={height ?? 32} sx={{ mb: i < count - 1 ? 1 : 0 }} />
        ))}
      </Box>
    );
  }

  if (type === 'paragraph') {
    return (
      <Box sx={sx}>
        {skeletons.map((_, i) => (
          <Box key={i} sx={{ mb: i < count - 1 ? 2 : 0 }}>
            <Skeleton variant="text" height={20} />
            <Skeleton variant="text" height={20} width="95%" />
            <Skeleton variant="text" height={20} width="90%" />
          </Box>
        ))}
      </Box>
    );
  }

  if (type === 'card') {
    return (
      <Box sx={sx}>
        {skeletons.map((_, i) => (
          <Card key={i} sx={{ mb: i < count - 1 ? 2 : 0 }}>
            <CardContent>
              <Skeleton variant="text" height={32} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={120} sx={{ mb: 1 }} />
              <Skeleton variant="text" height={20} width="60%" />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (type === 'list') {
    return (
      <Box sx={sx}>
        {skeletons.map((_, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2, mb: i < count - 1 ? 2 : 0 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={20} width="80%" />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  if (type === 'table') {
    return (
      <Box sx={sx}>
        {skeletons.map((_, i) => (
          <Box key={i} sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 1 }}>
            <Skeleton variant="text" height={24} />
            <Skeleton variant="text" height={24} />
            <Skeleton variant="text" height={24} />
            <Skeleton variant="text" height={24} />
          </Box>
        ))}
      </Box>
    );
  }

  return null;
}
