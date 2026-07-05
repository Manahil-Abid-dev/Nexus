import { DealDocument, DealDocumentStatus } from '../types';
import { format, subDays } from 'date-fns';

const daysAgo = (n: number) => format(subDays(new Date(), n), 'yyyy-MM-dd');

export const dealDocuments: DealDocument[] = [
  {
    id: 'doc1',
    ownerId: 'e1',
    partnerId: 'i1',
    name: 'TechWave AI - Term Sheet.pdf',
    fileType: 'pdf',
    size: '245 KB',
    uploadedAt: daysAgo(6),
    status: 'In Review',
  },
  {
    id: 'doc2',
    ownerId: 'i1',
    partnerId: 'e1',
    name: 'Series A - SAFE Agreement.pdf',
    fileType: 'pdf',
    size: '180 KB',
    uploadedAt: daysAgo(4),
    status: 'Signed',
    signedBy: 'e1',
    signatureDataUrl: undefined,
    signedAt: daysAgo(1),
  },
  {
    id: 'doc3',
    ownerId: 'e2',
    partnerId: 'i2',
    name: 'GreenLife NDA.docx',
    fileType: 'docx',
    size: '58 KB',
    uploadedAt: daysAgo(2),
    status: 'Draft',
  },
];

// All documents where the given user is either the owner or the counterpart
export const getDocumentsForUser = (userId: string): DealDocument[] => {
  return dealDocuments
    .filter(doc => doc.ownerId === userId || doc.partnerId === userId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
};

export const addDealDocument = (
  ownerId: string,
  partnerId: string,
  name: string,
  fileType: string,
  size: string,
  previewUrl?: string
): DealDocument => {
  const newDoc: DealDocument = {
    id: `doc${dealDocuments.length + 1}-${Date.now()}`,
    ownerId,
    partnerId,
    name,
    fileType,
    size,
    uploadedAt: format(new Date(), 'yyyy-MM-dd'),
    status: 'Draft',
    previewUrl,
  };
  dealDocuments.push(newDoc);
  return newDoc;
};

export const updateDocumentStatus = (docId: string, status: DealDocumentStatus): DealDocument | null => {
  const doc = dealDocuments.find(d => d.id === docId);
  if (!doc) return null;
  doc.status = status;
  return doc;
};

export const signDealDocument = (
  docId: string,
  signatureDataUrl: string,
  signedBy: string
): DealDocument | null => {
  const doc = dealDocuments.find(d => d.id === docId);
  if (!doc) return null;
  doc.status = 'Signed';
  doc.signatureDataUrl = signatureDataUrl;
  doc.signedBy = signedBy;
  doc.signedAt = format(new Date(), 'yyyy-MM-dd');
  return doc;
};
