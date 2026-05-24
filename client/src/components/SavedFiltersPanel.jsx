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
  Rating,
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SavedFiltersPanel = ({ onApplyFilter, onClose }) => {
  const [savedFilters, setSavedFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [currentFilters, setCurrentFilters] = useState({
    status: [],
    priority: [],
    source: [],
    minRevenue: '',
    maxRevenue: '',
    healthScore: { min: 0, max: 100 },
    tags: [],
  });

  useEffect(() => {
    fetchSavedFilters();
  }, []);

  const fetchSavedFilters = async () => {
    try {
      const response = await api.get('/filters');
      setSavedFilters(response.data);
    } catch (error) {
      toast.error('Failed to load filters');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      toast.error('Please enter a filter name');
      return;
    }

    try {
      await api.post('/filters', {
        name: filterName,
        description: filterDescription,
        filters: currentFilters,
      });
      toast.success('Filter saved successfully');
      setSaveDialogOpen(false);
      setFilterName('');
      setFilterDescription('');
      fetchSavedFilters();
    } catch (error) {
      toast.error('Failed to save filter');
    }
  };

  const handleApplyFilter = async (filterId) => {
    try {
      const response = await api.post(`/filters/${filterId}/apply`);
      onApplyFilter?.(response.data.leads);
      toast.success('Filter applied');
    } catch (error) {
      toast.error('Failed to apply filter');
    }
  };

  const handleDeleteFilter = async (filterId) => {
    try {
      await api.delete(`/filters/${filterId}`);
      toast.success('Filter deleted');
      fetchSavedFilters();
    } catch (error) {
      toast.error('Failed to delete filter');
    }
  };

  const handleToggleFavorite = async (filter) => {
    try {
      await api.put(`/filters/${filter._id}`, {
        ...filter,
        isFavorite: !filter.isFavorite,
      });
      fetchSavedFilters();
    } catch (error) {
      toast.error('Failed to update filter');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Advanced Search & Filters
      </Typography>

      {/* Quick Filter Builder */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Quick Filters
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  label="Status"
                  value={currentFilters.status}
                  onChange={(e) =>
                    setCurrentFilters({ ...currentFilters, status: e.target.value })
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
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
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  multiple
                  label="Priority"
                  value={currentFilters.priority}
                  onChange={(e) =>
                    setCurrentFilters({ ...currentFilters, priority: e.target.value })
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {['low', 'medium', 'high', 'critical'].map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Min Revenue"
                type="number"
                size="small"
                fullWidth
                value={currentFilters.minRevenue}
                onChange={(e) =>
                  setCurrentFilters({
                    ...currentFilters,
                    minRevenue: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Max Revenue"
                type="number"
                size="small"
                fullWidth
                value={currentFilters.maxRevenue}
                onChange={(e) =>
                  setCurrentFilters({
                    ...currentFilters,
                    maxRevenue: e.target.value,
                  })
                }
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => setSaveDialogOpen(true)}
          >
            Save Filter
          </Button>
        </CardActions>
      </Card>

      <Divider sx={{ my: 2 }} />

      {/* Saved Filters List */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Your Saved Filters
      </Typography>
      <List>
        {savedFilters.map((filter) => (
          <ListItem
            key={filter._id}
            secondaryAction={
              <Box>
                <IconButton
                  edge="end"
                  onClick={() => handleToggleFavorite(filter)}
                >
                  <StarIcon
                    sx={{ color: filter.isFavorite ? '#ffd700' : 'inherit' }}
                  />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteFilter(filter._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            }
          >
            <ListItemButton
              onClick={() => handleApplyFilter(filter._id)}
              dense
            >
              <ListItemText
                primary={filter.name}
                secondary={`Used ${filter.usageCount} times • ${filter.description}`}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Save Filter Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Save Current Filter</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Filter Name"
            placeholder="e.g., High-Value Open Deals"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            placeholder="Optional description"
            multiline
            rows={2}
            value={filterDescription}
            onChange={(e) => setFilterDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveFilter} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedFiltersPanel;
