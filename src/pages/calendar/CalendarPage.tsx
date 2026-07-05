import React, { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Plus, Trash2, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { MeetingRequestCard } from '../../components/calendar/MeetingRequestCard';
import { useAuth } from '../../context/AuthContext';
import {
  getAvailabilityForUser,
  addAvailabilitySlot,
  removeAvailabilitySlot,
} from '../../data/availability';
import {
  getMeetingsForUser,
  getIncomingRequestsForUser,
  getSentRequestsForUser,
} from '../../data/meetings';

type ValuePiece = Date | null;
type CalendarValue = ValuePiece | [ValuePiece, ValuePiece];

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [refreshKey, setRefreshKey] = useState(0);

  const bump = () => setRefreshKey(k => k + 1);

  const mySlots = useMemo(
    () => (user ? getAvailabilityForUser(user.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, refreshKey]
  );

  const allMeetings = useMemo(
    () => (user ? getMeetingsForUser(user.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, refreshKey]
  );

  const incomingRequests = useMemo(
    () => (user ? getIncomingRequestsForUser(user.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, refreshKey]
  );

  const sentRequests = useMemo(
    () => (user ? getSentRequestsForUser(user.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, refreshKey]
  );

  const confirmedMeetings = allMeetings.filter(m => m.status === 'accepted');

  if (!user) return null;

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const meetingDates = new Set(confirmedMeetings.map(m => m.date));
  const slotDates = new Set(mySlots.map(s => s.date));

  const handleAddSlot = () => {
    if (!startTime || !endTime || startTime >= endTime) return;
    addAvailabilitySlot(user.id, selectedDateStr, startTime, endTime);
    bump();
  };

  const handleRemoveSlot = (slotId: string) => {
    removeAvailabilitySlot(slotId);
    bump();
  };

  const slotsForSelectedDate = mySlots.filter(s => s.date === selectedDateStr);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scheduling Calendar</h1>
        <p className="text-gray-600">Manage your availability and meeting requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar + availability management */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Calendar</h2>
            </CardHeader>
            <CardBody>
              <Calendar
                onChange={(value: CalendarValue) => {
                  if (value instanceof Date) setSelectedDate(value);
                }}
                value={selectedDate}
                className="w-full border-0 font-sans"
                tileClassName={({ date, view }) => {
                  if (view !== 'month') return '';
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const classes: string[] = [];
                  if (meetingDates.has(dateStr)) classes.push('has-meeting');
                  if (slotDates.has(dateStr)) classes.push('has-slot');
                  return classes.join(' ');
                }}
              />
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary-600 inline-block" /> Confirmed meeting
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent-400 inline-block" /> Availability
                </span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">
                Availability for {format(selectedDate, 'EEE, MMM d')}
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex gap-2 items-end">
                <Input
                  label="Start"
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
                <Input
                  label="End"
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
                <Button size="md" leftIcon={<Plus size={16} />} onClick={handleAddSlot}>
                  Add
                </Button>
              </div>

              {slotsForSelectedDate.length > 0 ? (
                <ul className="space-y-2">
                  {slotsForSelectedDate.map(slot => (
                    <li
                      key={slot.id}
                      className="flex justify-between items-center px-3 py-2 rounded-md bg-gray-50 border border-gray-200"
                    >
                      <span className="text-sm text-gray-700">
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <div className="flex items-center gap-2">
                        {slot.isBooked ? (
                          <Badge variant="primary" size="sm">Booked</Badge>
                        ) : (
                          <Badge variant="gray" size="sm">Open</Badge>
                        )}
                        {!slot.isBooked && (
                          <button
                            onClick={() => handleRemoveSlot(slot.id)}
                            className="text-gray-400 hover:text-error-500"
                            aria-label="Remove slot"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No availability set for this day yet.</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Meeting requests + confirmed meetings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Incoming Requests</h2>
              <Badge variant="warning">{incomingRequests.length} pending</Badge>
            </CardHeader>
            <CardBody className="space-y-4">
              {incomingRequests.length > 0 ? (
                incomingRequests.map(m => (
                  <MeetingRequestCard key={m.id} meeting={m} viewerRole="host" onStatusUpdate={bump} />
                ))
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center">No incoming meeting requests</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Sent Requests</h2>
              <Badge variant="gray">{sentRequests.length} pending</Badge>
            </CardHeader>
            <CardBody className="space-y-4">
              {sentRequests.length > 0 ? (
                sentRequests.map(m => (
                  <MeetingRequestCard key={m.id} meeting={m} viewerRole="requester" onStatusUpdate={bump} />
                ))
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center">
                  You haven't requested any meetings yet. Visit a profile page to request one.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <CalendarClock size={18} /> Confirmed Meetings
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {confirmedMeetings.length > 0 ? (
                confirmedMeetings.map(m => (
                  <MeetingRequestCard
                    key={m.id}
                    meeting={m}
                    viewerRole={m.hostId === user.id ? 'host' : 'requester'}
                    onStatusUpdate={bump}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center">No confirmed meetings yet</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
