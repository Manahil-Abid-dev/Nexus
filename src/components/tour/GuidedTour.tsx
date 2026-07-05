import React, { useEffect, useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useAuth } from '../../context/AuthContext';

const TOUR_STORAGE_KEY = 'business_nexus_tour_seen';

const steps: Step[] = [
  {
    target: '[data-tour="tour-dashboard"]',
    content: 'This is your dashboard — a quick overview of requests, connections, and activity.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="tour-calendar"]',
    content: 'Schedule meetings here: set your availability and send or respond to meeting requests.',
  },
  {
    target: '[data-tour="tour-documents"]',
    content: 'The Document Chamber is where deal contracts get uploaded, reviewed, and e-signed.',
  },
  {
    target: '[data-tour="tour-wallet"]',
    content: 'Your Wallet tracks balance, deposits/withdrawals, and deal funding transfers.',
  },
];

interface GuidedTourProps {
  /** When true, forces the tour to run regardless of whether it's been seen before (used by the "Take a tour" button) */
  forceRun?: boolean;
  onFinish?: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ forceRun = false, onFinish }) => {
  const { user } = useAuth();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (forceRun) {
      setRun(true);
      return;
    }
    const hasSeenTour = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasSeenTour) {
      // Small delay so the dashboard has mounted before targeting elements
      const timer = setTimeout(() => setRun(true), 600);
      return () => clearTimeout(timer);
    }
  }, [user, forceRun]);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setRun(false);
      onFinish?.();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: '#2563eb',
          zIndex: 10000,
        },
      }}
    />
  );
};
