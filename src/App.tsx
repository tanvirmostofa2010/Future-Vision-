import React, { useMemo, useState } from 'react';
import { ReceiptModal } from './components/ReceiptModal';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import {
  generate111Members,
  generateInitialLedger,
  INITIAL_AUDIT_LOGS,
  INITIAL_FORUM_POSTS,
  INITIAL_INVESTMENTS,
  INITIAL_NOTICES,
} from './data/mockData';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ForumPage } from './pages/ForumPage';
import { InstallmentsPage } from './pages/InstallmentsPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { MembersPage } from './pages/MembersPage';
import { PortalPage } from './pages/PortalPage';
import {
  AuditLogEntry,
  DividendMethod,
  ForumCategory,
  ForumPost,
  InvestmentProject,
  LedgerEntry,
  Member,
  NoticeItem,
  NoticePriority,
  PageId,
  PaymentMethod,
  PaymentSubCategory,
  UserRole,
} from './types/fvc';
import { formatBDT, toBengaliDigits } from './utils/formatters';

function createTxHash(): string {
  const hex = Math.random().toString(16).slice(2, 6).toUpperCase();
  const hex2 = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `0x${hex}...${hex2}`;
}

function nowBnTimestamp(): string {
  const now = new Date();
  const d = now.toISOString().slice(0, 10);
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return toBengaliDigits(`${d} ${hh}:${mm}`);
}

export default function App() {
  const [members, setMembers] = useState<Member[]>(() => generate111Members());
  const [ledger, setLedger] = useState<LedgerEntry[]>(() =>
    generateInitialLedger(generate111Members())
  );
  const [investments, setInvestments] = useState<InvestmentProject[]>(INITIAL_INVESTMENTS);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(INITIAL_FORUM_POSTS);
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedOrgFund, setSelectedOrgFund] = useState(
    'Future Vision Capital — মূল তহবিল'
  );

  // Auth & Role State
  const [currentRole, setCurrentRole] = useState<UserRole>('SUPER_ADMIN');
  const [currentUserId, setCurrentUserId] = useState<string>('FVC-001');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Receipt Modal
  const [receiptEntry, setReceiptEntry] = useState<LedgerEntry | null>(null);

  const currentUser = useMemo(
    () => members.find((m) => m.id === currentUserId) || members[0],
    [members, currentUserId]
  );

  const pendingCount = useMemo(() => {
    const lCount = ledger.filter((e) => e.status === 'PENDING').length;
    const pCount = forumPosts.filter((p) => p.status === 'PENDING').length;
    const kCount = members.filter((m) => m.kycStatus === 'PENDING').length;
    return lCount + pCount + kCount;
  }, [ledger, forumPosts, members]);

  const appendAudit = (
    action: string,
    target: string,
    previousValue: string,
    newValue: string
  ) => {
    const log: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: nowBnTimestamp(),
      actorName: currentUser.fullName,
      actorId: currentUser.id,
      actorRole: currentRole,
      action,
      target,
      previousValue,
      newValue,
      txHash: createTxHash(),
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  // Role & Login Handlers
  const handleChangeRole = (role: UserRole) => {
    setCurrentRole(role);
    setIsAuthenticated(true);
    if (role === 'SUPER_ADMIN') setCurrentUserId('FVC-001');
    else if (role === 'TREASURER') setCurrentUserId('FVC-003');
    else setCurrentUserId('FVC-078');
  };

  const handleLogin = (memberId: string, role?: UserRole) => {
    setCurrentUserId(memberId);
    if (role) setCurrentRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Member Update & KYC Handlers
  const handleUpdateMember = (updated: Member) => {
    const prevMember = members.find((m) => m.id === updated.id);
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    appendAudit(
      'সদস্য তথ্য হালনাগাদ',
      updated.id,
      prevMember?.fullName || '',
      `${updated.fullName} (${updated.status})`
    );
  };

  const handleVerifyKyc = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, kycStatus: 'VERIFIED' } : m))
    );
    appendAudit('KYC যাচাই অনুমোদন', memberId, 'PENDING', 'VERIFIED');
  };

  // Ledger / Payment Handlers
  const handleAddPayment = (payload: {
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
  }) => {
    const member = members.find((m) => m.id === payload.memberId);
    const isAdminAutoApprove =
      currentRole === 'SUPER_ADMIN' || currentRole === 'TREASURER';
    const category =
      payload.subCategory === 'ADMISSION' ? 'ADMISSION' : 'INSTALLMENT';

    const newEntry: LedgerEntry = {
      id: `TXN-${Math.floor(90000 + Math.random() * 9000)}`,
      date: payload.date,
      category,
      debit: 0,
      credit: payload.amount,
      description: `${
        category === 'ADMISSION'
          ? 'এককালীন ভর্তি ফি'
          : payload.subCategory === 'SPECIAL_SAVINGS'
          ? 'বিশেষ সঞ্চয় জমা'
          : `মাসিক কিস্তি (${payload.monthLabel || ''})`
      } — ${member?.fullName || payload.memberId}`,
      memberId: payload.memberId,
      approvedBy: isAdminAutoApprove ? currentUser.fullName : 'অপেক্ষমাণ',
      status: isAdminAutoApprove ? 'APPROVED' : 'PENDING',
      paymentSubCategory: payload.subCategory,
      monthKey: payload.monthKey,
      monthLabel: payload.monthLabel,
      paymentMethod: payload.paymentMethod,
      referenceNo: payload.referenceNo,
      receiptNo: payload.receiptNo,
      remarks: payload.remarks,
      attachmentName: payload.attachmentName,
      submittedBy: currentUser.id,
    };

    setLedger((prev) => [...prev, newEntry]);
    appendAudit(
      'পেমেন্ট ভাউচার এন্ট্রি',
      `${newEntry.id} (${payload.memberId})`,
      'নতুন',
      `${formatBDT(payload.amount)} (${newEntry.status})`
    );
  };

  const handleApproveLedger = (entryId: string) => {
    const target = ledger.find((e) => e.id === entryId);
    setLedger((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, status: 'APPROVED', approvedBy: currentUser.fullName }
          : e
      )
    );
    if (target) {
      appendAudit(
        'আর্থিক ভাউচার অনুমোদন',
        target.id,
        'PENDING',
        `APPROVED (${formatBDT(target.credit || target.debit)})`
      );
    }
  };

  const handleRejectLedger = (entryId: string, reason: string) => {
    const target = ledger.find((e) => e.id === entryId);
    setLedger((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              status: 'REJECTED',
              approvedBy: currentUser.fullName,
              rejectionReason: reason,
            }
          : e
      )
    );
    if (target) {
      appendAudit('ভাউচার বাতিল', target.id, 'PENDING', `REJECTED: ${reason}`);
    }
  };

  // Investment & Dividend Handlers
  const handleAddInvestment = (project: InvestmentProject) => {
    setInvestments((prev) => [project, ...prev]);
    if (project.capitalInvested > 0) {
      const txn: LedgerEntry = {
        id: `TXN-${Math.floor(91000 + Math.random() * 8000)}`,
        date: project.investmentDate,
        category: 'INVESTMENT_OUT',
        debit: project.capitalInvested,
        credit: 0,
        description: `বিনিয়োগ মূলধন প্রদান — ${project.name} (${project.id})`,
        investmentId: project.id,
        approvedBy: currentUser.fullName,
        status: 'APPROVED',
        paymentMethod: 'BANK_TRANSFER',
        referenceNo: `INV-${project.id}`,
        receiptNo: `RCP-INV-${project.id}`,
      };
      setLedger((prev) => [...prev, txn]);
    }
    appendAudit(
      'নতুন বিনিয়োগ প্রকল্প নিবন্ধন',
      project.id,
      'নতুন',
      `${project.name} (${formatBDT(project.capitalInvested)})`
    );
  };

  const handleRecordInvestmentReturn = (
    investmentId: string,
    amount: number,
    note: string
  ) => {
    const proj = investments.find((i) => i.id === investmentId);
    setInvestments((prev) =>
      prev.map((i) =>
        i.id === investmentId
          ? { ...i, realizedReturn: i.realizedReturn + amount }
          : i
      )
    );
    const txn: LedgerEntry = {
      id: `TXN-${Math.floor(92000 + Math.random() * 7000)}`,
      date: new Date().toISOString().slice(0, 10),
      category: 'INVESTMENT_RETURN',
      debit: 0,
      credit: amount,
      description: `${note} — ${proj?.name || investmentId} (${investmentId})`,
      investmentId,
      approvedBy: currentUser.fullName,
      status: 'APPROVED',
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: `RET-${Date.now().toString().slice(-5)}`,
      receiptNo: `RCP-RET-${Date.now().toString().slice(-4)}`,
    };
    setLedger((prev) => [...prev, txn]);
    appendAudit(
      'বিনিয়োগ মুনাফা পোস্টিং',
      investmentId,
      formatBDT(proj?.realizedReturn || 0),
      formatBDT((proj?.realizedReturn || 0) + amount)
    );
  };

  const handleDistributeDividend = (
    totalPool: number,
    method: DividendMethod,
    payouts: { memberId: string; amount: number }[]
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const newEntries: LedgerEntry[] = payouts
      .filter((p) => p.amount > 0)
      .map((p, idx) => ({
        id: `TXN-DIV-${Date.now().toString().slice(-4)}-${idx + 1}`,
        date: today,
        category: 'DIVIDEND_PAYOUT',
        debit: p.amount,
        credit: 0,
        description: `লভ্যাংশ বণ্টন (${method}) — সদস্য ${p.memberId}`,
        memberId: p.memberId,
        approvedBy: currentUser.fullName,
        status: 'APPROVED',
        paymentMethod: 'BANK_TRANSFER',
        receiptNo: `RCP-DIV-${p.memberId}`,
      }));

    setLedger((prev) => [...prev, ...newEntries]);
    appendAudit(
      'লভ্যাংশ বণ্টন ও লেজার পোস্টিং',
      `${payouts.length} জন সদস্য`,
      'অবণ্টনকৃত',
      `${formatBDT(totalPool)} (${method})`
    );
  };

  // Forum Handlers
  const handleCreatePost = (payload: {
    title: string;
    category: ForumCategory;
    content: string;
    attachmentName?: string;
  }) => {
    const isAdminAutoApprove =
      currentRole === 'SUPER_ADMIN' || currentRole === 'TREASURER';
    const newPost: ForumPost = {
      id: `POST-${Math.floor(200 + Math.random() * 800)}`,
      authorId: currentUser.id,
      title: payload.title,
      category: payload.category,
      content: payload.content,
      attachmentName: payload.attachmentName,
      createdAt: 'এইমাত্র',
      likes: 0,
      likedByMe: false,
      isPinned: false,
      status: isAdminAutoApprove ? 'APPROVED' : 'PENDING',
      comments: [],
    };
    setForumPosts((prev) => [newPost, ...prev]);
    appendAudit(
      'ফোরাম আলোচনা দাখিল',
      newPost.id,
      'খসড়া',
      `${newPost.title} (${newPost.status})`
    );
  };

  const handleToggleLike = (postId: string) => {
    setForumPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likes: p.likedByMe ? Math.max(0, p.likes - 1) : p.likes + 1,
            }
          : p
      )
    );
  };

  const handleAddComment = (
    postId: string,
    content: string,
    parentCommentId?: string
  ) => {
    setForumPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        if (!parentCommentId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                id: `CMT-${Date.now()}`,
                authorId: currentUser.id,
                content,
                createdAt: 'এইমাত্র',
                replies: [],
              },
            ],
          };
        }
        return {
          ...p,
          comments: p.comments.map((c) =>
            c.id === parentCommentId
              ? {
                  ...c,
                  replies: [
                    ...c.replies,
                    {
                      id: `RPL-${Date.now()}`,
                      authorId: currentUser.id,
                      content,
                      createdAt: 'এইমাত্র',
                    },
                  ],
                }
              : c
          ),
        };
      })
    );
  };

  const handleApprovePost = (postId: string) => {
    setForumPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'APPROVED' } : p))
    );
    appendAudit('ফোরাম পোস্ট অনুমোদন', postId, 'PENDING', 'APPROVED');
  };

  const handleRejectPost = (postId: string, reason: string) => {
    setForumPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, status: 'REJECTED', rejectionReason: reason } : p
      )
    );
    appendAudit('ফোরাম পোস্ট বাতিল', postId, 'PENDING', `REJECTED: ${reason}`);
  };

  const handleTogglePin = (postId: string) => {
    setForumPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isPinned: !p.isPinned } : p))
    );
  };

  // Notice Handlers
  const handleCreateNotice = (payload: {
    title: string;
    details: string;
    priority: NoticePriority;
    expiresAt: string;
    isPinned: boolean;
  }) => {
    const notice: NoticeItem = {
      id: `NTC-${Date.now().toString().slice(-3)}`,
      title: payload.title,
      details: payload.details,
      priority: payload.priority,
      expiresAt: payload.expiresAt,
      isPinned: payload.isPinned,
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: `${currentUser.fullName}`,
    };
    setNotices((prev) => [notice, ...prev]);
    appendAudit('জরুরি নোটিশ প্রকাশ', notice.id, 'নতুন', notice.title);
  };

  const handleDeleteNotice = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
    appendAudit('নোটিশ অপসারণ', id, 'সক্রিয়', 'মুছে ফেলা হয়েছে');
  };

  const receiptMember = useMemo(
    () =>
      receiptEntry?.memberId
        ? members.find((m) => m.id === receiptEntry.memberId)
        : undefined,
    [receiptEntry, members]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F6FA] text-[#10243A]">
      <TopBar
        activePage={activePage}
        onNavigate={setActivePage}
        onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
        currentRole={currentRole}
        onChangeRole={handleChangeRole}
        currentUser={currentUser}
        isAuthenticated={isAuthenticated}
        notices={notices}
        pendingCount={pendingCount}
        selectedOrgFund={selectedOrgFund}
        onChangeOrgFund={setSelectedOrgFund}
      />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          currentRole={currentRole}
          pendingCount={pendingCount}
        />

        <main className="no-print flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {activePage === 'forum' && (
              <ForumPage
                posts={forumPosts}
                members={members}
                currentUser={currentUser}
                currentRole={currentRole}
                onCreatePost={handleCreatePost}
                onToggleLike={handleToggleLike}
                onAddComment={handleAddComment}
                onApprovePost={handleApprovePost}
                onRejectPost={handleRejectPost}
                onTogglePin={handleTogglePin}
              />
            )}

            {activePage === 'members' && (
              <MembersPage
                members={members}
                ledger={ledger}
                currentRole={currentRole}
                onUpdateMember={handleUpdateMember}
              />
            )}

            {activePage === 'installments' && (
              <InstallmentsPage
                members={members}
                ledger={ledger}
                currentRole={currentRole}
                currentUser={currentUser}
                onAddPayment={handleAddPayment}
                onApproveEntry={handleApproveLedger}
                onRejectEntry={handleRejectLedger}
                onOpenReceipt={setReceiptEntry}
              />
            )}

            {activePage === 'investments' && (
              <InvestmentsPage
                investments={investments}
                members={members}
                ledger={ledger}
                currentRole={currentRole}
                onAddInvestment={handleAddInvestment}
                onRecordInvestmentReturn={handleRecordInvestmentReturn}
                onDistributeDividend={handleDistributeDividend}
              />
            )}

            {activePage === 'dashboard' && (
              <AdminDashboardPage
                members={members}
                ledger={ledger}
                investments={investments}
                forumPosts={forumPosts}
                notices={notices}
                auditLogs={auditLogs}
                currentRole={currentRole}
                onApproveLedger={handleApproveLedger}
                onRejectLedger={handleRejectLedger}
                onApprovePost={handleApprovePost}
                onRejectPost={handleRejectPost}
                onVerifyKyc={handleVerifyKyc}
                onCreateNotice={handleCreateNotice}
                onDeleteNotice={handleDeleteNotice}
                onOpenReceipt={setReceiptEntry}
              />
            )}

            {activePage === 'portal' && (
              <PortalPage
                members={members}
                ledger={ledger}
                forumPosts={forumPosts}
                notices={notices}
                currentUser={currentUser}
                currentRole={currentRole}
                isAuthenticated={isAuthenticated}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onOpenReceipt={setReceiptEntry}
              />
            )}
          </div>
        </main>
      </div>

      {/* Printable Money Receipt Modal */}
      <ReceiptModal
        entry={receiptEntry}
        member={receiptMember}
        onClose={() => setReceiptEntry(null)}
      />
    </div>
  );
}
