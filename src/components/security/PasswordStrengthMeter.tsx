import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

type Strength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

const evaluateStrength = (password: string): Strength => {
  if (!password) return 'empty';

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  if (score === 3 || score === 4) return 'good';
  return 'strong';
};

const config: Record<Exclude<Strength, 'empty'>, { label: string; color: string; width: string }> = {
  weak: { label: 'Weak', color: 'bg-error-500', width: 'w-1/4' },
  fair: { label: 'Fair', color: 'bg-warning-500', width: 'w-2/4' },
  good: { label: 'Good', color: 'bg-accent-500', width: 'w-3/4' },
  strong: { label: 'Strong', color: 'bg-success-500', width: 'w-full' },
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const strength = evaluateStrength(password);

  if (strength === 'empty') return null;

  const { label, color, width } = config[strength];

  return (
    <div className="mt-2">
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} ${width} transition-all duration-300 rounded-full`} />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Password strength: <span className="font-medium">{label}</span>
        {(strength === 'weak' || strength === 'fair') && (
          <span className="text-gray-400"> — try adding numbers, symbols, or more length</span>
        )}
      </p>
    </div>
  );
};
