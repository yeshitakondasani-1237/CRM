import React from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  Chip,
  useTheme
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Groups as MeetingIcon,
  SyncAlt as StageIcon,
  NoteAlt as NoteIcon,
  Schedule as TimeIcon
} from '@mui/icons-material';

const getActivityIcon = (type) => {
  switch (type) {
    case 'call': return <PhoneIcon fontSize="small" sx={{ color: 'white' }} />;
    case 'email': return <EmailIcon fontSize="small" sx={{ color: 'white' }} />;
    case 'meeting': return <MeetingIcon fontSize="small" sx={{ color: 'white' }} />;
    case 'status_change': return <StageIcon fontSize="small" sx={{ color: 'white' }} />;
    default: return <NoteIcon fontSize="small" sx={{ color: 'white' }} />;
  }
};

const getActivityBgColor = (type, theme) => {
  switch (type) {
    case 'call': return theme.palette.success.main;
    case 'email': return theme.palette.info.main;
    case 'meeting': return theme.palette.secondary.main;
    case 'status_change': return theme.palette.warning.main;
    default: return theme.palette.text.secondary;
  }
};

const ActivityTimeline = ({ activities = [] }) => {
  const theme = useTheme();

  if (activities.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body2" color="text.secondary">No activities logged yet.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', pl: 4, py: 1 }}>
      {/* Central Line */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 15,
          width: 2,
          bgcolor: theme.palette.divider,
        }}
      />

      {/* Activity Loop */}
      {activities.map((activity, index) => (
        <Box key={activity._id || index} sx={{ position: 'relative', mb: 3 }}>
          {/* Timeline Dot (Icon inside circle) */}
          <Box
            sx={{
              position: 'absolute',
              left: -32,
              top: 4,
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: getActivityBgColor(activity.type, theme),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 2,
              zIndex: 1,
            }}
          >
            {getActivityIcon(activity.type)}
          </Box>

          {/* Activity Details Card */}
          <Card
            sx={{
              ml: 1,
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                boxShadow: 2,
              },
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" mb={1} gap={1}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar
                    src={activity.user?.avatar}
                    alt={activity.user?.name}
                    sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                  >
                    {activity.user?.name?.charAt(0)}
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {activity.title}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  {activity.duration && (
                    <Chip
                      icon={<TimeIcon style={{ fontSize: 13 }} />}
                      label={`${activity.duration} mins`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  )}
                  {activity.outcome && (
                    <Chip
                      label={activity.outcome}
                      size="small"
                      color={activity.outcome === 'Completed' ? 'success' : 'default'}
                      sx={{ fontSize: '0.7rem', height: 20, textTransform: 'capitalize' }}
                    />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(activity.createdAt).format('MMM DD, YYYY hh:mm A')}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', pl: 1 }}>
                {activity.description}
              </Typography>
              
              <Box mt={1} pl={1} display="flex" justifyContent="flex-start" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Logged by: <strong>{activity.user?.name || 'System'}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
};

export default ActivityTimeline;
