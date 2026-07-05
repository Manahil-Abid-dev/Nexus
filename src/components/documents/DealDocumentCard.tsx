import React, { useState } from 'react';
import { FileText, Eye, Download, PenLine, ArrowRight } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Badge, BadgeVariant } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SignaturePad } from './SignaturePad';
import { Avatar } from '../ui/Avatar';
import { DealDocument, DealDocumentStatus } from '../../types';
import { findUserById } from '../../data/users';
import { updateDocumentStatus, signDealDocument } from '../../data/dealDocuments';
import { format, parseISO } from 'date-fns';

interface DealDocumentCardProps {
  document: DealDocument;
  currentUserId: string;
  onChange: () => void;
}

const statusBadgeVariant: Record<DealDocumentStatus, BadgeVariant> = {
  Draft: 'gray',
  'In Review': 'warning',
  Signed: 'success',
};

const nextStatus: Record<DealDocumentStatus, DealDocumentStatus | null> = {
  Draft: 'In Review',
  'In Review': 'Signed',
  Signed: null,
};

export const DealDocumentCard: React.FC<DealDocumentCardProps> = ({ document, currentUserId, onChange }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const partnerId = document.ownerId === currentUserId ? document.partnerId : document.ownerId;
  const partner = findUserById(partnerId);
  const isOwner = document.ownerId === currentUserId;

  const handleAdvanceStatus = () => {
    const next = nextStatus[document.status];
    if (!next) return;
    if (next === 'Signed') {
      setShowSignaturePad(true);
      return;
    }
    updateDocumentStatus(document.id, next);
    onChange();
  };

  const handleSign = (dataUrl: string) => {
    signDealDocument(document.id, dataUrl, currentUserId);
    setShowSignaturePad(false);
    onChange();
  };

  const handleDownload = () => {
    if (!document.previewUrl) return;
    const link = window.document.createElement('a');
    link.href = document.previewUrl;
    link.download = document.name;
    link.click();
  };

  const canPreviewInline = document.previewUrl && document.fileType === 'pdf';
  const isImage = document.previewUrl && ['png', 'jpg', 'jpeg'].includes(document.fileType);

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardBody className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <div className="p-2 bg-primary-50 rounded-lg mr-3">
                <FileText size={20} className="text-primary-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 leading-tight">{document.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {document.fileType.toUpperCase()} · {document.size}
                </p>
              </div>
            </div>
            <Badge variant={statusBadgeVariant[document.status]} size="sm">
              {document.status}
            </Badge>
          </div>

          {partner && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Avatar src={partner.avatarUrl} alt={partner.name} size="xs" />
              <span>
                {isOwner ? 'Shared with' : 'From'} {partner.name}
              </span>
            </div>
          )}

          <p className="text-xs text-gray-400">
            {isOwner ? 'Uploaded' : 'Received'} {format(parseISO(document.uploadedAt), 'MMM d, yyyy')}
          </p>

          {document.status === 'Signed' && document.signedBy && (
            <p className="text-xs text-success-700 bg-success-50 rounded px-2 py-1">
              Signed by {findUserById(document.signedBy)?.name ?? 'a party'}
              {document.signedAt ? ` on ${format(parseISO(document.signedAt), 'MMM d, yyyy')}` : ''}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                aria-label="Preview"
                onClick={() => setShowPreview(true)}
              >
                <Eye size={16} />
              </Button>
              {document.previewUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  aria-label="Download"
                  onClick={handleDownload}
                >
                  <Download size={16} />
                </Button>
              )}
            </div>

            {document.status !== 'Signed' && (
              <Button
                variant="outline"
                size="sm"
                rightIcon={document.status === 'In Review' ? <PenLine size={14} /> : <ArrowRight size={14} />}
                onClick={handleAdvanceStatus}
              >
                {document.status === 'Draft' ? 'Send for Review' : 'Sign Document'}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Preview modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title={document.name} maxWidthClassName="max-w-2xl">
        {canPreviewInline ? (
          <iframe src={document.previewUrl} title={document.name} className="w-full h-[70vh] rounded-md border border-gray-200" />
        ) : isImage ? (
          <img src={document.previewUrl} alt={document.name} className="w-full rounded-md border border-gray-200" />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText size={40} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              Preview isn't available for this file type in the demo.{document.previewUrl ? ' You can download it instead.' : ''}
            </p>
            {document.previewUrl && (
              <Button className="mt-4" size="sm" leftIcon={<Download size={16} />} onClick={handleDownload}>
                Download
              </Button>
            )}
          </div>
        )}

        {document.status === 'Signed' && document.signatureDataUrl && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Signature on file:</p>
            <img src={document.signatureDataUrl} alt="Signature" className="h-16" />
          </div>
        )}
      </Modal>

      {/* Signature modal */}
      <Modal isOpen={showSignaturePad} onClose={() => setShowSignaturePad(false)} title="Sign Document">
        <SignaturePad onSave={handleSign} onCancel={() => setShowSignaturePad(false)} />
      </Modal>
    </>
  );
};
