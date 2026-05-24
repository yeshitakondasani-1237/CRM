import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import ActivityTimeline from '../components/ActivityTimeline.jsx';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepButton,
  Chip,
  Avatar,
  TextField,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as IndustryIcon,
  Source as SourceIcon,
  MonetizationOn as RevenueIcon,
  Star as PriorityIcon,
  Shield as HealthIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Add as AddIcon,
  CalendarToday as TaskIcon,
  CheckCircle as DoneIcon,
  PendingActions as PendingIcon
} from '@mui/icons-material';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);

  // States
  const [activeTab, setActiveTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  // Log Activity Form State
  const [newActivity, setNewActivity] = useState({
    type: 'note',
    title: '',
    description: '',
    duration: '',
    outcome: 'Completed'
  });

  // Schedule Task Form State
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: dayjs().add(2, 'day').format('YYYY-MM-DDTHH:mm'),
    priority: 'medium',
    type: 'follow_up'
  });

  // Lead Edit Form State
  const [editForm, setEditForm] = useState({});

  // ---------------- QUERY FETCHES ----------------
  const { data: teamList } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const { data } = await api.get('/api/team');
      return data;
    }
  });

  const { data: leadData, isLoading: leadLoading, error: leadError } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/leads/${id}`);
      return data;
    }
  });

  const { data: leadTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['leadTasks', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/tasks`, { params: { leadId: id } });
      return data;
    }
  });

  // ---------------- MUTATIONS ----------------
  const updateLeadMutation = useMutation({
    mutationFn: async (updatedFields) => {
      const { data } = await api.put(`/api/leads/${id}`, updatedFields);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
      toast.success('Lead profile updated successfully');
      setEditOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update lead details');
    }
  });

  const archiveLeadMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/api/leads/${id}/archive`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(data.isArchived ? 'Lead archived' : 'Lead restored');
    }
  });

  const logActivityMutation = useMutation({
    mutationFn: async (activityBody) => {
      const { data } = await api.post(`/api/activities`, { ...activityBody, lead: id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      toast.success('Activity logged in history');
      setNewActivity({ type: 'note', title: '', description: '', duration: '', outcome: 'Completed' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to log activity');
    }
  });

  const scheduleTaskMutation = useMutation({
    mutationFn: async (taskBody) => {
      const { data } = await api.post(`/api/tasks`, { ...taskBody, lead: id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadTasks', id] });
      toast.success('Follow-up task scheduled');
      setNewTask({
        title: '',
        description: '',
        dueDate: dayjs().add(2, 'day').format('YYYY-MM-DDTHH:mm'),
        priority: 'medium',
        type: 'follow_up'
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to schedule task');
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }) => {
      const { data } = await api.put(`/api/tasks/${taskId}`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadTasks', id] });
      toast.success('Task status updated');
    }
  });

  // ---------------- HANDLERS & STAGES ----------------
  const stages = ['lead', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'];
  const activeStep = leadData ? stages.indexOf(leadData.lead.status) : 0;

  const handleStageChange = (newStage) => {
    if (newStage === 'won') {
      const closedRevenue = prompt('Please confirm closing revenue amount:', leadData.lead.expectedRevenue);
      if (closedRevenue === null) return; // cancel update
      updateLeadMutation.mutate({ status: 'won', closedRevenue: Number(closedRevenue) || 0 });
    } else {
      updateLeadMutation.mutate({ status: newStage });
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateLeadMutation.mutate(editForm);
  };

  const handleNotesQuickSave = () => {
    updateLeadMutation.mutate({ notes: noteContent });
  };

  const handleActivitySubmit = (e) => {
    e.preventDefault();
    if (!newActivity.title || !newActivity.description) {
      return toast.error('Activity title and description are required');
    }
    logActivityMutation.mutate({
      ...newActivity,
      duration: newActivity.duration ? Number(newActivity.duration) : undefined
    });
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!newTask.title) {
      return toast.error('Task title is required');
    }
    scheduleTaskMutation.mutate(newTask);
  };

  if (leadLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="85vh">
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (leadError) {
    return (
      <Box p={3} bgcolor="error.light" borderRadius={2}>
        <Typography color="error.dark" variant="h6">Failed to retrieve lead details.</Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/leads')}>Back to Pipeline</Button>
      </Box>
    );
  }

  const { lead, activities } = leadData;

  // Initialize edit form once data loads
  if (Object.keys(editForm).length === 0 && lead) {
    setEditForm({
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      email: lead.email,
      phone: lead.phone,
      industry: lead.industry,
      location: lead.location,
      source: lead.source,
      priority: lead.priority,
      expectedRevenue: lead.expectedRevenue,
      assignedTo: lead.assignedTo?._id || '',
    });
    setNoteContent(lead.notes || '');
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ---------------- PROFILE HEADER ---------------- */}
      <Box mb={4} display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box>
          <Box display="flex" alignItems="center" gap={1.5} mb={1}>
            <Typography variant="h3" fontWeight={800} fontFamily="Outfit" sx={{ display: 'inline-flex' }}>
              {lead.companyName}
            </Typography>
            <Chip
              label={lead.isArchived ? 'Archived' : 'Active'}
              color={lead.isArchived ? 'default' : 'primary'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Typography variant="body1" color="text.secondary">
            Primary Contact: <strong>{lead.contactPerson}</strong> | Associated Executive: <strong>{lead.assignedTo?.name || 'Unassigned'}</strong>
          </Typography>
        </Box>

        <Box display="flex" gap={1.5}>
          <Button variant="outlined" color="primary" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
            Edit Profile
          </Button>
          <Button
            variant="outlined"
            color={lead.isArchived ? 'primary' : 'warning'}
            startIcon={<ArchiveIcon />}
            onClick={() => archiveLeadMutation.mutate()}
          >
            {lead.isArchived ? 'Restore Lead' : 'Archive Lead'}
          </Button>
          <Button variant="text" onClick={() => navigate('/leads')}>Back to leads</Button>
        </Box>
      </Box>

      {/* ---------------- INTERACTIVE PIPELINE STEPPER ---------------- */}
      <Card sx={{ mb: 4, overflow: 'visible' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={3}>
            Sales Pipeline Progression Stage
          </Typography>
          <Stepper nonLinear activeStep={activeStep} alternativeLabel>
            {stages.map((stage, index) => {
              const label = stage.replace('_', ' ');
              const isCurrent = index === activeStep;
              const isCompleted = index < activeStep;
              return (
                <Step key={stage} completed={isCompleted}>
                  <StepButton
                    onClick={() => handleStageChange(stage)}
                    disabled={updateLeadMutation.isPending}
                    optional={isCurrent && (
                      <Typography variant="caption" color="secondary" fontWeight={600}>
                        Current Stage
                      </Typography>
                    )}
                  >
                    <StepLabel
                      StepIconProps={{
                        sx: {
                          '&.Mui-active': { color: 'secondary.main' },
                          '&.Mui-completed': { color: 'success.main' },
                        }
                      }}
                    >
                      <span style={{ textTransform: 'capitalize', fontWeight: isCurrent ? 700 : 500 }}>
                        {label}
                      </span>
                    </StepLabel>
                  </StepButton>
                </Step>
              );
            })}
          </Stepper>
        </CardContent>
      </Card>

      {/* ---------------- MAIN LAYOUT GRID ---------------- */}
      <Grid container spacing={3}>
        {/* LEFT COLUMN: Metadata Details, Quick Notes, Followups */}
        <Grid item xs={12} md={5}>
          <Grid container spacing={3}>
            {/* Metadata Info Card */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" fontWeight={700} fontFamily="Outfit" mb={2.5}>
                    Lead Information
                  </Typography>

                  <Box display="flex" flexDirection="column" gap={2}>
                    {[
                      { icon: <EmailIcon color="action" />, label: 'Email', value: lead.email },
                      { icon: <PhoneIcon color="action" />, label: 'Phone', value: lead.phone || 'N/A' },
                      { icon: <IndustryIcon color="action" />, label: 'Industry', value: lead.industry || 'N/A' },
                      { icon: <LocationIcon color="action" />, label: 'Location', value: lead.location || 'N/A' },
                      { icon: <SourceIcon color="action" />, label: 'Source', value: lead.source },
                      {
                        icon: <RevenueIcon color="action" />,
                        label: 'Expected Revenue',
                        value: formatCurrency(lead.expectedRevenue),
                        extra: lead.status === 'won' && ` (Closed: ${formatCurrency(lead.closedRevenue)})`
                      },
                      {
                        icon: <PriorityIcon color="action" />,
                        label: 'Priority',
                        value: (
                          <Chip
                            label={lead.priority}
                            size="small"
                            color={lead.priority === 'critical' ? 'error' : lead.priority === 'high' ? 'warning' : 'primary'}
                            sx={{ textTransform: 'capitalize', height: 20 }}
                          />
                        )
                      },
                      {
                        icon: <HealthIcon color="action" />,
                        label: 'Health Score',
                        value: (
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Typography variant="body2" fontWeight={700} color={lead.healthScore >= 70 ? 'success.main' : lead.healthScore >= 40 ? 'warning.main' : 'error.main'}>
                              {lead.healthScore}%
                            </Typography>
                            <Box width={80}>
                              <LinearProgress
                                variant="determinate"
                                value={lead.healthScore}
                                color={lead.healthScore >= 70 ? 'success' : lead.healthScore >= 40 ? 'warning' : 'error'}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </Box>
                        )
                      }
                    ].map((row, idx) => (
                      <Box key={idx} display="flex" alignItems="center" gap={2}>
                        {row.icon}
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1 }}>
                            {row.label}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {row.value} {row.extra}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Notes Rich-Text Panel */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" fontWeight={700} fontFamily="Outfit" mb={2}>
                    BDA Notes Widget
                  </Typography>
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="Enter persistent notes about technical requirements, scheduling blockers, or custom pricing negotiations..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleNotesQuickSave}
                    disabled={updateLeadMutation.isPending}
                  >
                    Save Notes
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* RIGHT COLUMN: Activity logger & Chronological timeline */}
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} textColor="secondary" indicatorColor="secondary">
                <Tab label="Activity History Log" />
                <Tab label={`Pending Follow-ups (${leadTasks?.filter((t) => t.status === 'pending').length || 0})`} />
              </Tabs>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {activeTab === 0 ? (
                /* TAB 0: ACTIVITIES LOGGING & TIMELINE */
                <Box>
                  {/* Activity Logger Form */}
                  <form onSubmit={handleActivitySubmit}>
                    <Typography variant="subtitle2" fontWeight={700} mb={2.5}>
                      Log New Client Interaction
                    </Typography>
                    <Grid container spacing={2} mb={3}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={newActivity.type}
                            label="Type"
                            onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                          >
                            <MenuItem value="note">General Note</MenuItem>
                            <MenuItem value="call">Phone Call</MenuItem>
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="meeting">Meeting</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          label="Title"
                          size="small"
                          fullWidth
                          required
                          placeholder="e.g. Discovery Call, Spec sheet sent"
                          value={newActivity.title}
                          onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Details / Description"
                          size="small"
                          multiline
                          rows={2}
                          fullWidth
                          required
                          placeholder="What did you discuss? What are the next steps?"
                          value={newActivity.description}
                          onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                        />
                      </Grid>
                      {['call', 'meeting'].includes(newActivity.type) && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Duration (minutes)"
                              size="small"
                              type="number"
                              fullWidth
                              value={newActivity.duration}
                              onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Outcome</InputLabel>
                              <Select
                                value={newActivity.outcome}
                                label="Outcome"
                                onChange={(e) => setNewActivity({ ...newActivity, outcome: e.target.value })}
                              >
                                <MenuItem value="Completed">Completed</MenuItem>
                                <MenuItem value="Scheduled">Scheduled</MenuItem>
                                <MenuItem value="No Answer">No Answer</MenuItem>
                                <MenuItem value="Rescheduled">Rescheduled</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        </>
                      )}
                      <Grid item xs={12} display="flex" justifyContent="flex-end">
                        <Button type="submit" variant="contained" color="secondary" disabled={logActivityMutation.isPending}>
                          Log Interaction
                        </Button>
                      </Grid>
                    </Grid>
                  </form>

                  <Divider sx={{ my: 3 }} />

                  {/* Vertical Chronological Timeline */}
                  <ActivityTimeline activities={activities || []} />
                </Box>
              ) : (
                /* TAB 1: PENDING TASKS & SCHEDULER */
                <Box>
                  {/* Task Scheduler Form */}
                  <form onSubmit={handleTaskSubmit}>
                    <Typography variant="subtitle2" fontWeight={700} mb={2.5}>
                      Schedule New Follow-up
                    </Typography>
                    <Grid container spacing={2} mb={3}>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          label="Follow-up Title"
                          size="small"
                          fullWidth
                          required
                          placeholder="e.g. Call for feedback, email catalog specs"
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Priority</InputLabel>
                          <Select
                            value={newTask.priority}
                            label="Priority"
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                          >
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Due Date & Time"
                          type="datetime-local"
                          size="small"
                          fullWidth
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Follow-up Notes"
                          size="small"
                          fullWidth
                          placeholder="Additional context..."
                          value={newTask.description}
                          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} display="flex" justifyContent="flex-end">
                        <Button type="submit" variant="contained" color="secondary" disabled={scheduleTaskMutation.isPending}>
                          Add Follow-up
                        </Button>
                      </Grid>
                    </Grid>
                  </form>

                  <Divider sx={{ my: 3 }} />

                  {/* Tasks Check-List */}
                  <Typography variant="subtitle2" fontWeight={700} mb={2}>
                    Scheduled Tasks
                  </Typography>
                  
                  {tasksLoading ? (
                    <CircularProgress size={24} />
                  ) : leadTasks?.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No follow-ups scheduled.</Typography>
                  ) : (
                    <List>
                      {leadTasks?.map((task) => {
                        const isPending = task.status === 'pending';
                        return (
                          <ListItem
                            key={task._id}
                            disablePadding
                            sx={{
                              mb: 1,
                              p: 1.5,
                              borderRadius: 2,
                              border: `1px solid ${theme.palette.divider}`,
                              bgcolor: task.status === 'completed' ? `${theme.palette.success.main}08` : 'transparent',
                            }}
                          >
                            <ListItemIcon>
                              <Checkbox
                                checked={task.status === 'completed'}
                                onChange={(e) =>
                                  toggleTaskMutation.mutate({
                                    taskId: task._id,
                                    status: e.target.checked ? 'completed' : 'pending',
                                  })
                                }
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={task.title}
                              secondary={
                                <>
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    {`Due: ${dayjs(task.dueDate).format('MMM DD, YYYY [at] hh:mm A')}`}
                                  </Typography>
                                  {task.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                      {task.description}
                                    </Typography>
                                  )}
                                </>
                              }
                              primaryTypographyProps={{
                                fontWeight: 600,
                                style: { textDecoration: task.status === 'completed' ? 'line-through' : 'none' },
                              }}
                            />
                            <Chip
                              label={task.status}
                              size="small"
                              color={task.status === 'completed' ? 'success' : task.status === 'overdue' ? 'error' : 'warning'}
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ---------------- EDIT PROFILE MODAL ---------------- */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>Edit Opportunity Profile</DialogTitle>
        <Divider />
        <form onSubmit={handleEditSubmit}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Company Name"
                  fullWidth
                  required
                  value={editForm.companyName || ''}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Person"
                  fullWidth
                  required
                  value={editForm.contactPerson || ''}
                  onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Industry"
                  fullWidth
                  value={editForm.industry || ''}
                  onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Location"
                  fullWidth
                  value={editForm.location || ''}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Lead Source</InputLabel>
                  <Select
                    value={editForm.source || ''}
                    label="Lead Source"
                    onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                  >
                    <MenuItem value="Website">Website</MenuItem>
                    <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                    <MenuItem value="Trade Show">Trade Show</MenuItem>
                    <MenuItem value="Referral">Referral</MenuItem>
                    <MenuItem value="Cold Call">Cold Call</MenuItem>
                    <MenuItem value="Email Campaign">Email Campaign</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={editForm.priority || ''}
                    label="Priority"
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Expected Revenue"
                  type="number"
                  fullWidth
                  value={editForm.expectedRevenue || 0}
                  onChange={(e) => setEditForm({ ...editForm, expectedRevenue: Number(e.target.value) })}
                />
              </Grid>
              {user?.role !== 'executive' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Assign Executive</InputLabel>
                    <Select
                      value={editForm.assignedTo || ''}
                      label="Assign Executive"
                      onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                    >
                      <MenuItem value="">Unassigned</MenuItem>
                      {teamList?.map((exec) => (
                        <MenuItem key={exec._id} value={exec._id}>
                          {exec.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setEditOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={updateLeadMutation.isPending}>
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default LeadDetails;
