import { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  width: number;
  collapsedWidth: number;
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Athletes', icon: <PeopleIcon />, path: '/athletes' },
  { text: 'Assessments', icon: <AssessmentIcon />, path: '/assessments' },
];

export function Sidebar({ width, collapsedWidth, mobileOpen = false, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    handleMenuClose();
    navigate('/login');
  };

  const drawerWidth = collapsed ? collapsedWidth : width;

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with CoachLens branding */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!collapsed && (
          <Typography variant="h6" noWrap sx={{ fontFamily: 'Jost, sans-serif', fontWeight: 500 }}>
            CoachLens
          </Typography>
        )}
        <IconButton onClick={onToggleCollapse} size="small">
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Tooltip title={collapsed ? item.text : ''} placement="right">
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  onClose?.();
                }}
                sx={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 56 }}>
                  {item.icon}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={item.text} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      {/* Profile section at bottom */}
      <Divider />
      <Box sx={{ p: 2 }}>
        {user && (
          <>
            <Tooltip title={collapsed ? (user.displayName || user.email || 'Profile') : ''} placement="right">
              <ListItemButton
                onClick={handleMenuOpen}
                sx={{
                  borderRadius: 1,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 2,
                }}
              >
                <Avatar
                  alt={user.displayName || user.email || 'User'}
                  src={user.photoURL || undefined}
                  imgProps={{
                    crossOrigin: 'anonymous',
                    referrerPolicy: 'no-referrer'
                  }}
                  sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}
                >
                  {user.displayName?.[0] ?? user.email?.[0]?.toUpperCase()}
                </Avatar>
                {!collapsed && (
                  <Box sx={{ ml: 2, overflow: 'hidden', minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" noWrap sx={{ fontSize: '0.875rem' }}>
                      {user.displayName || 'User'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.75rem'
                      }}
                    >
                      {user.email}
                    </Typography>
                  </Box>
                )}
              </ListItemButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
            </Menu>
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            transition: 'width 0.2s ease-in-out',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
