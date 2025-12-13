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
  const [collapsed, setCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const drawerWidth = collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        width={DRAWER_WIDTH}
        collapsedWidth={COLLAPSED_DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onClose={handleDrawerToggle}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          overflow: 'auto',
          minHeight: 0,
          transition: 'width 0.2s ease-in-out',
        }}
      >
        {children || <Outlet />}
      </Box>
    </Box>
  );
}
