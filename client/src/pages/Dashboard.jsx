import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api.js';
import dayjs from 'dayjs';
import {
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendUpIcon,
  People as LeadsIcon,
  Verified as QualifiedIcon,
  MonetizationOn as RevenueIcon,
  Star as StarIcon,
  Schedule as ClockIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

// Format Helpers
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const Dashboard = () => {
  const theme = useTheme();

  // Queries using TanStack React Query
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useQuery({
    queryKey: ['dashboardKPIs'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/kpis');
      return data;
    }
  });

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboardCharts'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/charts');
      return data;
    }
  });

  const { data: widgets, isLoading: widgetsLoading } = useQuery({
    queryKey: ['dashboardWidgets'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/widgets');
      return data;
    }
  });

  const loading = kpisLoading || chartsLoading || widgetsLoading;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (kpisError) {
    return (
      <Box p={3} bgcolor="error.light" borderRadius={2}>
        <Typography color="error.dark" variant="h6">Failed to load CRM dashboard metrics. Make sure the server and database are running.</Typography>
      </Box>
    );
  }

  // Chart Palette Colors
  const COLORS = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ---------------- HEADER SECTION ---------------- */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h3" fontWeight={800} fontFamily="Outfit" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manufacturing BDA CRM Performance Overview
          </Typography>
        </Box>
      </Box>

      {/* ---------------- KPI CARDS ---------------- */}
      <Grid container spacing={3} mb={4}>
        {[
          {
            title: 'Total Active Leads',
            value: kpis?.totalLeads,
            subtitle: `${kpis?.newLeadsThisMonth} new this month`,
            icon: <LeadsIcon sx={{ color: 'secondary.main', fontSize: 32 }} />,
            bg: 'secondary.main'
          },
          {
            title: 'Qualified Pipeline',
            value: kpis?.qualifiedLeads,
            subtitle: 'Stage Qualified+',
            icon: <QualifiedIcon sx={{ color: 'info.main', fontSize: 32 }} />,
            bg: 'info.main'
          },
          {
            title: 'Closed deals',
            value: `${kpis?.wonDeals} Won / ${kpis?.lostDeals} Lost`,
            subtitle: `Conversion: ${kpis?.conversionRate}%`,
            icon: <TrendUpIcon sx={{ color: 'success.main', fontSize: 32 }} />,
            bg: 'success.main'
          },
          {
            title: 'Revenue Pipeline',
            value: formatCurrency(kpis?.revenueClosed),
            subtitle: `Expected: ${formatCurrency(kpis?.expectedRevenue)}`,
            icon: <RevenueIcon sx={{ color: 'warning.main', fontSize: 32 }} />,
            bg: 'warning.main'
          }
        ].map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ position: 'relative', overflow: 'hidden' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 4,
                  height: '100%',
                  bgcolor: card.bg
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} fontFamily="Outfit">
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, bgcolor: `${card.bg}12`, borderRadius: 2 }}>{card.icon}</Box>
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ---------------- CHART GRIDS ---------------- */}
      <Grid container spacing={3} mb={4}>
        {/* Expected vs Closed Revenue Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" fontWeight={700} mb={3} fontFamily="Outfit">
                Expected vs Closed Revenue Trend
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts?.revenueTrend || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={12} tickLine={false} />
                    <YAxis stroke={theme.palette.text.secondary} fontSize={12} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <RechartsTooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="expected" name="Expected Pipeline" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorExpected)" />
                    <Area type="monotone" dataKey="closed" name="Closed Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorClosed)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Lead Status Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h5" fontWeight={700} mb={2} fontFamily="Outfit">
                Leads by Status
              </Typography>
              <Box height={220} width="100%" flexGrow={1} display="flex" alignItems="center" justifyContent="center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts?.leadsByStatus || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(charts?.leadsByStatus || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box display="flex" flexWrap="wrap" justifyContent="center" gap={1.5} mt={2}>
                {(charts?.leadsByStatus || []).map((entry, index) => (
                  <Box key={entry.name} display="flex" alignItems="center" gap={0.5}>
                    <Box width={10} height={10} borderRadius="50%" bgcolor={COLORS[index % COLORS.length]} />
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {entry.name}: {entry.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Lead Source Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" fontWeight={700} mb={3} fontFamily="Outfit">
                Lead Source Distribution
              </Typography>
              <Box height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.sourceDistribution || []} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                    <XAxis type="number" stroke={theme.palette.text.secondary} fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke={theme.palette.text.secondary} fontSize={11} width={80} />
                    <RechartsTooltip />
                    <Bar dataKey="value" name="Leads" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                      {(charts?.sourceDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sales Performance by Executive */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" fontWeight={700} mb={3} fontFamily="Outfit">
                Executive Sales Performance
              </Typography>
              <Box height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.salesPerformance || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={11} />
                    <YAxis stroke={theme.palette.text.secondary} fontSize={11} yAxisId="left" tickFormatter={(v) => `$${v / 1000}k`} />
                    <YAxis stroke={theme.palette.text.secondary} fontSize={11} yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="closedRevenue" name="Revenue Closed" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="wonCount" name="Deals Won" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ---------------- WIDGETS SECTION ---------------- */}
      <Grid container spacing={3}>
        {/* High Priority Leads */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <StarIcon color="warning" />
                <Typography variant="h5" fontWeight={700} fontFamily="Outfit">
                  High-Priority Opportunities
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Company</TableCell>
                      <TableCell>Expected Rev</TableCell>
                      <TableCell>Health</TableCell>
                      <TableCell>Stage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {widgets?.highPriorityLeads?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No high-priority active leads.</TableCell>
                      </TableRow>
                    ) : (
                      widgets?.highPriorityLeads?.map((lead) => (
                        <TableRow key={lead._id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{lead.companyName}</Typography>
                            <Typography variant="caption" color="text.secondary">{lead.contactPerson}</Typography>
                          </TableCell>
                          <TableCell>{formatCurrency(lead.expectedRevenue)}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" fontWeight={600}>{lead.healthScore}%</Typography>
                              <Box flexGrow={1} width={40}>
                                <LinearProgress
                                  variant="determinate"
                                  value={lead.healthScore}
                                  color={lead.healthScore > 70 ? 'success' : lead.healthScore > 40 ? 'warning' : 'error'}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={lead.status} size="small" variant="outlined" sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Followups & Recent Activities */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={3}>
            {/* Upcoming Followups */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                    <ClockIcon color="secondary" />
                    <Typography variant="h5" fontWeight={700} fontFamily="Outfit">
                      Upcoming Follow-ups
                    </Typography>
                  </Box>
                  <List sx={{ p: 0 }}>
                    {widgets?.upcomingFollowups?.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" p={1}>No scheduled tasks due.</Typography>
                    ) : (
                      widgets?.upcomingFollowups?.slice(0, 3).map((task, idx) => (
                        <Box key={task._id}>
                          {idx > 0 && <Divider />}
                          <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                            <ListItemText
                              primary={task.title}
                              secondary={
                                <>
                                  <Typography component="span" variant="caption" color="text.primary" fontWeight={600}>
                                    {task.lead?.companyName || 'Lead'}
                                  </Typography>
                                  {` — Due: ${dayjs(task.dueDate).format('MMM DD, YYYY [at] hh:mm A')}`}
                                </>
                              }
                              primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                            />
                            <Chip label={task.priority} color={task.priority === 'high' ? 'error' : 'default'} size="small" sx={{ textTransform: 'capitalize', ml: 1 }} />
                          </ListItem>
                        </Box>
                      ))
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activities */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                    <HistoryIcon color="info" />
                    <Typography variant="h5" fontWeight={700} fontFamily="Outfit">
                      Recent Activities
                    </Typography>
                  </Box>
                  <List sx={{ p: 0 }}>
                    {widgets?.recentActivities?.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" p={1}>No recent logging history.</Typography>
                    ) : (
                      widgets?.recentActivities?.slice(0, 3).map((act, idx) => (
                        <Box key={act._id}>
                          {idx > 0 && <Divider />}
                          <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                            <Avatar src={act.user?.avatar} sx={{ width: 28, height: 28, mr: 1.5, fontSize: '0.8rem' }}>
                              {act.user?.name?.charAt(0)}
                            </Avatar>
                            <ListItemText
                              primary={act.title}
                              secondary={
                                <>
                                  <Typography component="span" variant="caption" color="text.primary" fontWeight={600}>
                                    {act.user?.name || 'User'}
                                  </Typography>
                                  {` | ${act.lead?.companyName || 'Lead'} — ${dayjs(act.createdAt).format('MMM DD, hh:mm A')}`}
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                                    {act.description}
                                  </Typography>
                                </>
                              }
                              primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                            />
                          </ListItem>
                        </Box>
                      ))
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
