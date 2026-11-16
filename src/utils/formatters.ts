const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)]);
}

export function formatBDT(amount: number, useBengaliDigits = true): string {
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('en-IN').format(abs);
  const digits = useBengaliDigits ? toBengaliDigits(formatted) : formatted;
  return `${isNegative ? '-' : ''}৳ ${digits}`;
}

export function formatNumberBn(num: number): string {
  return toBengaliDigits(new Intl.NumberFormat('en-IN').format(Math.round(num)));
}

export function formatDateBn(isoDate: string): string {
  if (!isoDate) return '—';
  const monthsBn = [
    'জানুয়ারি',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর',
  ];
  const parts = isoDate.split('-');
  if (parts.length !== 3) return toBengaliDigits(isoDate);
  const year = toBengaliDigits(parts[0]);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = toBengaliDigits(parseInt(parts[2], 10));
  return `${day} ${monthsBn[monthIdx] || parts[1]} ${year}`;
}

export function getInitials(fullName: string): string {
  const cleaned = fullName.replace(/^(মোঃ|ডাঃ|ইঞ্জিঃ|অ্যাডঃ|আলহাজ্ব)\s*/g, '').trim();
  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return cleaned.slice(0, 2);
}

export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join(
      '\n'
    );

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadHTMLReportAsPDF(title: string, subtitle: string, tableHtml: string): void {
  const html = `<!doctype html>
<html lang="bn">
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<style>
  body { font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif; color: #10243A; padding: 32px; }
  .header { border-bottom: 2px solid #10243A; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
  h1 { margin: 0; font-size: 20px; color: #10243A; }
  p { margin: 4px 0 0; font-size: 13px; color: #475569; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #CBD5E1; padding: 8px 10px; text-align: left; }
  th { background: #F1F5F9; font-weight: 600; }
  .right { text-align: right; font-variant-numeric: tabular-nums; }
  .footer { margin-top: 28px; font-size: 11px; color: #64748B; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>FUTURE VISION CAPITAL — ফিউচার ভিশন ক্যাপিটাল</h1>
      <p>${title} | ${subtitle}</p>
    </div>
    <div style="font-size:11px;color:#475569;">তারিখ: ${new Date().toLocaleDateString('bn-BD')}</div>
  </div>
  ${tableHtml}
  <div class="footer">স্বয়ংক্রিয়ভাবে জেনারেটেড প্রতিবেদন — Future Vision Capital (111 Members Cooperative)</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '_')}_FVC_Report.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const INSTALLMENT_MONTHS_2026 = [
  { key: '2026-01', label: 'জানুয়ারি ২০২৬' },
  { key: '2026-02', label: 'ফেব্রুয়ারি ২০২৬' },
  { key: '2026-03', label: 'মার্চ ২০২৬' },
  { key: '2026-04', label: 'এপ্রিল ২০২৬' },
  { key: '2026-05', label: 'মে ২০২৬' },
  { key: '2026-06', label: 'জুন ২০২৬' },
  { key: '2026-07', label: 'জুলাই ২০২৬' },
  { key: '2026-08', label: 'আগস্ট ২০২৬' },
  { key: '2026-09', label: 'সেপ্টেম্বর ২০২৬' },
  { key: '2026-10', label: 'অক্টোবর ২০২৬' },
  { key: '2026-11', label: 'নভেম্বর ২০২৬' },
  { key: '2026-12', label: 'ডিসেম্বর ২০২৬' },
];
