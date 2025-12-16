/**
 * Loading System - Export Index
 *
 * This file provides a single import point for all loading-related exports.
 * Use individual imports instead if you only need specific items.
 *
 * @example
 * // Import specific items
 * import { useLoading } from './hooks/useLoading';
 * import { LoadingButton } from './components/LoadingButton';
 *
 * @example
 * // Or use this index for all loading exports
 * import {
 *   LoadingProvider,
 *   useLoading,
 *   useLoadingState,
 *   GlobalLoadingBar,
 *   LoadingOverlay,
 *   ProgressIndicator,
 *   SkeletonLoader,
 *   LoadingButton,
 * } from './index-loading';
 */

// Context
export { LoadingProvider, useLoadingContext } from './contexts/LoadingContext';
export type { LoadingContextType, LoadingOperation } from './contexts/LoadingContext';

// Hooks
export { useLoading } from './hooks/useLoading';
export { useLoadingState } from './hooks/useLoadingState';

// Components
export { GlobalLoadingBar } from './components/GlobalLoadingBar';
export { LoadingOverlay } from './components/LoadingOverlay';
export { ProgressIndicator } from './components/ProgressIndicator';
export { SkeletonLoader } from './components/SkeletonLoader';
export { LoadingButton } from './components/LoadingButton';
