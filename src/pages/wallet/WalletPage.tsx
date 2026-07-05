import React, { useMemo, useState } from 'react';
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Send, ArrowDownLeft, ArrowUpRight, Repeat,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { TransactionStatus, TransactionType } from '../../types';
import {
  getBalance, getTransactionsForUser, deposit, withdraw, transfer, fundDeal,
} from '../../data/wallet';
import { findUserById, users } from '../../data/users';
import { format, parseISO } from 'date-fns';

type ModalKind = 'deposit' | 'withdraw' | 'send' | null;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const typeLabel: Record<TransactionType, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  transfer: 'Transfer',
  funding: 'Deal Funding',
};

const statusVariant: Record<TransactionStatus, BadgeVariant> = {
  completed: 'success',
  pending: 'warning',
  failed: 'error',
};

const typeIcon: Record<TransactionType, React.ReactNode> = {
  deposit: <ArrowDownLeft size={16} className="text-success-600" />,
  withdrawal: <ArrowUpRight size={16} className="text-error-600" />,
  transfer: <Repeat size={16} className="text-primary-600" />,
  funding: <Repeat size={16} className="text-accent-600" />,
};

export const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const bump = () => setRefreshKey(k => k + 1);

  const balance = useMemo(() => (user ? getBalance(user.id) : 0), [user, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const userTransactions = useMemo(
    () => (user ? getTransactionsForUser(user.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, refreshKey]
  );

  const otherUsers = useMemo(() => users.filter(u => u.id !== user?.id), [user]);

  if (!user) return null;

  const closeModal = () => {
    setActiveModal(null);
    setAmount('');
    setNote('');
    setRecipientId('');
    setFormError(null);
  };

  const handleSubmit = () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setFormError('Enter a valid amount');
      return;
    }

    if (activeModal === 'deposit') {
      deposit(user.id, numericAmount, note || 'Simulated deposit');
    } else if (activeModal === 'withdraw') {
      const result = withdraw(user.id, numericAmount, note || 'Simulated withdrawal');
      if (!result) {
        setFormError('Insufficient balance');
        return;
      }
    } else if (activeModal === 'send') {
      if (!recipientId) {
        setFormError('Select a recipient');
        return;
      }
      const recipient = findUserById(recipientId);
      const isFunding = user.role === 'investor' && recipient?.role === 'entrepreneur';
      const result = isFunding
        ? fundDeal(user.id, recipientId, numericAmount, note || 'Deal funding')
        : transfer(user.id, recipientId, numericAmount, note || 'Transfer');
      if (!result) {
        setFormError('Insufficient balance');
        return;
      }
    }

    bump();
    closeModal();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600">Manage deposits, withdrawals, and deal transfers (simulation only)</p>
      </div>

      {/* Balance card, styled Stripe/PayPal-like */}
      <div className="rounded-xl bg-gradient-to-br from-primary-700 to-primary-900 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm flex items-center gap-2">
              <Wallet size={16} /> Wallet Balance
            </p>
            <h2 className="text-3xl font-bold mt-1">{formatCurrency(balance)}</h2>
          </div>
          <span className="inline-flex items-center rounded-full bg-white/10 text-white text-sm px-2.5 py-0.5 font-medium">
            {user.role === 'investor' ? 'Investor Account' : 'Entrepreneur Account'}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <Button
            variant="secondary"
            leftIcon={<ArrowDownCircle size={16} />}
            onClick={() => setActiveModal('deposit')}
          >
            Deposit
          </Button>
          <Button
            variant="secondary"
            leftIcon={<ArrowUpCircle size={16} />}
            onClick={() => setActiveModal('withdraw')}
          >
            Withdraw
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Send size={16} />}
            onClick={() => setActiveModal('send')}
          >
            {user.role === 'investor' ? 'Fund a Deal' : 'Send Money'}
          </Button>
        </div>
      </div>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
        </CardHeader>
        <CardBody className="p-0">
          {userTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {userTransactions.map(txn => {
                    const sender = findUserById(txn.senderId);
                    const receiver = findUserById(txn.receiverId);
                    const isOutgoing = txn.senderId === user.id && txn.senderId !== txn.receiverId;
                    return (
                      <tr key={txn.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 flex items-center gap-2">
                          {typeIcon[txn.type]}
                          {typeLabel[txn.type]}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${isOutgoing ? 'text-error-600' : 'text-success-600'}`}>
                          {isOutgoing ? '-' : '+'}
                          {formatCurrency(txn.amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {sender?.name ?? 'External'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {receiver?.name ?? 'External'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={statusVariant[txn.status]} size="sm">{txn.status}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(txn.createdAt), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-10">No transactions yet</p>
          )}
        </CardBody>
      </Card>

      {/* Deposit / Withdraw / Send modal */}
      <Modal
        isOpen={activeModal !== null}
        onClose={closeModal}
        title={
          activeModal === 'deposit'
            ? 'Deposit Funds'
            : activeModal === 'withdraw'
            ? 'Withdraw Funds'
            : user.role === 'investor'
            ? 'Fund a Deal'
            : 'Send Money'
        }
      >
        <div className="space-y-4">
          {activeModal === 'send' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={recipientId}
                onChange={e => setRecipientId(e.target.value)}
              >
                <option value="">Select a recipient…</option>
                {otherUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Amount (USD)"
            type="number"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            fullWidth
          />

          <Input
            label="Note (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            fullWidth
          />

          {formError && <p className="text-sm text-error-600">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
