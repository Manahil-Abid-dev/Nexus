import { Transaction, TransactionType } from '../types';
import { subDays } from 'date-fns';

const daysAgo = (n: number) => new Date(subDays(new Date(), n)).toISOString();

// Starting balances (in USD), keyed by userId
export const walletBalances: Record<string, number> = {
  e1: 24500,
  e2: 8200,
  e3: 15750,
  e4: 3100,
  i1: 482000,
  i2: 915000,
  i3: 267500,
};

export const transactions: Transaction[] = [
  {
    id: 'txn1',
    type: 'deposit',
    amount: 10000,
    senderId: 'e1',
    receiverId: 'e1',
    status: 'completed',
    note: 'Bank transfer deposit',
    createdAt: daysAgo(10),
  },
  {
    id: 'txn2',
    type: 'funding',
    amount: 50000,
    senderId: 'i1',
    receiverId: 'e1',
    status: 'completed',
    note: 'Seed funding — TechWave AI',
    createdAt: daysAgo(6),
  },
  {
    id: 'txn3',
    type: 'withdrawal',
    amount: 2000,
    senderId: 'e1',
    receiverId: 'e1',
    status: 'completed',
    note: 'Withdrawal to bank account',
    createdAt: daysAgo(3),
  },
  {
    id: 'txn4',
    type: 'transfer',
    amount: 500,
    senderId: 'e1',
    receiverId: 'e2',
    status: 'pending',
    note: 'Advisory fee',
    createdAt: daysAgo(1),
  },
];

export const getBalance = (userId: string): number => walletBalances[userId] ?? 0;

// All transactions where the user is the sender or receiver, most recent first
export const getTransactionsForUser = (userId: string): Transaction[] => {
  return transactions
    .filter(t => t.senderId === userId || t.receiverId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

const recordTransaction = (
  type: TransactionType,
  amount: number,
  senderId: string,
  receiverId: string,
  note?: string
): Transaction => {
  const txn: Transaction = {
    id: `txn${transactions.length + 1}-${Date.now()}`,
    type,
    amount,
    senderId,
    receiverId,
    status: 'completed',
    note,
    createdAt: new Date().toISOString(),
  };
  transactions.push(txn);
  return txn;
};

export const deposit = (userId: string, amount: number, note?: string): Transaction => {
  walletBalances[userId] = (walletBalances[userId] ?? 0) + amount;
  return recordTransaction('deposit', amount, userId, userId, note);
};

export const withdraw = (userId: string, amount: number, note?: string): Transaction | null => {
  const balance = getBalance(userId);
  if (amount > balance) return null;
  walletBalances[userId] = balance - amount;
  return recordTransaction('withdrawal', amount, userId, userId, note);
};

export const transfer = (
  fromId: string,
  toId: string,
  amount: number,
  note?: string
): Transaction | null => {
  const balance = getBalance(fromId);
  if (amount > balance) return null;
  walletBalances[fromId] = balance - amount;
  walletBalances[toId] = (walletBalances[toId] ?? 0) + amount;
  return recordTransaction('transfer', amount, fromId, toId, note);
};

// Investor -> Entrepreneur funding flow (semantically a transfer, tagged distinctly for the deal timeline / UI)
export const fundDeal = (
  investorId: string,
  entrepreneurId: string,
  amount: number,
  note?: string
): Transaction | null => {
  const balance = getBalance(investorId);
  if (amount > balance) return null;
  walletBalances[investorId] = balance - amount;
  walletBalances[entrepreneurId] = (walletBalances[entrepreneurId] ?? 0) + amount;
  return recordTransaction('funding', amount, investorId, entrepreneurId, note);
};
