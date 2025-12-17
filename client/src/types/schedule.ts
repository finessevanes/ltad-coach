export interface ScheduleEvent {
  id: string;
  time: string; // "10:00"
  title: string;
  location?: string;
  duration?: number; // minutes
  participants?: string[]; // athlete IDs or names
  isLive?: boolean;
  type?: 'huddle' | 'session' | 'assessment' | 'meeting';
}
