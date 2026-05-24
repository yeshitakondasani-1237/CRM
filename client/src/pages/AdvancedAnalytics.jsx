import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  LinearProgress,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendUpIcon,
  People as PeopleIcon,
  MonetizationOn as MoneyIcon,
  Percent as PercentIcon,
  Timer as TimerIcon,
  Target as TargetIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  FunnelChart,
  Funnel,
} from 'recharts';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0'];

const AdvancedAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await api.get('/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboardData) {
    return <Typography>No data available</Typography>;
  }

  // Sample data for demonstration
  const pipelineData = [
    { name: 'Lead', value: 45, count: 150 },
    { name: 'Contacted', value: 35, count: 85 },
    { name: 'Qualified', value: 25, count: 65 },
    { name: 'Proposal', value: 15, count: 42 },
    { name: 'Negotiation', value: 8, count: 28 },
    { name: 'Won', value: 5, count: 18 },
  ];

  const revenueData = [
    { month: 'Jan', expected: 45000, closed: 32000 },
    { month: 'Feb', expected: 52000, closed: 38000 },
    { month: 'Mar', expected: 48000, closed: 41000 },
    { month: 'Apr', expected: 61000, closed: 52000 },
    { month: 'May', expected: 55000, closed: 48000 },
    { month: 'Jun', expected: 67000, closed: 58000 },
  ];

  const sourceData = [
    { name: 'Website', value: 32 },
    { name: 'Referral', value: 28 },
    { name: 'Cold Call', value: 18 },
    { name: 'LinkedIn', value: 15 },
    { name: 'Trade Show', value: 7 },
  ];

  const conversionMetrics = [
    { stage: 'Lead → Contacted', rate: 56.7, trend: 'up' },
    { stage: 'Contacted → Qualified', rate: 76.5, trend: 'up' },
    { stage: 'Qualified → Proposal', rate: 64.6, trend: 'down' },
    { stage: 'Proposal → Negotiation', rate: 66.7, trend: 'up' },
    { stage: 'Negotiation → Won', rate: 64.3, trend: 'up' },
  ];

  const KPICard = ({ icon: Icon, title, value, subtitle, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {subtitle}
            </Typography>
          </Box>
          <Icon sx={{ fontSize: 40, color, opacity: 0.5 }} />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Advanced Analytics Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            icon={PeopleIcon}
            title="Total Leads"
            value="2,450"
            subtitle="↑ 12% from last month"
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            icon={MoneyIcon}
            title="Expected Revenue"
            value="$892K"
            subtitle="↑ 18% from last month"
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            icon={TargetIcon}
            title="Conversion Rate"
            value="18.5%"
            subtitle="↑ 2.3% from last month"
            color="#FF9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            icon={TrendUpIcon}
            title="Win Rate"
            value="42.3%"
            subtitle="↑ 5.1% from last month"
            color="#9C27B0"
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Sales Pipeline Funnel
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Funnel
                    dataKey="count"
                    data={pipelineData}
                    fill="#8884d8"
                    dataLabel={{ position: 'right' }}
                  >
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Lead Source Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Revenue Trends (Expected vs Closed)
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="expected" fill="#2196F3" name="Expected Revenue" />
              <Bar dataKey="closed" fill="#4CAF50" name="Closed Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Conversion Metrics Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Stage Conversion Rates
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Conversion Stage</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Trend</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {conversionMetrics.map((metric, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{metric.stage}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <Box sx={{ width: 60 }}>
                          <LinearProgress
                            variant="determinate"
                            value={metric.rate}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                        <Typography variant="body2">{metric.rate.toFixed(1)}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={metric.trend.toUpperCase()}
                        color={metric.trend === 'up' ? 'success' : 'warning'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {metric.rate > 70 ? (
                        <Chip label="Excellent" color="success" size="small" />
                      ) : metric.rate > 50 ? (
                        <Chip label="Good" color="info" size="small" />
                      ) : (
                        <Chip label="Needs Improvement" color="warning" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdvancedAnalyticsDashboard;
