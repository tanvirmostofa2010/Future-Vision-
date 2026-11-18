import {
  AuditLogEntry,
  ForumPost,
  InvestmentProject,
  LedgerEntry,
  Member,
  NoticeItem,
  PaymentMethod,
} from '../types/fvc';
import { INSTALLMENT_MONTHS_2026 } from '../utils/formatters';

export const ADMISSION_FEE_AMOUNT = 5000;
export const MONTHLY_INSTALLMENT_AMOUNT = 2000;
export const CURRENT_MONTH_KEY = '2026-11'; // নভেম্বর ২০২৬ (11th month of 2026)
export const TOTAL_EXPECTED_MONTHS_YTD = 11; // Jan - Nov 2026

const FIRST_NAMES = [
  'মোঃ তানভীর',
  'মোঃ আরিফুল',
  'আব্দুল্লাহ আল',
  'মোঃ রাশেদুল',
  'মোঃ কামরুল',
  'তৌহিদুল',
  'মোঃ মাহমুদুল',
  'শাহরিয়ার',
  'মোঃ সাইফুল',
  'ফারহানা',
  'নুসরাত',
  'মোঃ জহিরুল',
  'মোঃ মেহেদী',
  'সাব্বির',
  'মোঃ নাঈম',
  'তানজিলা',
  'মোঃ ইমরান',
  'আশরাফুল',
  'মোঃ সোহেল',
  'মোস্তাফিজুর',
  'খালিদ',
  'মোঃ আনিসুর',
  'রেজাউল',
  'শরিফুল',
  'মোঃ হাবিবুর',
  'সাদিয়া',
  'ইফতেখার',
  'মোঃ মিজানুর',
  'নাজমুল',
  'ফয়সাল',
  'মোঃ রফিকুল',
  'তাসনিম',
  'মোঃ শামীম',
  'আতাউর',
  'মোঃ মাসুদ',
  'মোঃ বোরহান',
  'মাহবুবুর',
];

const LAST_NAMES = [
  'মোস্তফা',
  'ইসলাম',
  'মামুন',
  'করিম',
  'হাসান',
  'রহমান',
  'হোসেন',
  'আহমেদ',
  'চৌধুরী',
  'খান',
  'সিকদার',
  'তালুকদার',
  'পাটোয়ারী',
  'মজুমদার',
  'ভুঁইয়া',
  'সরকার',
  'বিশ্বাস',
  'মোল্লা',
  'মিয়া',
  'হক',
  'আক্তার',
  'সুলতানা',
  'জাহান',
];

const FATHER_NAMES = [
  'মোঃ আবুল কাশেম',
  'আলহাজ্ব মতিউর রহমান',
  'মোঃ শামসুল আলম',
  'আব্দুল খালেক',
  'মোঃ নুরুল ইসলাম',
  'মোঃ সিরাজুল হক',
  'হাজী আব্দুল লতিফ',
  'মোঃ দেলোয়ার হোসেন',
  'মোঃ ফজলুল করিম',
  'মোঃ শাহাবুদ্দিন আহমেদ',
  'মোঃ মোখলেসুর রহমান',
  'মোঃ আব্দুর রশিদ',
];

const MOTHER_NAMES = [
  'বেগম রোকেয়া আক্তার',
  'মিসেস ফাতেমা খাতুন',
  'জাহানারা বেগম',
  'সালমা সুলতানা',
  'হালিমা খাতুন',
  'মনোয়ারা বেগম',
  'নূরজাহান বেগম',
  'রওশন আরা বেগম',
  'তাহমিনা আক্তার',
  'খাদিজা বেগম',
];

const OCCUPATIONS = [
  'ব্যাংক কর্মকর্তা',
  'সফটওয়্যার প্রকৌশলী',
  'ব্যবসায়ী (আমদানি-রপ্তানি)',
  'সরকারি কর্মকর্তা',
  'বিশ্ববিদ্যালয় প্রভাষক',
  'চিকিৎসক',
  'সিভিল ইঞ্জিনিয়ার',
  'টেক্সটাইল মার্চেন্ডাইজার',
  'আইনজীবী',
  'করপোরেট নির্বাহী',
  'ফার্মাসিস্ট',
  'কৃষি উদ্যোক্তা',
];

const DISTRICTS = [
  { area: 'উত্তরা সেক্টর-১০, ঢাকা', perm: 'কুমিল্লা সদর, কুমিল্লা' },
  { area: 'মিরপুর ডিওএইচএস, ঢাকা', perm: 'বগুড়া সদর, বগুড়া' },
  { area: 'ধানমন্ডি রোড-২৭, ঢাকা', perm: 'সিলেট সদর, সিলেট' },
  { area: 'বনশ্রী ব্লক-সি, ঢাকা', perm: 'ফেনী সদর, ফেনী' },
  { area: 'মোহাম্মদপুর তাজমহল রোড, ঢাকা', perm: 'যশোর সদর, যশোর' },
  { area: 'বাড্ডা লিংক রোড, ঢাকা', perm: 'নোয়াখালী সদর, নোয়াখালী' },
  { area: 'নাসিরাবাদ হাউজিং, চট্টগ্রাম', perm: 'চন্দনাইশ, চট্টগ্রাম' },
  { area: 'বসুন্ধরা আবাসিক এলাকা, ঢাকা', perm: 'রাজশাহী সদর, রাজশাহী' },
  { area: 'খিলগাঁও তালতলা, ঢাকা', perm: 'ময়মনসিংহ সদর, ময়মনসিংহ' },
  { area: 'সিদ্ধেশ্বরী রোড, ঢাকা', perm: 'বরিশাল সদর, বরিশাল' },
];

const RELATIONS = ['স্ত্রী', 'মাতা', 'পিতা', 'ভাই', 'বোন', 'পুত্র', 'কন্যা'];

const AVATAR_COLORS = [
  '#10243A',
  '#087F68',
  '#1E3A5F',
  '#0F766E',
  '#274464',
  '#115E59',
  '#1D3557',
  '#0D6E5C',
];

const COMMITTEE_ROLES: Record<number, string> = {
  1: 'সভাপতি (President)',
  2: 'সাধারণ সম্পাদক (General Secretary)',
  3: 'কোষাধ্যক্ষ (Treasurer)',
  4: 'সহ-সভাপতি (Vice President)',
  5: 'সাংগঠনিক সম্পাদক',
  6: 'বিনিয়োগ ও প্রকল্প সমন্বয়ক',
  7: 'প্রচার ও দপ্তর সম্পাদক',
  8: 'নির্বাহী সদস্য',
  9: 'নির্বাহী সদস্য',
};

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function generate111Members(): Member[] {
  const members: Member[] = [];
  const operators = ['017', '018', '019', '016', '013', '015'];

  for (let i = 1; i <= 111; i++) {
    const first =
      i === 1
        ? 'মোঃ তানভীর'
        : i === 3
        ? 'মোঃ রাশেদুল'
        : i === 78
        ? 'মোঃ মাহফুজুর'
        : FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const last =
      i === 1
        ? 'মোস্তফা'
        : i === 3
        ? 'করিম'
        : i === 78
        ? 'রহমান চৌধুরী'
        : LAST_NAMES[(i * 5) % LAST_NAMES.length];
    const fullName = `${first} ${last}`;
    const dist = DISTRICTS[i % DISTRICTS.length];
    const op = operators[i % operators.length];
    const phoneMid = String(10000000 + ((i * 7919) % 89999999)).padStart(8, '0');
    const mobile = `${op}${phoneMid}`;

    const isInactive = i === 64 || i === 99;
    const isPendingKyc = i === 107 || i === 109 || i === 111;

    const birthYear = 1978 + (i % 18);
    const birthMonth = pad2((i % 12) + 1);
    const birthDay = pad2((i % 27) + 1);

    const admMonth = i <= 95 ? '01' : i <= 105 ? '02' : '03';
    const admDay = pad2((i % 20) + 1);

    const nomineeRelation = RELATIONS[i % RELATIONS.length];
    const nomineeFirst =
      nomineeRelation === 'স্ত্রী' || nomineeRelation === 'মাতা' || nomineeRelation === 'বোন'
        ? ['নাসরিন', 'ফারজানা', 'সুমাইয়া', 'রুবিনা', 'তাহেরা'][i % 5]
        : ['মোঃ শফিকুল', 'আব্দুল মান্নান', 'মোঃ তারেক', 'জাহিদুল'][i % 4];

    members.push({
      id: `FVC-${pad3(i)}`,
      serialNumber: i,
      fullName,
      fatherName: FATHER_NAMES[i % FATHER_NAMES.length],
      motherName: MOTHER_NAMES[i % MOTHER_NAMES.length],
      dob: `${birthYear}-${birthMonth}-${birthDay}`,
      occupation: OCCUPATIONS[i % OCCUPATIONS.length],
      mobile,
      email: `member.${pad3(i)}@futurevisioncapital.org`,
      presentAddress: `বাসা-${10 + (i % 45)}, রোড-${1 + (i % 12)}, ${dist.area}`,
      permanentAddress: `গ্রাম/মহল্লা-দক্ষিণপাড়া, ${dist.perm}`,
      admissionDate: `2026-${admMonth}-${admDay}`,
      status: isInactive ? 'INACTIVE' : 'ACTIVE',
      kycStatus: isPendingKyc ? 'PENDING' : 'VERIFIED',
      committeeRole: COMMITTEE_ROLES[i],
      nominee: {
        name: `${nomineeFirst} ${LAST_NAMES[(i + 3) % LAST_NAMES.length]}`,
        relation: nomineeRelation,
        age: 24 + (i % 26),
        nid: `${1988000000000 + i * 135791}`,
      },
      avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
    });
  }

  return members;
}

export function generateInitialLedger(members: Member[]): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  let txnCounter = 88001;
  let rcpCounter = 1001;
  const methods: PaymentMethod[] = ['BANK_TRANSFER', 'MFS', 'CASH'];

  // 1. Admission fees for all 111 members (last 2 pending? No, 109 approved, 2 pending for queue demo)
  for (const m of members) {
    const isPendingAdmission = m.serialNumber === 111;
    entries.push({
      id: `TXN-${txnCounter++}`,
      date: m.admissionDate,
      category: 'ADMISSION',
      debit: 0,
      credit: ADMISSION_FEE_AMOUNT,
      description: `এককালীন ভর্তি ফি — ${m.fullName} (${m.id})`,
      memberId: m.id,
      approvedBy: isPendingAdmission ? 'অপেক্ষমাণ' : 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
      status: isPendingAdmission ? 'PENDING' : 'APPROVED',
      paymentSubCategory: 'ADMISSION',
      paymentMethod: methods[m.serialNumber % methods.length],
      referenceNo: `ADM-${m.serialNumber}926`,
      receiptNo: `RCP-2026-${rcpCounter++}`,
      remarks: 'সদস্যপদ ভর্তি ফি বাবদ জমা',
      submittedBy: m.id,
    });
  }

  // 2. Monthly installments across Jan 2026 to Nov 2026
  // Most members paid all 11 months; ~16 members have 1-3 months due; a couple have pending Nov submissions
  for (const m of members) {
    if (m.status === 'INACTIVE') {
      // Inactive members paid only 4 months
      for (let mo = 0; mo < 4; mo++) {
        const mObj = INSTALLMENT_MONTHS_2026[mo];
        entries.push({
          id: `TXN-${txnCounter++}`,
          date: `2026-${pad2(mo + 1)}-${pad2(5 + (m.serialNumber % 15))}`,
          category: 'INSTALLMENT',
          debit: 0,
          credit: MONTHLY_INSTALLMENT_AMOUNT,
          description: `মাসিক কিস্তি (${mObj.label}) — ${m.fullName}`,
          memberId: m.id,
          approvedBy: 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
          status: 'APPROVED',
          paymentSubCategory: 'INSTALLMENT',
          monthKey: mObj.key,
          monthLabel: mObj.label,
          paymentMethod: methods[(m.serialNumber + mo) % 3],
          referenceNo: `INS-${mObj.key.replace('-', '')}-${m.serialNumber}`,
          receiptNo: `RCP-2026-${rcpCounter++}`,
          submittedBy: m.id,
        });
      }
      continue;
    }

    // Active members: determine how many months paid (out of 11)
    let paidMonths = 11;
    if (m.serialNumber % 9 === 0) paidMonths = 9; // 2 months due
    else if (m.serialNumber % 14 === 0) paidMonths = 8; // 3 months due
    else if (m.serialNumber % 17 === 0) paidMonths = 10; // 1 month due
    if (m.serialNumber === 78 || m.serialNumber === 1 || m.serialNumber === 3) {
      paidMonths = 11; // FVC-078, FVC-001, FVC-003 up to date
    }

    for (let mo = 0; mo < paidMonths; mo++) {
      const mObj = INSTALLMENT_MONTHS_2026[mo];
      // Make FVC-012 and FVC-045 November installments PENDING for Admin Approval Queue demo
      const isPending =
        mo === 10 && (m.serialNumber === 12 || m.serialNumber === 45 || m.serialNumber === 88);

      entries.push({
        id: `TXN-${txnCounter++}`,
        date: `2026-${pad2(mo + 1)}-${pad2(4 + ((m.serialNumber + mo) % 18))}`,
        category: 'INSTALLMENT',
        debit: 0,
        credit: MONTHLY_INSTALLMENT_AMOUNT,
        description: `মাসিক কিস্তি (${mObj.label}) — ${m.fullName}`,
        memberId: m.id,
        approvedBy: isPending ? 'অপেক্ষমাণ' : 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
        status: isPending ? 'PENDING' : 'APPROVED',
        paymentSubCategory: 'INSTALLMENT',
        monthKey: mObj.key,
        monthLabel: mObj.label,
        paymentMethod: methods[(m.serialNumber + mo) % 3],
        referenceNo: `BK-${mObj.key.replace('-', '')}-${pad3(m.serialNumber)}`,
        receiptNo: `RCP-2026-${rcpCounter++}`,
        remarks: isPending ? 'বিকাশ মার্চেন্ট পেমেন্ট স্লিপ সংযুক্ত' : 'নিয়মিত মাসিক কিস্তি',
        attachmentName: isPending ? `slip_${m.id}_nov2026.jpg` : undefined,
        submittedBy: m.id,
      });
    }
  }

  // 3. Investments Outflow (Approved)
  entries.push(
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-03-18',
      category: 'INVESTMENT_OUT',
      debit: 950000,
      credit: 0,
      description: 'বিনিয়োগ মূলধন প্রদান — পূর্বাচল গ্রিন ভ্যালি ল্যান্ড শেয়ার (INV-101)',
      investmentId: 'INV-101',
      approvedBy: 'মোঃ তানভীর মোস্তফা (সভাপতি)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'RTGS-20260318-101',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-04-10',
      category: 'INVESTMENT_OUT',
      debit: 550000,
      credit: 0,
      description: 'বিনিয়োগ মূলধন প্রদান — পদ্মা এগ্রো ডেইরি ও ফিশারিজ প্রকল্প (INV-102)',
      investmentId: 'INV-102',
      approvedBy: 'মোঃ তানভীর মোস্তফা (সভাপতি)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'BEFTN-20260410-102',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-05-15',
      category: 'INVESTMENT_OUT',
      debit: 420000,
      credit: 0,
      description: 'বিনিয়োগ মূলধন প্রদান — মৌসুমি পাইকারি চাল ও ভোজ্যতেল ট্রেডিং (INV-103)',
      investmentId: 'INV-103',
      approvedBy: 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'NPSB-20260515-103',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-07-02',
      category: 'INVESTMENT_OUT',
      debit: 320000,
      credit: 0,
      description: 'বিনিয়োগ মূলধন প্রদান — স্মার্ট পোল্ট্রি ও ফিড ডিস্ট্রিবিউশন (INV-104)',
      investmentId: 'INV-104',
      approvedBy: 'মোঃ তানভীর মোস্তফা (সভাপতি)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'RTGS-20260702-104',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    }
  );

  // 4. Realized Investment Returns (Approved)
  entries.push(
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-09-20',
      category: 'INVESTMENT_RETURN',
      debit: 0,
      credit: 118500,
      description: 'মুনাফা ও মূলধন রিটার্ন — মৌসুমি পাইকারি চাল ট্রেডিং (INV-103)',
      investmentId: 'INV-103',
      approvedBy: 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'RET-20260920-103',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-10-15',
      category: 'INVESTMENT_RETURN',
      debit: 0,
      credit: 145000,
      description: 'ত্রৈমাসিক মুনাফা প্রাপ্তি — পদ্মা এগ্রো ডেইরি ও ফিশারিজ (INV-102)',
      investmentId: 'INV-102',
      approvedBy: 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'RET-20261015-102',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-10-28',
      category: 'INVESTMENT_RETURN',
      debit: 0,
      credit: 64000,
      description: 'লভ্যাংশ প্রাপ্তি — স্মার্ট পোল্ট্রি ও ফিড ডিস্ট্রিবিউশন (INV-104)',
      investmentId: 'INV-104',
      approvedBy: 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'RET-20261028-104',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    }
  );

  // 5. Operating Expenses (Approved + 1 Pending voucher for Approval Queue)
  entries.push(
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-06-25',
      category: 'EXPENSE',
      debit: 24500,
      credit: 0,
      description: 'অর্ধ-বার্ষিক সাধারণ সভা (AGM) ভেন্যু ও আপ্যায়ন ব্যয়',
      approvedBy: 'মোঃ তানভীর মোস্তফা (সভাপতি)',
      status: 'APPROVED',
      paymentMethod: 'CASH',
      referenceNo: 'EXP-202606-01',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-09-05',
      category: 'EXPENSE',
      debit: 14200,
      credit: 0,
      description: 'সমিতি নিবন্ধন নবায়ন, অডিট স্টেশনারি ও সার্ভার হোস্টিং ব্যয়',
      approvedBy: 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'EXP-202609-02',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-11-12',
      category: 'EXPENSE',
      debit: 18500,
      credit: 0,
      description: 'বার্ষিক অডিট রিপোর্ট প্রিন্টিং ও লিগ্যাল কনসালটেন্সি ফি (ভাউচার #৪০৯)',
      approvedBy: 'অপেক্ষমাণ',
      status: 'PENDING',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'EXP-202611-03',
      receiptNo: `RCP-2026-${rcpCounter++}`,
      submittedBy: 'FVC-003',
    }
  );

  return entries;
}

export function generateSeedLedger(members: Member[]): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  let txnCounter = 88001;
  let rcpCounter = 1001;
  const methods: PaymentMethod[] = ['BANK_TRANSFER', 'MFS', 'CASH'];

  // 1. Admission fees (111 entries)
  for (const m of members) {
    const isPendingAdmission = m.serialNumber === 111;
    entries.push({
      id: `TXN-${txnCounter++}`,
      date: m.admissionDate,
      category: 'ADMISSION',
      debit: 0,
      credit: ADMISSION_FEE_AMOUNT,
      description: `এককালীন ভর্তি ফি — ${m.fullName} (${m.id})`,
      memberId: m.id,
      memberOwnerEmail: m.email,
      approvedBy: isPendingAdmission ? 'অপেক্ষমাণ' : 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
      status: isPendingAdmission ? 'PENDING' : 'APPROVED',
      paymentSubCategory: 'ADMISSION',
      paymentMethod: methods[m.serialNumber % methods.length],
      referenceNo: `ADM-${m.serialNumber}926`,
      receiptNo: `RCP-2026-${rcpCounter++}`,
      remarks: 'সদস্যপদ ভর্তি ফি বাবদ জমা',
      submittedBy: m.id,
    });
  }

  // 2. Consolidated Jan-Oct 2026 + individual Nov 2026 installments
  for (const m of members) {
    let paidMonths = 11;
    if (m.status === 'INACTIVE') paidMonths = 4;
    else if (m.serialNumber % 9 === 0) paidMonths = 9;
    else if (m.serialNumber % 14 === 0) paidMonths = 8;
    else if (m.serialNumber % 17 === 0) paidMonths = 10;
    if (m.serialNumber === 78 || m.serialNumber === 1 || m.serialNumber === 3) {
      paidMonths = 11;
    }

    const baseMonths = Math.min(paidMonths, 10);
    if (baseMonths > 0) {
      const covered = INSTALLMENT_MONTHS_2026.slice(0, baseMonths).map((x) => x.key);
      const firstLabel = INSTALLMENT_MONTHS_2026[0].label;
      const lastLabel = INSTALLMENT_MONTHS_2026[baseMonths - 1].label;
      entries.push({
        id: `TXN-${txnCounter++}`,
        date: `2026-${pad2(baseMonths)}-15`,
        category: 'INSTALLMENT',
        debit: 0,
        credit: baseMonths * MONTHLY_INSTALLMENT_AMOUNT,
        description: `নিয়মিত কিস্তি (${firstLabel} – ${lastLabel}, ${baseMonths} মাস) — ${m.fullName}`,
        memberId: m.id,
        memberOwnerEmail: m.email,
        approvedBy: 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
        status: 'APPROVED',
        paymentSubCategory: 'INSTALLMENT',
        monthKey: covered[covered.length - 1],
        monthLabel: `${firstLabel} – ${lastLabel}`,
        monthsCount: baseMonths,
        coveredMonths: covered,
        paymentMethod: methods[m.serialNumber % 3],
        referenceNo: `INS-YTD-${pad3(m.serialNumber)}`,
        receiptNo: `RCP-2026-${rcpCounter++}`,
        submittedBy: m.id,
      });
    }

    if (paidMonths === 11) {
      const novObj = INSTALLMENT_MONTHS_2026[10];
      const isPending = m.serialNumber === 12 || m.serialNumber === 45 || m.serialNumber === 88;
      entries.push({
        id: `TXN-${txnCounter++}`,
        date: `2026-11-${pad2(4 + (m.serialNumber % 10))}`,
        category: 'INSTALLMENT',
        debit: 0,
        credit: MONTHLY_INSTALLMENT_AMOUNT,
        description: `মাসিক কিস্তি (${novObj.label}) — ${m.fullName}`,
        memberId: m.id,
        memberOwnerEmail: m.email,
        approvedBy: isPending ? 'অপেক্ষমাণ' : 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
        status: isPending ? 'PENDING' : 'APPROVED',
        paymentSubCategory: 'INSTALLMENT',
        monthKey: novObj.key,
        monthLabel: novObj.label,
        monthsCount: 1,
        coveredMonths: [novObj.key],
        paymentMethod: methods[(m.serialNumber + 10) % 3],
        referenceNo: `BK-202611-${pad3(m.serialNumber)}`,
        receiptNo: `RCP-2026-${rcpCounter++}`,
        remarks: isPending ? 'বিকাশ মার্চেন্ট পেমেন্ট স্লিপ সংযুক্ত' : 'নিয়মিত মাসিক কিস্তি',
        attachmentName: isPending ? `slip_${m.id}_nov2026.jpg` : undefined,
        submittedBy: m.id,
      });
    }
  }

  // 3. Investments, Returns & Expenses
  entries.push(
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-03-18',
      category: 'INVESTMENT_OUT',
      debit: 950000,
      credit: 0,
      description: 'বিনিয়োগ মূলধন প্রদান — পূর্বাচল গ্রিন ভ্যালি ল্যান্ড শেয়ার (INV-101)',
      investmentId: 'INV-101',
      approvedBy: 'মোঃ তানভীর মোস্তফা (সভাপতি)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'RTGS-20260318-101',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-04-10',
      category: 'INVESTMENT_OUT',
      debit: 550000,
      credit: 0,
      description: 'বিনিয়োগ মূলধন প্রদান — পদ্মা এগ্রো ডেইরি ও ফিশারিজ প্রকল্প (INV-102)',
      investmentId: 'INV-102',
      approvedBy: 'মোঃ তানভীর মোস্তফা (সভাপতি)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'BEFTN-20260410-102',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-05-15',
      category: 'INVESTMENT_OUT',
      debit: 420000,
      credit: 0,
      description: 'বিনিয়োগ মূলধন প্রদান — মৌসুমি পাইকারি চাল ও ভোজ্যতেল ট্রেডিং (INV-103)',
      investmentId: 'INV-103',
      approvedBy: 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'NPSB-20260515-103',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-07-02',
      category: 'INVESTMENT_OUT',
      debit: 320000,
      credit: 0,
      description: 'বিনিয়োগ মূলধন প্রদান — স্মার্ট পোল্ট্রি ও ফিড ডিস্ট্রিবিউশন (INV-104)',
      investmentId: 'INV-104',
      approvedBy: 'মোঃ তানভীর মোস্তফা (সভাপতি)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'RTGS-20260702-104',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-09-20',
      category: 'INVESTMENT_RETURN',
      debit: 0,
      credit: 118500,
      description: 'মুনাফা ও মূলধন রিটার্ন — মৌসুমি পাইকারি চাল ট্রেডিং (INV-103)',
      investmentId: 'INV-103',
      approvedBy: 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'RET-20260920-103',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-10-15',
      category: 'INVESTMENT_RETURN',
      debit: 0,
      credit: 145000,
      description: 'ত্রৈমাসিক মুনাফা প্রাপ্তি — পদ্মা এগ্রো ডেইরি ও ফিশারিজ (INV-102)',
      investmentId: 'INV-102',
      approvedBy: 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'RET-20261015-102',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-10-28',
      category: 'INVESTMENT_RETURN',
      debit: 0,
      credit: 64000,
      description: 'লভ্যাংশ প্রাপ্তি — স্মার্ট পোল্ট্রি ও ফিড ডিস্ট্রিবিউশন (INV-104)',
      investmentId: 'INV-104',
      approvedBy: 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'RET-20261028-104',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-06-25',
      category: 'EXPENSE',
      debit: 24500,
      credit: 0,
      description: 'অর্ধ-বার্ষিক সাধারণ সভা (AGM) ভেন্যু ও আপ্যায়ন ব্যয়',
      approvedBy: 'মোঃ তানভীর মোস্তফা (সভাপতি)',
      status: 'APPROVED',
      paymentMethod: 'CASH',
      referenceNo: 'EXP-202606-01',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-09-05',
      category: 'EXPENSE',
      debit: 14200,
      credit: 0,
      description: 'সমিতি নিবন্ধন নবায়ন, অডিট স্টেশনারি ও সার্ভার হোস্টিং ব্যয়',
      approvedBy: 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'EXP-202609-02',
      receiptNo: `RCP-2026-${rcpCounter++}`,
    },
    {
      id: `TXN-${txnCounter++}`,
      date: '2026-11-12',
      category: 'EXPENSE',
      debit: 18500,
      credit: 0,
      description: 'বার্ষিক অডিট রিপোর্ট প্রিন্টিং ও লিগ্যাল কনসালটেন্সি ফি (ভাউচার #৪০৯)',
      approvedBy: 'অপেক্ষমাণ',
      status: 'PENDING',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'EXP-202611-03',
      receiptNo: `RCP-2026-${rcpCounter++}`,
      submittedBy: 'FVC-003',
    }
  );

  return entries;
}

export const INITIAL_INVESTMENTS: InvestmentProject[] = [
  {
    id: 'INV-101',
    name: 'পূর্বাচল গ্রিন ভ্যালি ল্যান্ড শেয়ার প্রকল্প',
    category: 'জমি ও রিয়েল এস্টেট',
    description:
      'পূর্বাচল সেক্টর-১৯ সংলগ্ন ১০ কাঠা বাণিজ্যিক/আবাসিক প্লটে যৌথ বিনিয়োগ। দলিল ও বায়না সম্পন্ন হয়েছে।',
    investmentDate: '2026-03-18',
    capitalInvested: 950000,
    durationMonths: 24,
    expectedReturnRate: 28,
    realizedReturn: 0,
    unrealizedValuation: 1210000,
    status: 'ACTIVE',
    inChargeName: 'ইঞ্জিঃ মোঃ কামরুল হাসান',
    inChargeMemberId: 'FVC-006',
    inChargeMobile: '01711882233',
  },
  {
    id: 'INV-102',
    name: 'পদ্মা এগ্রো ডেইরি ও মৎস্য খামার',
    category: 'এগ্রো ফার্মিং',
    description:
      'মুন্সিগঞ্জে আধুনিক শেডে ২৫টি উন্নত জাতের গাভী এবং ৩ একর মৎস্য প্রকল্পে ইকুইটি পার্টনারশিপ।',
    investmentDate: '2026-04-10',
    capitalInvested: 550000,
    durationMonths: 18,
    expectedReturnRate: 22,
    realizedReturn: 145000,
    unrealizedValuation: 615000,
    status: 'ACTIVE',
    inChargeName: 'মোঃ আরিফুল ইসলাম',
    inChargeMemberId: 'FVC-002',
    inChargeMobile: '01819334455',
  },
  {
    id: 'INV-103',
    name: 'মৌসুমি পাইকারি চাল ও ভোজ্যতেল ট্রেডিং',
    category: 'পাইকারি ট্রেডিং',
    description:
      'উত্তরাঞ্চলের মিল থেকে সরাসরি মিনিকেট ও নাজিরশাইল চাল সংগ্রহ করে ঢাকার পাইকারি বাজারে সরবরাহ।',
    investmentDate: '2026-05-15',
    capitalInvested: 420000,
    durationMonths: 6,
    expectedReturnRate: 18,
    realizedReturn: 118500,
    unrealizedValuation: 420000,
    status: 'MATURED',
    inChargeName: 'মোঃ রাশেদুল করিম',
    inChargeMemberId: 'FVC-003',
    inChargeMobile: '01715667788',
  },
  {
    id: 'INV-104',
    name: 'স্মার্ট পোল্ট্রি ও ফিড ডিস্ট্রিবিউশন হাব',
    category: 'ব্যবসা',
    description:
      'গাজীপুর ও সাভার অঞ্চলে ডিলারশিপ নেটওয়ার্কের মাধ্যমে পোল্ট্রি ফিড ও বাচ্চা সরবরাহের যৌথ ব্যবসা।',
    investmentDate: '2026-07-02',
    capitalInvested: 320000,
    durationMonths: 12,
    expectedReturnRate: 20,
    realizedReturn: 64000,
    unrealizedValuation: 350000,
    status: 'ACTIVE',
    inChargeName: 'আব্দুল্লাহ আল মামুন',
    inChargeMemberId: 'FVC-005',
    inChargeMobile: '01911229900',
  },
  {
    id: 'INV-105',
    name: 'রাজউক উত্তরা কমার্শিয়াল স্পেস বুকিং (প্রস্তাবিত)',
    category: 'পার্টনারশিপ',
    description:
      'বোর্ড অনুমোদনের অপেক্ষায় থাকা ১,২০০ বর্গফুট কমার্শিয়াল অফিস স্পেস ক্রয় প্রস্তাবনা।',
    investmentDate: '2026-11-01',
    capitalInvested: 0,
    durationMonths: 36,
    expectedReturnRate: 25,
    realizedReturn: 0,
    unrealizedValuation: 0,
    status: 'ON_HOLD',
    inChargeName: 'মোঃ তানভীর মোস্তফা',
    inChargeMemberId: 'FVC-001',
    inChargeMobile: '01712345678',
  },
];

export const INITIAL_FORUM_POSTS: ForumPost[] = [
  {
    id: 'POST-101',
    authorId: 'FVC-001',
    title: 'বার্ষিক সাধারণ সভা (AGM-2026) ও প্রথম লভ্যাংশ বণ্টন সংক্রান্ত জরুরি প্রস্তাবনা',
    category: 'সাধারণ সভা',
    content:
      'প্রিয় ১১১ জন সম্মানিত সদস্য, আগামী ২৫ ডিসেম্বর ২০২৬ তারিখে আমাদের বার্ষিক সাধারণ সভা অনুষ্ঠিত হবে। এবারের সভায় মৌসুমি ট্রেডিং ও এগ্রো প্রকল্পের অর্জিত মুনাফা থেকে প্রাথমিক লভ্যাংশ বণ্টনের প্রস্তাব পেশ করা হবে। সকল সদস্যকে নিজ নিজ বকেয়া কিস্তি ১০ ডিসেম্বরের মধ্যে পরিশোধ করার জন্য বিনীত অনুরোধ জানাচ্ছি।',
    attachmentName: 'AGM_2026_Agenda_Draft.pdf',
    createdAt: '২ ঘণ্টা আগে',
    likes: 48,
    likedByMe: true,
    isPinned: true,
    status: 'APPROVED',
    comments: [
      {
        id: 'CMT-1',
        authorId: 'FVC-003',
        content:
          'কিস্তি ও লেজার সমন্বয়ের কাজ এরই মধ্যে ৯৬% সম্পন্ন হয়েছে। মানি রিসিট পোর্টাল থেকে ডাউনলোড করা যাবে।',
        createdAt: '১ ঘণ্টা আগে',
        replies: [
          {
            id: 'RPL-1',
            authorId: 'FVC-078',
            content: 'অসাধারণ উদ্যোগ! আমার সব কিস্তির রিসিট অনলাইনে যাচাই করে নিয়েছি।',
            createdAt: '৪০ মিনিট আগে',
          },
        ],
      },
      {
        id: 'CMT-2',
        authorId: 'FVC-014',
        content: 'সভার ভেন্যু উত্তরা বা ধানমন্ডি কেন্দ্রিক হলে সবার জন্য যাতায়াত সহজ হবে।',
        createdAt: '২৫ মিনিট আগে',
        replies: [],
      },
    ],
  },
  {
    id: 'POST-102',
    authorId: 'FVC-006',
    title: 'বিনিয়োগ ধারণা: গাজীপুর-মাওনা হাইওয়ে সংলগ্ন ওয়্যারহাউজ ও কোল্ড স্টোরেজ শেয়ার',
    category: 'বিনিয়োগ ধারণা',
    content:
      'আমাদের অব্যবহৃত তরল মূলধন (Liquid Fund) থেকে প্রায় ৮-১০ লক্ষ টাকা একটি আধুনিক কৃষি পণ্য সংরক্ষণ কোল্ড স্টোরেজের ৪০% শেয়ারে বিনিয়োগ করা যেতে পারে। প্রাথমিক সম্ভাব্যতা যাচাইয়ে বার্ষিক ২২-২৬% নিট রিটার্নের সুযোগ দেখা যাচ্ছে। বিনিয়োগ কমিটির মতামত কাম্য।',
    attachmentName: 'Cold_Storage_Feasibility.xlsx',
    createdAt: 'গতকাল',
    likes: 31,
    likedByMe: false,
    isPinned: false,
    status: 'APPROVED',
    comments: [
      {
        id: 'CMT-3',
        authorId: 'FVC-002',
        content: 'প্রজেক্ট সাইট ভিজিটের জন্য ৫ সদস্যের একটি টিম আগামী শুক্রবার পরিদর্শনে যাবে।',
        createdAt: '১৮ ঘণ্টা আগে',
        replies: [],
      },
    ],
  },
  {
    id: 'POST-103',
    authorId: 'FVC-028',
    title: 'শীতকালীন সমাজকল্যাণ তহবিল ও শিক্ষা বৃত্তি কর্মসূচি ২০২৬',
    category: 'সমাজকল্যাণ',
    content:
      'প্রতি বছরের ন্যায় এবারও আমাদের সংগঠনের সামাজিক দায়বদ্ধতার অংশ হিসেবে লভ্যাংশের ১.৫% অথবা স্বেচ্ছা অনুদানের মাধ্যমে ৫০০ অসহায় পরিবারের মাঝে শীতবস্ত্র বিতরণের প্রস্তাব রাখছি।',
    createdAt: '৩ দিন আগে',
    likes: 62,
    likedByMe: true,
    isPinned: false,
    status: 'APPROVED',
    comments: [],
  },
  {
    id: 'POST-104',
    authorId: 'FVC-052',
    title: 'প্রস্তাবনা: কিস্তি পরিশোধের সময়সীমা প্রতি মাসের ১০ তারিখের পরিবর্তে ১৫ তারিখ করা হোক',
    category: 'প্রস্তাবনা',
    content:
      'অনেক বেসরকারি চাকরিজীবী সদস্যের বেতন মাসের ৭ থেকে ১২ তারিখের মধ্যে হয়। তাই জরিমানা ছাড়া কিস্তি পরিশোধের শেষ তারিখ ১৫ তারিখ নির্ধারণ করলে সবার জন্য সুবিধা হবে।',
    createdAt: '৩০ মিনিট আগে',
    likes: 4,
    likedByMe: false,
    isPinned: false,
    status: 'PENDING',
    comments: [],
  },
];

export const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'NTC-001',
    title: 'নভেম্বর ২০২৬ মাসের কিস্তি পরিশোধের শেষ তারিখ ২০ নভেম্বর',
    details:
      'সকল সম্মানিত সদস্যকে নির্ধারিত সময়ের মধ্যে মাসিক কিস্তি ৳২,০০০ জমা দিয়ে রিসিট সংরক্ষণ করার অনুরোধ করা হলো।',
    priority: 'URGENT',
    expiresAt: '2026-11-25',
    isPinned: true,
    createdAt: '2026-11-10',
    createdBy: 'মোঃ তানভীর মোস্তফা (সভাপতি)',
  },
  {
    id: 'NTC-002',
    title: 'পদ্মা এগ্রো প্রকল্পের দ্বিতীয় ত্রৈমাসিক মুনাফা তহবিলে যুক্ত হয়েছে',
    details:
      'পদ্মা এগ্রো ডেইরি ও ফিশারিজ প্রকল্প থেকে ৳১,৪৫,০০০ মুনাফা আমাদের মূল ব্যাংক হিসেবে জমা হয়েছে।',
    priority: 'NORMAL',
    expiresAt: '2026-12-10',
    isPinned: false,
    createdAt: '2026-11-05',
    createdBy: 'মোঃ রাশেদুল করিম (কোষাধ্যক্ষ)',
  },
  {
    id: 'NTC-003',
    title: 'নতুন ৩ জন সদস্যের KYC যাচাইকরণ প্রক্রিয়াধীন',
    details: 'FVC-107, FVC-109 এবং FVC-111 নম্বর সদস্যদের জাতীয় পরিচয়পত্র যাচাই চলছে।',
    priority: 'NORMAL',
    expiresAt: '2026-11-30',
    isPinned: false,
    createdAt: '2026-11-12',
    createdBy: 'সাধারণ সম্পাদক',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-901',
    timestamp: '২০২৬-১১-১৫ ০৪:১২ পিএম',
    actorName: 'মোঃ রাশেদুল করিম',
    actorId: 'FVC-003',
    actorRole: 'TREASURER',
    action: 'লভ্যাংশ রিটার্ন পোস্টিং',
    target: 'INV-104 (স্মার্ট পোল্ট্রি)',
    previousValue: '৳ ০',
    newValue: '৳ ৬৪,০০০ (অনুমোদিত)',
    txHash: '0x8F4A...9C12',
  },
  {
    id: 'AUD-902',
    timestamp: '২০২৬-১১-১৪ ১১:৩০ এএম',
    actorName: 'মোঃ তানভীর মোস্তফা',
    actorId: 'FVC-001',
    actorRole: 'SUPER_ADMIN',
    action: 'জরুরি নোটিশ প্রকাশ',
    target: 'NTC-001',
    previousValue: 'খসড়া',
    newValue: 'পিন করা ও লাইভ ব্যানার',
    txHash: '0x3D91...7E04',
  },
  {
    id: 'AUD-903',
    timestamp: '২০২৬-১১-১২ ০৩:৪৫ পিএম',
    actorName: 'মোঃ রাশেদুল করিম',
    actorId: 'FVC-003',
    actorRole: 'TREASURER',
    action: 'খরচের ভাউচার দাখিল',
    target: 'TXN-89340',
    previousValue: 'নতুন এন্ট্রি',
    newValue: '৳ ১৮,৫০০ (অপেক্ষমাণ)',
    txHash: '0x7B22...4A89',
  },
];
