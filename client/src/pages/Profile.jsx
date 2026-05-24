import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice.js';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import {
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Person as ProfileIcon,
  Save as SaveIcon,
  Lock as LockIcon
} from '@mui/icons-material';

const Profile = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);

  // States
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email) {
      return toast.error('Name and email are required fields');
    }

    setLoading(true);
    try {
      const { data } = await api.put('/api/auth/profile', profileForm);
      dispatch(loginSuccess({ user: data, token: data.token }));
      toast.success('Profile details updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('Please fill in all password fields');
    }

    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }

    setLoading(true);
    try {
      const { data } = await api.put('/api/auth/profile', {
        password: newPassword
      });
      dispatch(loginSuccess({ user: data, token: data.token }));
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ---------------- HEADER BAR ---------------- */}
      <Box mb={4} display="flex" alignItems="center" gap={2}>
        <ProfileIcon color="secondary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h3" fontWeight={800} fontFamily="Outfit" gutterBottom>
            My Profile Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your personal credentials, contact info, and theme preferences
          </Typography>
        </Box>
      </Box>

      {/* ---------------- MAIN LAYOUT GRID ---------------- */}
      <Grid container spacing={3}>
        {/* Left Card: Profile Avatar display & Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2.5,
                  border: `4px solid ${theme.palette.secondary.main}`,
                  boxShadow: 3
                }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
              <Typography variant="h5" fontWeight={700} fontFamily="Outfit">
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize', mb: 1 }}>
                Role: <strong>{user?.role === 'executive' ? 'Sales Executive' : user?.role === 'manager' ? 'BDA Manager' : 'Administrator'}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Department: {user?.department || 'Sales'}
              </Typography>
              <Divider sx={{ width: '100%', mb: 3 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                Registered Email
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {user?.email}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Columns: Edit details form & Password change form */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Edit details form */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" fontWeight={700} fontFamily="Outfit" mb={3}>
                    Edit Profile Details
                  </Typography>

                  <form onSubmit={handleProfileSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Full Name"
                          fullWidth
                          required
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Email Address"
                          type="email"
                          fullWidth
                          required
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Phone Number"
                          fullWidth
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Avatar URL"
                          fullWidth
                          value={profileForm.avatar}
                          onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} display="flex" justifyContent="flex-end" sx={{ mt: 1 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="secondary"
                          startIcon={<SaveIcon />}
                          disabled={loading}
                          sx={{ py: 1, px: 3 }}
                        >
                          {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Details'}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
              </Card>
            </Grid>

            {/* Password change form */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" fontWeight={700} fontFamily="Outfit" mb={3}>
                    Security Settings (Change Password)
                  </Typography>

                  <form onSubmit={handlePasswordSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Current Password"
                          type="password"
                          fullWidth
                          required
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="New Password"
                          type="password"
                          fullWidth
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Confirm New Password"
                          type="password"
                          fullWidth
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} display="flex" justifyContent="flex-end" sx={{ mt: 1 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="secondary"
                          startIcon={<LockIcon />}
                          disabled={loading}
                          sx={{ py: 1, px: 3 }}
                        >
                          Change password
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
