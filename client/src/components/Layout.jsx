import React, { useState } from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { useSelector } from 'react-redux';
import { getCustomTheme } from '../theme.js';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const themeMode = useSelector((state) => state.auth.themeMode);

  // Construct theme based on Redux state theme mode
  const activeTheme = getCustomTheme(themeMode);

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Top Navbar Header */}
        <Header collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Navigation Drawer Sidebar */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Main Application Content Window */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            mt: '64px', // Offset for the fixed AppBar height
            width: {
              xs: '100%',
              sm: `calc(100% - ${collapsed ? 80 : 260}px)`,
            },
            transition: (theme) =>
              theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
