import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, MonitorUp, MonitorX, AlertCircle,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { findUserById } from '../../data/users';

type CallStatus = 'connecting' | 'connected' | 'ended';

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const VideoCallPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CallStatus>('connecting');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const callPartner = userId ? findUserById(userId) : null;

  // Acquire local camera/mic on mount - this is real WebRTC media capture (no signaling server, since this is a frontend-only mock)
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Simulate the remote peer picking up after a short delay
        setTimeout(() => {
          if (!cancelled) setStatus('connected');
        }, 1500);
      } catch {
        if (!cancelled) {
          setPermissionError(
            'Camera/microphone access was blocked or unavailable. You can still preview the call UI without live video.'
          );
          setStatus('connected');
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Call timer
  useEffect(() => {
    if (status !== 'connected') return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const toggleMic = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) {
      setMicOn(m => !m);
      return;
    }
    const nextState = !micOn;
    stream.getAudioTracks().forEach(track => (track.enabled = nextState));
    setMicOn(nextState);
  }, [micOn]);

  const toggleCamera = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) {
      setCameraOn(c => !c);
      return;
    }
    const nextState = !cameraOn;
    stream.getVideoTracks().forEach(track => (track.enabled = nextState));
    setCameraOn(nextState);
  }, [cameraOn]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = streamRef.current;
      setIsScreenSharing(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      setIsScreenSharing(true);

      // Auto-revert if the user stops sharing from the browser's own UI
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        screenStreamRef.current = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = streamRef.current;
        setIsScreenSharing(false);
      });
    } catch {
      // User cancelled the screen share picker - no-op
    }
  }, [isScreenSharing]);

  const handleEndCall = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    setStatus('ended');
    setTimeout(() => navigate(userId ? `/chat/${userId}` : '/messages'), 800);
  };

  if (!currentUser) return null;

  if (!callPartner) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center">
        <AlertCircle size={40} className="text-gray-400 mb-3" />
        <h2 className="text-lg font-medium text-gray-700">Contact not found</h2>
        <Button className="mt-4" onClick={() => navigate('/messages')}>Back to Messages</Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-900 rounded-lg overflow-hidden animate-fade-in relative">
      {/* Remote participant (simulated - avatar tile since there is no signaling server) */}
      <div className="flex-1 relative flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="flex flex-col items-center">
          <Avatar src={callPartner.avatarUrl} alt={callPartner.name} size="xl" className="ring-4 ring-white/10" />
          <h2 className="text-white text-lg font-medium mt-4">{callPartner.name}</h2>
          <p className="text-gray-300 text-sm mt-1">
            {status === 'connecting' && 'Calling…'}
            {status === 'connected' && formatDuration(elapsed)}
            {status === 'ended' && 'Call ended'}
          </p>
        </div>

        {status === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
          </div>
        )}

        {/* Local self-view */}
        <div className="absolute bottom-4 right-4 w-40 sm:w-56 aspect-video rounded-lg overflow-hidden border-2 border-white/20 bg-gray-800 shadow-lg">
          {cameraOn || isScreenSharing ? (
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Avatar src={currentUser.avatarUrl} alt={currentUser.name} size="lg" />
            </div>
          )}
          {isScreenSharing && (
            <span className="absolute top-1 left-1 bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded">
              Sharing screen
            </span>
          )}
        </div>

        {permissionError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-warning-50 text-warning-700 text-sm px-4 py-2 rounded-md shadow max-w-md text-center">
            {permissionError}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 py-4 flex items-center justify-center gap-4">
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full transition-colors ${micOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-error-500 text-white hover:bg-error-600'}`}
          aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full transition-colors ${cameraOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-error-500 text-white hover:bg-error-600'}`}
          aria-label={cameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {cameraOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full transition-colors ${isScreenSharing ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
          aria-label={isScreenSharing ? 'Stop screen share' : 'Share screen'}
        >
          {isScreenSharing ? <MonitorX size={20} /> : <MonitorUp size={20} />}
        </button>

        <button
          onClick={handleEndCall}
          className="p-3 rounded-full bg-error-600 text-white hover:bg-error-700 transition-colors ml-4"
          aria-label="End call"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
};
