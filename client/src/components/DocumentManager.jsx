import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Avatar,
  Grid,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  CloudUpload as UploadIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import api from '../utils/api';
import toast from 'react-hot-toast';

const DocumentManager = ({ leadId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploadData, setUploadData] = useState({
    fileUrl: '',
    fileName: '',
    fileType: '',
    documentType: 'other',
    description: '',
  });
  const [shareData, setShareData] = useState({
    userId: '',
    permission: 'view',
  });

  useEffect(() => {
    if (leadId) {
      fetchDocuments();
    }
  }, [leadId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/files/${leadId}`);
      setDocuments(response.data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadData.fileName || !uploadData.fileUrl) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      await api.post(`/files/upload/${leadId}`, uploadData);
      toast.success('Document uploaded successfully');
      setUploadDialogOpen(false);
      setUploadData({
        fileUrl: '',
        fileName: '',
        fileType: '',
        documentType: 'other',
        description: '',
      });
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  const handleShareDocument = async () => {
    if (!shareData.userId) {
      toast.error('Please select a team member');
      return;
    }

    try {
      await api.post(`/files/document/${selectedDoc._id}/share`, shareData);
      toast.success('Document shared successfully');
      setShareDialogOpen(false);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to share document');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/files/document/${docId}`);
        toast.success('Document deleted');
        fetchDocuments();
      } catch (error) {
        toast.error('Failed to delete document');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
            Document Management
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Upload and manage documents for this lead (proposals, contracts, invoices, etc.)
          </Alert>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Document
          </Button>
        </CardActions>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>File Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  No documents uploaded yet
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GetAppIcon fontSize="small" />
                      {doc.fileName}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doc.documentType}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={doc.uploadedBy?.avatar}
                        sx={{ width: 24, height: 24 }}
                      />
                      {doc.uploadedBy?.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setShareDialogOpen(true);
                      }}
                    >
                      <ShareIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteDocument(doc._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="File Name"
                value={uploadData.fileName}
                onChange={(e) =>
                  setUploadData({ ...uploadData, fileName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="File URL"
                placeholder="https://..."
                value={uploadData.fileUrl}
                onChange={(e) =>
                  setUploadData({ ...uploadData, fileUrl: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={uploadData.documentType}
                  label="Document Type"
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      documentType: e.target.value,
                    })
                  }
                >
                  {[
                    'proposal',
                    'contract',
                    'quotation',
                    'invoice',
                    'report',
                    'other',
                  ].map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={uploadData.description}
                onChange={(e) =>
                  setUploadData({ ...uploadData, description: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUploadDocument} variant="contained">
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Share Document: {selectedDoc?.fileName}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Team Member ID"
                value={shareData.userId}
                onChange={(e) =>
                  setShareData({ ...shareData, userId: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Permission Level</InputLabel>
                <Select
                  value={shareData.permission}
                  label="Permission Level"
                  onChange={(e) =>
                    setShareData({ ...shareData, permission: e.target.value })
                  }
                >
                  {['view', 'edit', 'download'].map((perm) => (
                    <MenuItem key={perm} value={perm}>
                      {perm}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleShareDocument} variant="contained">
            Share
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentManager;
