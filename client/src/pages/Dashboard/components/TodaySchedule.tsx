import {
  Box,
  Typography,
  Avatar,
  AvatarGroup,
  Chip,
  Skeleton,
} from '@mui/material';
import { ScheduleEvent } from '../../../types/schedule';

interface TodayScheduleProps {
  events?: ScheduleEvent[];
  loading?: boolean;
}

// Mock data for now - in real app, this would come from API
const getMockEvents = (): ScheduleEvent[] => {
  return [
    {
      id: '1',
      time: '08:00',
      title: 'Morning Huddle',
      location: 'Conf. Room A',
      duration: 15,
      type: 'huddle',
      isLive: false,
    },
    {
      id: '2',
      time: '15:00',
      title: 'New Athlete Assessment',
      location: 'Training Facility',
      duration: 45,
      type: 'assessment',
      isLive: false,
    },
  ];
};

export function TodaySchedule({ events = getMockEvents(), loading = false }: TodayScheduleProps) {
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dayOfMonth = today.getDate();

  if (loading) {
    return (
      <Box sx={{ height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            pb: 1.5,
            borderBottom: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Skeleton variant="text" width={100} height={24} />
          <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 0.5 }} />
        </Box>
        <Box
          sx={{
            p: 3,
            bgcolor: 'white',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          }}
        >
          {[1, 2].map((i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Skeleton variant="text" width={50} height={20} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%' }}>
      {/* Header with divider */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '1.125rem',
            color: '#2D2D2D',
          }}
        >
          Today
        </Typography>
        <Chip
          label={`${dayOfWeek} ${dayOfMonth}`}
          size="small"
          sx={{
            backgroundColor: '#000',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.7rem',
            height: 24,
            borderRadius: 0.5,
          }}
        />
      </Box>

      {/* Event List Container */}
      <Box
        sx={{
          p: 3,
          bgcolor: 'white',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'grey.200',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {events.map((event, index) => {
            const isPast = index === 0;

            return (
              <Box key={event.id}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: isPast ? 'grey.400' : 'text.secondary',
                    display: 'block',
                    mb: 1,
                  }}
                >
                  {event.time}
                </Typography>

                <Box
                  sx={{
                    backgroundColor: event.isLive ? '#000' : '#F5F5F5',
                    color: event.isLive ? '#fff' : 'text.primary',
                    borderRadius: 1,
                    p: 2,
                    position: 'relative',
                    border: event.isLive ? 'none' : '1px solid',
                    borderColor: 'grey.200',
                    opacity: isPast ? 0.5 : 1,
                  }}
                >
                  {event.isLive && (
                    <Chip
                      label="LIVE"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: '#D4FF00',
                        color: '#000',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 20,
                      }}
                    />
                  )}

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      mb: 0.5,
                      pr: event.isLive ? 6 : 0,
                    }}
                  >
                    {event.title}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: event.isLive ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                      fontSize: '0.75rem',
                      display: 'block',
                      mb: event.participants ? 1.5 : 0,
                    }}
                  >
                    {event.location}
                    {event.duration && ` • ${event.duration} min`}
                  </Typography>

                  {event.participants && event.participants.length > 0 && (
                    <AvatarGroup
                      max={5}
                      sx={{
                        '& .MuiAvatar-root': {
                          width: 28,
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: event.isLive ? '#D4FF00' : 'primary.main',
                          color: event.isLive ? '#000' : '#fff',
                          border: event.isLive
                            ? '2px solid #000'
                            : '2px solid #F5F5F5',
                        },
                      }}
                    >
                      {event.participants.map((participant, idx) => (
                        <Avatar key={idx}>{participant.charAt(0)}</Avatar>
                      ))}
                    </AvatarGroup>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Empty State */}
        {events.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', py: 4 }}
          >
            No events scheduled for today
          </Typography>
        )}
      </Box>
    </Box>
  );
}
