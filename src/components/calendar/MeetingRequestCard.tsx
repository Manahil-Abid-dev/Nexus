import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, MessageCircle, Clock } from 'lucide-react';
import { MeetingRequest } from '../../types';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { findUserById } from '../../data/users';
import { updateMeetingStatus } from '../../data/meetings';
import { format, parseISO } from 'date-fns';

interface MeetingRequestCardProps {
  meeting: MeetingRequest;
  /** Which side of the meeting the *current* user is on, so we know whose profile to show and which actions to allow */
  viewerRole: 'host' | 'requester';
  onStatusUpdate?: (meetingId: string, status: 'accepted' | 'declined' | 'cancelled') => void;
}

export const MeetingRequestCard: React.FC<MeetingRequestCardProps> = ({
  meeting,
  viewerRole,
  onStatusUpdate,
}) => {
  const navigate = useNavigate();
  const counterpartId = viewerRole === 'host' ? meeting.requesterId : meeting.hostId;
  const counterpart = findUserById(counterpartId);

  if (!counterpart) return null;

  const handleUpdate = (status: 'accepted' | 'declined' | 'cancelled') => {
    updateMeetingStatus(meeting.id, status);
    onStatusUpdate?.(meeting.id, status);
  };

  const getStatusBadge = () => {
    switch (meeting.status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'accepted':
        return <Badge variant="success">Confirmed</Badge>;
      case 'declined':
        return <Badge variant="error">Declined</Badge>;
      case 'cancelled':
        return <Badge variant="gray">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            <Avatar
              src={counterpart.avatarUrl}
              alt={counterpart.name}
              size="md"
              status={counterpart.isOnline ? 'online' : 'offline'}
              className="mr-3"
            />
            <div>
              <h3 className="text-md font-semibold text-gray-900">{counterpart.name}</h3>
              <p className="text-sm text-gray-500 flex items-center mt-0.5">
                <Clock size={14} className="mr-1" />
                {format(parseISO(meeting.date), 'EEE, MMM d')} · {meeting.startTime}–{meeting.endTime}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <p className="mt-3 text-sm text-gray-600">{meeting.topic}</p>
      </CardBody>

      <CardFooter className="border-t border-gray-100 bg-gray-50">
        <div className="flex justify-between w-full">
          {meeting.status === 'pending' && viewerRole === 'host' && (
            <div className="space-x-2">
              <Button variant="outline" size="sm" leftIcon={<X size={16} />} onClick={() => handleUpdate('declined')}>
                Decline
              </Button>
              <Button variant="success" size="sm" leftIcon={<Check size={16} />} onClick={() => handleUpdate('accepted')}>
                Accept
              </Button>
            </div>
          )}

          {meeting.status === 'pending' && viewerRole === 'requester' && (
            <Button variant="outline" size="sm" leftIcon={<X size={16} />} onClick={() => handleUpdate('cancelled')}>
              Cancel Request
            </Button>
          )}

          {meeting.status === 'accepted' && (
            <Button variant="outline" size="sm" leftIcon={<X size={16} />} onClick={() => handleUpdate('cancelled')}>
              Cancel Meeting
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            leftIcon={<MessageCircle size={16} />}
            onClick={() => navigate(`/chat/${counterpart.id}`)}
          >
            Message
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
