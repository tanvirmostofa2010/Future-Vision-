import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Megaphone,
  Printer,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { FvcCrest } from '../components/FvcCrest';
import { MONTHLY_INSTALLMENT_AMOUNT, TOTAL_EXPECTED_MONTHS_YTD } from '../data/mockData';
import { ForumPost, LedgerEntry, Member, NoticeItem, UserRole } from '../types/fvc';
import { formatBDT, formatDateBn, getInitials, toBengaliDigits } from '../utils/formatters';

interface PortalPageProps {
  members: Member[];
  ledger: LedgerEntry[];
  forumPosts: ForumPost[];
  notices: NoticeItem[];
  currentUser: Member;
  currentRole: UserRole;
  isAuthenticated: boolean;
  authUserId?: string | null;
  authEmail?: string | null;
  authPhotoUrl?: string | null;
  authBusy?: boolean;
  authError?: string | null;
  onUserIdLogin: (userId: string, password: string) => Promise<void>;
  onUserIdRegister?: (payload: {
    userId: string;
    password: string;
    displayName: string;
    linkedMemberId: string;
  }) => Promise<void>;
  onGoogleLogin: () => void;
  onLogout: () => void;
  onLinkMemberId?: (memberId: string) => void;
  onOpenReceipt: (entry: LedgerEntry) => void;
}

export const PortalPage: React.FC<PortalPageProps> = ({
  members,
  ledger,
  forumPosts,
  notices,
  currentUser,
  currentRole,
  isAuthenticated,
  authUserId,
  authEmail,
  authBusy,
  authError,
  onUserIdLogin,
  onUserIdRegister,
  onGoogleLogin,
  onLogout,
  onLinkMemberId,
  onOpenReceipt,
}) => {
  const [selectedLinkId, setSelectedLinkId] = useState(currentUser.id);
  const [authTab, setAuthTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loginUserId, setLoginUserId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Member self-registration state
  const [regUserId, setRegUserId] = useState('');
  const [regName, setRegName] = useState('');
  const [regMemberId, setRegMemberId] = useState('FVC-078');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!loginUserId.trim() || !loginPassword) {
      setLocalError('অনুগ্রহ করে ইউজার আইডি ও পাসওয়ার্ড লিখুন।');
      return;
    }
    await onUserIdLogin(loginUserId.trim(), loginPassword);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!onUserIdRegister) return;
    if (!regUserId.trim() || !regName.trim() || !regPassword) {
      setLocalError('অনুগ্রহ করে ইউজার আইডি, পূর্ণ নাম এবং পাসওয়ার্ড দিন।');
      return;
    }
    if (regPassword.length < 6) {
      setLocalError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setLocalError('পাসওয়ার্ড ও নিশ্চিত পাসওয়ার্ড মিলছে না।');
      return;
    }
    await onUserIdRegister({
      userId: regUserId.trim(),
      password: regPassword,
      displayName: regName.trim(),
      linkedMemberId: regMemberId.trim() || 'FVC-078',
    });
  };

  // Compute Personal Financial Snapshot for currentUser
  const mySnapshot = useMemo(() => {
    const myEntries = ledger.filter(
      (e) => e.memberId === currentUser.id && e.status === 'APPROVED'
    );
    const admissionPaid = myEntries
      .filter((e) => e.category === 'ADMISSION')
      .reduce((s, e) => s + e.credit, 0);
    const installmentEntries = myEntries.filter((e) => e.category === 'INSTALLMENT');
    const installmentsPaid = installmentEntries.reduce((s, e) => s + e.credit, 0);
    const installmentCount = installmentEntries.reduce(
      (s, e) => s + (e.monthsCount ?? 1),
      0
    );
    const dueMonths = Math.max(0, TOTAL_EXPECTED_MONTHS_YTD - installmentCount);
    const dueAmount = dueMonths * MONTHLY_INSTALLMENT_AMOUNT;
    const actualDividend = myEntries
      .filter((e) => e.category === 'DIVIDEND_PAYOUT')
      .reduce((s, e) => s + e.debit, 0);

    const totalRealized = ledger
      .filter((e) => e.status === 'APPROVED' && e.category === 'INVESTMENT_RETURN')
      .reduce((s, e) => s + e.credit, 0);
    const totalExpense = ledger
      .filter((e) => e.status === 'APPROVED' && e.category === 'EXPENSE')
      .reduce((s, e) => s + e.debit, 0);
    const totalAllInstallments = ledger
      .filter((e) => e.status === 'APPROVED' && e.category === 'INSTALLMENT')
      .reduce((s, e) => s + e.credit, 0);

    const netProfit = Math.max(0, totalRealized - totalExpense);
    const projectedDividend =
      actualDividend > 0
        ? actualDividend
        : totalAllInstallments > 0
        ? Math.round((installmentsPaid / totalAllInstallments) * netProfit)
        : 0;

    return {
      admissionPaid,
      installmentsPaid,
      installmentCount,
      dueMonths,
      dueAmount,
      projectedDividend,
      myReceipts: ledger
        .filter((e) => e.memberId === currentUser.id && e.status !== 'REJECTED')
        .slice()
        .reverse(),
    };
  }, [ledger, currentUser.id]);

  const myForumPosts = useMemo(
    () => forumPosts.filter((p) => p.authorId === currentUser.id),
    [forumPosts, currentUser.id]
  );

  const displayedError = localError || authError;

  return (
    <div className="space-y-6">
      {/* Corporate Architectural Hero Card */}
      <section className="relative overflow-hidden rounded-2xl bg-[#10243A] text-white border border-[#1E3A5F]">
        <svg
          className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
          viewBox="0 0 1200 360"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <rect x="640" y="30" width="140" height="330" stroke="#D6A84B" strokeWidth="1.2" />
          <rect x="800" y="60" width="170" height="300" stroke="#64748B" strokeWidth="1.2" />
          <rect x="990" y="20" width="160" height="340" stroke="#087F68" strokeWidth="1.2" />
          <line x1="640" y1="90" x2="1150" y2="90" stroke="#94A3B8" strokeWidth="0.7" />
          <line x1="640" y1="150" x2="1150" y2="150" stroke="#94A3B8" strokeWidth="0.7" />
          <line x1="640" y1="210" x2="1150" y2="210" stroke="#94A3B8" strokeWidth="0.7" />
          <line x1="640" y1="270" x2="1150" y2="270" stroke="#94A3B8" strokeWidth="0.7" />
        </svg>

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3.5">
              <FvcCrest size={52} />
              <div>
                <div className="text-lg sm:text-xl font-bold font-display text-white">
                  Future Vision Capital
                </div>
                <div className="text-xs font-medium text-[#D6A84B]">
                  Together We Build a Better Financial Future · একত্রে গড়ি সমৃদ্ধ আগামী
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-[#D6A84B] mb-1">
                সদস্য ও অ্যাডমিন পোর্টাল (ইউজার আইডি ও পাসওয়ার্ড সুরক্ষিত)
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-white">
                স্বাগতম — নিরাপদ সমবায় ও আর্থিক ব্যবস্থাপনা
              </h1>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                অ্যাডমিন প্যানেলের নির্ধারিত ইউজার আইডি-পাসওয়ার্ড এবং ১১১ জন সদস্যের ব্যক্তিগত
                লগইন পোর্টালের মাধ্যমে কিস্তি, ভর্তি ফি, ডিজিটাল মানি রিসিট ও বিনিয়োগ হিসাব
                স্থায়ীভাবে সংরক্ষিত থাকে।
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-200 pt-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D6A84B]" />
                <span>মাল্টি-অ্যাডমিন ও সদস্য রোল-ভিত্তিক প্রবেশাধিকার</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#087F68]" />
                <span>Firebase Auth ও Firestore Rules দ্বারা সুরক্ষিত</span>
              </div>
            </div>
          </div>

          {isAuthenticated && (
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-5 min-w-[270px]">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold border-2 border-[#D6A84B]"
                  style={{ backgroundColor: currentUser.avatarColor }}
                >
                  {getInitials(currentUser.fullName)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {currentUser.fullName}
                  </div>
                  <div className="text-xs font-mono-id text-[#D6A84B]">
                    {currentUser.id}
                    {authUserId ? ` · ID: ${authUserId}` : ''}
                  </div>
                  {authEmail && !authEmail.endsWith('@auth.futurevisioncapital.org') && (
                    <div className="text-[11px] text-slate-300 truncate">{authEmail}</div>
                  )}
                  <div className="text-[11px] text-[#F1CE7C] mt-0.5">
                    {currentRole === 'SUPER_ADMIN'
                      ? 'সুপার অ্যাডমিন'
                      : currentRole === 'TREASURER'
                      ? 'কোষাধ্যক্ষ / অ্যাডমিন'
                      : 'সাধারণ সদস্য'}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                লগআউট (Sign Out)
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Dual Mode: A. User ID & Password + Google Login OR B. Authenticated Member Portal */}
      {!isAuthenticated ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Segmented Auth Mode Tabs */}
              <div className="flex items-center gap-1 p-1 bg-[#F3F6FA] rounded-lg w-fit mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('LOGIN');
                    setLocalError(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    authTab === 'LOGIN'
                      ? 'bg-white text-[#10243A] shadow-xs'
                      : 'text-slate-600 hover:text-[#10243A]'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#087F68]" />
                  ইউজার আইডি ও পাসওয়ার্ড লগইন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('REGISTER');
                    setLocalError(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    authTab === 'REGISTER'
                      ? 'bg-white text-[#10243A] shadow-xs'
                      : 'text-slate-600 hover:text-[#10243A]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#10243A]" />
                  নতুন সদস্য রেজিস্ট্রেশন
                </button>
              </div>

              {displayedError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 font-medium leading-relaxed">
                  {displayedError}
                </div>
              )}

              {authTab === 'LOGIN' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#10243A]">
                      অ্যাডমিন বা সদস্য অ্যাকাউন্টে লগইন করুন
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      আপনার নির্ধারিত ইউজার আইডি (যেমন: <span className="font-mono-id font-semibold">admin1</span> অথবা{' '}
                      <span className="font-mono-id font-semibold">FVC-078</span>) ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#10243A] mb-1">
                        ইউজার আইডি / ইমেইল
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        value={loginUserId}
                        onChange={(e) => setLoginUserId(e.target.value)}
                        placeholder="যেমন: FVC-002 বা FVC-078 বা admin.rashed"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#10243A] mb-1">
                        পাসওয়ার্ড
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="আপনার গোপন পাসওয়ার্ড দিন"
                          className="w-full px-3.5 py-2.5 pr-10 text-sm bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#10243A] p-1 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={authBusy}
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg bg-[#087F68] hover:bg-[#066956] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-[#F1CE7C]" />
                      {authBusy ? 'যাচাই হচ্ছে...' : 'লগইন করুন'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <h2 className="text-lg font-bold text-[#10243A]">
                      সাধারণ সদস্য নিজের ইউজার আইডি ও পাসওয়ার্ড সেট করুন
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      সদস্য আইডি (FVC-001 থেকে FVC-111) নির্বাচন করে নিজের নতুন লগইন অ্যাকাউন্ট তৈরি করুন।
                      অ্যাডমিন অ্যাকাউন্ট কেবল সুপার অ্যাডমিন প্যানেল থেকে তৈরি করা যাবে।
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#10243A] mb-1">
                        পছন্দের ইউজার আইডি (ইংরেজিতে)
                      </label>
                      <input
                        type="text"
                        required
                        value={regUserId}
                        onChange={(e) => setRegUserId(e.target.value)}
                        placeholder="যেমন: FVC-078 বা mahfuz78"
                        className="w-full px-3 py-2 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#10243A] mb-1">
                        সদস্য আইডি নম্বর
                      </label>
                      <input
                        type="text"
                        required
                        value={regMemberId}
                        onChange={(e) => setRegMemberId(e.target.value.toUpperCase())}
                        placeholder="FVC-078"
                        className="w-full px-3 py-2 text-xs font-mono-id bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#10243A] mb-1">
                      আপনার পূর্ণ নাম
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="সদস্য নিবন্ধন অনুযায়ী আপনার নাম"
                      className="w-full px-3 py-2 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#10243A] mb-1">
                        নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="******"
                        className="w-full px-3 py-2 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#10243A] mb-1">
                        পাসওয়ার্ড নিশ্চিত করুন
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="******"
                        className="w-full px-3 py-2 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authBusy}
                    className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg bg-[#10243A] hover:bg-[#193554] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-[#D6A84B]" />
                    {authBusy ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'সদস্য অ্যাকাউন্ট তৈরি ও লগইন করুন'}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                সুপার অ্যাডমিন / Google অ্যাকাউন্ট ব্যবহারকারীর জন্য:
              </span>
              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={authBusy}
                className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#10243A] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 text-[#087F68]" />
                Google দিয়ে লগইন করুন
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#10243A]">
                অ্যাডমিন ও সদস্য লগইন নির্দেশিকা
              </h3>
              <ul className="space-y-3 text-xs text-slate-700 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#087F68] shrink-0 mt-0.5" />
                  <span>
                    <strong>৪–৫ জন অ্যাডমিনের পৃথক লগইন:</strong> সুপার অ্যাডমিন ড্যাশবোর্ডের{' '}
                    <strong>অ্যাডমিন ও ইউজার অ্যাক্সেস</strong> ট্যাব থেকে ৪–৫ জন নির্বাহী অ্যাডমিনের
                    জন্য আলাদা ইউজার আইডি ও পাসওয়ার্ড তৈরি করে দেওয়া যাবে।
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#087F68] shrink-0 mt-0.5" />
                  <span>
                    <strong>সদস্যদের নিজস্ব আইডি-পাসওয়ার্ড:</strong> প্রত্যেক সদস্য নিজের ইউজার আইডি ও
                    পাসওয়ার্ড দিয়ে লগইন করে কিস্তি, বকেয়া, রিসিট ও ফোরাম দেখতে পারবেন।
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#087F68] shrink-0 mt-0.5" />
                  <span>
                    <strong>অডিট ট্রেইল সুরক্ষা:</strong> যে অ্যাডমিন যে অনুমোদন বা পেমেন্ট এন্ট্রি
                    করবেন, তাঁর নিজস্ব নাম ও আইডি অনুযায়ী অডিট লগ সংরক্ষিত হবে।
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F3F6FA] border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              প্রথমবার চালুর সময় প্রধান সুপার অ্যাডমিন Google দিয়ে লগইন করে ডাটাবেস সিড ও বাকি
              অ্যাডমিনদের ইউজার আইডি-পাসওয়ার্ড তৈরি করে দিতে পারবেন।
            </div>
          </div>
        </div>
      ) : (
        /* B. Authenticated Member Self-Service Portal */
        <div className="space-y-6">
          {/* Member ID Linkage Bar */}
          {onLinkMemberId && members.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-[#10243A]">সংযুক্ত সদস্য প্রোফাইল: </span>
                <span className="text-slate-600">
                  আপনার লগইন অ্যাকাউন্টের সাথে লিংক করা সদস্য আইডি ({currentUser.id})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedLinkId}
                  onChange={(e) => setSelectedLinkId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} — {m.fullName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => onLinkMemberId(selectedLinkId)}
                  className="px-3 py-1.5 rounded-lg bg-[#10243A] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  লিংক আপডেট
                </button>
              </div>
            </div>
          )}

          {/* My Financial Snapshot */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#10243A]">
                আমার আর্থিক চিত্র ({currentUser.id})
              </h2>
              <span className="text-xs text-slate-500">অনুমোদিত লেনদেনের ভিত্তিতে হালনাগাদ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>মোট জমা ভর্তি ফি</span>
                  <UserCheck className="w-4 h-4 text-[#10243A]" />
                </div>
                <div className="text-xl font-bold text-[#10243A] mt-2 tabular-nums">
                  {formatBDT(mySnapshot.admissionPaid)}
                </div>
                <div className="text-[11px] text-[#087F68] mt-1">এককালীন নিবন্ধন পরিশোধিত</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>মোট পরিশোধিত কিস্তি</span>
                  <Wallet className="w-4 h-4 text-[#087F68]" />
                </div>
                <div className="text-xl font-bold text-[#087F68] mt-2 tabular-nums">
                  {formatBDT(mySnapshot.installmentsPaid)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                  মোট {toBengaliDigits(mySnapshot.installmentCount)} টি কিস্তি সম্পন্ন
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>বর্তমান বকেয়া অবস্থা</span>
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      mySnapshot.dueAmount > 0 ? 'text-red-600' : 'text-[#087F68]'
                    }`}
                  />
                </div>
                <div
                  className={`text-xl font-bold mt-2 tabular-nums ${
                    mySnapshot.dueAmount > 0 ? 'text-red-600' : 'text-[#087F68]'
                  }`}
                >
                  {formatBDT(mySnapshot.dueAmount)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {mySnapshot.dueMonths === 0
                    ? 'কোনো বকেয়া নেই (নিয়মিত)'
                    : `${toBengaliDigits(mySnapshot.dueMonths)} মাসের কিস্তি বকেয়া`}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>অর্জিত / সম্ভাব্য লভ্যাংশ</span>
                  <ShieldCheck className="w-4 h-4 text-[#D6A84B]" />
                </div>
                <div className="text-xl font-bold text-[#9E7422] mt-2 tabular-nums">
                  {formatBDT(mySnapshot.projectedDividend)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">মূলধন আনুপাতিক হিসাব</div>
              </div>
            </div>
          </section>

          {/* My Money Receipt Gallery + Cooperative Notices */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#087F68]" />
                  <h3 className="text-sm font-bold text-[#10243A]">
                    আমার মানি রিসিট গ্যালারি ({toBengaliDigits(mySnapshot.myReceipts.length)} টি)
                  </h3>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {mySnapshot.myReceipts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    এই সদস্য আইডির অধীনে এখনো কোনো রিসিট পাওয়া যায়নি। (অ্যাডমিন আপনার অ্যাকাউন্টটি
                    সদস্য আইডির সাথে লিংক করলে পূর্বের রিসিটগুলো দৃশ্যমান হবে)
                  </div>
                ) : (
                  mySnapshot.myReceipts.map((entry) => (
                    <div
                      key={entry.id}
                      className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono-id font-bold text-[#10243A]">
                            {entry.receiptNo || entry.id}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-[#087F68]">
                            {entry.category === 'ADMISSION'
                              ? 'এককালীন ভর্তি ফি'
                              : entry.category === 'DIVIDEND_PAYOUT'
                              ? 'লভ্যাংশ প্রাপ্তি'
                              : `মাসিক কিস্তি (${entry.monthLabel || ''})`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                          তারিখ: {formatDateBn(entry.date)} · অবস্থা:{' '}
                          {entry.status === 'APPROVED' ? 'অনুমোদিত' : 'অনুমোদন অপেক্ষমাণ'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#10243A] tabular-nums">
                          {formatBDT(entry.credit > 0 ? entry.credit : entry.debit)}
                        </span>
                        <button
                          onClick={() => onOpenReceipt(entry)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F3F6FA] hover:bg-[#10243A] text-[#10243A] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          রশিদ
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <div className="lg:col-span-5 space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 bg-[#10243A] text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#D6A84B]" />
                  <h3 className="text-sm font-bold">সমিতির জরুরি নোটিশ ও রেজোলিউশন</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {notices.map((n) => (
                    <div key={n.id} className="p-4 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#10243A]">{n.title}</span>
                        <span
                          className={`text-[10px] font-bold shrink-0 ${
                            n.priority === 'URGENT' ? 'text-red-600' : 'text-[#087F68]'
                          }`}
                        >
                          {n.priority === 'URGENT' ? 'জরুরি' : 'সাধারণ'}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{n.details}</p>
                      <div className="text-[10px] text-slate-400 mt-1.5">
                        প্রকাশ: {formatDateBn(n.createdAt)} · {n.createdBy}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-[#10243A] mb-3">
                  আমার প্রস্তাবনাসমূহ ও ফোরাম স্ট্যাটাস
                </h3>
                {myForumPosts.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    আপনি এখনো কোনো ফোরাম প্রস্তাবনা জমা দেননি। ফোরাম মডিউল থেকে নতুন আলোচনা শুরু
                    করতে পারেন।
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {myForumPosts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-lg bg-[#F3F6FA] border border-slate-200 text-xs"
                      >
                        <div className="font-semibold text-[#10243A]">{p.title}</div>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                          <span>{p.category}</span>
                          <span
                            className={`font-semibold ${
                              p.status === 'APPROVED' ? 'text-[#087F68]' : 'text-amber-700'
                            }`}
                          >
                            {p.status === 'APPROVED' ? 'অনুমোদিত' : 'পর্যালোচনায়'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
