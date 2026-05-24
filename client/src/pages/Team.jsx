import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import {
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Groups as TeamIcon,
  EmojiEvents as LeaderboardIcon,
  PersonAdd as AddIcon
} from '@mui/icons-material';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const Team = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);

  // Form State for registering new user
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'executive',
    phone: '',
    department: 'Sales',
    avatar: ''
  });

  // ---------------- QUERY FETCHES ----------------
  const { data: performance, isLoading: perfLoading } = useQuery({
    queryKey: ['teamPerformance'],
    queryFn: async () => {
      const { data } = await api.get('/api/team/performance');
      return data;
    }
  });

  const { data: leaderboard, isLoading: leadLoading } = useQuery({
    queryKey: ['teamLeaderboard'],
    queryFn: async () => {
      const { data } = await api.get('/api/team/leaderboard');
      return data;
    }
  });

  // ---------------- REGISTRATION MUTATION ----------------
  const registerUserMutation = useMutation({
    mutationFn: async (userBody) => {
      const { data } = await api.post('/api/auth/register', userBody);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPerformance'] });
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('New employee registered successfully!');
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'executive',
        phone: '',
        department: 'Sales',
        avatar: ''
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register employee');
    }
  });

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      return toast.error('Name, email, and password are required fields');
    }
    registerUserMutation.mutate(newUser);
  };

  const loading = perfLoading || leadLoading;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ---------------- HEADER BAR ---------------- */}
      <Box mb={4} display="flex" alignItems="center" gap={2}>
        <TeamIcon color="secondary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h3" fontWeight={800} fontFamily="Outfit" gutterBottom>
            Team Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Lead assignments, deal conversion percentages, and closed revenues
          </Typography>
        </Box>
      </Box>

      {/* ---------------- LEADERBOARD PANEL ---------------- */}
      <Typography variant="h5" fontWeight={700} fontFamily="Outfit" mb={2}>
        Executive Rankings Leaderboard
      </Typography>
      <Grid container spacing={3} mb={4}>
        {leaderboard?.slice(0, 3).map((exec, idx) => (
          <Grid item xs={12} sm={4} key={exec._id}>
            <Card sx={{ position: 'relative', overflow: 'hidden' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  p: 1.5,
                  fontSize: '2rem',
                  fontWeight: 900,
                  opacity: 0.1,
                  fontFamily: 'Outfit'
                }}
              >
                #{idx + 1}
              </Box>
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Avatar
                  src={exec.avatar}
                  alt={exec.name}
                  sx={{
                    width: 60,
                    height: 60,
                    border: (theme) => `2px solid ${idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : '#b45309'}`,
                  }}
                >
                  {exec.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} display="flex" alignItems="center" gap={0.5}>
                    {idx === 0 && <LeaderboardIcon sx={{ color: '#fbbf24', fontSize: 18 }} />}
                    Rank #{idx + 1}
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {exec.name}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={800} color="secondary.main">
                    {formatCurrency(exec.revenueGenerated)} Closed ({exec.dealsWon} Won)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ---------------- MAIN LAYOUT GRID ---------------- */}
      <Grid container spacing={3}>
        {/* LEFT COLUMN: Team Performance Table */}
        <Grid item xs={12} md={user?.role === 'admin' ? 8 : 12}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box p={3}>
                <Typography variant="h5" fontWeight={700} fontFamily="Outfit">
                  BDA Performance Audit
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Member</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell align="center">Leads Assigned</TableCell>
                      <TableCell align="center">Won Deals</TableCell>
                      <TableCell align="center">Conversion Rate</TableCell>
                      <TableCell align="center">Tasks Logged</TableCell>
                      <TableCell align="right">Revenue Closed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {performance?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No performance data found.</TableCell>
                      </TableRow>
                    ) : (
                      performance?.map((exec) => (
                        <TableRow key={exec._id}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar src={exec.avatar} alt={exec.name} sx={{ width: 32, height: 32 }}>
                                {exec.name?.charAt(0)}
                              </Avatar>
                              <Typography variant="body2" fontWeight={600}>{exec.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{exec.department}</TableCell>
                          <TableCell align="center">{exec.leadsAssigned}</TableCell>
                          <TableCell align="center">{exec.leadsConverted}</TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={700} color="secondary.main">
                              {exec.conversionPercentage}%
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{exec.followupsCompleted}</TableCell>
                          <TableCell align="right" fontWeight={700}>{formatCurrency(exec.revenueGenerated)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COLUMN: Register Employee Form (Only visible to admin) */}
        {user?.role === 'admin' && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                  <AddIcon color="secondary" />
                  <Typography variant="h5" fontWeight={700} fontFamily="Outfit">
                    Register Employee
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <form onSubmit={handleRegisterSubmit}>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                      label="Full Name"
                      size="small"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                    <TextField
                      label="Email Address"
                      type="email"
                      size="small"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                    <TextField
                      label="Secure Password"
                      type="password"
                      size="small"
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                    <FormControl size="small" fullWidth>
                      <InputLabel>Role Permission</InputLabel>
                      <Select
                        value={newUser.role}
                        label="Role Permission"
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      >
                        <MenuItem value="admin">Administrator</MenuItem>
                        <MenuItem value="manager">BDA Manager</MenuItem>
                        <MenuItem value="executive">Sales Executive</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Phone Number"
                      size="small"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    />
                    <TextField
                      label="Department"
                      size="small"
                      value={newUser.department}
                      onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    />
                    <TextField
                      label="Avatar Image URL"
                      size="small"
                      placeholder="https://unsplash.com/..."
                      value={newUser.avatar}
                      onChange={(e) => setNewUser({ ...newUser, avatar: e.target.value })}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      disabled={registerUserMutation.isPending}
                      sx={{ mt: 1, py: 1 }}
                    >
                      {registerUserMutation.isPending ? 'Registering...' : 'Register User'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Team;
