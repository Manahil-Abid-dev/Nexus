import React, { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FolderOpen } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DealDocumentCard } from '../../components/documents/DealDocumentCard';
import { useAuth } from '../../context/AuthContext';
import { DealDocumentStatus } from '../../types';
import { getDocumentsForUser, addDealDocument } from '../../data/dealDocuments';
import { getUsersByRole } from '../../data/users';

const STATUS_COLUMNS: DealDocumentStatus[] = ['Draft', 'In Review', 'Signed'];

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getExtension = (fileName: string) => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'file';
};

export const DocumentChamberPage: React.FC = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const bump = () => setRefreshKey(k => k + 1);

  const counterpartRole = user?.role === 'entrepreneur' ? 'investor' : 'entrepreneur';
  const potentialPartners = useMemo(() => getUsersByRole(counterpartRole), [counterpartRole]);

  const documents = useMemo(
    () => (user ? getDocumentsForUser(user.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, refreshKey]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!user || !selectedPartnerId || acceptedFiles.length === 0) return;
      acceptedFiles.forEach(file => {
        const previewUrl = URL.createObjectURL(file);
        addDealDocument(
          user.id,
          selectedPartnerId,
          file.name,
          getExtension(file.name),
          formatSize(file.size),
          previewUrl
        );
      });
      bump();
      setShowUploadModal(false);
    },
    [user, selectedPartnerId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    disabled: !selectedPartnerId,
  });

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Chamber</h1>
          <p className="text-gray-600">Upload, review, and e-sign deal contracts with your counterparts</p>
        </div>

        <Button leftIcon={<UploadCloud size={18} />} onClick={() => setShowUploadModal(true)}>
          Upload Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <FolderOpen size={24} className="text-gray-500" />
              </div>
              <p className="text-gray-600">No deal documents yet</p>
              <p className="text-sm text-gray-500 mt-1">Upload a contract or NDA to get started</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATUS_COLUMNS.map(status => {
            const docsInColumn = documents.filter(d => d.status === status);
            return (
              <Card key={status} className="bg-gray-50 border border-gray-200">
                <CardHeader className="flex justify-between items-center bg-white">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{status}</h2>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                    {docsInColumn.length}
                  </span>
                </CardHeader>
                <CardBody className="space-y-3 min-h-[120px]">
                  {docsInColumn.length > 0 ? (
                    docsInColumn.map(doc => (
                      <DealDocumentCard key={doc.id} document={doc} currentUserId={user.id} onChange={bump} />
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-6">No documents</p>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Deal Document">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Share with ({counterpartRole})
            </label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={selectedPartnerId}
              onChange={e => setSelectedPartnerId(e.target.value)}
            >
              <option value="">Select a {counterpartRole}…</option>
              {potentialPartners.map(partner => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </select>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              !selectedPartnerId
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud size={32} className="mx-auto text-gray-400 mb-2" />
            {!selectedPartnerId ? (
              <p className="text-sm text-gray-500">Select a recipient above before uploading</p>
            ) : isDragActive ? (
              <p className="text-sm text-primary-600">Drop the file here…</p>
            ) : (
              <p className="text-sm text-gray-500">
                Drag & drop a PDF, Word doc, or image, or <span className="text-primary-600 font-medium">browse</span>
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
