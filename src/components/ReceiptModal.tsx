import React from 'react';
import { Download, Printer, ShieldCheck, X } from 'lucide-react';
import { LedgerEntry, Member } from '../types/fvc';
import { formatBDT, formatDateBn } from '../utils/formatters';
import { FvcCrest } from './FvcCrest';

interface ReceiptModalProps {
  entry: LedgerEntry | null;
  member: Member | undefined;
  onClose: () => void;
}

const PAYMENT_METHOD_BN: Record<string, string> = {
  BANK_TRANSFER: 'ব্যাংক ট্রান্সফার (BEFTN / RTGS)',
  CASH: 'নগদ / ক্যাশ কাউন্টার',
  MFS: 'মোবাইল ব্যাংকিং (বিকাশ / নগদ / রকেট)',
};

const CATEGORY_BN: Record<string, string> = {
  ADMISSION: 'এককালীন ভর্তি ফি',
  INSTALLMENT: 'মাসিক কিস্তি',
  INVESTMENT_OUT: 'বিনিয়োগ মূলধন প্রদান',
  INVESTMENT_RETURN: 'বিনিয়োগ মুনাফা প্রাপ্তি',
  EXPENSE: 'পরিচালনা ব্যয় ভাউচার',
  DIVIDEND_PAYOUT: 'লভ্যাংশ বণ্টন',
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ entry, member, onClose }) => {
  if (!entry) return null;

  const amount = entry.credit > 0 ? entry.credit : entry.debit;
  const receiptNumber = entry.receiptNo || `RCP-${entry.id}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const html = `<!doctype html>
<html lang="bn">
<head>
<meta charset="UTF-8" />
<title>Money Receipt - ${receiptNumber}</title>
<style>
  body { font-family: 'Hind Siliguri', sans-serif; background: #f8fafc; padding: 32px; color: #10243A; }
  .voucher { max-width: 720px; margin: 0 auto; background: #fff; border: 2px solid #10243A; padding: 32px; }
  .top { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #D6A84B; padding-bottom: 16px; margin-bottom: 20px; }
  .title { font-size: 20px; font-weight: 700; margin: 0; }
  .sub { font-size: 12px; color: #475569; margin: 2px 0 0; }
  .badge { border: 1px solid #087F68; color: #087F68; padding: 4px 10px; font-size: 12px; font-weight: 700; }
  .grid { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .grid td { padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 13px; }
  .label { background: #f1f5f9; font-weight: 600; width: 32%; }
  .sigs { display: flex; justify-content: space-between; margin-top: 48px; padding-top: 12px; }
  .sig-box { width: 40%; text-align: center; border-top: 1px solid #10243A; padding-top: 6px; font-size: 12px; }
</style>
</head>
<body>
  <div class="voucher">
    <div class="top">
      <div>
        <h1 class="title">FUTURE VISION CAPITAL (ফিউচার ভিশন ক্যাপিটাল)</h1>
        <p class="sub">একত্রে গড়ি সমৃদ্ধ আগামী · ১১১ সদস্যের সমন্বিত সমবায় তহবিল</p>
      </div>
      <div class="badge">মানি রিসিট / MONEY RECEIPT</div>
    </div>
    <table class="grid">
      <tr><td class="label">রশিদ নম্বর (Receipt No)</td><td>${receiptNumber}</td><td class="label">ভাউচার আইডি</td><td>${entry.id}</td></tr>
      <tr><td class="label">সদস্যের নাম</td><td>${member?.fullName || 'প্রাতিষ্ঠানিক তহবিল'}</td><td class="label">সদস্য আইডি</td><td>${entry.memberId || 'FVC-CORP'}</td></tr>
      <tr><td class="label">জমার খাত</td><td>${CATEGORY_BN[entry.category] || entry.category}</td><td class="label">কিস্তির মাস</td><td>${entry.monthLabel || 'এককালীন / সাধারণ'}</td></tr>
      <tr><td class="label">প্রাপ্তির মাধ্যম</td><td>${PAYMENT_METHOD_BN[entry.paymentMethod || 'BANK_TRANSFER']}</td><td class="label">তারিখ</td><td>${formatDateBn(entry.date)}</td></tr>
      <tr><td class="label">রেফারেন্স নম্বর</td><td>${entry.referenceNo || '—'}</td><td class="label">মোট টাকার পরিমাণ</td><td><strong>${formatBDT(amount)}</strong></td></tr>
      <tr><td class="label">বিবরণ ও মন্তব্য</td><td colspan="3">${entry.description}${entry.remarks ? ` (${entry.remarks})` : ''}</td></tr>
    </table>
    <div class="sigs">
      <div class="sig-box">কোষাধ্যক্ষের স্বাক্ষর ও ডিজিটাল সিল<br/><small>মোঃ রাশেদুল করিম (FVC-003)</small></div>
      <div class="sig-box">সভাপতির অনুমোদন ও সিল<br/><small>মোঃ তানভীর মোস্তফা (FVC-001)</small></div>
    </div>
  </div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${receiptNumber}_${entry.memberId || 'FVC'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10243A]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden print-only-area">
        {/* Top Modal Controls (hidden when printing) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-[#10243A] text-white">
          <div className="flex items-center gap-3">
            <FvcCrest size={30} />
            <div>
              <h3 className="text-sm font-semibold">ডিজিটাল মানি রিসিট (A4/A5 প্রিন্ট প্রস্তুত)</h3>
              <p className="text-xs text-slate-300 font-mono-id">{receiptNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              ডাউনলোড
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#087F68] hover:bg-[#066956] text-white rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              রশিদ প্রিন্ট করুন
            </button>
            <button
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable A4/A5 Voucher Body */}
        <div className="p-6 sm:p-8 bg-white">
          <div className="border-2 border-[#10243A] rounded-lg p-6">
            {/* Voucher Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#D6A84B] pb-4 mb-5">
              <div className="flex items-center gap-3.5">
                <FvcCrest size={52} />
                <div>
                  <h2 className="text-lg font-bold text-[#10243A] font-display tracking-tight">
                    FUTURE VISION CAPITAL
                  </h2>
                  <p className="text-xs font-semibold text-[#087F68]">
                    ফিউচার ভিশন ক্যাপিটাল — একত্রে গড়ি সমৃদ্ধ আগামী
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    নিবন্ধিত ১১১ সদস্যের সমন্বিত সমবায় ও বিনিয়োগ তহবিল · ঢাকা, বাংলাদেশ
                  </p>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="inline-block border border-[#10243A] bg-[#F3F6FA] px-3 py-1 rounded text-xs font-bold text-[#10243A]">
                  মানি রিসিট / MONEY RECEIPT
                </div>
                <p className="text-xs text-slate-600 mt-1.5 font-mono-id">
                  রশিদ নং: <strong className="text-[#10243A]">{receiptNumber}</strong>
                </p>
                <p className="text-[11px] text-slate-500 font-mono-id">ভাউচার: {entry.id}</p>
              </div>
            </div>

            {/* Voucher Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">সদস্যের নাম:</span>
                <span className="font-semibold text-[#10243A]">
                  {member?.fullName || 'প্রাতিষ্ঠানিক হিসাব'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">সদস্য আইডি:</span>
                <span className="font-mono-id font-semibold text-[#10243A]">
                  {entry.memberId || 'FVC-CORP'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">জমার খাত:</span>
                <span className="font-medium text-[#10243A]">
                  {CATEGORY_BN[entry.category] || entry.category}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">কিস্তির মাস:</span>
                <span className="font-medium text-[#10243A]">
                  {entry.monthLabel || 'এককালীন / সাধারণ'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">জমার তারিখ:</span>
                <span className="font-medium text-[#10243A] tabular-nums">
                  {formatDateBn(entry.date)}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">প্রাপ্তির মাধ্যম:</span>
                <span className="font-medium text-[#10243A]">
                  {PAYMENT_METHOD_BN[entry.paymentMethod || 'BANK_TRANSFER']}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5 sm:col-span-2">
                <span className="text-slate-500">ট্রানজেকশন / রেফারেন্স নং:</span>
                <span className="font-mono-id text-slate-800">{entry.referenceNo || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5 sm:col-span-2">
                <span className="text-slate-500">বিবরণ:</span>
                <span className="text-slate-800 text-right">{entry.description}</span>
              </div>
            </div>

            {/* Amount Highlight Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F3F6FA] border border-slate-200 rounded-lg px-5 py-4 mb-8">
              <div>
                <p className="text-xs text-slate-500">সর্বমোট গৃহীত / পরিশোধিত অর্থ</p>
                <p className="text-2xl font-bold text-[#087F68] tabular-nums mt-0.5">
                  {formatBDT(amount)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#087F68] bg-white border border-[#087F68]/30 px-3 py-1.5 rounded-md">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  অবস্থা: {entry.status === 'APPROVED' ? 'অনুমোদিত ও যাচাইকৃত' : entry.status === 'PENDING' ? 'অনুমোদনের অপেক্ষায়' : 'বাতিল'}
                </span>
              </div>
            </div>

            {/* Digital Seals & Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 mt-4">
              <div className="text-center">
                <div className="inline-flex flex-col items-center justify-center px-3 py-1.5 border border-dashed border-[#087F68]/50 rounded text-[10px] text-[#087F68] mb-2">
                  <span className="font-semibold">VERIFIED DIGITAL SEAL</span>
                  <span className="font-mono-id">FVC-TREASURER-003</span>
                </div>
                <div className="border-t border-slate-400 pt-1.5">
                  <p className="text-xs font-semibold text-[#10243A]">মোঃ রাশেদুল করিম</p>
                  <p className="text-[11px] text-slate-500">কোষাধ্যক্ষ, ফিউচার ভিশন ক্যাপিটাল</p>
                </div>
              </div>
              <div className="text-center">
                <div className="inline-flex flex-col items-center justify-center px-3 py-1.5 border border-dashed border-[#D6A84B]/70 rounded text-[10px] text-[#9E7422] mb-2">
                  <span className="font-semibold">EXECUTIVE SEAL</span>
                  <span className="font-mono-id">FVC-PRESIDENT-001</span>
                </div>
                <div className="border-t border-slate-400 pt-1.5">
                  <p className="text-xs font-semibold text-[#10243A]">মোঃ তানভীর মোস্তফা</p>
                  <p className="text-[11px] text-slate-500">সভাপতি, ফিউচার ভিশন ক্যাপিটাল</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
