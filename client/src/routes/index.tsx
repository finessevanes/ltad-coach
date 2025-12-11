import { RouteObject } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Home } from '../pages/Home';

// Route definitions for the application
// Additional routes will be added in subsequent phases
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      // Dashboard route (FE-015)
      {
        path: 'dashboard',
        element: <Home />, // Placeholder until FE-015
      },
      // Athletes routes (FE-004, FE-005)
      {
        path: 'athletes',
        element: <Home />, // Placeholder until FE-004
      },
      // Assessments routes (FE-011)
      {
        path: 'assessments',
        element: <Home />, // Placeholder until FE-011
      },
    ],
  },
];
