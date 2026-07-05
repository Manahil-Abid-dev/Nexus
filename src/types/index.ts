export type UserRole = 'entrepreneur' | 'investor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  isOnline?: boolean;
  createdAt: string;
}

export interface Entrepreneur extends User {
  role: 'entrepreneur';
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
}

export interface Investor extends User {
  role: 'investor';
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface AvailabilitySlot {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isBooked: boolean;
}

export type MeetingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface MeetingRequest {
  id: string;
  requesterId: string;
  hostId: string;
  slotId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  topic: string;
  status: MeetingStatus;
  createdAt: string;
}

export type DealDocumentStatus = 'Draft' | 'In Review' | 'Signed';

export interface DealDocument {
  id: string;
  ownerId: string; // who uploaded the document
  partnerId: string; // the counterpart on the other side of the deal
  name: string;
  fileType: string; // pdf, docx, xlsx, png, etc. (derived from the file extension)
  size: string;
  uploadedAt: string;
  status: DealDocumentStatus;
  previewUrl?: string; // object URL / data URL, when a preview is available
  signatureDataUrl?: string;
  signedBy?: string;
  signedAt?: string;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'funding';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  senderId: string; // for deposits, this is the user themself (external source)
  receiverId: string; // for withdrawals, this is the user themself (external destination)
  status: TransactionStatus;
  note?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  url: string;
  ownerId: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}