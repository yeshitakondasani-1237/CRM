import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Assessment as ReportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  PlayArrow as GenerateIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const Reports = () => {
  const queryClient = useQueryClient();

  // Form States
  const [type, setType] = useState('lead');
  const [title, setTitle] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '' });

  // Currently generated report state
  const [generatedReport, setGeneratedReport] = useState(null);

  // ---------------- QUERY HISTORIES ----------------
  const { data: reportsHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['reportsHistory'],
    queryFn: async () => {
      const { data } = await api.get('/api/reports');
      return data;
    }
  });

  // ---------------- GENERATION MUTATION ----------------
  const generateReportMutation = useMutation({
    mutationFn: async (reportParams) => {
      const { data } = await api.post('/api/reports', reportParams);
      return data;
    },
    onSuccess: (data) => {
      setGeneratedReport(data);
      queryClient.invalidateQueries({ queryKey: ['reportsHistory'] });
      toast.success('Report generated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    }
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    const finalTitle = title || `${type.charAt(0).toUpperCase() + type.slice(1)} Summary Report - ${dayjs().format('MMM YYYY')}`;
    generateReportMutation.mutate({
      type,
      title: finalTitle,
      filters: type === 'lead' ? filters : undefined
    });
  };

  // ---------------- DOWNLOAD EXCEL ----------------
  const downloadExcel = () => {
    if (!generatedReport) return;
    const { type: reportType, data: reportData, title: reportTitle } = generatedReport;

    let sheetData = [];
    if (reportType === 'lead') {
      sheetData = reportData.leads || [];
    } else if (reportType === 'revenue') {
      sheetData = Object.entries(reportData.stageBreakdown || {}).map(([stage, rev]) => ({
        Stage: stage.toUpperCase(),
        Revenue: rev
      }));
    } else if (reportType === 'performance') {
      sheetData = reportData.metrics || [];
    }

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
    XLSX.writeFile(wb, `${reportTitle.replace(/ /g, '_')}.xlsx`);
    toast.success('Excel spreadsheet downloaded');
  };

  // ---------------- DOWNLOAD PDF ----------------
  const downloadPDF = () => {
    if (!generatedReport) return;
    const { type: reportType, data: reportData, title: reportTitle } = generatedReport;

    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Manufacturing BDA CRM Report', 14, 20);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Title: ${reportTitle}`, 14, 28);
    doc.text(`Generated On: ${dayjs().format('MMM DD, YYYY hh:mm A')}`, 14, 34);
    doc.text(`Report Category: ${reportType.toUpperCase()}`, 14, 40);

    doc.setDrawColor(220, 220, 220);
    doc.line(14, 45, 196, 45);

    if (reportType === 'lead') {
      // Leads Summary
      doc.text(`Total Opportunities Evaluated: ${reportData.totalLeads}`, 14, 52);
      doc.text(`Deals Converted (Won): ${reportData.wonLeads}`, 14, 58);
      doc.text(`Deals Lost: ${reportData.lostLeads}`, 14, 64);
      doc.text(`Active Pipelines: ${reportData.activeLeads}`, 14, 70);

      const headers = [['Company Name', 'Contact Person', 'Stage', 'Priority', 'Expected Value', 'Owner']];
      const body = (reportData.leads || []).map(l => [
        l.companyName,
        l.contactPerson,
        l.status.toUpperCase(),
        l.priority.toUpperCase(),
        formatCurrency(l.expectedRevenue),
        l.assignedTo
      ]);

      doc.autoTable({
        startY: 76,
        head: headers,
        body: body,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 23, 42] }
      });

    } else if (reportType === 'revenue') {
      // Revenue Summary
      doc.text(`Total Expected Value of Pipeline: ${formatCurrency(reportData.expectedRevenueTotal)}`, 14, 52);
      doc.text(`Closed Secured Revenue Total: ${formatCurrency(reportData.closedRevenueTotal)}`, 14, 58);

      const headers = [['Pipeline Status Stage', 'Accumulated Value']];
      const body = Object.entries(reportData.stageBreakdown || {}).map(([stage, rev]) => [
        stage.toUpperCase(),
        formatCurrency(rev)
      ]);

      doc.autoTable({
        startY: 65,
        head: headers,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }
      });

    } else if (reportType === 'performance') {
      // Performance metrics
      doc.text(`Sales Executives Evaluated: ${reportData.executivesCount}`, 14, 52);

      const headers = [['Name', 'Department', 'Leads Assigned', 'Won', 'Lost', 'Conversion', 'Revenue Closed']];
      const body = (reportData.metrics || []).map(m => [
        m.name,
        m.department,
        m.leadsAssigned,
        m.dealsWon,
        m.dealsLost,
        `${m.conversionRate}%`,
        formatCurrency(m.revenueGenerated)
      ]);

      doc.autoTable({
        startY: 58,
        head: headers,
        body: body,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 23, 42] }
      });
    }

    doc.save(`${reportTitle.replace(/ /g, '_')}.pdf`);
    toast.success('PDF document downloaded');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ---------------- HEADER BAR ---------------- */}
      <Box mb={4} display="flex" alignItems="center" gap={2}>
        <ReportIcon color="secondary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h3" fontWeight={800} fontFamily="Outfit" gutterBottom>
            Reports Workspace
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure, generate, and export performance spreadsheets or PDFs
          </Typography>
        </Box>
      </Box>

      {/* ---------------- CONFIGURATION BUILDER GRID ---------------- */}
      <Grid container spacing={3} mb={4}>
        {/* Report Builder Form */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" fontWeight={700} fontFamily="Outfit" mb={3}>
                Report Settings
              </Typography>
              <form onSubmit={handleGenerate}>
                <Box display="flex" flexDirection="column" gap={2.5}>
                  <FormControl fullWidth>
                    <InputLabel>Report Type</InputLabel>
                    <Select value={type} label="Report Type" onChange={(e) => setType(e.target.value)}>
                      <MenuItem value="lead">Lead Analytics Report</MenuItem>
                      <MenuItem value="revenue">Revenue Breakdown Report</MenuItem>
                      <MenuItem value="performance">Executive Performance Report</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Custom Report Title"
                    placeholder="e.g. Sales Pipeline Audit Q2"
                    fullWidth
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  {type === 'lead' && (
                    <>
                      <FormControl fullWidth>
                        <InputLabel>Filter by Status</InputLabel>
                        <Select
                          value={filters.status}
                          label="Filter by Status"
                          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                          <MenuItem value="">All Stages</MenuItem>
                          <MenuItem value="lead">Lead</MenuItem>
                          <MenuItem value="contacted">Contacted</MenuItem>
                          <MenuItem value="qualified">Qualified</MenuItem>
                          <MenuItem value="proposal_sent">Proposal Sent</MenuItem>
                          <MenuItem value="negotiation">Negotiation</MenuItem>
                          <MenuItem value="won">Won</MenuItem>
                          <MenuItem value="lost">Lost</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel>Filter by Priority</InputLabel>
                        <Select
                          value={filters.priority}
                          label="Filter by Priority"
                          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        >
                          <MenuItem value="">All Priorities</MenuItem>
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="critical">Critical</MenuItem>
                        </Select>
                      </FormControl>
                    </>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    startIcon={<GenerateIcon />}
                    fullWidth
                    disabled={generateReportMutation.isPending}
                    sx={{ py: 1.2 }}
                  >
                    {generateReportMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Generate report'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Report Output Preview Pane */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', minHeight: 300, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
                <Typography variant="h5" fontWeight={700} fontFamily="Outfit">
                  Report Preview Pane
                </Typography>
                {generatedReport && (
                  <Box display="flex" gap={1.5}>
                    <Button variant="outlined" color="error" startIcon={<PdfIcon />} onClick={downloadPDF}>
                      Export PDF
                    </Button>
                    <Button variant="outlined" color="success" startIcon={<ExcelIcon />} onClick={downloadExcel}>
                      Export Excel
                    </Button>
                  </Box>
                )}
              </Box>
              <Divider sx={{ mb: 3 }} />

              {/* Preview Body */}
              {!generatedReport ? (
                <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1} height="100%">
                  <Typography variant="body1" color="text.secondary">
                    Configure settings and click "Generate Report" to view analytics preview.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={2}>
                    {generatedReport.title}
                  </Typography>

                  {/* Summary Metric Cards */}
                  {generatedReport.type === 'lead' && (
                    <Box mb={3}>
                      <Grid container spacing={2}>
                        {[
                          { l: 'Total Evaluated', v: generatedReport.data.totalLeads },
                          { l: 'Deals Won', v: generatedReport.data.wonLeads },
                          { l: 'Deals Lost', v: generatedReport.data.lostLeads },
                          { l: 'Active Opportunities', v: generatedReport.data.activeLeads }
                        ].map((s, i) => (
                          <Grid item xs={6} sm={3} key={i}>
                            <Box p={1.5} sx={{ bgcolor: 'action.hover', borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                              <Typography variant="caption" color="text.secondary" display="block">{s.l}</Typography>
                              <Typography variant="body1" fontWeight={700}>{s.v}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {generatedReport.type === 'revenue' && (
                    <Box mb={3}>
                      <Grid container spacing={2}>
                        {[
                          { l: 'Total Pipeline Value', v: formatCurrency(generatedReport.data.expectedRevenueTotal) },
                          { l: 'Closed Secured Value', v: formatCurrency(generatedReport.data.closedRevenueTotal) }
                        ].map((s, i) => (
                          <Grid item xs={12} sm={6} key={i}>
                            <Box p={2} sx={{ bgcolor: 'action.hover', borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                              <Typography variant="caption" color="text.secondary" display="block">{s.l}</Typography>
                              <Typography variant="h5" fontWeight={700} color="secondary.main">{s.v}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {generatedReport.type === 'performance' && (
                    <Box mb={3}>
                      <Grid container spacing={2}>
                        {[
                          { l: 'Executives Benchmarked', v: generatedReport.data.executivesCount }
                        ].map((s, i) => (
                          <Grid item xs={12} key={i}>
                            <Box p={2} sx={{ bgcolor: 'action.hover', borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                              <Typography variant="caption" color="text.secondary" display="block">{s.l}</Typography>
                              <Typography variant="h5" fontWeight={700}>{s.v} BDA Team Members</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Previewing generated records</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>Only displaying up to 5 entries for preview. Download complete document to view all rows.</Typography>

                  {/* Tiny Table Preview (Truncated to 5 entries) */}
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        {generatedReport.type === 'lead' && (
                          <TableRow>
                            <TableCell>Company</TableCell>
                            <TableCell>Stage</TableCell>
                            <TableCell>Expected Rev</TableCell>
                          </TableRow>
                        )}
                        {generatedReport.type === 'revenue' && (
                          <TableRow>
                            <TableCell>Stage</TableCell>
                            <TableCell>Pipeline Value</TableCell>
                          </TableRow>
                        )}
                        {generatedReport.type === 'performance' && (
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Conversion %</TableCell>
                            <TableCell>Closed Rev</TableCell>
                          </TableRow>
                        )}
                      </TableHead>
                      <TableBody>
                        {generatedReport.type === 'lead' && (
                          generatedReport.data.leads?.slice(0, 5).map((l, i) => (
                            <TableRow key={i}>
                              <TableCell>{l.companyName}</TableCell>
                              <TableCell sx={{ textTransform: 'capitalize' }}>{l.status}</TableCell>
                              <TableCell>{formatCurrency(l.expectedRevenue)}</TableCell>
                            </TableRow>
                          ))
                        )}
                        {generatedReport.type === 'revenue' && (
                          Object.entries(generatedReport.data.stageBreakdown || {}).slice(0, 5).map(([stage, rev], i) => (
                            <TableRow key={i}>
                              <TableCell sx={{ textTransform: 'capitalize' }}>{stage}</TableCell>
                              <TableCell>{formatCurrency(rev)}</TableCell>
                            </TableRow>
                          ))
                        )}
                        {generatedReport.type === 'performance' && (
                          generatedReport.data.metrics?.slice(0, 5).map((m, i) => (
                            <TableRow key={i}>
                              <TableCell>{m.name}</TableCell>
                              <TableCell>{m.conversionRate}%</TableCell>
                              <TableCell>{formatCurrency(m.revenueGenerated)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ---------------- REPORTS GENERATION HISTORY ---------------- */}
      <Box mb={3} display="flex" alignItems="center" gap={1.5}>
        <HistoryIcon color="action" />
        <Typography variant="h5" fontWeight={700} fontFamily="Outfit">
          Report Audit Logs
        </Typography>
      </Box>

      {historyLoading ? (
        <CircularProgress size={24} />
      ) : (
        <Card sx={{ border: 'none', boxShadow: 'none' }}>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Title</TableCell>
                  <TableCell>Report Category</TableCell>
                  <TableCell>Generated By</TableCell>
                  <TableCell>Generated On</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportsHistory?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No report history audit logs found.</TableCell>
                  </TableRow>
                ) : (
                  reportsHistory?.map((rep) => (
                    <TableRow key={rep._id}>
                      <TableCell fontWeight={600}>{rep.title}</TableCell>
                      <TableCell sx={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{rep.type}</TableCell>
                      <TableCell>{rep.generatedBy?.name || 'System'}</TableCell>
                      <TableCell>{dayjs(rep.createdAt).format('MMM DD, YYYY hh:mm A')}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          color="secondary"
                          onClick={() => {
                            setGeneratedReport(rep);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Load Preview
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
};

export default Reports;
