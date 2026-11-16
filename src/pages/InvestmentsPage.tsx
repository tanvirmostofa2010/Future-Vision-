import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  Calculator,
  CheckCircle2,
  Coins,
  Layers,
  PauseCircle,
  Plus,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import {
  DividendMethod,
  InvestmentCategory,
  InvestmentProject,
  InvestmentStatus,
  LedgerEntry,
  Member,
  UserRole,
} from '../types/fvc';
import { formatBDT, formatDateBn, toBengaliDigits } from '../utils/formatters';

interface InvestmentsPageProps {
  investments: InvestmentProject[];
  members: Member[];
  ledger: LedgerEntry[];
  currentRole: UserRole;
  onAddInvestment: (project: InvestmentProject) => void;
  onRecordInvestmentReturn: (investmentId: string, amount: number, note: string) => void;
  onDistributeDividend: (
    totalPool: number,
    method: DividendMethod,
    payouts: { memberId: string; amount: number }[]
  ) => void;
}

const INVESTMENT_CATEGORIES: InvestmentCategory[] = [
  'ব্যবসা',
  'জমি ও রিয়েল এস্টেট',
  'এগ্রো ফার্মিং',
  'পাইকারি ট্রেডিং',
  'পার্টনারশিপ',
  'অন্যান্য',
];

const STATUS_LABELS: Record<InvestmentStatus, { label: string; cls: string }> = {
  ACTIVE: { label: 'চলমান (Active)', cls: 'text-[#087F68]' },
  MATURED: { label: 'সম্পন্ন (Matured)', cls: 'text-[#10243A]' },
  ON_HOLD: { label: 'স্থগিত (On-Hold)', cls: 'text-amber-700' },
};

export const InvestmentsPage: React.FC<InvestmentsPageProps> = ({
  investments,
  members,
  ledger,
  currentRole,
  onAddInvestment,
  onRecordInvestmentReturn,
  onDistributeDividend,
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [returnModalInv, setReturnModalInv] = useState<InvestmentProject | null>(null);
  const [returnAmount, setReturnAmount] = useState<number>(50000);
  const [returnNote, setReturnNote] = useState<string>('ত্রৈমাসিক মুনাফা প্রাপ্তি');
  const [toast, setToast] = useState<string | null>(null);

  // New Investment Form State
  const [invId, setInvId] = useState(`INV-${106 + investments.length}`);
  const [invName, setInvName] = useState('');
  const [invCategory, setInvCategory] = useState<InvestmentCategory>('এগ্রো ফার্মিং');
  const [invDesc, setInvDesc] = useState('');
  const [invDate, setInvDate] = useState('2026-11-15');
  const [invCapital, setInvCapital] = useState(250000);
  const [invDuration, setInvDuration] = useState(12);
  const [invRate, setInvRate] = useState(22);
  const [invChargeMemberId, setInvChargeMemberId] = useState('FVC-006');

  // Automated Dividend Distribution Engine State
  const [dividendPool, setDividendPool] = useState<number>(500000);
  const [dividendMethod, setDividendMethod] = useState<DividendMethod>('PROPORTIONAL');
  const [customPercent, setCustomPercent] = useState<number>(12);

  const isAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'TREASURER';

  // Calculate all Core Financial Metrics strictly from APPROVED Ledger Entries
  const financials = useMemo(() => {
    let totalContributedCapital = 0;
    let totalInvestedOut = 0;
    let totalRealizedReturn = 0;
    let totalOperatingExpenses = 0;
    let totalDividendPaid = 0;

    for (const entry of ledger) {
      if (entry.status !== 'APPROVED') continue;
      if (entry.category === 'ADMISSION' || entry.category === 'INSTALLMENT') {
        totalContributedCapital += entry.credit;
      } else if (entry.category === 'INVESTMENT_OUT') {
        totalInvestedOut += entry.debit;
      } else if (entry.category === 'INVESTMENT_RETURN') {
        totalRealizedReturn += entry.credit;
      } else if (entry.category === 'EXPENSE') {
        totalOperatingExpenses += entry.debit;
      } else if (entry.category === 'DIVIDEND_PAYOUT') {
        totalDividendPaid += entry.debit;
      }
    }

    const availableLiquidFunds =
      totalContributedCapital +
      totalRealizedReturn -
      totalInvestedOut -
      totalOperatingExpenses -
      totalDividendPaid;

    const netDistributableProfit = Math.max(
      0,
      totalRealizedReturn - totalOperatingExpenses - totalDividendPaid
    );

    return {
      totalContributedCapital,
      totalInvestedOut,
      availableLiquidFunds,
      totalRealizedReturn,
      totalOperatingExpenses,
      netDistributableProfit,
    };
  }, [ledger]);

  // Member Installment Contribution Map for Proportional Dividend Calculation
  const memberContributions = useMemo(() => {
    const activeMembers = members.filter((m) => m.status === 'ACTIVE');
    const paidByMember = new Map<string, number>();
    let totalActiveInstallments = 0;

    for (const m of activeMembers) paidByMember.set(m.id, 0);

    for (const entry of ledger) {
      if (entry.status !== 'APPROVED' || !entry.memberId) continue;
      if (entry.category === 'INSTALLMENT' && paidByMember.has(entry.memberId)) {
        paidByMember.set(entry.memberId, (paidByMember.get(entry.memberId) ?? 0) + entry.credit);
        totalActiveInstallments += entry.credit;
      }
    }

    return { activeMembers, paidByMember, totalActiveInstallments };
  }, [members, ledger]);

  const dividendPreview = useMemo(() => {
    const { activeMembers, paidByMember, totalActiveInstallments } = memberContributions;
    if (activeMembers.length === 0) return [];

    return activeMembers.map((m) => {
      const paid = paidByMember.get(m.id) ?? 0;
      const ratio = totalActiveInstallments > 0 ? paid / totalActiveInstallments : 0;
      let payout = 0;

      if (dividendMethod === 'EQUAL') {
        payout = Math.round(dividendPool / activeMembers.length);
      } else if (dividendMethod === 'PROPORTIONAL') {
        payout = Math.round(dividendPool * ratio);
      } else {
        payout = Math.round((paid * customPercent) / 100);
      }

      return {
        member: m,
        paid,
        ratioPercent: ratio * 100,
        payout,
      };
    });
  }, [memberContributions, dividendMethod, dividendPool, customPercent]);

  const totalCalculatedPayout = useMemo(
    () => dividendPreview.reduce((s, r) => s + r.payout, 0),
    [dividendPreview]
  );

  const handleCreateInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName.trim() || invCapital <= 0) return;
    const inCharge = members.find((m) => m.id === invChargeMemberId) || members[0];
    const newProj: InvestmentProject = {
      id: invId.trim(),
      name: invName.trim(),
      category: invCategory,
      description: invDesc.trim() || 'সমবায় বোর্ড অনুমোদিত নতুন বিনিয়োগ প্রকল্প।',
      investmentDate: invDate,
      capitalInvested: invCapital,
      durationMonths: invDuration,
      expectedReturnRate: invRate,
      realizedReturn: 0,
      unrealizedValuation: invCapital,
      status: 'ACTIVE',
      inChargeName: inCharge.fullName,
      inChargeMemberId: inCharge.id,
      inChargeMobile: inCharge.mobile,
    };
    onAddInvestment(newProj);
    setShowNewModal(false);
    setInvName('');
    setInvDesc('');
    setInvId(`INV-${107 + investments.length}`);
    setToast(`নতুন বিনিয়োগ প্রকল্প (${newProj.id}) সফলভাবে নিবন্ধিত ও লেজারে যুক্ত হয়েছে।`);
    setTimeout(() => setToast(null), 5000);
  };

  const handlePostReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalInv || returnAmount <= 0) return;
    onRecordInvestmentReturn(returnModalInv.id, returnAmount, returnNote);
    setToast(
      `${returnModalInv.name}-এর মুনাফা (${formatBDT(returnAmount)}) মূল তহবিলে যুক্ত হয়েছে।`
    );
    setReturnModalInv(null);
    setTimeout(() => setToast(null), 5000);
  };

  const handlePostDividendToLedger = () => {
    if (!isAdmin) return;
    onDistributeDividend(
      totalCalculatedPayout,
      dividendMethod,
      dividendPreview.map((d) => ({ memberId: d.member.id, amount: d.payout }))
    );
    setToast(
      `মোট ${formatBDT(totalCalculatedPayout)} লভ্যাংশ ${toBengaliDigits(
        dividendPreview.length
      )} জন সক্রিয় সদস্যের লেজারে সফলভাবে পোস্ট করা হয়েছে!`
    );
    setTimeout(() => setToast(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#10243A]">
            বিনিয়োগ ও লভ্যাংশ ব্যবস্থাপনা
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            সম্মিলিত মূলধন বিনিয়োগ, প্রকল্পভিত্তিক মুনাফা ট্র্যাকিং ও স্বয়ংক্রিয় লভ্যাংশ বণ্টন ইঞ্জিন
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#087F68] hover:bg-[#066956] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            নতুন বিনিয়োগ প্রকল্প যুক্ত করুন
          </button>
        )}
      </div>

      {toast && (
        <div className="bg-emerald-50 border border-[#087F68]/40 rounded-xl px-4 py-3 text-xs font-semibold text-[#087F68] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* 5 Key Investment Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>সংগৃহীত সঞ্চয় মূলধন</span>
            <Layers className="w-4 h-4 text-[#10243A]" />
          </div>
          <div className="text-xl font-bold text-[#10243A] mt-2 tabular-nums">
            {formatBDT(financials.totalContributedCapital)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">ভর্তি ফি ও কিস্তি হতে প্রাপ্ত</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>মোট বিনিয়োগকৃত অর্থ</span>
            <Briefcase className="w-4 h-4 text-[#087F68]" />
          </div>
          <div className="text-xl font-bold text-[#10243A] mt-2 tabular-nums">
            {formatBDT(financials.totalInvestedOut)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {toBengaliDigits(investments.filter((i) => i.capitalInvested > 0).length)} টি প্রকল্পে
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>অব্যবহৃত ক্যাশ ও ব্যাংক</span>
            <Wallet className="w-4 h-4 text-[#087F68]" />
          </div>
          <div className="text-xl font-bold text-[#087F68] mt-2 tabular-nums">
            {formatBDT(financials.availableLiquidFunds)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">বিনিয়োগযোগ্য তরল তহবিল</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>অর্জিত রিয়ালাইজড আয়</span>
            <TrendingUp className="w-4 h-4 text-[#D6A84B]" />
          </div>
          <div className="text-xl font-bold text-[#9E7422] mt-2 tabular-nums">
            {formatBDT(financials.totalRealizedReturn)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">ব্যাংক একাউন্টে নগদ প্রাপ্তি</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>নেট বণ্টনযোগ্য লভ্যাংশ</span>
            <Coins className="w-4 h-4 text-[#087F68]" />
          </div>
          <div className="text-xl font-bold text-[#087F68] mt-2 tabular-nums">
            {formatBDT(financials.netDistributableProfit)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">ব্যয় ও পূর্ব বণ্টন বাদে</div>
        </div>
      </div>

      {/* Investment Portfolio Cards */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-[#10243A]">বিনিয়োগ পোর্টফোলিও ও প্রকল্পসমূহ</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {investments.map((inv) => {
            const returnProgress =
              inv.capitalInvested > 0
                ? Math.min(100, Math.round((inv.realizedReturn / inv.capitalInvested) * 100))
                : 0;
            const st = STATUS_LABELS[inv.status];

            return (
              <div
                key={inv.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono-id font-bold text-[#087F68]">{inv.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{inv.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatDateBn(inv.investmentDate)}</span>
                      </div>
                      <h3 className="text-base font-bold text-[#10243A] mt-1">{inv.name}</h3>
                    </div>

                    <span className={`text-xs font-semibold shrink-0 flex items-center gap-1 ${st.cls}`}>
                      {inv.status === 'ON_HOLD' && <PauseCircle className="w-3.5 h-3.5" />}
                      {inv.status === 'ACTIVE' && <TrendingUp className="w-3.5 h-3.5" />}
                      {inv.status === 'MATURED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {st.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{inv.description}</p>

                  {/* Capital vs Realized vs Unrealized Valuation */}
                  <div className="grid grid-cols-3 gap-3 mt-4 p-3 bg-[#F3F6FA] rounded-lg border border-slate-200/70 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">বিনিয়োগিত মূলধন</span>
                      <span className="font-bold text-[#10243A] tabular-nums">
                        {formatBDT(inv.capitalInvested)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">রিয়ালাইজড মুনাফা</span>
                      <span className="font-bold text-[#087F68] tabular-nums">
                        {formatBDT(inv.realizedReturn)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">
                        আনরিয়েলাইজড মূল্যায়ন
                      </span>
                      <span className="font-bold text-[#9E7422] tabular-nums">
                        {formatBDT(inv.unrealizedValuation)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">
                        প্রত্যাশিত হার: {toBengaliDigits(inv.expectedReturnRate)}% ({toBengaliDigits(inv.durationMonths)} মাস)
                      </span>
                      <span className="font-semibold text-[#087F68] tabular-nums">
                        রিটার্ন অর্জিত: {toBengaliDigits(returnProgress)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#087F68] rounded-full transition-all"
                        style={{ width: `${Math.max(returnProgress, inv.capitalInvested > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-slate-600">
                    প্রজেক্ট ইনচার্জ:{' '}
                    <strong className="text-[#10243A]">{inv.inChargeName}</strong>{' '}
                    <span className="font-mono-id text-slate-500">({inv.inChargeMobile})</span>
                  </div>

                  {isAdmin && inv.capitalInvested > 0 && (
                    <button
                      onClick={() => {
                        setReturnModalInv(inv);
                        setReturnAmount(50000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#10243A] hover:bg-[#193554] text-white text-[11px] font-semibold cursor-pointer"
                    >
                      মুনাফা রিটার্ন পোস্টিং
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Automated Dividend Distribution Calculator */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-[#10243A] text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-[#D6A84B]" />
            <div>
              <h2 className="text-sm font-bold">
                স্বয়ংক্রিয় লভ্যাংশ বণ্টন ইঞ্জিন (Dividend Distribution Engine)
              </h2>
              <p className="text-[11px] text-slate-300">
                সক্রিয় {toBengaliDigits(memberContributions.activeMembers.length)} জন সদস্যের মাঝে
                লাইভ হিসাব ও সরাসরি ডাবল-এন্ট্রি লেজারে পোস্টিং
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={handlePostDividendToLedger}
              className="px-4 py-2 rounded-lg bg-[#D6A84B] hover:bg-[#c59638] text-[#10243A] text-xs font-bold transition-colors cursor-pointer"
            >
              অ্যাডমিন অনুমোদন ও লেজারে পোস্টিং
            </button>
          )}
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-[#10243A] mb-1.5">
                মোট বণ্টনযোগ্য মুনাফা পুল (৳ টাকা)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                disabled={dividendMethod === 'CUSTOM_PERCENT'}
                value={dividendPool}
                onChange={(e) => setDividendPool(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm font-bold text-[#087F68] bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68] tabular-nums disabled:opacity-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#10243A] mb-1.5">
                লভ্যাংশ বণ্টন পদ্ধতি নির্বাচন করুন
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDividendMethod('EQUAL')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-colors cursor-pointer ${
                    dividendMethod === 'EQUAL'
                      ? 'bg-[#087F68] text-white border-[#087F68]'
                      : 'bg-[#F3F6FA] text-[#10243A] border-slate-200'
                  }`}
                >
                  Option A: সমবণ্টন (Equal)
                </button>
                <button
                  type="button"
                  onClick={() => setDividendMethod('PROPORTIONAL')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-colors cursor-pointer ${
                    dividendMethod === 'PROPORTIONAL'
                      ? 'bg-[#087F68] text-white border-[#087F68]'
                      : 'bg-[#F3F6FA] text-[#10243A] border-slate-200'
                  }`}
                >
                  Option B: মূলধনভিত্তিক আনুপাতিক
                </button>
                <button
                  type="button"
                  onClick={() => setDividendMethod('CUSTOM_PERCENT')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-colors cursor-pointer ${
                    dividendMethod === 'CUSTOM_PERCENT'
                      ? 'bg-[#087F68] text-white border-[#087F68]'
                      : 'bg-[#F3F6FA] text-[#10243A] border-slate-200'
                  }`}
                >
                  Option C: নির্দিষ্ট পার্সেন্টেজ (%)
                </button>
              </div>
            </div>
          </div>

          {dividendMethod === 'CUSTOM_PERCENT' && (
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-[#10243A] mb-1">
                কমিটি অনুমোদিত লভ্যাংশের হার (% জমা মূলধনের উপর)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={customPercent}
                onChange={(e) => setCustomPercent(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-bold bg-[#F3F6FA] border border-slate-200 rounded-lg tabular-nums"
              />
            </div>
          )}

          {/* Summary Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-[#F3F6FA] rounded-lg border border-slate-200 text-xs">
            <span>
              বণ্টনযোগ্য সক্রিয় সদস্য:{' '}
              <strong className="tabular-nums">
                {toBengaliDigits(dividendPreview.length)} জন
              </strong>
            </span>
            <span>
              সর্বমোট ক্যালকুলেটেড প্রাপ্য:{' '}
              <strong className="text-[#087F68] text-sm tabular-nums">
                {formatBDT(totalCalculatedPayout)}
              </strong>
            </span>
          </div>

          {/* Live Preview Table */}
          <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#F3F6FA] border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">সদস্য আইডি</th>
                  <th className="py-2.5 px-4">সদস্যের নাম</th>
                  <th className="py-2.5 px-4 text-right">মোট কিস্তি জমা</th>
                  <th className="py-2.5 px-4 text-right">জমার অনুপাত</th>
                  <th className="py-2.5 px-4 text-right">প্রাপ্য লভ্যাংশ (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {dividendPreview.map((row) => (
                  <tr key={row.member.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono-id font-semibold text-[#087F68]">
                      {row.member.id}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#10243A]">
                      {row.member.fullName}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{formatBDT(row.paid)}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-slate-600">
                      {toBengaliDigits(row.ratioPercent.toFixed(2))}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-[#087F68] tabular-nums">
                      {formatBDT(row.payout)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* New Investment Entry Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10243A]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#10243A] text-white flex items-center justify-between">
              <h3 className="text-base font-bold">নতুন বিনিয়োগ প্রকল্প এন্ট্রি</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateInvestment} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">বিনিয়োগ আইডি</label>
                  <input
                    required
                    value={invId}
                    onChange={(e) => setInvId(e.target.value)}
                    className="w-full px-3 py-2 font-mono-id bg-[#F3F6FA] border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">ক্যাটাগরি</label>
                  <select
                    value={invCategory}
                    onChange={(e) => setInvCategory(e.target.value as InvestmentCategory)}
                    className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg"
                  >
                    {INVESTMENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">প্রকল্পের নাম *</label>
                <input
                  required
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  placeholder="যেমন: সাভার কোল্ড স্টোরেজ জয়েন্ট ভেঞ্চার"
                  className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">বিবরণ</label>
                <textarea
                  rows={2}
                  value={invDesc}
                  onChange={(e) => setInvDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">মূলধন (৳)</label>
                  <input
                    type="number"
                    min={1000}
                    value={invCapital}
                    onChange={(e) => setInvCapital(Number(e.target.value))}
                    className="w-full px-2.5 py-2 font-bold bg-[#F3F6FA] border border-slate-200 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">মেয়াদ (মাস)</label>
                  <input
                    type="number"
                    min={1}
                    value={invDuration}
                    onChange={(e) => setInvDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">প্রত্যাশিত হার (%)</label>
                  <input
                    type="number"
                    min={1}
                    value={invRate}
                    onChange={(e) => setInvRate(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">প্রজেক্ট ইনচার্জ (দায়িত্বপ্রাপ্ত সদস্য)</label>
                <select
                  value={invChargeMemberId}
                  onChange={(e) => setInvChargeMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg"
                >
                  {members.slice(0, 20).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} — {m.fullName} ({m.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#087F68] text-white font-semibold cursor-pointer"
                >
                  বিনিয়োগ সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Investment Return Modal */}
      {returnModalInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10243A]/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-[#10243A] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">মুনাফা রিটার্ন পোস্টিং — {returnModalInv.id}</h3>
              <button
                onClick={() => setReturnModalInv(null)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handlePostReturn} className="p-5 space-y-4 text-xs">
              <div className="font-semibold text-[#10243A]">{returnModalInv.name}</div>
              <div>
                <label className="block font-semibold mb-1">প্রাপ্ত মুনাফার পরিমাণ (৳)</label>
                <input
                  type="number"
                  min={500}
                  required
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 font-bold text-[#087F68] bg-[#F3F6FA] border border-slate-200 rounded-lg tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">বিবরণ</label>
                <input
                  type="text"
                  required
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnModalInv(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#087F68] text-white font-semibold cursor-pointer"
                >
                  লেজারে জমা করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
