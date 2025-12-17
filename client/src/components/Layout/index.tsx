import { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 64;

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Main content uses collapsed width for margin (sidebar expands on hover, overlaying content)
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        width={DRAWER_WIDTH}
        collapsedWidth={COLLAPSED_DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onClose={handleDrawerToggle}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { sm: `${COLLAPSED_DRAWER_WIDTH}px` },
          width: { sm: `calc(100% - ${COLLAPSED_DRAWER_WIDTH}px)` },
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        {children || <Outlet />}
      </Box>
    </Box>
  );
}
