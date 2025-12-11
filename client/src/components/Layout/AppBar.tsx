import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

interface AppBarProps {
  drawerWidth: number;
  onMenuClick?: () => void;
}

export function AppBar({ drawerWidth, onMenuClick }: AppBarProps) {
  return (
    <MuiAppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div">
          AI Coach
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {/* Auth buttons will be added in FE-002 */}
      </Toolbar>
    </MuiAppBar>
  );
}
