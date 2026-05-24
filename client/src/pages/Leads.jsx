import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import KanbanBoard from '../components/KanbanBoard.jsx';
import CSVImportModal from '../components/CSVImportModal.jsx';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Paper,
  CircularProgress,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  ViewKanban as KanbanIcon,
  List as ListIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewDetailsIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const Leads = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);

  // Tabs: 0 = Kanban, 1 = List/Table
  const [activeTab, setActiveTab] = useState(0);

  // Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [minRevenue, setMinRevenue] = useState('');
  const [maxRevenue, setMaxRevenue] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Dialog Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // New Lead Form State
  const [newLead, setNewLead] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    industry: '',
    location: '',
    source: 'Website',
    priority: 'medium',
    expectedRevenue: 0,
    assignedTo: '',
    notes: '',
    tags: []
  });

  // Bulk Import Form State (simple bulk text or JSON copy-paste)
  const [importData, setImportData] = useState('');

  // ---------------- FETCH QUERIES ----------------
  const { data: teamList } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const { data } = await api.get('/api/team');
      return data;
    }
  });

  // Leads Query with Filters
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', { search, status, priority, assignedTo, minRevenue, maxRevenue, page, rowsPerPage }],
    queryFn: async () => {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined,
        assignedTo: assignedTo || undefined,
        minRevenue: minRevenue || undefined,
        maxRevenue: maxRevenue || undefined
      };
      const { data } = await api.get('/api/leads', { params });
      return data;
    }
  });

  // ---------------- MUTATIONS ----------------
  const createLeadMutation = useMutation({
    mutationFn: async (leadBody) => {
      const { data } = await api.post('/api/leads', leadBody);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardCharts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardWidgets'] });
      toast.success('New lead created successfully');
      setCreateOpen(false);
      // Reset form
      setNewLead({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        industry: '',
        location: '',
        source: 'Website',
        priority: 'medium',
        expectedRevenue: 0,
        assignedTo: '',
        notes: '',
        tags: []
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create lead');
    }
  });

  const importLeadsMutation = useMutation({
    mutationFn: async (leadsList) => {
      const { data } = await api.post('/api/leads/import', { leads: leadsList });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(data.message || 'Leads imported successfully');
      setImportOpen(false);
      setImportData('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to import bulk leads');
    }
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/api/leads/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardCharts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardWidgets'] });
      toast.success('Lead and associated logs removed');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete lead');
    }
  });

  // ---------------- HANDLERS ----------------
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newLead.companyName || !newLead.contactPerson || !newLead.email) {
      return toast.error('Company name, contact person, and email are required');
    }
    createLeadMutation.mutate(newLead);
  };

  const handleImportSubmit = (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importData);
      if (!Array.isArray(parsed)) {
        return toast.error('Data must be a JSON array of objects');
      }
      importLeadsMutation.mutate(parsed);
    } catch (err) {
      toast.error('Invalid JSON format. Please check your syntax.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/api/leads/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `manufacturing_leads_${dayjs().format('YYYYMMDD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to export leads list');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setAssignedTo('');
    setMinRevenue('');
    setMaxRevenue('');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ---------------- HEADER BAR ---------------- */}
      <Box mb={4} display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap={2}>
        <Box>
          <Typography variant="h3" fontWeight={800} fontFamily="Outfit" gutterBottom>
            Sales Opportunities
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pipeline board & lead database
          </Typography>
        </Box>

        <Box display="flex" gap={1.5}>
          {user?.role !== 'executive' && (
            <>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ImportIcon />}
                onClick={() => setImportOpen(true)}
              >
                Bulk Import
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ExportIcon />}
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
            </>
          )}
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Add New Lead
          </Button>
        </Box>
      </Box>

      {/* ---------------- FILTER CONTROLS CARD ---------------- */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                label="Search Leads"
                size="small"
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="lead">Lead</MenuItem>
                  <MenuItem value="contacted">Contacted</MenuItem>
                  <MenuItem value="qualified">Qualified</MenuItem>
                  <MenuItem value="proposal_sent">Proposal Sent</MenuItem>
                  <MenuItem value="negotiation">Negotiation</MenuItem>
                  <MenuItem value="won">Won</MenuItem>
                  <MenuItem value="lost">Lost</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {user?.role !== 'executive' && (
              <Grid item xs={12} sm={4} md={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Assignee</InputLabel>
                  <Select value={assignedTo} label="Assignee" onChange={(e) => setAssignedTo(e.target.value)}>
                    <MenuItem value="">All Executives</MenuItem>
                    {teamList?.map((exec) => (
                      <MenuItem key={exec._id} value={exec._id}>
                        {exec.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} sm={4} md={1.5}>
              <TextField
                label="Min Rev"
                type="number"
                size="small"
                fullWidth
                value={minRevenue}
                onChange={(e) => setMinRevenue(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={1.5}>
              <TextField
                label="Max Rev"
                type="number"
                size="small"
                fullWidth
                value={maxRevenue}
                onChange={(e) => setMaxRevenue(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end">
              <Button
                variant="text"
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                color="inherit"
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ---------------- VIEW TABS ---------------- */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} textColor="secondary" indicatorColor="secondary">
          <Tab icon={<KanbanIcon />} label="Pipeline Board" iconPosition="start" />
          <Tab icon={<ListIcon />} label="List Database" iconPosition="start" />
        </Tabs>
      </Box>

      {/* ---------------- TAB PANELS ---------------- */}
      {leadsLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={10}>
          <CircularProgress color="secondary" />
        </Box>
      ) : activeTab === 0 ? (
        /* KANBAN PIPELINE VIEW */
        <KanbanBoard leads={leadsData?.leads || []} />
      ) : (
        /* TABLE DATABASE VIEW */
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company Name</TableCell>
                <TableCell>Contact Person</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Expected Revenue</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>Health Score</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leadsData?.leads?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No leads found matching current criteria.
                  </TableCell>
                </TableRow>
              ) : (
                leadsData?.leads?.map((lead) => (
                  <TableRow key={lead._id}>
                    <TableCell fontWeight={600}>{lead.companyName}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{lead.contactPerson}</Typography>
                      <Typography variant="caption" color="text.secondary">{lead.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={lead.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          fontWeight: 600,
                          bgcolor: lead.status === 'won' ? 'success.light' : lead.status === 'lost' ? 'error.light' : 'action.hover',
                          color: lead.status === 'won' ? 'success.dark' : lead.status === 'lost' ? 'error.dark' : 'text.primary',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={lead.priority}
                        size="small"
                        color={lead.priority === 'critical' ? 'error' : lead.priority === 'high' ? 'warning' : 'primary'}
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell fontWeight={700}>{formatCurrency(lead.expectedRevenue)}</TableCell>
                    <TableCell>{lead.assignedTo?.name || 'Unassigned'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color={lead.healthScore >= 70 ? 'success.main' : lead.healthScore >= 40 ? 'warning.main' : 'error.main'}>
                        {lead.healthScore}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={1}>
                        <Tooltip title="View Detailed Profile">
                          <IconButton size="small" color="secondary" href={`/leads/${lead._id}`}>
                            <ViewDetailsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {user?.role !== 'executive' && (
                          <Tooltip title="Delete Permanently">
                            <IconButton size="small" color="error" onClick={() => {
                              if (window.confirm('Are you sure you want to delete this lead?')) {
                                deleteLeadMutation.mutate(lead._id);
                              }
                            }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={leadsData?.total || 0}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </TableContainer>
      )}

      {/* ---------------- CREATE LEAD MODAL ---------------- */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>Create New Sales Opportunity</DialogTitle>
        <Divider />
        <form onSubmit={handleCreateSubmit}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Company Name"
                  fullWidth
                  required
                  value={newLead.companyName}
                  onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Person"
                  fullWidth
                  required
                  value={newLead.contactPerson}
                  onChange={(e) => setNewLead({ ...newLead, contactPerson: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Industry"
                  fullWidth
                  placeholder="e.g. Automotive, Aerospace"
                  value={newLead.industry}
                  onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Location"
                  fullWidth
                  placeholder="e.g. Detroit, MI"
                  value={newLead.location}
                  onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Lead Source</InputLabel>
                  <Select value={newLead.source} label="Lead Source" onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}>
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
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select value={newLead.priority} label="Priority" onChange={(e) => setNewLead({ ...newLead, priority: e.target.value })}>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Expected Revenue"
                  type="number"
                  fullWidth
                  value={newLead.expectedRevenue}
                  onChange={(e) => setNewLead({ ...newLead, expectedRevenue: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              {user?.role !== 'executive' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Assign Executive</InputLabel>
                    <Select value={newLead.assignedTo} label="Assign Executive" onChange={(e) => setNewLead({ ...newLead, assignedTo: e.target.value })}>
                      <MenuItem value="">Unassigned (Defaults to self if Executive)</MenuItem>
                      {teamList?.map((exec) => (
                        <MenuItem key={exec._id} value={exec._id}>
                          {exec.name} ({exec.role})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  label="Description / Initial Notes"
                  multiline
                  rows={3}
                  fullWidth
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setCreateOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={createLeadMutation.isPending}>
              Create opportunity
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* CSV Import Modal */}
      <CSVImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['leads'] });
          setImportOpen(false);
        }}
      />
    </Box>
  );
};

export default Leads;
