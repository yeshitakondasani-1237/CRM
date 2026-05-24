import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleTheme, logout } from '../store/authSlice.js';
import {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
} from '../store/notificationSlice.js';
import api from '../utils/api.js';
import socket, { connectSocket, disconnectSocket } from '../utils/socket.js';
import toast from 'react-hot-toast';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Box,
  Tooltip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as BellIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  CheckCircle as CheckIcon,
  MarkEmailRead as ReadAllIcon
} from '@mui/icons-material';

const Header = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const { user, themeMode } = useSelector((state) => state.auth);
  const { notifications, unreadCount } = useSelector((state) => state.notifications);

  // States for dropdowns
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [anchorElProfile, setAnchorElProfile] = useState(null);

  // 1. Fetch historical notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications');
      dispatch(setNotifications(data));
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Connect Socket
      connectSocket(user._id);

      // Listen for socket events
      socket.on('notification', (newNotif) => {
        dispatch(addNotification(newNotif));
        toast(newNotif.message || newNotif.title, {
          icon: '🔔',
          style: {
            borderRadius: '8px',
            background: themeMode === 'light' ? '#fff' : '#1e293b',
            color: themeMode === 'light' ? '#0f172a' : '#f1f5f9',
          },
        });
        
        // Play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.4;
          audio.play();
        } catch (e) {
          // Blocked by browser sandbox
        }
      });
    }

    return () => {
      socket.off('notification');
    };
  }, [user]);

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      dispatch(markAllAsRead());
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      dispatch(markAsRead(id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    disconnectSocket();
    dispatch(logout());
    navigate('/login');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setCollapsed(!collapsed)}
            sx={{ color: theme.palette.text.primary }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontFamily: 'Outfit',
              color: theme.palette.text.primary,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Manufacturing CRM Portal
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1.5}>
          {/* Theme Selector Toggle */}
          <Tooltip title={themeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
            <IconButton onClick={() => dispatch(toggleTheme())} color="inherit" sx={{ color: theme.palette.text.primary }}>
              {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Real-time Notifications Bell */}
          <IconButton
            color="inherit"
            onClick={(e) => setAnchorElNotif(e.currentTarget)}
            sx={{ color: theme.palette.text.primary }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <BellIcon />
            </Badge>
          </IconButton>

          {/* Profile Clickable Icon */}
          {user && (
            <Tooltip title="Account profile">
              <IconButton onClick={(e) => setAnchorElProfile(e.currentTarget)} sx={{ p: 0 }}>
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  sx={{ width: 35, height: 35, border: `2px solid ${theme.palette.secondary.main}` }}
                >
                  {user.name?.charAt(0)}
                </Avatar>
              </IconButton>
            </Tooltip>
          )}

          {/* -------------------- NOTIFICATIONS MENU DROPDOWN -------------------- */}
          <Menu
            anchorEl={anchorElNotif}
            open={Boolean(anchorElNotif)}
            onClose={() => setAnchorElNotif(null)}
            slotProps={{
              paper: {
                sx: { width: 340, maxHeight: 400, mt: 1.5, borderRadius: 3 }
              }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<ReadAllIcon />}
                  onClick={handleMarkAllAsRead}
                  sx={{ textTransform: 'none' }}
                >
                  Mark all read
                </Button>
              )}
            </Box>
            <Divider />
            
            <List sx={{ p: 0, maxHeight: 280, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="All caught up!"
                    secondary="No new alerts found."
                    primaryTypographyProps={{ align: 'center', variant: 'body2' }}
                    secondaryTypographyProps={{ align: 'center' }}
                  />
                </ListItem>
              ) : (
                notifications.map((notif) => (
                  <ListItem
                    key={notif._id}
                    sx={{
                      backgroundColor: notif.isRead ? 'transparent' : `${theme.palette.info.main}08`,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      px: 2,
                      py: 1.5,
                      '&:hover': { backgroundColor: theme.palette.action.hover }
                    }}
                    secondaryAction={
                      !notif.isRead && (
                        <IconButton
                          edge="end"
                          size="small"
                          color="success"
                          onClick={() => handleMarkSingleAsRead(notif._id)}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText
                      primary={notif.title}
                      secondary={notif.message}
                      primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: notif.isRead ? 500 : 700 }}
                      secondaryTypographyProps={{ fontSize: '0.8rem' }}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Menu>

          {/* -------------------- PROFILE CONTROL DROPDOWN -------------------- */}
          <Menu
            anchorEl={anchorElProfile}
            open={Boolean(anchorElProfile)}
            onClose={() => setAnchorElProfile(null)}
            slotProps={{
              paper: {
                sx: { width: 220, mt: 1.5, borderRadius: 3 }
              }
            }}
          >
            {user && (
              <Box sx={{ px: 2.5, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            )}
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchorElProfile(null);
                navigate('/profile');
              }}
              sx={{ py: 1 }}
            >
              <PersonIcon sx={{ mr: 1.5, fontSize: 20 }} /> Profile settings
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ py: 1, color: theme.palette.error.main }}>
              <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} /> Log out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
