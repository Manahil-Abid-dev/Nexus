import { MeetingRequest, MeetingStatus } from '../types';
import { format, addDays } from 'date-fns';
import { setSlotBooked, findSlotById } from './availability';

const dayOffset = (offset: number) => format(addDays(new Date(), offset), 'yyyy-MM-dd');

export const meetingRequests: MeetingRequest[] = [
  {
    id: 'mtg1',
    requesterId: 'i1',
    hostId: 'e1',
    slotId: 'av5',
    date: dayOffset(1),
    startTime: '11:00',
    endTime: '11:30',
    topic: 'Discuss Series A terms for TechWave AI',
    status: 'accepted',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mtg2',
    requesterId: 'e2',
    hostId: 'i1',
    slotId: 'av2',
    date: dayOffset(1),
    startTime: '10:00',
    endTime: '10:30',
    topic: 'Pitch GreenLife Solutions expansion plan',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

// Get all meetings (sent or received) involving a user, sorted by date/time
export const getMeetingsForUser = (userId: string): MeetingRequest[] => {
  return meetingRequests
    .filter(m => m.requesterId === userId || m.hostId === userId)
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
};

// Meeting requests a user needs to respond to (they are the host)
export const getIncomingRequestsForUser = (userId: string): MeetingRequest[] => {
  return getMeetingsForUser(userId).filter(m => m.hostId === userId && m.status === 'pending');
};

// Meetings a user has sent that are still pending
export const getSentRequestsForUser = (userId: string): MeetingRequest[] => {
  return getMeetingsForUser(userId).filter(m => m.requesterId === userId && m.status === 'pending');
};

// Confirmed (accepted) upcoming meetings for a user - used on the dashboard
export const getConfirmedMeetingsForUser = (userId: string): MeetingRequest[] => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return getMeetingsForUser(userId).filter(m => m.status === 'accepted' && m.date >= today);
};

// Create a new meeting request against another user's open slot
export const createMeetingRequest = (
  requesterId: string,
  hostId: string,
  slotId: string,
  topic: string
): MeetingRequest | null => {
  const slot = findSlotById(slotId);
  if (!slot || slot.isBooked) return null;

  const newRequest: MeetingRequest = {
    id: `mtg${meetingRequests.length + 1}-${Date.now()}`,
    requesterId,
    hostId,
    slotId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    topic,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  meetingRequests.push(newRequest);
  return newRequest;
};

// Accept/decline/cancel a meeting request
export const updateMeetingStatus = (meetingId: string, status: MeetingStatus): MeetingRequest | null => {
  const meeting = meetingRequests.find(m => m.id === meetingId);
  if (!meeting) return null;

  meeting.status = status;

  // Free up or lock the underlying slot depending on the new status
  if (status === 'accepted') {
    setSlotBooked(meeting.slotId, true);
  } else if (status === 'declined' || status === 'cancelled') {
    setSlotBooked(meeting.slotId, false);
  }

  return meeting;
};
