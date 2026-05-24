import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice.js';
import { disconnectSocket } from '../utils/socket.js';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarIcon,
  AutoAwesome as SmartIcon,
  BarChart as ReportIcon,
  People as TeamIcon,
  Person as ProfileIcon,
  ExitToApp as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  PrecisionManufacturing as LogoIcon
} from '@mui/icons-material';

const sidebarWidth = 260;
const collapsedSidebarWidth = 80;

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    disconnectSocket();
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['admin', 'manager', 'executive'] },
    { text: 'Leads Pipeline', icon: <AssignmentIcon />, path: '/leads', roles: ['admin', 'manager', 'executive'] },
    { text: 'Follow-ups', icon: <CalendarIcon />, path: '/tasks', roles: ['admin', 'manager', 'executive'] },
    { text: 'Smart Insights', icon: <SmartIcon />, path: '/smart-insights', roles: ['admin', 'manager', 'executive'] },
    { text: 'Reports Builder', icon: <ReportIcon />, path: '/reports', roles: ['admin', 'manager'] },
    { text: 'Team Members', icon: <TeamIcon />, path: '/team', roles: ['admin', 'manager'] },
    { text: 'My Profile', icon: <ProfileIcon />, path: '/profile', roles: ['admin', 'manager', 'executive'] },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? collapsedSidebarWidth : sidebarWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: collapsed ? collapsedSidebarWidth : sidebarWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}
    >
      <Box>
        {/* Sidebar Header & Brand Logo */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            p: 2.5,
            minHeight: 70,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LogoIcon color="secondary" sx={{ fontSize: 28 }} />
            {!collapsed && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontFamily: 'Outfit',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(45deg, #3b82f6, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                BDA CRM
              </Typography>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Navigation Items */}
        <List sx={{ px: 1.5, py: 2 }}>
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                <Tooltip title={collapsed ? item.text : ''} placement="right">
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={isActive}
                    sx={{
                      minHeight: 48,
                      justifyContent: collapsed ? 'center' : 'initial',
                      px: 2.5,
                      borderRadius: 2,
                      color: isActive ? theme.palette.secondary.main : theme.palette.text.secondary,
                      backgroundColor: isActive ? `${theme.palette.secondary.main}12` : 'transparent',
                      '&.Mui-selected': {
                        backgroundColor: `${theme.palette.secondary.main}12`,
                        '&:hover': {
                          backgroundColor: `${theme.palette.secondary.main}20`,
                        },
                      },
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        color: theme.palette.text.primary,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: collapsed ? 'auto' : 2,
                        justifyContent: 'center',
                        color: isActive ? theme.palette.secondary.main : 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: isActive ? 600 : 500,
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Sidebar Footer User Section */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        {user && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                src={user.avatar}
                alt={user.name}
                sx={{
                  width: 40,
                  height: 40,
                  border: `2px solid ${theme.palette.divider}`,
                }}
              >
                {user.name?.charAt(0)}
              </Avatar>
              {!collapsed && (
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, noWrap: true }}>
                    {user.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: 'capitalize',
                      color: theme.palette.text.secondary,
                      noWrap: true,
                    }}
                  >
                    {user.role === 'executive' ? 'Sales Executive' : user.role === 'manager' ? 'BDA Manager' : 'Administrator'}
                  </Typography>
                </Box>
              )}
            </Box>
            {!collapsed && (
              <IconButton onClick={handleLogout} color="error" size="small">
                <LogoutIcon />
              </IconButton>
            )}
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
