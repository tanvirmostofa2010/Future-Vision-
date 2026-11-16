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
  onLogin: (memberIdOrEmail: string, role?: UserRole) => void;
  onLogout: () => void;
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
  onLogin,
  onLogout,
  onOpenReceipt,
}) => {
  const [identifier, setIdentifier] = useState('FVC-078');
  const [password, setPassword] = useState('••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

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
    const installmentCount = installmentEntries.length;
    const dueMonths = Math.max(0, TOTAL_EXPECTED_MONTHS_YTD - installmentCount);
    const dueAmount = dueMonths * MONTHLY_INSTALLMENT_AMOUNT;
    const actualDividend = myEntries
      .filter((e) => e.category === 'DIVIDEND_PAYOUT')
      .reduce((s, e) => s + e.debit, 0);

    // Estimate projected dividend share from cooperative realized net profit
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

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = identifier.trim().toUpperCase();
    const matched = members.find(
      (m) => m.id === cleaned || m.email.toLowerCase() === identifier.trim().toLowerCase()
    );
    if (matched) {
      const inferredRole: UserRole =
        matched.id === 'FVC-001'
          ? 'SUPER_ADMIN'
          : matched.id === 'FVC-003'
          ? 'TREASURER'
          : 'MEMBER';
      onLogin(matched.id, inferredRole);
    } else {
      onLogin('FVC-078', 'MEMBER');
    }
  };

  return (
    <div className="space-y-6">
      {/* Corporate Architectural Hero Card (matching Navy + Gold Crest aesthetic) */}
      <section className="relative overflow-hidden rounded-2xl bg-[#10243A] text-white border border-[#1E3A5F]">
        {/* Architectural SVG Backdrop */}
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
                সদস্য ও অ্যাডমিন পোর্টাল
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-white">
                স্বাগতম — নিরাপদ সমবায় ও আর্থিক ব্যবস্থাপনা
              </h1>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                ১১১ জন সদস্যের নির্ভুল কিস্তি, ভর্তি ফি, বিনিয়োগ হিসাব, ডিজিটাল মানি রিসিট এবং
                প্রাতিষ্ঠানিক সিদ্ধান্তসমূহ একক নিরাপদ প্ল্যাটফর্মে।
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-200 pt-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D6A84B]" />
                <span>রোল-ভিত্তিক প্রবেশাধিকার (Super Admin, Treasurer ও General Member)</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#087F68]" />
                <span>ব্যক্তিগত আর্থিক তথ্য সম্পূর্ণ সুরক্ষিত ও এনক্রিপ্টেড</span>
              </div>
            </div>
          </div>

          {isAuthenticated && (
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-5 min-w-[260px]">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold border-2 border-[#D6A84B]"
                  style={{ backgroundColor: currentUser.avatarColor }}
                >
                  {getInitials(currentUser.fullName)}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{currentUser.fullName}</div>
                  <div className="text-xs font-mono-id text-[#D6A84B]">{currentUser.id}</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {currentRole === 'SUPER_ADMIN'
                      ? 'সুপার অ্যাডমিন'
                      : currentRole === 'TREASURER'
                      ? 'কোষাধ্যক্ষ'
                      : 'সাধারণ সদস্য'}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                লগআউট / অ্যাকাউন্ট পরিবর্তন
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Dual Mode: A. Authentication Screen OR B. Authenticated Member Self-Portal */}
      {!isAuthenticated ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Login Form Card */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[#10243A]">পোর্টালে লগইন করুন</h2>
            <p className="text-xs text-slate-500 mt-1">
              আপনার Member ID (যেমন: FVC-078) অথবা নিবন্ধিত Email দিয়ে প্রবেশ করুন।
            </p>

            <form onSubmit={handleFormLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#10243A] mb-1.5">
                  সদস্য আইডি অথবা ইমেইল (Member ID / Email)
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="FVC-078 বা member.078@futurevisioncapital.org"
                  className="w-full px-3.5 py-2.5 text-sm font-mono-id bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10243A] mb-1.5">
                  পাসওয়ার্ড (Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 text-sm bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label="পাসওয়ার্ড দেখুন"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#10243A] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>আমাকে মনে রাখুন (Remember Me)</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotSuccess(false);
                  }}
                  className="font-semibold text-[#087F68] hover:underline cursor-pointer"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#087F68] hover:bg-[#066956] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                নিরাপদ পোর্টালে প্রবেশ করুন
              </button>
            </form>
          </div>

          {/* Role Selector Demo Switcher */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-[#10243A]">
                দ্রুত ভূমিকা পরীক্ষা (Role Demo Switcher)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                যেকোনো ভূমিকা এক ক্লিকে নির্বাচন করে সম্পূর্ণ অ্যাপ্লিকেশন পরীক্ষা করুন:
              </p>

              <div className="mt-5 space-y-3">
                <button
                  onClick={() => onLogin('FVC-001', 'SUPER_ADMIN')}
                  className="w-full p-4 rounded-xl border border-slate-200 hover:border-[#10243A] bg-[#F3F6FA] hover:bg-white text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#10243A]">১. সুপার অ্যাডমিন</span>
                    <span className="font-mono-id text-xs font-semibold text-[#087F68]">
                      FVC-001
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    মোঃ তানভীর মোস্তফা (সভাপতি) — পূর্ণ অনুমোদন, লভ্যাংশ ও নোটিশ অধিকার
                  </p>
                </button>

                <button
                  onClick={() => onLogin('FVC-003', 'TREASURER')}
                  className="w-full p-4 rounded-xl border border-slate-200 hover:border-[#087F68] bg-[#F3F6FA] hover:bg-white text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#10243A]">
                      ২. কোষাধ্যক্ষ (Treasurer)
                    </span>
                    <span className="font-mono-id text-xs font-semibold text-[#087F68]">
                      FVC-003
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    মোঃ রাশেদুল করিম — কিস্তি যাচাই, ভাউচার অনুমোদন ও লেজার পরিচালনা
                  </p>
                </button>

                <button
                  onClick={() => onLogin('FVC-078', 'MEMBER')}
                  className="w-full p-4 rounded-xl border border-slate-200 hover:border-[#D6A84B] bg-[#F3F6FA] hover:bg-white text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#10243A]">
                      ৩. সাধারণ সদস্য (General Member)
                    </span>
                    <span className="font-mono-id text-xs font-semibold text-[#087F68]">
                      FVC-078
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    মোঃ মাহফুজুর রহমান চৌধুরী — ব্যক্তিগত কিস্তি, মানি রিসিট ও ফোরাম পোর্টাল
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* B. Authenticated Member Self-Service Portal */
        <div className="space-y-6">
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
            {/* Money Receipt Gallery */}
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
                {mySnapshot.myReceipts.map((entry) => (
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
                ))}
              </div>
            </section>

            {/* Right Column: Notices & My Forum Proposals */}
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
                    আপনি এখনো কোনো ফোরাম প্রস্তাবনা জমা দেননি। ফোরাম মডিউল থেকে নতুন আলোচনা শুরু করতে পারেন।
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

      {/* Forgot Password Dialog */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10243A]/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#10243A]">
              <KeyRound className="w-5 h-5 text-[#087F68]" />
              <h3 className="text-base font-bold">পাসওয়ার্ড পুনরুদ্ধার</h3>
            </div>
            {forgotSuccess ? (
              <div className="text-xs text-[#087F68] bg-emerald-50 border border-[#087F68]/30 rounded-lg p-3">
                আপনার নিবন্ধিত ইমেইল/মোবাইলে পাসওয়ার্ড রিসেট লিংক ও ওটিপি পাঠানো হয়েছে।
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotSuccess(true);
                }}
                className="space-y-3 text-xs"
              >
                <p className="text-slate-600">
                  আপনার সদস্য আইডি অথবা নিবন্ধিত ইমেইল লিখুন। অ্যাডমিন ভেরিফাইড রিসেট লিংক পাঠানো হবে।
                </p>
                <input
                  type="text"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="FVC-078 বা ইমেইল"
                  className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#087F68] text-white font-semibold cursor-pointer"
                  >
                    রিসেট লিংক পাঠান
                  </button>
                </div>
              </form>
            )}
            {forgotSuccess && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-[#10243A] text-white text-xs font-semibold cursor-pointer"
                >
                  ঠিক আছে
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
