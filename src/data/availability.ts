import { AvailabilitySlot } from '../types';
import { format, addDays } from 'date-fns';

// Helper to build a YYYY-MM-DD string relative to today
const dayOffset = (offset: number) => format(addDays(new Date(), offset), 'yyyy-MM-dd');

export const availabilitySlots: AvailabilitySlot[] = [
  { id: 'av1', userId: 'i1', date: dayOffset(1), startTime: '10:00', endTime: '10:30', isBooked: false },
  { id: 'av2', userId: 'i1', date: dayOffset(1), startTime: '11:00', endTime: '11:30', isBooked: true },
  { id: 'av3', userId: 'i1', date: dayOffset(3), startTime: '14:00', endTime: '14:30', isBooked: false },
  { id: 'av4', userId: 'i2', date: dayOffset(2), startTime: '09:00', endTime: '09:30', isBooked: false },
  { id: 'av5', userId: 'e1', date: dayOffset(1), startTime: '11:00', endTime: '11:30', isBooked: true },
  { id: 'av6', userId: 'e1', date: dayOffset(4), startTime: '15:00', endTime: '15:30', isBooked: false },
];

// Get all availability slots belonging to a user, sorted by date/time
export const getAvailabilityForUser = (userId: string): AvailabilitySlot[] => {
  return availabilitySlots
    .filter(slot => slot.userId === userId)
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
};

// Get only the open (not booked) slots for a user - useful when another user wants to book time
export const getOpenSlotsForUser = (userId: string): AvailabilitySlot[] => {
  return getAvailabilityForUser(userId).filter(slot => !slot.isBooked);
};

// Add a new availability slot
export const addAvailabilitySlot = (
  userId: string,
  date: string,
  startTime: string,
  endTime: string
): AvailabilitySlot => {
  const newSlot: AvailabilitySlot = {
    id: `av${availabilitySlots.length + 1}-${Date.now()}`,
    userId,
    date,
    startTime,
    endTime,
    isBooked: false,
  };
  availabilitySlots.push(newSlot);
  return newSlot;
};

// Remove an availability slot (only if it isn't already booked)
export const removeAvailabilitySlot = (slotId: string): boolean => {
  const index = availabilitySlots.findIndex(slot => slot.id === slotId);
  if (index === -1 || availabilitySlots[index].isBooked) return false;
  availabilitySlots.splice(index, 1);
  return true;
};

// Mark a slot as booked/unbooked
export const setSlotBooked = (slotId: string, isBooked: boolean): void => {
  const slot = availabilitySlots.find(s => s.id === slotId);
  if (slot) slot.isBooked = isBooked;
};

export const findSlotById = (slotId: string): AvailabilitySlot | undefined => {
  return availabilitySlots.find(slot => slot.id === slotId);
};
