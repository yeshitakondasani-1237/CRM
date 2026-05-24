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
  PrecisionManufacturing as LogoIcon
} from '@mui/icons-material';
import { getCustomTheme } from '../theme.js';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const themeMode = useSelector((state) => state.auth.themeMode);
  const activeTheme = getCustomTheme(themeMode);

  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter both email and password');
    }

    dispatch(loginStart());
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      dispatch(loginSuccess({ user: data, token: data.token }));
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid credentials, try again.';
      dispatch(loginFail(errMsg));
      toast.error(errMsg);
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
        }}
      >
        <Fade in timeout={600}>
          <Card
            sx={{
              width: '100%',
              maxWidth: 420,
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
              <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
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
                  Sign In
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Access your BDA Sales & CRM Dashboard
                </Typography>
              </Box>

              {/* Input fields form */}
              <form onSubmit={handleSubmit}>
                <Box display="flex" flexDirection="column" gap={2.5}>
                  <TextField
                    label="Email Address"
                    type="email"
                    fullWidth
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    variant="outlined"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

                  {error && (
                    <Typography variant="caption" color="error">
                      {error}
                    </Typography>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    size="large"
                    fullWidth
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                  </Button>
                </Box>
              </form>

              {/* Sign Up Link */}
              <Box mt={3} display="flex" justifyContent="center" alignItems="center" gap={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?
                </Typography>
                <Typography
                  component={Link}
                  to="/register"
                  variant="body2"
                  fontWeight={700}
                  color="secondary.main"
                  sx={{
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign Up
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Box>
    </ThemeProvider>
  );
};

export default Login;
