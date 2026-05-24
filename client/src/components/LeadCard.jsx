import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Launch as ViewIcon,
  Shield as HealthIcon
} from '@mui/icons-material';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const getHealthColor = (score) => {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'error';
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'primary';
    default: return 'default';
  }
};

const LeadCard = ({ lead }) => {
  const navigate = useNavigate();

  // Drag and Drop Hook
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead._id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: 1,
        touchAction: 'none',
        '&:hover': {
          boxShadow: 3,
          borderColor: 'secondary.main',
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} fontFamily="Outfit" sx={{ lineHeight: 1.2 }}>
              {lead.companyName}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {lead.contactPerson}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag trigger when clicking link
            onClick={() => navigate(`/leads/${lead._id}`)}
          >
            <ViewIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="body2" fontWeight={600} color="secondary.main">
            {formatCurrency(lead.expectedRevenue)}
          </Typography>
          
          <Box display="flex" gap={0.5}>
            <Chip
              label={lead.priority}
              size="small"
              color={getPriorityColor(lead.priority)}
              sx={{ height: 18, fontSize: '0.65rem', textTransform: 'capitalize' }}
            />
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={0.5}>
            <HealthIcon color={getHealthColor(lead.healthScore)} sx={{ fontSize: 16 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Health: {lead.healthScore}%
            </Typography>
          </Box>
          <Tooltip title={lead.assignedTo?.name || 'Unassigned'}>
            <Avatar
              src={lead.assignedTo?.avatar}
              alt={lead.assignedTo?.name}
              sx={{ width: 24, height: 24, fontSize: '0.65rem' }}
            >
              {lead.assignedTo?.name?.charAt(0)}
            </Avatar>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LeadCard;
