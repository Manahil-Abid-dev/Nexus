import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser } from 'lucide-react';
import { Button } from '../ui/Button';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
  const sigRef = useRef<SignatureCanvas>(null);

  const handleClear = () => {
    sigRef.current?.clear();
  };

  const handleSave = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Draw your signature below to sign this document.</p>

      <div className="border-2 border-dashed border-gray-300 rounded-md bg-gray-50">
        <SignatureCanvas
          ref={sigRef}
          penColor="#1e3a8a"
          canvasProps={{ className: 'w-full h-40 rounded-md' }}
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" size="sm" leftIcon={<Eraser size={16} />} onClick={handleClear}>
          Clear
        </Button>

        <div className="space-x-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Confirm Signature
          </Button>
        </div>
      </div>
    </div>
  );
};
