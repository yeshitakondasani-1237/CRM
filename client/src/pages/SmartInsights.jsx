import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api.js';
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
  Divider,
  Chip,
  Button,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Warning as WarningIcon,
  TrendingUp as ForecastIcon,
  AccessTime as AgeIcon,
  CheckCircle as ConvertIcon,
  ReportProblem as RiskIcon,
  Analytics as FunnelIcon
} from '@mui/icons-material';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const SmartInsights = () => {
  const theme = useTheme();

  // ---------------- QUERY QUERIES ----------------
  const { data: recommendations, isLoading: recLoading } = useQuery({
    queryKey: ['smartRecommendations'],
    queryFn: async () => {
      const { data } = await api.get('/api/smart/recommendations');
      return data;
    }
  });

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['smartForecast'],
    queryFn: async () => {
      const { data } = await api.get('/api/smart/revenue-forecast');
      return data;
    }
  });

  const { data: aging, isLoading: agingLoading } = useQuery({
    queryKey: ['smartAging'],
    queryFn: async () => {
      const { data } = await api.get('/api/smart/lead-aging');
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

  const loading = recLoading || forecastLoading || agingLoading || chartsLoading;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  // Calculate Sales Funnel values based on Leads by Status from charts query
  // Stages: lead, contacted, qualified, proposal_sent, negotiation, won
  const statusCounts = {};
  if (charts?.leadsByStatus) {
    charts.leadsByStatus.forEach((item) => {
      statusCounts[item.name] = item.value;
    });
  }

  const getCount = (status) => statusCounts[status] || 0;

  // Cumulative funnel calculations
  const won = getCount('won');
  const negotiation = getCount('negotiation') + won;
  const proposal = getCount('proposal_sent') + negotiation;
  const qualified = getCount('qualified') + proposal;
  const contacted = getCount('contacted') + qualified;
  const totalLeads = getCount('lead') + contacted + getCount('lost'); // include lost at top of funnel

  const funnelStages = [
    { label: 'Total Leads (Top of Funnel)', count: totalLeads },
    { label: 'Contacted Stage', count: contacted },
    { label: 'Qualified Opportunities', count: qualified },
    { label: 'Proposals Submitted', count: proposal },
    { label: 'In Active Negotiation', count: negotiation },
    { label: 'Deals Won (Closed Won)', count: won },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ---------------- HEADER BAR ---------------- */}
      <Box mb={4} display="flex" alignItems="center" gap={2}>
        <AIIcon color="secondary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h3" fontWeight={800} fontFamily="Outfit" gutterBottom>
            Smart AI Insights
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Lead health scoring, pipeline forecasting, and aging bottlenecks
          </Typography>
        </Box>
      </Box>

      {/* ---------------- REVENUE FORECASTING CARDS ---------------- */}
      <Typography variant="h5" fontWeight={700} fontFamily="Outfit" mb={2}>
        Pipeline Revenue Forecast
      </Typography>
      <Grid container spacing={3} mb={4}>
        {[
          {
            title: 'Expected Pipeline Value',
            value: formatCurrency(forecast?.expectedRevenue),
            desc: 'Sum of all active opportunities',
            color: 'primary.main'
          },
          {
            title: 'Weighted AI Forecast',
            value: formatCurrency(forecast?.forecastRevenue),
            desc: 'Revenue adjusted by conversion probability',
            color: 'secondary.main',
            highlight: true
          },
          {
            title: 'Closed Won Revenue',
            value: formatCurrency(forecast?.closedRevenue),
            desc: 'Actual revenue secured',
            color: 'success.main'
          }
        ].map((card, idx) => (
          <Grid item xs={12} sm={4} key={idx}>
            <Card
              sx={{
                border: card.highlight ? `2px solid ${theme.palette.secondary.main}` : undefined,
                boxShadow: card.highlight ? '0 8px 24px rgba(37, 99, 235, 0.15)' : undefined
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="h4" fontWeight={800} fontFamily="Outfit" color={card.color} mb={1}>
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ---------------- SALES FUNNEL VISUALIZATION ---------------- */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <FunnelIcon color="secondary" />
                <Typography variant="h5" fontWeight={700} fontFamily="Outfit">
                  Sales Conversion Funnel
                </Typography>
              </Box>

              <Box display="flex" flexDirection="column" gap={2}>
                {funnelStages.map((stage, idx) => {
                  // Calculate conversion relative to top of funnel (percentage)
                  const percentage = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
                  
                  // Color gradient narrowing down the funnel
                  const bgOpacities = [0.15, 0.25, 0.4, 0.6, 0.8, 1.0];

                  return (
                    <Box key={idx}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="body2" fontWeight={600}>
                          {stage.label}
                        </Typography>
                        <Box display="flex" gap={2}>
                          <Typography variant="body2" fontWeight={700}>
                            {stage.count} leads
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            {percentage}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          width: '100%',
                          height: 28,
                          bgcolor: `${theme.palette.secondary.main}12`,
                          borderRadius: 1.5,
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                      >
                        <Box
                          sx={{
                            width: `${percentage}%`,
                            height: '100%',
                            bgcolor: theme.palette.secondary.main,
                            opacity: bgOpacities[idx],
                            transition: 'width 1s ease',
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Recommendations Panel */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <AIIcon color="secondary" />
                <Typography variant="h5" fontWeight={700} fontFamily="Outfit">
                  AI Recommendation Panel
                </Typography>
              </Box>

              <Box display="flex" flexDirection="column" gap={3}>
                {[
                  {
                    title: 'Needs Immediate Attention',
                    list: recommendations?.attentionNeeded,
                    icon: <WarningIcon color="warning" />,
                    emptyMsg: 'All leads are actively contacted.',
                    type: 'attention'
                  },
                  {
                    title: 'High Conversion Potential',
                    list: recommendations?.highConversionProbable,
                    icon: <ConvertIcon color="success" />,
                    emptyMsg: 'No prospects fit high-conversion score thresholds.',
                    type: 'convert'
                  },
                  {
                    title: 'At-Risk Deals',
                    list: recommendations?.atRisk,
                    icon: <RiskIcon color="error" />,
                    emptyMsg: 'No critical task overdue warnings found.',
                    type: 'risk'
                  }
                ].map((sec, idx) => (
                  <Box key={idx}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      {sec.icon}
                      <Typography variant="subtitle2" fontWeight={700}>
                        {sec.title}
                      </Typography>
                    </Box>
                    
                    {sec.list?.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 3.5, display: 'block' }}>
                        {sec.emptyMsg}
                      </Typography>
                    ) : (
                      <Box display="flex" flexDirection="column" gap={1} sx={{ pl: 3.5 }}>
                        {sec.list?.slice(0, 2).map((lead) => (
                          <Box
                            key={lead._id}
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            p={1}
                            sx={{
                              bgcolor: theme.palette.action.hover,
                              borderRadius: 1.5,
                              border: `1px solid ${theme.palette.divider}`
                            }}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {lead.companyName}
                              </Typography>
                              {sec.type === 'attention' && (
                                <Typography variant="caption" color="text.secondary">
                                  Inactive: {lead.daysInactive} days
                                </Typography>
                              )}
                              {sec.type === 'convert' && (
                                <Typography variant="caption" color="text.secondary">
                                  Pipeline: {formatCurrency(lead.expectedRevenue)}
                                </Typography>
                              )}
                              {sec.type === 'risk' && (
                                <Typography variant="caption" color="error">
                                  Reason: {lead.reason}
                                </Typography>
                              )}
                            </Box>
                            <Button size="small" variant="text" href={`/leads/${lead._id}`}>
                              Open
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ---------------- LEAD AGING TRACKER ---------------- */}
      <Typography variant="h5" fontWeight={700} fontFamily="Outfit" mb={2}>
        Lead Aging & Escalation Panel
      </Typography>
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Company Name</TableCell>
                  <TableCell>Current Stage</TableCell>
                  <TableCell>Days in Stage</TableCell>
                  <TableCell>Total Age</TableCell>
                  <TableCell>Escalation Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {aging?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No active leads currently tracked.</TableCell>
                  </TableRow>
                ) : (
                  aging?.map((lead) => (
                    <TableRow key={lead._id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{lead.companyName}</Typography>
                        <Typography variant="caption" color="text.secondary">{lead.contactPerson}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={lead.status.replace('_', ' ')} size="small" sx={{ textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AgeIcon fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight={600}>{lead.daysInStage} days</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{lead.totalAge} days</TableCell>
                      <TableCell>
                        {lead.needsEscalation ? (
                          <Chip
                            label="Needs Escalation"
                            color="error"
                            size="small"
                            sx={{ fontWeight: 600, animation: 'pulse 2s infinite' }}
                          />
                        ) : (
                          <Chip label="Stable" color="success" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button size="small" color="secondary" href={`/leads/${lead._id}`}>
                          View details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SmartInsights;
// Inject keyframe animation for aging pulse alerts in local style
const style = document.createElement('style');
style.innerHTML = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(style);
