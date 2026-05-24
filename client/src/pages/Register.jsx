import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginStart, loginSuccess, loginFail } from '../store/authSlice.js';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress,
  ThemeProvider,
  CssBaseline,
  Fade
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  PrecisionManufacturing as LogoIcon,
  HowToReg as RegisterIcon
} from '@mui/icons-material';
import { getCustomTheme } from '../theme.js';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const themeMode = useSelector((state) => state.auth.themeMode);
  const activeTheme = getCustomTheme(themeMode);

  const { isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    // Clear error on change
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    dispatch(loginStart());
    try {
      const { data } = await api.post('/api/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });
      dispatch(loginSuccess({ user: data, token: data.token }));
      toast.success(`Welcome aboard, ${data.name}! 🎉`);
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      dispatch(loginFail(errMsg));
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: themeMode === 'light'
            ? 'radial-gradient(circle at 10% 20%, rgba(216, 241, 230, 0.46) 0.1%, rgba(233, 226, 226, 0.28) 90.1%)'
            : 'radial-gradient(circle at 10% 20%, rgba(15, 23, 42, 1) 0%, rgba(9, 13, 22, 1) 90.1%)',
          px: 2,
          py: 4,
        }}
      >
        <Fade in timeout={600}>
          <Card
            sx={{
              width: '100%',
              maxWidth: 460,
              borderRadius: 4,
              boxShadow: themeMode === 'light'
                ? '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
                : '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -6px rgba(0, 0, 0, 0.3)',
              background: themeMode === 'light'
                ? 'rgba(255, 255, 255, 0.85)'
                : 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${themeMode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.05)'}`,
              overflow: 'visible',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Logo Section */}
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: 'secondary.main',
                    color: 'white',
                    mb: 2,
                    boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LogoIcon sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="h4" fontWeight={800} align="center" gutterBottom fontFamily="Outfit">
                  Create Account
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Join the BDA Sales & CRM Platform
                </Typography>
              </Box>

              {/* Registration Form */}
              <form onSubmit={handleSubmit}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    id="register-name"
                    label="Full Name"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={formData.name}
                    onChange={handleChange('name')}
                    error={!!errors.name}
                    helperText={errors.name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    id="register-email"
                    label="Email Address"
                    type="email"
                    fullWidth
                    variant="outlined"
                    value={formData.email}
                    onChange={handleChange('email')}
                    error={!!errors.email}
                    helperText={errors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    id="register-password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    variant="outlined"
                    value={formData.password}
                    onChange={handleChange('password')}
                    error={!!errors.password}
                    helperText={errors.password || 'Minimum 6 characters'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    id="register-confirm-password"
                    label="Confirm Password"
                    type={showConfirm ? 'text' : 'password'}
                    fullWidth
                    variant="outlined"
                    value={formData.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirm(!showConfirm)}
                            edge="end"
                          >
                            {showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    id="register-phone"
                    label="Phone Number (Optional)"
                    type="tel"
                    fullWidth
                    variant="outlined"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    id="register-submit-btn"
                    type="submit"
                    variant="contained"
                    color="secondary"
                    size="large"
                    fullWidth
                    disabled={loading}
                    startIcon={!loading && <RegisterIcon />}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      mt: 0.5,
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                  </Button>
                </Box>
              </form>

              {/* Sign In Link */}
              <Box mt={3} display="flex" justifyContent="center" alignItems="center" gap={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?
                </Typography>
                <Typography
                  component={Link}
                  to="/login"
                  variant="body2"
                  fontWeight={700}
                  color="secondary.main"
                  sx={{
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign In
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Box>
    </ThemeProvider>
  );
};

export default Register;
