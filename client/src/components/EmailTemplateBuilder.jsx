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
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import api from '../utils/api';
import toast from 'react-hot-toast';

const EmailTemplateBuilder = ({ leadId, leadEmail }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [templateData, setTemplateData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'general',
    variables: [],
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/emails/templates');
      setTemplates(response.data);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateData.name || !templateData.subject || !templateData.body) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      if (selectedTemplate) {
        await api.put(`/emails/templates/${selectedTemplate._id}`, templateData);
        toast.success('Template updated');
      } else {
        await api.post('/emails/templates', templateData);
        toast.success('Template saved');
      }
      setBuilderOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Delete this template?')) {
      try {
        await api.delete(`/emails/templates/${templateId}`);
        toast.success('Template deleted');
        fetchTemplates();
      } catch (error) {
        toast.error('Failed to delete template');
      }
    }
  };

  const handleSendEmail = async () => {
    try {
      let emailBody = selectedTemplate.body;
      const recipientEmail = leadEmail || '';

      // Replace variables with actual values
      const variables = {
        leadName: 'Lead Name',
        companyName: 'Company Name',
        dealAmount: '$0',
      };

      Object.entries(variables).forEach(([key, value]) => {
        emailBody = emailBody.replace(`{{${key}}}`, value);
      });

      await api.post(`/emails/log/${leadId}`, {
        templateId: selectedTemplate._id,
        subject: selectedTemplate.subject,
        body: emailBody,
        recipientEmail,
      });

      toast.success('Email logged successfully');
      setSendDialogOpen(false);
    } catch (error) {
      toast.error('Failed to log email');
    }
  };

  const resetForm = () => {
    setTemplateData({
      name: '',
      subject: '',
      body: '',
      category: 'general',
      variables: [],
    });
    setSelectedTemplate(null);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateData(template);
    setBuilderOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Email Communication
          </Typography>
          <Alert severity="info">
            Create, manage, and send professional email templates
          </Alert>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => {
              resetForm();
              setBuilderOpen(true);
            }}
          >
            Create Template
          </Button>
          {selectedTemplate && (
            <Button
              variant="contained"
              color="success"
              startIcon={<SendIcon />}
              onClick={() => setSendDialogOpen(true)}
            >
              Send Email
            </Button>
          )}
        </CardActions>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%' }}>
            <Typography variant="subtitle2" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
              Templates
            </Typography>
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {templates.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No templates yet" secondary="Create one to get started" />
                </ListItem>
              ) : (
                templates.map((template) => (
                  <ListItem
                    key={template._id}
                    secondaryAction={
                      <Box>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleDeleteTemplate(template._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemButton
                      onClick={() => setSelectedTemplate(template)}
                      selected={selectedTemplate?._id === template._id}
                    >
                      <ListItemText
                        primary={template.name}
                        secondary={template.category}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedTemplate && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Template Preview
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="caption" color="textSecondary">
                Category: <Chip label={selectedTemplate.category} size="small" />
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Subject:
              </Typography>
              <Paper variant="outlined" sx={{ p: 1, mb: 2, backgroundColor: '#f9f9f9' }}>
                <Typography variant="body2">{selectedTemplate.subject}</Typography>
              </Paper>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Body:
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  backgroundColor: '#f9f9f9',
                  minHeight: 200,
                  whiteSpace: 'pre-wrap',
                  overflow: 'auto',
                }}
              >
                <Typography variant="body2">{selectedTemplate.body}</Typography>
              </Paper>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Template Builder Dialog */}
      <Dialog open={builderOpen} onClose={() => setBuilderOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          {selectedTemplate ? 'Edit Template' : 'Create Email Template'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                placeholder="e.g., Follow-up Email"
                value={templateData.name}
                onChange={(e) =>
                  setTemplateData({ ...templateData, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={templateData.category}
                  label="Category"
                  onChange={(e) =>
                    setTemplateData({ ...templateData, category: e.target.value })
                  }
                >
                  {[
                    'follow_up',
                    'proposal',
                    'contract',
                    'negotiation',
                    'closing',
                    'general',
                  ].map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Subject"
                placeholder="Subject line"
                value={templateData.subject}
                onChange={(e) =>
                  setTemplateData({ ...templateData, subject: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Body"
                multiline
                rows={8}
                placeholder="Use {{variable}} for dynamic content"
                value={templateData.body}
                onChange={(e) =>
                  setTemplateData({ ...templateData, body: e.target.value })
                }
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Available variables: {{leadName}}, {{companyName}}, {{dealAmount}}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBuilderOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTemplate} variant="contained">
            {selectedTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Send Email</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Recipient Email"
            value={leadEmail}
            disabled
            sx={{ mb: 2 }}
          />
          <Alert severity="info">
            This will log the email to the lead's activity timeline
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSendEmail} variant="contained" color="success">
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailTemplateBuilder;
