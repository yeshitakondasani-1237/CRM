import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  Button,
  useTheme
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CheckCircle as DoneIcon,
  PendingActions as PendingIcon,
  Warning as WarningIcon,
  OpenInNew as LinkIcon
} from '@mui/icons-material';

const Tasks = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();

  // Active tab: 0 = Pending, 1 = Overdue, 2 = Completed
  const [activeTab, setActiveTab] = useState(0);

  // ---------------- FETCH TASKS ----------------
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', activeTab],
    queryFn: async () => {
      let statusParam = '';
      if (activeTab === 0) statusParam = 'pending';
      if (activeTab === 1) statusParam = 'overdue';
      if (activeTab === 2) statusParam = 'completed';

      const { data } = await api.get('/api/tasks', { params: { status: statusParam } });
      return data;
    }
  });

  // ---------------- MUTATIONS ----------------
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.put(`/api/tasks/${id}`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardWidgets'] });
      toast.success('Task status updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/api/tasks/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardWidgets'] });
      toast.success('Follow-up task deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  });

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ---------------- HEADER BAR ---------------- */}
      <Box mb={4}>
        <Typography variant="h3" fontWeight={800} fontFamily="Outfit" gutterBottom>
          Follow-up Reminders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track meetings, phone calls, and email check-ins
        </Typography>
      </Box>

      {/* ---------------- TABS SEPARATOR ---------------- */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} textColor="secondary" indicatorColor="secondary">
          <Tab label="Pending Tasks" />
          <Tab label="Overdue Alerts" />
          <Tab label="Completed Logs" />
        </Tabs>
      </Box>

      {/* ---------------- TASKS LIST VIEW ---------------- */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress color="secondary" />
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 2 }}>
            {tasks?.length === 0 ? (
              <Box py={5} textAlign="center">
                <Typography variant="body1" color="text.secondary">
                  No tasks found in this category.
                </Typography>
              </Box>
            ) : (
              <List>
                {tasks?.map((task, idx) => {
                  const isOverdue = task.status === 'overdue';
                  const isCompleted = task.status === 'completed';

                  return (
                    <Box key={task._id}>
                      {idx > 0 && <Divider />}
                      <ListItem
                        secondaryAction={
                          <Box display="flex" gap={1}>
                            {task.lead && (
                              <Tooltip title="View Lead Profile">
                                <IconButton size="small" color="secondary" href={`/leads/${task.lead._id}`}>
                                  <LinkIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete Task">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  if (window.confirm('Delete this follow-up permanently?')) {
                                    deleteTaskMutation.mutate(task._id);
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                        sx={{
                          py: 2,
                          px: 2,
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <ListItemIcon>
                          <Checkbox
                            checked={isCompleted}
                            onChange={(e) =>
                              toggleTaskMutation.mutate({
                                id: task._id,
                                status: e.target.checked ? 'completed' : 'pending',
                              })
                            }
                            color={isOverdue ? 'error' : 'primary'}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={task.title}
                          secondary={
                            <>
                              <Typography component="span" variant="caption" color="text.primary" fontWeight={600}>
                                {task.lead?.companyName || 'General Follow-up'}
                              </Typography>
                              {` — Due: ${dayjs(task.dueDate).format('MMM DD, YYYY [at] hh:mm A')}`}
                              {task.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {task.description}
                                </Typography>
                              )}
                            </>
                          }
                          primaryTypographyProps={{
                            fontWeight: 600,
                            style: { textDecoration: isCompleted ? 'line-through' : 'none' },
                            color: isOverdue ? 'error.main' : 'text.primary',
                          }}
                        />
                        <Box mr={6} display="flex" gap={1}>
                          <Chip
                            label={task.type.replace('_', ' ')}
                            size="small"
                            variant="outlined"
                            sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
                          />
                          <Chip
                            label={task.priority}
                            size="small"
                            color={task.priority === 'high' ? 'error' : 'default'}
                            sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
                          />
                        </Box>
                      </ListItem>
                    </Box>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Tasks;
