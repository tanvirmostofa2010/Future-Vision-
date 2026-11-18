import React, { useMemo, useState } from 'react';
import {
  Activity,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Download,
  History,
  KeyRound,
  Megaphone,
  Pin,
  Plus,
  Printer,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  AuditLogEntry,
  ForumPost,
  InvestmentProject,
  LedgerEntry,
  Member,
  NoticeItem,
  NoticePriority,
  UserAccountRecord,
  UserRole,
} from '../types/fvc';
import {
  exportToCSV,
  formatBDT,
  formatDateBn,
  INSTALLMENT_MONTHS_2026,
  toBengaliDigits,
} from '../utils/formatters';

interface AdminDashboardPageProps {
  members: Member[];
  ledger: LedgerEntry[];
  investments: InvestmentProject[];
  forumPosts: ForumPost[];
  notices: NoticeItem[];
  auditLogs: AuditLogEntry[];
  userAccounts: UserAccountRecord[];
  currentRole: UserRole;
  onApproveLedger: (id: string) => void;
  onRejectLedger: (id: string, reason: string) => void;
  onApprovePost: (id: string) => void;
  onRejectPost: (id: string, reason: string) => void;
  onVerifyKyc: (memberId: string) => void;
  onCreateNotice: (payload: {
    title: string;
    details: string;
    priority: NoticePriority;
    expiresAt: string;
    isPinned: boolean;
  }) => void;
  onDeleteNotice: (id: string) => void;
  onOpenReceipt: (entry: LedgerEntry) => void;
  onCreateUserAccount: (payload: {
    userId: string;
    password: string;
    displayName: string;
    role: UserRole;
    linkedMemberId: string;
  }) => Promise<void>;
  onUpdateUserAccess: (
    account: UserAccountRecord,
    newRole: UserRole,
    newLinkedMemberId: string
  ) => Promise<void>;
}

const DONUT_COLORS = ['#10243A', '#087F68', '#D6A84B', '#2563EB', '#64748B'];

const EXECUTIVE_ADMIN_PRESETS: Array<{
  userId: string;
  memberId: string;
  title: string;
  role: UserRole;
}> = [
  { userId: 'FVC-001', memberId: 'FVC-001', title: 'সভাপতি (সুপার অ্যাডমিন)', role: 'SUPER_ADMIN' },
  { userId: 'FVC-002', memberId: 'FVC-002', title: 'সাধারণ সম্পাদক (অ্যাডমিন)', role: 'SUPER_ADMIN' },
  { userId: 'FVC-003', memberId: 'FVC-003', title: 'কোষাধ্যক্ষ (ট্রেজারার)', role: 'TREASURER' },
  { userId: 'FVC-004', memberId: 'FVC-004', title: 'সহ-সভাপতি (অ্যাডমিন)', role: 'SUPER_ADMIN' },
  { userId: 'FVC-006', memberId: 'FVC-006', title: 'প্রকল্প সমন্বয়ক (ট্রেজারার)', role: 'TREASURER' },
];

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  members,
  ledger,
  investments,
  forumPosts,
  notices,
  auditLogs,
  userAccounts,
  currentRole,
  onApproveLedger,
  onRejectLedger,
  onApprovePost,
  onRejectPost,
  onVerifyKyc,
  onCreateNotice,
  onDeleteNotice,
  onOpenReceipt,
  onCreateUserAccount,
  onUpdateUserAccess,
}) => {
  const [dashboardSection, setDashboardSection] = useState<'OVERVIEW' | 'ACCESS'>('OVERVIEW');
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [ledgerTab, setLedgerTab] = useState<'LEDGER' | 'AUDIT'>('LEDGER');

  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeDetails, setNoticeDetails] = useState('');
  const [noticePriority, setNoticePriority] = useState<NoticePriority>('URGENT');
  const [noticeExpires, setNoticeExpires] = useState('2026-12-31');
  const [noticePinned, setNoticePinned] = useState(true);

  // Admin & Member Account Provisioning Form State
  const [newUserId, setNewUserId] = useState('FVC-002');
  const [newDisplayName, setNewDisplayName] = useState(
    members.find((m) => m.id === 'FVC-002')?.fullName || 'মোঃ আরিফুল ইসলাম'
  );
  const [newRole, setNewRole] = useState<UserRole>('SUPER_ADMIN');
  const [newLinkedMemberId, setNewLinkedMemberId] = useState('FVC-002');
  const [newPassword, setNewPassword] = useState('');
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessFeedback, setAccessFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [rowEdits, setRowEdits] = useState<
    Record<string, { role: UserRole; linkedMemberId: string }>
  >({});

  const isAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'TREASURER';

  const handleApplyPreset = (preset: (typeof EXECUTIVE_ADMIN_PRESETS)[number]) => {
    const m = members.find((x) => x.id === preset.memberId);
    setNewUserId(preset.userId);
    setNewLinkedMemberId(preset.memberId);
    setNewRole(preset.role);
    setNewDisplayName(m?.fullName || preset.title);
    setAccessFeedback(null);
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessFeedback(null);
    if (!newUserId.trim() || !newDisplayName.trim() || newPassword.length < 6) {
      setAccessFeedback({
        type: 'error',
        text: 'সঠিক ইউজার আইডি, পূর্ণ নাম এবং কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।',
      });
      return;
    }
    setAccessBusy(true);
    try {
      await onCreateUserAccount({
        userId: newUserId.trim(),
        password: newPassword,
        displayName: newDisplayName.trim(),
        role: newRole,
        linkedMemberId: newLinkedMemberId,
      });
      setAccessFeedback({
        type: 'success',
        text: `সফলভাবে "${newUserId.trim()}" (${
          newRole === 'MEMBER' ? 'সাধারণ সদস্য' : 'অ্যাডমিন'
        }) অ্যাকাউন্ট তৈরি ও ডাটাবেসে সংযুক্ত হয়েছে।`,
      });
      setNewPassword('');
    } catch (err) {
      setAccessFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে।',
      });
    } finally {
      setAccessBusy(false);
    }
  };

  const handleSaveRowAccess = async (acct: UserAccountRecord) => {
    const edited = rowEdits[acct.uid] || {
      role: acct.role,
      linkedMemberId: acct.linkedMemberId,
    };
    setAccessBusy(true);
    setAccessFeedback(null);
    try {
      await onUpdateUserAccess(acct, edited.role, edited.linkedMemberId);
      setAccessFeedback({
        type: 'success',
        text: `${acct.displayName} (${acct.userId || acct.linkedMemberId})-এর রোল ও সদস্য লিংক আপডেট হয়েছে।`,
      });
    } catch (err) {
      setAccessFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'আপডেট করতে সমস্যা হয়েছে।',
      });
    } finally {
      setAccessBusy(false);
    }
  };

  // Core KPI Calculations strictly from APPROVED ledger entries
  const kpis = useMemo(() => {
    let collectedCapital = 0;
    let activeInvestmentOut = 0;
    let realizedReturn = 0;
    let operatingExpense = 0;
    let dividendPaid = 0;

    for (const entry of ledger) {
      if (entry.status !== 'APPROVED') continue;
      if (entry.category === 'ADMISSION' || entry.category === 'INSTALLMENT') {
        collectedCapital += entry.credit;
      } else if (entry.category === 'INVESTMENT_OUT') {
        activeInvestmentOut += entry.debit;
      } else if (entry.category === 'INVESTMENT_RETURN') {
        realizedReturn += entry.credit;
      } else if (entry.category === 'EXPENSE') {
        operatingExpense += entry.debit;
      } else if (entry.category === 'DIVIDEND_PAYOUT') {
        dividendPaid += entry.debit;
      }
    }

    const totalInflow = collectedCapital + realizedReturn;
    const totalOutflow = activeInvestmentOut + operatingExpense + dividendPaid;
    const cashInHand = totalInflow - totalOutflow;
    const netProfit = realizedReturn - operatingExpense;

    return {
      totalMembers: members.length,
      collectedCapital,
      activeInvestmentOut,
      cashInHand,
      netProfit,
      totalInflow,
      totalOutflow,
    };
  }, [members.length, ledger]);

  // Monthly Installment Trend Data (Jan - Nov 2026)
  const monthlyTrend = useMemo(() => {
    const months = INSTALLMENT_MONTHS_2026.slice(0, 11);
    return months.map((mo) => {
      const sum = ledger
        .filter((e) => e.status === 'APPROVED' && e.category === 'INSTALLMENT')
        .reduce((s, e) => {
          if (e.coveredMonths && e.coveredMonths.length > 0) {
            if (e.coveredMonths.includes(mo.key)) {
              return s + e.credit / e.coveredMonths.length;
            }
            return s;
          }
          return e.monthKey === mo.key ? s + e.credit : s;
        }, 0);
      return {
        key: mo.key,
        shortLabel: mo.label.split(' ')[0].slice(0, 4),
        fullLabel: mo.label,
        amount: Math.round(sum),
      };
    });
  }, [ledger]);

  const maxMonthlyAmount = useMemo(
    () => Math.max(1, ...monthlyTrend.map((m) => m.amount)),
    [monthlyTrend]
  );

  // Investment Sector Allocation Donut Data
  const sectorData = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of investments) {
      if (inv.capitalInvested <= 0) continue;
      map.set(inv.category, (map.get(inv.category) ?? 0) + inv.capitalInvested);
    }
    const entries = Array.from(map.entries()).map(([category, amount], idx) => ({
      category,
      amount,
      color: DONUT_COLORS[idx % DONUT_COLORS.length],
    }));
    const total = entries.reduce((s, e) => s + e.amount, 0) || 1;
    let cumulative = 0;
    return entries.map((e) => {
      const pct = (e.amount / total) * 100;
      const start = cumulative;
      cumulative += pct;
      return { ...e, pct, start };
    });
  }, [investments]);

  // Approval Queue Items
  const pendingLedgerItems = useMemo(
    () => ledger.filter((e) => e.status === 'PENDING'),
    [ledger]
  );
  const pendingPosts = useMemo(
    () => forumPosts.filter((p) => p.status === 'PENDING'),
    [forumPosts]
  );
  const pendingKycMembers = useMemo(
    () => members.filter((m) => m.kycStatus === 'PENDING'),
    [members]
  );

  const totalPendingQueue =
    pendingLedgerItems.length + pendingPosts.length + pendingKycMembers.length;

  const handleNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeDetails.trim()) return;
    onCreateNotice({
      title: noticeTitle.trim(),
      details: noticeDetails.trim(),
      priority: noticePriority,
      expiresAt: noticeExpires,
      isPinned: noticePinned,
    });
    setNoticeTitle('');
    setNoticeDetails('');
  };

  const handleExportLedgerCSV = () => {
    const headers = [
      'TXN ID',
      'Date',
      'Category',
      'Description',
      'Member ID',
      'Debit',
      'Credit',
      'Status',
      'Approved By',
    ];
    const rows = ledger
      .slice()
      .reverse()
      .map((e) => [
        e.id,
        e.date,
        e.category,
        e.description,
        e.memberId || '',
        e.debit,
        e.credit,
        e.status,
        e.approvedBy,
      ]);
    exportToCSV('FVC_Double_Entry_Ledger.csv', headers, rows);
  };

  const adminAccountCount = useMemo(
    () => userAccounts.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'TREASURER').length,
    [userAccounts]
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Section Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#10243A]">
            অ্যাডমিন ড্যাশবোর্ড ও সুপারভিশন
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            তাৎক্ষণিক ডাবল-এন্ট্রি আর্থিক সারসংক্ষেপ, অনুমোদন কিউ, এবং ৪–৫ জন অ্যাডমিন ও সদস্য লগইন ব্যবস্থাপনা
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => setDashboardSection('OVERVIEW')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap ${
                dashboardSection === 'OVERVIEW'
                  ? 'bg-[#10243A] text-white'
                  : 'text-slate-600 hover:text-[#10243A]'
              }`}
            >
              সারসংক্ষেপ ও অনুমোদন
            </button>
            <button
              type="button"
              onClick={() => setDashboardSection('ACCESS')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap ${
                dashboardSection === 'ACCESS'
                  ? 'bg-[#087F68] text-white'
                  : 'text-slate-600 hover:text-[#10243A]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              অ্যাডমিন ও ইউজার অ্যাক্সেস ({toBengaliDigits(userAccounts.length)})
            </button>
          </div>

          <button
            onClick={handleExportLedgerCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#10243A] cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-[#087F68]" />
            পূর্ণ লেজার CSV এক্সপোর্ট
          </button>
        </div>
      </div>

      {dashboardSection === 'ACCESS' ? (
        <div className="space-y-6">
          {/* Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">সক্রিয় অ্যাডমিন প্যানেল ইউজার</div>
              <div className="text-2xl font-bold text-[#10243A] mt-1 tabular-nums">
                {toBengaliDigits(adminAccountCount)} জন
              </div>
              <div className="text-[11px] text-[#087F68] mt-1">
                সুপার অ্যাডমিন ও কোষাধ্যক্ষ অ্যাক্সেস
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">নিবন্ধিত সাধারণ সদস্য লগইন</div>
              <div className="text-2xl font-bold text-[#087F68] mt-1 tabular-nums">
                {toBengaliDigits(userAccounts.length - adminAccountCount)} জন
              </div>
              <div className="text-[11px] text-slate-500 mt-1">ইউজার আইডি ও পাসওয়ার্ড যুক্ত</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">মোট নিবন্ধিত পোর্টাল অ্যাকাউন্ট</div>
              <div className="text-2xl font-bold text-[#10243A] mt-1 tabular-nums">
                {toBengaliDigits(userAccounts.length)} টি
              </div>
              <div className="text-[11px] text-slate-500 mt-1">সকল লগইন Firestore-এ সংরক্ষিত</div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Create Admin / Member User ID & Password Form */}
            <section className="xl:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 bg-[#10243A] text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#D6A84B]" />
                <h2 className="text-sm font-bold">
                  নতুন অ্যাডমিন বা সদস্য অ্যাকাউন্ট তৈরি করুন
                </h2>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-[#10243A] mb-2">
                    ৫ জন নির্বাহী অ্যাডমিনের দ্রুত প্রিসেট নির্বাচন:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {EXECUTIVE_ADMIN_PRESETS.map((preset) => {
                      const exists = userAccounts.some(
                        (u) => u.linkedMemberId === preset.memberId
                      );
                      return (
                        <button
                          key={preset.memberId}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
                            newLinkedMemberId === preset.memberId
                              ? 'bg-[#10243A] text-white border-[#10243A]'
                              : exists
                              ? 'bg-[#087F68]/10 text-[#087F68] border-[#087F68]/30'
                              : 'bg-[#F3F6FA] text-slate-700 border-slate-200 hover:border-[#087F68]'
                          }`}
                        >
                          {preset.memberId} · {preset.title.split(' ')[0]}
                          {exists ? ' (সক্রিয়)' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {accessFeedback && (
                  <div
                    className={`p-3 rounded-lg border text-xs font-medium leading-relaxed ${
                      accessFeedback.type === 'success'
                        ? 'bg-[#087F68]/10 border-[#087F68]/30 text-[#065F4D]'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    {accessFeedback.text}
                  </div>
                )}

                <form onSubmit={handleCreateAccountSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#10243A] mb-1">
                        ইউজার আইডি (Login ID)
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!isAdmin || accessBusy}
                        value={newUserId}
                        onChange={(e) => setNewUserId(e.target.value)}
                        placeholder="যেমন: FVC-002 বা admin.rashed"
                        className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg font-mono-id focus:outline-none focus:border-[#087F68]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#10243A] mb-1">
                        ভূমিকা / রোল (Role)
                      </label>
                      <select
                        disabled={!isAdmin || accessBusy}
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                      >
                        <option value="SUPER_ADMIN">সুপার অ্যাডমিন (পূর্ণ নিয়ন্ত্রণ)</option>
                        <option value="TREASURER">কোষাধ্যক্ষ / অ্যাডমিন (আর্থিক ও অনুমোদন)</option>
                        <option value="MEMBER">সাধারণ সদস্য (নিজস্ব পোর্টাল)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#10243A] mb-1">
                      সংযুক্ত সদস্য আইডি (১–১১১)
                    </label>
                    <select
                      disabled={!isAdmin || accessBusy}
                      value={newLinkedMemberId}
                      onChange={(e) => {
                        const mId = e.target.value;
                        setNewLinkedMemberId(mId);
                        const found = members.find((m) => m.id === mId);
                        if (found) setNewDisplayName(found.fullName);
                      }}
                      className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id} — {m.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#10243A] mb-1">
                      ব্যবহারকারীর নাম
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isAdmin || accessBusy}
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      placeholder="পূর্ণ নাম লিখুন"
                      className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#10243A] mb-1">
                      লগইন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      disabled={!isAdmin || accessBusy}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="একটি শক্তিশালী পাসওয়ার্ড দিন"
                      className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isAdmin || accessBusy}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#087F68] hover:bg-[#066956] disabled:bg-slate-300 text-white font-semibold cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-[#F1CE7C]" />
                    {accessBusy ? 'সংরক্ষণ হচ্ছে...' : 'ইউজার আইডি ও পাসওয়ার্ড তৈরি করুন'}
                  </button>
                </form>
              </div>
            </section>

            {/* Registered Accounts Table */}
            <section className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#087F68]" />
                  <h2 className="text-sm font-bold text-[#10243A]">
                    নিবন্ধিত অ্যাডমিন ও মেম্বার অ্যাকাউন্টসমূহ
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  সর্বোচ্চ ৪–৫ জন অ্যাডমিন ও ১১১ সদস্য
                </span>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#F3F6FA] border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="py-2.5 px-4">ইউজার আইডি</th>
                      <th className="py-2.5 px-4">নাম</th>
                      <th className="py-2.5 px-4">সদস্য লিংক</th>
                      <th className="py-2.5 px-4">রোল (Role)</th>
                      <th className="py-2.5 px-4 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {userAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          এখনো কোনো নিবন্ধিত অ্যাকাউন্ট পাওয়া যায়নি। বাম পাশের ফর্ম থেকে অ্যাকাউন্ট
                          তৈরি করুন।
                        </td>
                      </tr>
                    ) : (
                      userAccounts.map((acct) => {
                        const editState = rowEdits[acct.uid] || {
                          role: acct.role,
                          linkedMemberId: acct.linkedMemberId,
                        };
                        const dirty =
                          editState.role !== acct.role ||
                          editState.linkedMemberId !== acct.linkedMemberId;
                        return (
                          <tr key={acct.uid} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-mono-id font-bold text-[#10243A]">
                              {acct.userId || acct.linkedMemberId}
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-[#10243A]">{acct.displayName}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                                {acct.email}
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <select
                                disabled={!isAdmin || accessBusy}
                                value={editState.linkedMemberId}
                                onChange={(e) =>
                                  setRowEdits((prev) => ({
                                    ...prev,
                                    [acct.uid]: {
                                      ...editState,
                                      linkedMemberId: e.target.value,
                                    },
                                  }))
                                }
                                className="px-2 py-1 text-xs bg-[#F3F6FA] border border-slate-200 rounded-md font-mono-id"
                              >
                                {members.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.id}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2.5 px-4">
                              <select
                                disabled={!isAdmin || accessBusy}
                                value={editState.role}
                                onChange={(e) =>
                                  setRowEdits((prev) => ({
                                    ...prev,
                                    [acct.uid]: {
                                      ...editState,
                                      role: e.target.value as UserRole,
                                    },
                                  }))
                                }
                                className={`px-2 py-1 text-xs border rounded-md font-semibold ${
                                  editState.role === 'MEMBER'
                                    ? 'bg-[#F3F6FA] border-slate-200 text-slate-700'
                                    : 'bg-[#087F68]/10 border-[#087F68]/30 text-[#087F68]'
                                }`}
                              >
                                <option value="SUPER_ADMIN">সুপার অ্যাডমিন</option>
                                <option value="TREASURER">কোষাধ্যক্ষ</option>
                                <option value="MEMBER">সাধারণ সদস্য</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                type="button"
                                disabled={!isAdmin || accessBusy || !dirty}
                                onClick={() => handleSaveRowAccess(acct)}
                                className="px-3 py-1 rounded-md bg-[#10243A] hover:bg-[#193554] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold cursor-pointer"
                              >
                                সংরক্ষণ
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <>

      {/* Top 5 Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>মোট সদস্য</span>
            <Users className="w-4 h-4 text-[#10243A]" />
          </div>
          <div className="text-2xl font-bold text-[#10243A] mt-2 tabular-nums">
            {toBengaliDigits(kpis.totalMembers)} জন
          </div>
          <div className="text-[11px] text-[#087F68] mt-1 font-medium">সমবায় কোটা পূর্ণ</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>মোট সংগৃহীত মূলধন</span>
            <Activity className="w-4 h-4 text-[#087F68]" />
          </div>
          <div className="text-xl font-bold text-[#10243A] mt-2 tabular-nums">
            {formatBDT(kpis.collectedCapital)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">অনুমোদিত ভর্তি ও কিস্তি</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>মোট সক্রিয় বিনিয়োগ</span>
            <Briefcase className="w-4 h-4 text-[#10243A]" />
          </div>
          <div className="text-xl font-bold text-[#10243A] mt-2 tabular-nums">
            {formatBDT(kpis.activeInvestmentOut)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">জমি, এগ্রো ও ট্রেডিং</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>ক্যাশ ইন হ্যান্ড / ব্যাংক</span>
            <Wallet className="w-4 h-4 text-[#087F68]" />
          </div>
          <div className="text-xl font-bold text-[#087F68] mt-2 tabular-nums">
            {formatBDT(kpis.cashInHand)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">তরল ব্যবহারযোগ্য অর্থ</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>নেট প্রফিট / লস</span>
            <TrendingUp className="w-4 h-4 text-[#D6A84B]" />
          </div>
          <div
            className={`text-xl font-bold mt-2 tabular-nums ${
              kpis.netProfit >= 0 ? 'text-[#087F68]' : 'text-red-600'
            }`}
          >
            {formatBDT(kpis.netProfit)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">রিয়ালাইজড আয় - ব্যয়</div>
        </div>
      </div>

      {/* Interactive SVG Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Monthly Installment Collection Trend (Bar Chart) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#10243A]">
                মাসিক কিস্তি আদায় ট্রেন্ড (২০২৬)
              </h2>
              <p className="text-[11px] text-slate-500">
                প্রতি মাসের অনুমোদিত কিস্তি সংগ্রহের চিত্র
              </p>
            </div>
            {hoveredMonth && (
              <span className="text-xs font-bold text-[#087F68] tabular-nums">
                {hoveredMonth}
              </span>
            )}
          </div>

          <div className="h-52 flex items-end gap-2 pt-4 pb-2">
            {monthlyTrend.map((m) => {
              const heightPct = Math.max(8, Math.round((m.amount / maxMonthlyAmount) * 100));
              return (
                <div
                  key={m.key}
                  onMouseEnter={() =>
                    setHoveredMonth(`${m.fullLabel}: ${formatBDT(m.amount)}`)
                  }
                  onMouseLeave={() => setHoveredMonth(null)}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
                >
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      className="w-full max-w-[28px] rounded-t-md bg-[#10243A] group-hover:bg-[#087F68] transition-colors"
                      style={{ height: `${heightPct}%` }}
                      title={`${m.fullLabel}: ${formatBDT(m.amount)}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {m.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sector Allocation Donut Chart */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#10243A]">বিনিয়োগ খাত বণ্টন</h2>
            <p className="text-[11px] text-slate-500">খাতভিত্তিক পোর্টফোলিও শেয়ার</p>
          </div>

          <div className="my-4 flex items-center justify-center">
            <svg width="144" height="144" viewBox="0 0 42 42" className="-rotate-90">
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke="#F1F5F9"
                strokeWidth="6"
              />
              {sectorData.map((seg) => (
                <circle
                  key={seg.category}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="6"
                  strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                  strokeDashoffset={-seg.start}
                />
              ))}
            </svg>
          </div>

          <div className="space-y-1.5 text-[11px]">
            {sectorData.map((seg) => (
              <div key={seg.category} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-slate-700 truncate">{seg.category}</span>
                </div>
                <span className="font-semibold text-[#10243A] tabular-nums shrink-0">
                  {toBengaliDigits(seg.pct.toFixed(0))}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cash-Flow Tracker (Inflow vs Outflow) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#10243A]">ক্যাশ-ফ্লো ট্র্যাকার</h2>
            <p className="text-[11px] text-slate-500">মোট ইনফ্লো বনাম আউটফ্লো</p>
          </div>

          <div className="space-y-4 my-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-600">মোট ইনফ্লো (আয়/জমা)</span>
                <span className="font-bold text-[#087F68] tabular-nums">
                  {formatBDT(kpis.totalInflow)}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#087F68] rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-600">মোট আউটফ্লো (বিনিয়োগ/ব্যয়)</span>
                <span className="font-bold text-[#10243A] tabular-nums">
                  {formatBDT(kpis.totalOutflow)}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D6A84B] rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((kpis.totalOutflow / Math.max(1, kpis.totalInflow)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">নিট অবশিষ্ট রিজার্ভ:</span>
            <span className="font-bold text-[#087F68] tabular-nums">
              {formatBDT(kpis.cashInHand)}
            </span>
          </div>
        </div>
      </div>

      {/* Approval Queue & Emergency Notice Management */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Approval Queue */}
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 bg-[#10243A] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#D6A84B]" />
              <h2 className="text-sm font-bold">অনুমোদনের অপেক্ষমাণ তালিকা (Approval Queue)</h2>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#D6A84B] text-[#10243A] text-xs font-bold tabular-nums">
              {toBengaliDigits(totalPendingQueue)} টি
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
            {totalPendingQueue === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                বর্তমানে কোনো অনুমোদন অপেক্ষমাণ নেই। সকল কার্যক্রম হালনাগাদ।
              </div>
            ) : (
              <>
                {pendingLedgerItems.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono-id font-bold text-[#087F68]">{item.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#10243A]">
                          {item.category === 'EXPENSE'
                            ? 'খরচের ভাউচার'
                            : item.category === 'ADMISSION'
                            ? 'ভর্তি ফি'
                            : 'কিস্তি পেমেন্ট'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-[#10243A] tabular-nums">
                          {formatBDT(item.credit > 0 ? item.credit : item.debit)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-2 shrink-0">
                        {rejectingId === item.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value)}
                              placeholder="বাতিলের কারণ..."
                              className="px-2 py-1 text-xs border border-red-300 rounded-md w-36"
                            />
                            <button
                              onClick={() => {
                                onRejectLedger(item.id, rejectNote || 'অসম্পূর্ণ ভাউচার');
                                setRejectingId(null);
                                setRejectNote('');
                              }}
                              className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold cursor-pointer"
                            >
                              নিশ্চিত
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => onApproveLedger(item.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#087F68] hover:bg-[#066956] text-white text-xs font-semibold cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              অনুমোদন করুন
                            </button>
                            <button
                              onClick={() => setRejectingId(item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              বাতিল
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {pendingPosts.map((post) => (
                  <div key={post.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono-id font-bold text-[#9E7422]">{post.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#10243A]">পেন্ডিং ফোরাম পোস্ট</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-500">{post.category}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 mt-1">{post.title}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onApprovePost(post.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#087F68] text-white text-xs font-semibold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          অনুমোদন করুন
                        </button>
                        <button
                          onClick={() => onRejectPost(post.id, 'অসম্পূর্ণ প্রস্তাবনা')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          বাতিল
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {pendingKycMembers.map((m) => (
                  <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono-id font-bold text-[#10243A]">{m.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-amber-700">সদস্য KYC যাচাইকরণ</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">
                        {m.fullName} ({m.mobile}) — {m.occupation}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => onVerifyKyc(m.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#10243A] text-white text-xs font-semibold cursor-pointer shrink-0"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#D6A84B]" />
                        KYC অনুমোদন
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {/* Emergency Notice Board Management */}
        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-[#10243A] text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#D6A84B]" />
            <h2 className="text-sm font-bold">জরুরি নোটিশ বোর্ড পরিচালনা</h2>
          </div>

          <form onSubmit={handleNoticeSubmit} className="p-4 border-b border-slate-200 space-y-3 text-xs">
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="নোটিশের শিরোনাম লিখুন..."
              className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68] disabled:opacity-60"
            />
            <textarea
              rows={2}
              required
              disabled={!isAdmin}
              value={noticeDetails}
              onChange={(e) => setNoticeDetails(e.target.value)}
              placeholder="বিস্তারিত নোটিশ যা মেম্বার পোর্টাল ও টপ ব্যানারে দেখাবে..."
              className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68] disabled:opacity-60"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                disabled={!isAdmin}
                value={noticePriority}
                onChange={(e) => setNoticePriority(e.target.value as NoticePriority)}
                className="px-2.5 py-1.5 bg-[#F3F6FA] border border-slate-200 rounded-lg"
              >
                <option value="URGENT">প্রায়োরিটি: জরুরি</option>
                <option value="NORMAL">প্রায়োরিটি: সাধারণ</option>
              </select>
              <input
                type="date"
                disabled={!isAdmin}
                value={noticeExpires}
                onChange={(e) => setNoticeExpires(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F3F6FA] border border-slate-200 rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-1.5 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noticePinned}
                  onChange={(e) => setNoticePinned(e.target.checked)}
                />
                <span>টপ ব্যানারে পিন করুন</span>
              </label>
              <button
                type="submit"
                disabled={!isAdmin}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#087F68] hover:bg-[#066956] disabled:bg-slate-300 text-white font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                প্রকাশ করুন
              </button>
            </div>
          </form>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {notices.map((n) => (
              <div key={n.id} className="p-3.5 text-xs flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-[#10243A]">
                    {n.isPinned && <Pin className="w-3 h-3 text-[#D6A84B]" />}
                    <span>{n.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{n.details}</p>
                  <div className="text-[10px] text-slate-400 mt-1">
                    মেয়াদ: {formatDateBn(n.expiresAt)} · {n.priority === 'URGENT' ? 'জরুরি' : 'সাধারণ'}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => onDeleteNotice(n.id)}
                    className="text-[11px] text-red-600 hover:underline shrink-0 cursor-pointer"
                  >
                    মুছুন
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Double-Entry Financial Ledger & Audit Trail */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#F3F6FA] rounded-lg">
            <button
              onClick={() => setLedgerTab('LEDGER')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                ledgerTab === 'LEDGER' ? 'bg-white text-[#10243A] shadow-xs' : 'text-slate-600'
              }`}
            >
              ডাবল-এন্ট্রি আর্থিক লেজার ({toBengaliDigits(ledger.length)})
            </button>
            <button
              onClick={() => setLedgerTab('AUDIT')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer flex items-center gap-1.5 ${
                ledgerTab === 'AUDIT' ? 'bg-white text-[#10243A] shadow-xs' : 'text-slate-600'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              অডিট ট্রেইল ({toBengaliDigits(auditLogs.length)})
            </button>
          </div>
        </div>

        {ledgerTab === 'LEDGER' ? (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#F3F6FA] border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">TXN আইডি</th>
                  <th className="py-2.5 px-4">তারিখ</th>
                  <th className="py-2.5 px-4">খাত ও বিবরণ</th>
                  <th className="py-2.5 px-4 text-right">ডেবিট (আউটফ্লো)</th>
                  <th className="py-2.5 px-4 text-right">ক্রেডিট (ইনফ্লো)</th>
                  <th className="py-2.5 px-4">অবস্থা</th>
                  <th className="py-2.5 px-4 text-right">রিসিট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {ledger
                  .slice()
                  .reverse()
                  .slice(0, 50)
                  .map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono-id font-semibold text-[#10243A]">
                        {entry.id}
                      </td>
                      <td className="py-2.5 px-4 tabular-nums text-slate-600">
                        {formatDateBn(entry.date)}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-[#10243A]">{entry.description}</div>
                        <div className="text-[11px] text-slate-400">
                          অনুমোদন: {entry.approvedBy}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-red-700 tabular-nums">
                        {entry.debit > 0 ? formatBDT(entry.debit) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-[#087F68] tabular-nums">
                        {entry.credit > 0 ? formatBDT(entry.credit) : '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`font-semibold ${
                            entry.status === 'APPROVED'
                              ? 'text-[#087F68]'
                              : entry.status === 'PENDING'
                              ? 'text-amber-700'
                              : 'text-red-600'
                          }`}
                        >
                          {entry.status === 'APPROVED'
                            ? 'অনুমোদিত'
                            : entry.status === 'PENDING'
                            ? 'পেন্ডিং'
                            : 'বাতিল'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => onOpenReceipt(entry)}
                          className="inline-flex items-center gap-1 text-[#10243A] hover:text-[#087F68] font-semibold cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#F3F6FA] border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">সময়</th>
                  <th className="py-2.5 px-4">সম্পাদনকারী</th>
                  <th className="py-2.5 px-4">অ্যাকশন ও টার্গেট</th>
                  <th className="py-2.5 px-4">পূর্বের মান</th>
                  <th className="py-2.5 px-4">নতুন মান</th>
                  <th className="py-2.5 px-4">ট্রানজেকশন হ্যাশ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-[#10243A]">{log.actorName}</div>
                      <div className="font-mono-id text-[10px] text-slate-500">{log.actorId}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-[#087F68]">{log.action}</div>
                      <div className="font-mono-id text-[11px] text-slate-500">{log.target}</div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{log.previousValue}</td>
                    <td className="py-2.5 px-4 font-semibold text-[#10243A]">{log.newValue}</td>
                    <td className="py-2.5 px-4 font-mono-id text-slate-500">{log.txHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
};
