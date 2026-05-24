import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Grid,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import api from '../utils/api';
import toast from 'react-hot-toast';

const WorkflowAutomationBuilder = () => {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [automationData, setAutomationData] = useState({
    name: '',
    description: '',
    triggerType: 'status_change',
    triggerConditions: {
      statusFrom: 'lead',
      statusTo: 'contacted',
    },
    actions: [
      {
        actionType: 'assign_user',
        actionData: { userId: '' },
      },
    ],
    isActive: true,
  });

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const response = await api.get('/automations');
      setAutomations(response.data);
    } catch (error) {
      toast.error('Failed to load automations');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAutomation = async () => {
    if (!automationData.name || !automationData.description) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      if (selectedAutomation) {
        await api.put(`/automations/${selectedAutomation._id}`, automationData);
        toast.success('Automation updated');
      } else {
        await api.post('/automations', automationData);
        toast.success('Automation created');
      }
      setBuilderOpen(false);
      resetForm();
      fetchAutomations();
    } catch (error) {
      toast.error('Failed to save automation');
    }
  };

  const handleDeleteAutomation = async (automationId) => {
    if (window.confirm('Delete this automation?')) {
      try {
        await api.delete(`/automations/${automationId}`);
        toast.success('Automation deleted');
        fetchAutomations();
      } catch (error) {
        toast.error('Failed to delete automation');
      }
    }
  };

  const handleToggleActive = async (automation) => {
    try {
      await api.put(`/automations/${automation._id}`, {
        ...automation,
        isActive: !automation.isActive,
      });
      fetchAutomations();
      toast.success(automation.isActive ? 'Automation paused' : 'Automation activated');
    } catch (error) {
      toast.error('Failed to update automation');
    }
  };

  const handleEditAutomation = (automation) => {
    setSelectedAutomation(automation);
    setAutomationData(automation);
    setBuilderOpen(true);
  };

  const addAction = () => {
    setAutomationData({
      ...automationData,
      actions: [
        ...automationData.actions,
        {
          actionType: 'update_field',
          actionData: {},
        },
      ],
    });
  };

  const removeAction = (index) => {
    setAutomationData({
      ...automationData,
      actions: automationData.actions.filter((_, i) => i !== index),
    });
  };

  const resetForm = () => {
    setAutomationData({
      name: '',
      description: '',
      triggerType: 'status_change',
      triggerConditions: {},
      actions: [],
      isActive: true,
    });
    setSelectedAutomation(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Workflow Automations
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Alert severity="info">
            Create automated workflows to handle repetitive tasks like assigning leads,
            updating probabilities, and creating follow-up tasks
          </Alert>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setBuilderOpen(true);
            }}
          >
            Create Workflow
          </Button>
        </CardActions>
      </Card>

      <Grid container spacing={2}>
        {automations.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">No automations created yet</Typography>
            </Paper>
          </Grid>
        ) : (
          automations.map((automation) => (
            <Grid item xs={12} md={6} key={automation._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6">{automation.name}</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={automation.isActive}
                          onChange={() => handleToggleActive(automation)}
                        />
                      }
                      label={automation.isActive ? 'Active' : 'Inactive'}
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {automation.description}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    <strong>Trigger:</strong> {automation.triggerType}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
                    <strong>Actions:</strong> {automation.actions.length} action(s)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {automation.actions.map((action, idx) => (
                      <Chip
                        key={idx}
                        label={action.actionType}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => handleEditAutomation(automation)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteAutomation(automation._id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Automation Builder Dialog */}
      <Dialog open={builderOpen} onClose={() => setBuilderOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          {selectedAutomation ? 'Edit Workflow' : 'Create Workflow'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Workflow Name"
                placeholder="e.g., Auto-assign Qualified Leads"
                value={automationData.name}
                onChange={(e) =>
                  setAutomationData({ ...automationData, name: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={automationData.description}
                onChange={(e) =>
                  setAutomationData({
                    ...automationData,
                    description: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Trigger
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Trigger Type</InputLabel>
                <Select
                  value={automationData.triggerType}
                  label="Trigger Type"
                  onChange={(e) =>
                    setAutomationData({
                      ...automationData,
                      triggerType: e.target.value,
                    })
                  }
                >
                  {[
                    'status_change',
                    'revenue_milestone',
                    'time_based',
                    'probability_change',
                  ].map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {automationData.triggerType === 'status_change' && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>From Status</InputLabel>
                    <Select
                      value={
                        automationData.triggerConditions?.statusFrom || ''
                      }
                      label="From Status"
                      onChange={(e) =>
                        setAutomationData({
                          ...automationData,
                          triggerConditions: {
                            ...automationData.triggerConditions,
                            statusFrom: e.target.value,
                          },
                        })
                      }
                    >
                      {[
                        'lead',
                        'contacted',
                        'qualified',
                        'proposal_sent',
                        'negotiation',
                        'won',
                        'lost',
                      ].map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>To Status</InputLabel>
                    <Select
                      value={automationData.triggerConditions?.statusTo || ''}
                      label="To Status"
                      onChange={(e) =>
                        setAutomationData({
                          ...automationData,
                          triggerConditions: {
                            ...automationData.triggerConditions,
                            statusTo: e.target.value,
                          },
                        })
                      }
                    >
                      {[
                        'contacted',
                        'qualified',
                        'proposal_sent',
                        'negotiation',
                        'won',
                        'lost',
                      ].map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">Actions</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addAction}>
                  Add Action
                </Button>
              </Box>
            </Grid>

            {automationData.actions.map((action, idx) => (
              <Grid item xs={12} key={idx}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Action Type</InputLabel>
                    <Select
                      value={action.actionType}
                      label="Action Type"
                      onChange={(e) => {
                        const newActions = [...automationData.actions];
                        newActions[idx].actionType = e.target.value;
                        setAutomationData({
                          ...automationData,
                          actions: newActions,
                        });
                      }}
                    >
                      {[
                        'assign_user',
                        'update_field',
                        'update_probability',
                        'create_task',
                      ].map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => removeAction(idx)}
                    sx={{ mt: 1 }}
                  >
                    Remove
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBuilderOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveAutomation} variant="contained">
            {selectedAutomation ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowAutomationBuilder;
