import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CSVImportModal = ({ open, onClose, onImportSuccess }) => {
  const [step, setStep] = useState(0);
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    companyName: 0,
    contactPerson: 1,
    email: 2,
    phone: 3,
    industry: 4,
    location: 5,
    source: 6,
    priority: 7,
    expectedRevenue: 8,
  });

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split('\n').map((row) => row.split(','));
      setCsvData(rows.slice(1)); // Skip header
      setStep(1);
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (field, colIndex) => {
    setColumnMapping({ ...columnMapping, [field]: colIndex });
  };

  const validateAndImport = async () => {
    setLoading(true);
    setErrors([]);

    try {
      const leads = csvData.map((row, idx) => {
        const lead = {
          companyName: row[columnMapping.companyName]?.trim(),
          contactPerson: row[columnMapping.contactPerson]?.trim(),
          email: row[columnMapping.email]?.trim(),
          phone: row[columnMapping.phone]?.trim() || '',
          industry: row[columnMapping.industry]?.trim() || '',
          location: row[columnMapping.location]?.trim() || '',
          source: row[columnMapping.source]?.trim() || 'Other',
          priority: row[columnMapping.priority]?.trim() || 'medium',
          expectedRevenue: parseFloat(row[columnMapping.expectedRevenue]) || 0,
        };

        // Validation
        const rowErrors = [];
        if (!lead.companyName) rowErrors.push('Company name required');
        if (!lead.contactPerson) rowErrors.push('Contact person required');
        if (!lead.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email))
          rowErrors.push('Valid email required');

        if (rowErrors.length > 0) {
          setErrors((prev) => [
            ...prev,
            { row: idx + 1, messages: rowErrors },
          ]);
        }

        return lead;
      });

      if (errors.length > 0) {
        toast.error(`${errors.length} rows have validation errors`);
        setStep(2);
        return;
      }

      // Send to backend
      const response = await api.post('/leads/import', { leads });
      toast.success(`Successfully imported ${leads.length} leads`);
      onImportSuccess?.();
      handleClose();
    } catch (error) {
      toast.error('Import failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setCsvData([]);
    setErrors([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Import Leads from CSV</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mt: 2 }}>
          <Step>
            <StepLabel>Upload CSV</StepLabel>
          </Step>
          <Step>
            <StepLabel>Map Columns</StepLabel>
          </Step>
          <Step>
            <StepLabel>Preview & Confirm</StepLabel>
          </Step>
        </Stepper>

        <Box sx={{ mt: 3 }}>
          {step === 0 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <input
                hidden
                accept=".csv"
                type="file"
                id="csv-upload"
                onChange={handleFileUpload}
              />
              <label htmlFor="csv-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<UploadIcon />}
                >
                  Upload CSV File
                </Button>
              </label>
              <Alert severity="info" sx={{ mt: 2 }}>
                CSV should contain columns: Company Name, Contact Person, Email,
                Phone, Industry, Location, Source, Priority, Expected Revenue
              </Alert>
            </Box>
          )}

          {step === 1 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {Object.keys(columnMapping).map((field) => (
                <FormControl key={field} size="small">
                  <InputLabel>{field}</InputLabel>
                  <Select
                    value={columnMapping[field]}
                    label={field}
                    onChange={(e) => handleMappingChange(field, e.target.value)}
                  >
                    {csvData[0]?.map((_, idx) => (
                      <MenuItem key={idx} value={idx}>
                        Column {idx + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </Box>
          )}

          {step === 2 && (
            <Box>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Company</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {csvData.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {row[columnMapping.companyName]}
                        </TableCell>
                        <TableCell>
                          {row[columnMapping.contactPerson]}
                        </TableCell>
                        <TableCell>{row[columnMapping.email]}</TableCell>
                        <TableCell>
                          <Chip
                            label="Valid"
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {csvData.length > 5 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Showing first 5 of {csvData.length} rows
                </Alert>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {step === 0 && csvData.length > 0 && (
          <Button
            onClick={() => setStep(1)}
            variant="contained"
            disabled={loading}
          >
            Next
          </Button>
        )}
        {step === 1 && (
          <>
            <Button onClick={() => setStep(0)}>Back</Button>
            <Button
              onClick={() => setStep(2)}
              variant="contained"
              disabled={loading}
            >
              Preview
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <Button onClick={() => setStep(1)}>Back</Button>
            <Button
              onClick={validateAndImport}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Import'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CSVImportModal;
