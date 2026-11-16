import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  PlusCircle,
  Printer,
  Search,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import {
  ADMISSION_FEE_AMOUNT,
  MONTHLY_INSTALLMENT_AMOUNT,
  TOTAL_EXPECTED_MONTHS_YTD,
} from '../data/mockData';
import {
  LedgerEntry,
  Member,
  PaymentMethod,
  PaymentSubCategory,
  UserRole,
} from '../types/fvc';
import {
  downloadHTMLReportAsPDF,
  exportToCSV,
  formatBDT,
  formatDateBn,
  INSTALLMENT_MONTHS_2026,
  toBengaliDigits,
} from '../utils/formatters';

interface InstallmentsPageProps {
  members: Member[];
  ledger: LedgerEntry[];
  currentRole: UserRole;
  currentUser: Member;
  onAddPayment: (payload: {
    memberId: string;
    subCategory: PaymentSubCategory;
    monthKey?: string;
    monthLabel?: string;
    date: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNo: string;
    receiptNo: string;
    remarks: string;
    attachmentName?: string;
  }) => void;
  onApproveEntry: (entryId: string) => void;
  onRejectEntry: (entryId: string, reason: string) => void;
  onOpenReceipt: (entry: LedgerEntry) => void;
}

type ActiveTab = 'RECENT' | 'LEDGER' | 'DEFAULTERS';

export const InstallmentsPage: React.FC<InstallmentsPageProps> = ({
  members,
  ledger,
  currentRole,
  currentUser,
  onAddPayment,
  onApproveEntry,
  onRejectEntry,
  onOpenReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('RECENT');
  const [searchTerm, setSearchTerm] = useState('');
  const [smsSentNotice, setSmsSentNotice] = useState<string | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  // Payment Voucher Entry Form State
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    currentRole === 'MEMBER' ? currentUser.id : 'FVC-017'
  );
  const [memberSearchFilter, setMemberSearchFilter] = useState('');
  const [subCategory, setSubCategory] = useState<PaymentSubCategory>('INSTALLMENT');
  const [monthKey, setMonthKey] = useState<string>('2026-11');
  const [paymentDate, setPaymentDate] = useState<string>('2026-11-15');
  const [amount, setAmount] = useState<number>(MONTHLY_INSTALLMENT_AMOUNT);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MFS');
  const [referenceNo, setReferenceNo] = useState<string>('BK-202611-9042');
  const [receiptNo, setReceiptNo] = useState<string>(
    `RCP-2026-${Math.floor(4500 + (ledger.length % 5000))}`
  );
  const [remarks, setRemarks] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);

  const isAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'TREASURER';
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  // Duplicate prevention check
  const duplicateWarning = useMemo(() => {
    if (!selectedMemberId) return null;
    if (subCategory === 'INSTALLMENT') {
      const existing = ledger.find(
        (e) =>
          e.memberId === selectedMemberId &&
          e.category === 'INSTALLMENT' &&
          e.monthKey === monthKey &&
          e.status !== 'REJECTED'
      );
      if (existing) {
        const mLabel =
          INSTALLMENT_MONTHS_2026.find((m) => m.key === monthKey)?.label || monthKey;
        return `সতর্কবার্তা: সদস্য ${selectedMemberId}-এর ${mLabel} মাসের কিস্তি (${existing.id}) ইতিমধ্যেই ${
          existing.status === 'APPROVED' ? 'জমা ও অনুমোদিত' : 'অনুমোদনের অপেক্ষায়'
        } রয়েছে। একই মাসের কিস্তি দ্বিতীয়বার জমা দেওয়া যাবে না।`;
      }
    } else if (subCategory === 'ADMISSION') {
      const existingAdm = ledger.find(
        (e) =>
          e.memberId === selectedMemberId &&
          e.category === 'ADMISSION' &&
          e.status !== 'REJECTED'
      );
      if (existingAdm) {
        return `সতর্কবার্তা: সদস্য ${selectedMemberId}-এর এককালীন ভর্তি ফি (${existingAdm.id}) ইতিমধ্যেই জমা রয়েছে।`;
      }
    }
    return null;
  }, [ledger, selectedMemberId, subCategory, monthKey]);

  const handleSubCategoryChange = (next: PaymentSubCategory) => {
    setSubCategory(next);
    if (next === 'ADMISSION') setAmount(ADMISSION_FEE_AMOUNT);
    else if (next === 'INSTALLMENT') setAmount(MONTHLY_INSTALLMENT_AMOUNT);
    else setAmount(5000);
  };

  const handleVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateWarning || amount <= 0) return;

    const monthObj = INSTALLMENT_MONTHS_2026.find((m) => m.key === monthKey);
    onAddPayment({
      memberId: selectedMemberId,
      subCategory,
      monthKey: subCategory === 'INSTALLMENT' ? monthKey : undefined,
      monthLabel: subCategory === 'INSTALLMENT' ? monthObj?.label : undefined,
      date: paymentDate,
      amount,
      paymentMethod,
      referenceNo: referenceNo.trim() || `REF-${Date.now().toString().slice(-6)}`,
      receiptNo: receiptNo.trim() || `RCP-2026-${Math.floor(5000 + Math.random() * 4000)}`,
      remarks: remarks.trim(),
      attachmentName,
    });

    setSubmitFeedback(
      `ভাউচার সফলভাবে দাখিল হয়েছে! (${selectedMemberId} · ${formatBDT(amount)})`
    );
    setRemarks('');
    setAttachmentName(undefined);
    setReceiptNo(`RCP-2026-${Math.floor(5000 + Math.random() * 4000)}`);
    setTimeout(() => setSubmitFeedback(null), 5000);
  };

  const filteredMemberOptions = useMemo(() => {
    const q = memberSearchFilter.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.fullName.toLowerCase().includes(q) ||
        m.mobile.includes(q)
    );
  }, [members, memberSearchFilter]);

  // Tab 1: Recent Member Payment Submissions
  const recentSubmissions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return ledger
      .filter((e) => e.category === 'ADMISSION' || e.category === 'INSTALLMENT')
      .filter((e) => {
        if (!q) return true;
        const m = e.memberId ? memberMap.get(e.memberId) : undefined;
        return (
          e.id.toLowerCase().includes(q) ||
          (e.memberId?.toLowerCase().includes(q) ?? false) ||
          (m?.fullName.toLowerCase().includes(q) ?? false) ||
          (e.monthLabel?.toLowerCase().includes(q) ?? false)
        );
      })
      .slice()
      .reverse()
      .slice(0, 60);
  }, [ledger, searchTerm, memberMap]);

  // Tab 2 & 3: Member-wise Ledger Summary & Defaulters
  const memberLedgerRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return members
      .map((m) => {
        const entries = ledger.filter(
          (e) => e.memberId === m.id && e.status === 'APPROVED'
        );
        const admissionPaid = entries
          .filter((e) => e.category === 'ADMISSION')
          .reduce((s, e) => s + e.credit, 0);
        const installmentEntries = entries.filter((e) => e.category === 'INSTALLMENT');
        const installmentPaid = installmentEntries.reduce((s, e) => s + e.credit, 0);
        const installmentCount = installmentEntries.length;
        const dueMonths = Math.max(0, TOTAL_EXPECTED_MONTHS_YTD - installmentCount);
        const dueAmount = dueMonths * MONTHLY_INSTALLMENT_AMOUNT;
        return {
          member: m,
          admissionPaid,
          installmentPaid,
          installmentCount,
          totalPaid: admissionPaid + installmentPaid,
          dueMonths,
          dueAmount,
        };
      })
      .filter((row) => {
        if (!q) return true;
        return (
          row.member.id.toLowerCase().includes(q) ||
          row.member.fullName.toLowerCase().includes(q) ||
          row.member.mobile.includes(q)
        );
      });
  }, [members, ledger, searchTerm]);

  const defaulterRows = useMemo(
    () => memberLedgerRows.filter((r) => r.dueMonths > 0),
    [memberLedgerRows]
  );

  const handleSendReminderSms = (member: Member, dueAmount: number, dueMonths: number) => {
    setSmsSentNotice(
      `তাগাদা এসএমএস পাঠানো হয়েছে: ${member.fullName} (${member.id} · ${member.mobile}) — বকেয়া ${toBengaliDigits(
        dueMonths
      )} মাস (${formatBDT(dueAmount)})`
    );
    setTimeout(() => setSmsSentNotice(null), 5000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Member ID',
      'Name',
      'Mobile',
      'Admission Paid',
      'Installments Count',
      'Installment Paid',
      'Total Paid',
      'Due Months',
      'Due Amount',
    ];
    const rows = memberLedgerRows.map((r) => [
      r.member.id,
      r.member.fullName,
      r.member.mobile,
      r.admissionPaid,
      r.installmentCount,
      r.installmentPaid,
      r.totalPaid,
      r.dueMonths,
      r.dueAmount,
    ]);
    exportToCSV('FVC_Installment_Ledger.csv', headers, rows);
  };

  const handleDownloadPDFReport = () => {
    const rowsHtml = memberLedgerRows
      .slice(0, 50)
      .map(
        (r) => `<tr>
          <td>${r.member.id}</td>
          <td>${r.member.fullName}</td>
          <td class="right">${formatBDT(r.admissionPaid)}</td>
          <td class="right">${toBengaliDigits(r.installmentCount)} টি</td>
          <td class="right">${formatBDT(r.installmentPaid)}</td>
          <td class="right">${formatBDT(r.dueAmount)}</td>
        </tr>`
      )
      .join('');
    downloadHTMLReportAsPDF(
      'কিস্তি ও ভর্তি ফি বিবরণী ২০২৬',
      'সদস্যভিত্তিক অনুমোদিত জমার তালিকা',
      `<table>
        <thead>
          <tr><th>আইডি</th><th>সদস্যের নাম</th><th class="right">ভর্তি ফি</th><th class="right">কিস্তি সংখ্যা</th><th class="right">মোট কিস্তি</th><th class="right">বকেয়া</th></tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>`
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#10243A]">
            কিস্তি ও ভর্তি ফি ব্যবস্থাপনা
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            এককালীন ভর্তি ফি ৳৫,০০০ এবং নির্ধারিত মাসিক কিস্তি ৳২,০০০ · ডুপ্লিকেট এন্ট্রি সুরক্ষাসহ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#10243A] cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#087F68]" />
            CSV/Excel এক্সপোর্ট
          </button>
          <button
            onClick={handleDownloadPDFReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#10243A] hover:bg-[#193554] text-white text-xs font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#D6A84B]" />
            রিপোর্ট ডাউনলোড
          </button>
        </div>
      </div>

      {/* Feedback Banners */}
      {submitFeedback && (
        <div className="bg-emerald-50 border border-[#087F68]/40 rounded-xl px-4 py-3 text-xs font-semibold text-[#087F68] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{submitFeedback}</span>
        </div>
      )}
      {smsSentNotice && (
        <div className="bg-amber-50 border border-[#D6A84B] rounded-xl px-4 py-3 text-xs font-semibold text-[#9E7422] flex items-center gap-2">
          <BellRing className="w-4 h-4 shrink-0" />
          <span>{smsSentNotice}</span>
        </div>
      )}

      {/* Payment Voucher Entry Form */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-[#10243A] text-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-[#D6A84B]" />
            <h2 className="text-sm font-bold">নতুন পেমেন্ট ভাউচার এন্ট্রি (কিস্তি / ভর্তি ফি)</h2>
          </div>
          <span className="text-[11px] text-slate-300">
            ভর্তি ফি: ৳ ৫,০০০ · মাসিক কিস্তি: ৳ ২,০০০
          </span>
        </div>

        <form onSubmit={handleVoucherSubmit} className="p-5 space-y-4">
          {duplicateWarning && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs font-semibold text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Smart Member Dropdown with quick filter */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#10243A] mb-1">
                সদস্য নির্বাচন করুন (নাম ও FVC আইডি) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={memberSearchFilter}
                  onChange={(e) => setMemberSearchFilter(e.target.value)}
                  placeholder="ফিল্টার (FVC-042)..."
                  className="w-36 px-3 py-2 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                />
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                >
                  {filteredMemberOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} — {m.fullName} ({m.mobile})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#10243A] mb-1">
                পেমেন্ট ক্যাটাগরি
              </label>
              <select
                value={subCategory}
                onChange={(e) => handleSubCategoryChange(e.target.value as PaymentSubCategory)}
                className="w-full px-3 py-2 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
              >
                <option value="INSTALLMENT">মাসিক কিস্তি (Monthly Installment)</option>
                <option value="ADMISSION">ভর্তি ফি (Admission Fee)</option>
                <option value="SPECIAL_SAVINGS">বিশেষ সঞ্চয় (Special Contribution)</option>
                <option value="OTHER">অন্যান্য জমা</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#10243A] mb-1">
                কিস্তির মাস ও বছর
              </label>
              <select
                disabled={subCategory !== 'INSTALLMENT'}
                value={monthKey}
                onChange={(e) => setMonthKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68] disabled:opacity-50"
              >
                {INSTALLMENT_MONTHS_2026.map((mo) => (
                  <option key={mo.key} value={mo.key}>
                    {mo.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#10243A] mb-1">
                পেমেন্টের তারিখ
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#10243A] mb-1">
                জমার পরিমাণ (৳ টাকা) *
              </label>
              <input
                type="number"
                min={100}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-bold text-[#087F68] bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#10243A] mb-1">
                পেমেন্ট মাধ্যম
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
              >
                <option value="BANK_TRANSFER">ব্যাংক ট্রান্সফার (BEFTN/RTGS)</option>
                <option value="MFS">বিকাশ / নগদ / রকেট (MFS)</option>
                <option value="CASH">ক্যাশ / নগদ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#10243A] mb-1">
                ট্রানজেকশন / রেফারেন্স ও রশিদ নং
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="রেফারেন্স নং"
                  className="px-2.5 py-2 text-xs font-mono-id bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                />
                <input
                  type="text"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  placeholder="রশিদ নং"
                  className="px-2.5 py-2 text-xs font-mono-id bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-[#10243A] mb-1">
                রিমার্কস / মন্তব্য
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="যেমন: ব্যাংক ডিপোজিট স্লিপ অনুযায়ী জমা করা হলো"
                className="w-full px-3 py-2 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#10243A] mb-1">
                পেমেন্ট স্লিপ আপলোড (ঐচ্ছিক)
              </label>
              <label className="flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-slate-300 bg-[#F3F6FA] hover:border-[#087F68] cursor-pointer text-xs">
                <span className="flex items-center gap-2 text-slate-600 truncate">
                  <UploadCloud className="w-4 h-4 text-[#087F68] shrink-0" />
                  {attachmentName ? (
                    <span className="font-mono-id text-[#087F68] font-semibold">
                      {attachmentName}
                    </span>
                  ) : (
                    'ব্যাংক রিসিট বা বিকাশ স্ক্রিনশট সংযুক্ত করুন'
                  )}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setAttachmentName(f.name);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={Boolean(duplicateWarning)}
              className="px-5 py-2.5 rounded-lg bg-[#087F68] hover:bg-[#066956] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              পেমেন্ট ভাউচার জমা দিন
            </button>
          </div>
        </form>
      </section>

      {/* Management Tabs & Search */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#F3F6FA] rounded-lg overflow-x-auto">
            <button
              onClick={() => setActiveTab('RECENT')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                activeTab === 'RECENT'
                  ? 'bg-white text-[#10243A] shadow-xs font-semibold'
                  : 'text-slate-600'
              }`}
            >
              ১. সম্প্রতি জমাকৃত কিস্তি
            </button>
            <button
              onClick={() => setActiveTab('LEDGER')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                activeTab === 'LEDGER'
                  ? 'bg-white text-[#10243A] shadow-xs font-semibold'
                  : 'text-slate-600'
              }`}
            >
              ২. সদস্যভিত্তিক কিস্তি বিবরণী
            </button>
            <button
              onClick={() => setActiveTab('DEFAULTERS')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'DEFAULTERS'
                  ? 'bg-white text-[#10243A] shadow-xs font-semibold'
                  : 'text-slate-600'
              }`}
            >
              <span>৩. বকেয়া তালিকা</span>
              <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[10px] font-bold tabular-nums">
                {toBengaliDigits(defaulterRows.length)}
              </span>
            </button>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="আইডি, নাম বা মাস খুঁজুন..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
            />
          </div>
        </div>

        {/* Tab 1: Recent Submissions */}
        {activeTab === 'RECENT' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F3F6FA] border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">ট্রানজেকশন</th>
                  <th className="py-3 px-4">সদস্য</th>
                  <th className="py-3 px-4">খাত ও মাস</th>
                  <th className="py-3 px-4">তারিখ</th>
                  <th className="py-3 px-4 text-right">পরিমাণ</th>
                  <th className="py-3 px-4">অবস্থা</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentSubmissions.map((entry) => {
                  const m = entry.memberId ? memberMap.get(entry.memberId) : undefined;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-mono-id font-semibold text-[#10243A]">{entry.id}</div>
                        <div className="font-mono-id text-[10px] text-slate-500">
                          {entry.receiptNo}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#10243A]">
                          {m?.fullName || entry.memberId}
                        </div>
                        <div className="font-mono-id text-[11px] text-[#087F68]">
                          {entry.memberId}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {entry.category === 'ADMISSION' ? 'ভর্তি ফি' : 'মাসিক কিস্তি'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {entry.monthLabel || 'এককালীন'}
                        </div>
                      </td>
                      <td className="py-3 px-4 tabular-nums text-slate-600">
                        {formatDateBn(entry.date)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#10243A] tabular-nums">
                        {formatBDT(entry.credit)}
                      </td>
                      <td className="py-3 px-4">
                        {entry.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 text-[#087F68] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> অনুমোদিত
                          </span>
                        )}
                        {entry.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                            <Clock className="w-3.5 h-3.5" /> অপেক্ষমাণ
                          </span>
                        )}
                        {entry.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                            <XCircle className="w-3.5 h-3.5" /> বাতিল
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {isAdmin && entry.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => onApproveEntry(entry.id)}
                                className="px-2 py-1 rounded bg-[#087F68] text-white text-[11px] font-semibold cursor-pointer"
                              >
                                অনুমোদন
                              </button>
                              <button
                                onClick={() => onRejectEntry(entry.id, 'ভাউচার তথ্য অসামঞ্জস্যপূর্ণ')}
                                className="px-2 py-1 rounded border border-red-200 text-red-600 text-[11px] font-semibold cursor-pointer"
                              >
                                বাতিল
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => onOpenReceipt(entry)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F3F6FA] hover:bg-[#10243A] text-[#10243A] hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            মানি রিসিট
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Member-wise Ledger */}
        {activeTab === 'LEDGER' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F3F6FA] border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">আইডি</th>
                  <th className="py-3 px-4">সদস্যের নাম</th>
                  <th className="py-3 px-4 text-right">ভর্তি ফি</th>
                  <th className="py-3 px-4 text-right">কিস্তি সংখ্যা</th>
                  <th className="py-3 px-4 text-right">মোট পরিশোধিত কিস্তি</th>
                  <th className="py-3 px-4 text-right">সর্বমোট জমা</th>
                  <th className="py-3 px-4 text-right">বকেয়া (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {memberLedgerRows.map((row) => (
                  <tr key={row.member.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono-id font-semibold text-[#087F68]">
                      {row.member.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#10243A]">{row.member.fullName}</div>
                      <div className="font-mono-id text-[11px] text-slate-500">
                        {row.member.mobile}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {formatBDT(row.admissionPaid)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {toBengaliDigits(row.installmentCount)} / {toBengaliDigits(TOTAL_EXPECTED_MONTHS_YTD)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#10243A] tabular-nums">
                      {formatBDT(row.installmentPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#087F68] tabular-nums">
                      {formatBDT(row.totalPaid)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <span
                        className={
                          row.dueAmount > 0 ? 'font-bold text-red-600' : 'text-slate-500'
                        }
                      >
                        {formatBDT(row.dueAmount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Defaulter List */}
        {activeTab === 'DEFAULTERS' && (
          <div className="overflow-x-auto">
            {defaulterRows.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#087F68] font-semibold">
                অভিনন্দন! সকল সদস্যের কিস্তি হালনাগাদ রয়েছে।
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F3F6FA] border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">আইডি</th>
                    <th className="py-3 px-4">সদস্যের নাম ও মোবাইল</th>
                    <th className="py-3 px-4 text-right">পরিশোধিত কিস্তি</th>
                    <th className="py-3 px-4 text-right">বকেয়া মাস</th>
                    <th className="py-3 px-4 text-right">মোট বকেয়া (৳)</th>
                    <th className="py-3 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {defaulterRows.map((row) => (
                    <tr key={row.member.id} className="hover:bg-red-50/30">
                      <td className="py-3 px-4 font-mono-id font-semibold text-[#10243A]">
                        {row.member.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#10243A]">{row.member.fullName}</div>
                        <div className="font-mono-id text-[11px] text-slate-500">
                          {row.member.mobile}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {toBengaliDigits(row.installmentCount)} টি
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-red-600 tabular-nums">
                        {toBengaliDigits(row.dueMonths)} মাস
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-700 tabular-nums">
                        {formatBDT(row.dueAmount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            handleSendReminderSms(row.member, row.dueAmount, row.dueMonths)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10243A] hover:bg-[#193554] text-white text-[11px] font-semibold cursor-pointer"
                        >
                          <BellRing className="w-3.5 h-3.5 text-[#D6A84B]" />
                          তাগাদা এসএমএস নোটিশ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
