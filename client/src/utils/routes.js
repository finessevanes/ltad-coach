export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ATHLETES: '/athletes',
  ADD_ATHLETE: '/athletes/new',
  EDIT_ATHLETE: '/athletes/:id/edit',
  ATHLETE_PROFILE: '/athletes/:id',
  NEW_ASSESSMENT: '/athletes/:id/assess',
  CAMERA_SETUP: '/athletes/:id/assess/camera',
  RECORDING: '/athletes/:id/assess/recording',
  RECORDING_PREVIEW: '/athletes/:id/assess/preview',
  UPLOAD_VIDEO: '/athletes/:id/assess/upload',
  ASSESSMENT_RESULTS: '/assessments/:id',
  CONSENT: '/consent/:token',
  PARENT_REPORT: '/report/:id',
  SETTINGS: '/settings',
};

// Helper to generate dynamic routes
export const generateRoute = {
  athleteProfile: (id) => `/athletes/${id}`,
  editAthlete: (id) => `/athletes/${id}/edit`,
  newAssessment: (id) => `/athletes/${id}/assess`,
  cameraSetup: (id) => `/athletes/${id}/assess/camera`,
  recording: (id) => `/athletes/${id}/assess/recording`,
  recordingPreview: (id) => `/athletes/${id}/assess/preview`,
  uploadVideo: (id) => `/athletes/${id}/assess/upload`,
  assessmentResults: (id) => `/assessments/${id}`,
  consent: (token) => `/consent/${token}`,
  parentReport: (id) => `/report/${id}`,
};
