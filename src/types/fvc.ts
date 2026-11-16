export type UserRole = 'SUPER_ADMIN' | 'TREASURER' | 'MEMBER';

export type PageId =
  | 'forum'
  | 'members'
  | 'installments'
  | 'investments'
  | 'dashboard'
  | 'portal';

export type MemberStatus = 'ACTIVE' | 'INACTIVE';
export type KycStatus = 'VERIFIED' | 'PENDING';

export interface NomineeInfo {
  name: string;
  relation: string;
  age: number;
  nid: string;
}

export interface Member {
  id: string; // e.g., FVC-001 to FVC-111
  serialNumber: number; // 1 to 111
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  occupation: string;
  mobile: string;
  email: string;
  presentAddress: string;
  permanentAddress: string;
  admissionDate: string;
  status: MemberStatus;
  kycStatus: KycStatus;
  committeeRole?: string; // e.g., সভাপতি, কোষাধ্যক্ষ, সাধারণ সম্পাদক, নির্বাহী সদস্য
  nominee: NomineeInfo;
  avatarColor: string;
  avatarUrl?: string;
}

export type LedgerCategory =
  | 'ADMISSION'
  | 'INSTALLMENT'
  | 'INVESTMENT_OUT'
  | 'INVESTMENT_RETURN'
  | 'EXPENSE'
  | 'DIVIDEND_PAYOUT';

export type PaymentSubCategory =
  | 'ADMISSION'
  | 'INSTALLMENT'
  | 'SPECIAL_SAVINGS'
  | 'OTHER';

export type PaymentMethod = 'BANK_TRANSFER' | 'CASH' | 'MFS';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LedgerEntry {
  id: string; // e.g., TXN-88491
  date: string; // YYYY-MM-DD
  category: LedgerCategory;
  debit: number; // Outflow / Expense / Investment Out / Dividend Payout
  credit: number; // Inflow / Capital / Return
  description: string;
  memberId?: string; // FVC-001 .. FVC-111
  investmentId?: string; // INV-001 ..
  approvedBy: string;
  status: ApprovalStatus;
  // Extended voucher & audit fields
  paymentSubCategory?: PaymentSubCategory;
  monthKey?: string; // e.g., "2026-11"
  monthLabel?: string; // e.g., "নভেম্বর ২০২৬"
  paymentMethod?: PaymentMethod;
  referenceNo?: string;
  receiptNo?: string; // e.g., RCP-2026-0412
  remarks?: string;
  attachmentName?: string;
  submittedBy?: string;
  rejectionReason?: string;
}

export type InvestmentCategory =
  | 'ব্যবসা'
  | 'জমি ও রিয়েল এস্টেট'
  | 'এগ্রো ফার্মিং'
  | 'পাইকারি ট্রেডিং'
  | 'পার্টনারশিপ'
  | 'অন্যান্য';

export type InvestmentStatus = 'ACTIVE' | 'MATURED' | 'ON_HOLD';

export interface InvestmentProject {
  id: string; // e.g., INV-101
  name: string;
  category: InvestmentCategory;
  description: string;
  investmentDate: string;
  capitalInvested: number;
  durationMonths: number;
  expectedReturnRate: number; // %
  realizedReturn: number;
  unrealizedValuation: number;
  status: InvestmentStatus;
  inChargeName: string;
  inChargeMemberId: string;
  inChargeMobile: string;
}

export type ForumCategory =
  | 'প্রস্তাবনা'
  | 'বিনিয়োগ ধারণা'
  | 'সাধারণ সভা'
  | 'সমাজকল্যাণ'
  | 'বিবিধ';

export interface ForumReply {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface ForumComment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  replies: ForumReply[];
}

export interface ForumPost {
  id: string;
  authorId: string;
  title: string;
  category: ForumCategory;
  content: string;
  attachmentName?: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  isPinned: boolean;
  status: ApprovalStatus;
  comments: ForumComment[];
  rejectionReason?: string;
}

export type NoticePriority = 'URGENT' | 'NORMAL';

export interface NoticeItem {
  id: string;
  title: string;
  details: string;
  priority: NoticePriority;
  expiresAt: string;
  isPinned: boolean;
  createdAt: string;
  createdBy: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  target: string;
  previousValue: string;
  newValue: string;
  txHash: string;
}

export type DividendMethod = 'EQUAL' | 'PROPORTIONAL' | 'CUSTOM_PERCENT';

export interface DividendRecord {
  id: string;
  date: string;
  totalPool: number;
  method: DividendMethod;
  approvedBy: string;
  memberCount: number;
}
