import React, { useState } from 'react';
import { RiArrowUpLine, RiWalletLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { createWithdrawal } from '../api/withdrawalsApi';
import PageHeader from '../components/ui/PageHeader';

const withdrawMethods = [
  { id: 'usdt-trc20', name: 'USDT (TRC20)', minWithdraw: 10 },
  { id: 'btc', name: 'Bitcoin (BTC)', minWithdraw: 50 },
  { id: 'bank', name: 'Bank Wire Transfer', minWithdraw: 100 },
];

export default function Withdraw() {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [method, setMethod] = useState(withdrawMethods[0]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) {
      setErrorMsg('Please enter a valid withdrawal amount.');
      return;
    }

    if (numAmount < method.minWithdraw) {
      setErrorMsg(`Minimum withdrawal for ${method.name} is $${method.minWithdraw}.`);
      return;
    }

    if ((user?.earningWallet || 0) < numAmount) {
      setErrorMsg(`Insufficient available balance ($${(user?.earningWallet || 0).toFixed(2)} USD).`);
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Please enter your recipient wallet address or bank account coordinates.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createWithdrawal({
        amount: numAmount,
        gateway: method.name,
        address: address.trim(),
      });

      if (res?.success) {
        setSuccessMsg(res.message || 'Withdrawal request submitted successfully. Processing within 12-24 hours.');
        setAmount('');
        setAddress('');
        if (refreshUser) await refreshUser();
      } else {
        setErrorMsg(res?.message || 'Withdrawal request failed.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Withdraw Funds"
        subtitle="Request instant payout from your available earning wallet directly to your external address"
        badge="Payout Gateway"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card-gold p-6 rounded-2xl">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                <RiWalletLine size={24} className="text-emerald-700" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 font-poppins">Available Balance</p>
                <p className="text-2xl font-bold font-display text-slate-900 tabular-nums">${(user?.earningWallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="space-y-2.5 pt-3 border-t border-gold-200/60 text-sm font-poppins">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Earned</span>
                <span className="text-emerald-600 font-bold tabular-nums">${(user?.totalEarned || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Withdrawn</span>
                <span className="text-orange-600 font-bold tabular-nums">${(user?.totalWithdrawn || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Method selection */}
          <div className="card p-5 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400 font-poppins">Withdraw Gateway</p>
            {withdrawMethods.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m)}
                className={`w-full p-3.5 rounded-xl flex items-center justify-between transition-all text-left text-sm font-poppins border
                  ${method.id === m.id ? 'card-gold border-gold-400 ring-2 ring-gold-200 text-slate-900 font-bold shadow-sm' : 'border-slate-100 hover:border-slate-300 text-slate-600'}
                `}
              >
                <span className="font-semibold">{m.name}</span>
                <span className="text-xs text-slate-400 font-normal">Min ${m.minWithdraw}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Withdraw form */}
        <div className="lg:col-span-2">
          <div className="card p-6 sm:p-8">
            {successMsg && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-poppins">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-poppins">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={`Min amount $${method.minWithdraw}`}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">
                  {method.id === 'bank' ? 'Bank Account Coordinates' : 'Recipient Wallet Address'}
                </label>
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={method.id === 'bank' ? 'Bank Name, Account number, IFSC / IBAN...' : 'Enter your recipient wallet address'}
                  className="input"
                  required
                />
              </div>

              <div className="px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-poppins space-y-1">
                <p className="font-semibold text-slate-800">Withdrawal Policy:</p>
                <p>• Automated clearance turnaround: 12-24 hours</p>
                <p>• 0% platform surcharge on crypto settlement</p>
                <p>• Minimum withdrawal: ${method.minWithdraw}</p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn btn-primary py-3.5 text-sm font-bold cursor-pointer"
              >
                {submitting ? 'Submitting request...' : (
                  <span className="flex items-center justify-center gap-1.5">
                    <RiArrowUpLine size={16} /> Request Withdrawal
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
