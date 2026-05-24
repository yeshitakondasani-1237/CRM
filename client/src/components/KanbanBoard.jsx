import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import {
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
  useTheme,
  Grid
} from '@mui/material';
import LeadCard from './LeadCard.jsx';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val || 0);
};

// Droppable Column Component
const KanbanColumn = ({ status, title, leads, color }) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const theme = useTheme();
  const totalValue = leads.reduce((sum, lead) => sum + (lead.expectedRevenue || 0), 0);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        bgcolor: theme.palette.mode === 'light' ? '#f1f5f9' : '#0b0f19',
        borderRadius: 3,
        p: 2,
        height: '100%',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={10} height={10} borderRadius="50%" bgcolor={color} />
          <Typography variant="subtitle1" fontWeight={700} fontFamily="Outfit">
            {title}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ bgcolor: theme.palette.divider, px: 1, py: 0.5, borderRadius: 1.5, fontWeight: 700 }}>
          {leads.length}
        </Typography>
      </Box>

      {/* Pipeline Value */}
      <Box mb={2} px={1.5} py={0.8} sx={{ bgcolor: theme.palette.background.paper, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          Pipeline Value
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          {formatCurrency(totalValue)}
        </Typography>
      </Box>

      {/* Cards Scroll Container */}
      <Box
        className="kanban-column-scroll"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
        }}
      >
        {leads.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 100,
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary">Drop leads here</Typography>
          </Box>
        ) : (
          leads.map((lead) => <LeadCard key={lead._id} lead={lead} />)
        )}
      </Box>
    </Box>
  );
};

const KanbanBoard = ({ leads = [] }) => {
  const queryClient = useQueryClient();

  const stages = [
    { status: 'lead', title: 'Lead', color: '#64748b' },
    { status: 'contacted', title: 'Contacted', color: '#0ea5e9' },
    { status: 'qualified', title: 'Qualified', color: '#a855f7' },
    { status: 'proposal_sent', title: 'Proposal Sent', color: '#eab308' },
    { status: 'negotiation', title: 'Negotiation', color: '#3b82f6' },
    { status: 'won', title: 'Won', color: '#10b981' },
    { status: 'lost', title: 'Lost', color: '#ef4444' }
  ];

  // Drag sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px drag movement to start dragging. This allows clicking buttons inside cards.
      },
    })
  );

  // Mongoose Lead Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.put(`/api/leads/${id}`, { status });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardCharts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardWidgets'] });
      queryClient.invalidateQueries({ queryKey: ['smartRecommendations'] });
      toast.success(`Pipeline updated: Stage set to '${data.status.replace('_', ' ')}'`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update pipeline stage');
    }
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeLeadId = active.id;
    const destinationStatus = over.id;

    // Find the lead being moved
    const draggedLead = leads.find((l) => l._id === activeLeadId);
    
    // Only call api if status actually changed
    if (draggedLead && draggedLead.status !== destinationStatus) {
      updateStatusMutation.mutate({ id: activeLeadId, status: destinationStatus });
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Grid container spacing={2} sx={{ overflowX: 'auto', flexWrap: { xs: 'wrap', lg: 'nowrap' }, minWidth: { lg: 1200 } }}>
        {stages.map((stage) => {
          const filteredLeads = leads.filter((l) => l.status === stage.status);
          return (
            <Grid item xs={12} sm={6} md={3} lg={true} key={stage.status} sx={{ minWidth: { lg: 180 } }}>
              <KanbanColumn
                status={stage.status}
                title={stage.title}
                leads={filteredLeads}
                color={stage.color}
              />
            </Grid>
          );
        })}
      </Grid>
    </DndContext>
  );
};

export default KanbanBoard;
