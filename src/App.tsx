import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { KeyRound, Loader2, LogIn } from 'lucide-react';
import { FvcCrest } from './components/FvcCrest';
import { ReceiptModal } from './components/ReceiptModal';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ForumPage } from './pages/ForumPage';
import { InstallmentsPage } from './pages/InstallmentsPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { MembersPage } from './pages/MembersPage';
import { PortalPage } from './pages/PortalPage';
import {
  addForumCommentToFirestore,
  BOOTSTRAPPED_ADMIN_EMAIL,
  deleteNoticeFromFirestore,
  ensureUserAccount,
  fetchPostComments,
  formatFirebaseAuthError,
  loginWithUserIdAndPassword,
  provisionUserAccountByAdmin,
  registerMemberWithUserId,
  saveAuditLogToFirestore,
  saveBatchDividendEntriesToFirestore,
  saveForumPostToFirestore,
  saveInvestmentToFirestore,
  saveLedgerEntryToFirestore,
  saveMemberToFirestore,
  saveNoticeToFirestore,
  seedCooperativeDatabaseIfNeeded,
  syncCooperativeSummary,
  toggleForumLikeInFirestore,
  updateForumPostInFirestore,
  updateInvestmentReturnInFirestore,
  updateLedgerStatusInFirestore,
  updateUserLinkedMember,
  updateUserRoleAndLinkByAdmin,
  verifyMemberKycInFirestore,
} from './services/fvcFirestore';
import {
  AuditLogEntry,
  DividendMethod,
  ForumCategory,
  ForumComment,
  ForumPost,
  InvestmentProject,
  LedgerEntry,
  Member,
  NoticeItem,
  NoticePriority,
  PageId,
  PaymentMethod,
  PaymentSubCategory,
  UserAccountRecord,
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

interface MemberPublicDoc {
  id: string;
  serialNumber: number;
  fullName: string;
  occupation: string;
  admissionDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  kycStatus: 'VERIFIED' | 'PENDING';
  committeeRole?: string;
  avatarColor: string;
  ownerUid?: string;
}

interface MemberPrivateDoc {
  id: string;
  ownerUid?: string;
  memberOwnerEmail?: string;
  fatherName: string;
  motherName: string;
  dob: string;
  mobile: string;
  email: string;
  presentAddress: string;
  permanentAddress: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineeAge: number;
  nomineeNid: string;
}

export default function App() {
  // Firebase Auth State
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [accountRole, setAccountRole] = useState<UserRole>('MEMBER');
  const [previewRole, setPreviewRole] = useState<UserRole>('SUPER_ADMIN');
  const [linkedMemberId, setLinkedMemberId] = useState<string>('FVC-001');
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [seedingDb, setSeedingDb] = useState(false);
  const [gateUserId, setGateUserId] = useState('');
  const [gatePassword, setGatePassword] = useState('');

  // Firestore Live Collections
  const [publicMembers, setPublicMembers] = useState<MemberPublicDoc[]>([]);
  const [privateMembersMap, setPrivateMembersMap] = useState<Map<string, MemberPrivateDoc>>(
    new Map()
  );
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [investments, setInvestments] = useState<InvestmentProject[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccountRecord[]>([]);

  // Navigation & UI State
  const [activePage, setActivePage] = useState<PageId>('portal');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedOrgFund, setSelectedOrgFund] = useState(
    'Future Vision Capital — মূল তহবিল'
  );
  const [receiptEntry, setReceiptEntry] = useState<LedgerEntry | null>(null);

  const isActualAdmin =
    accountRole === 'SUPER_ADMIN' ||
    accountRole === 'TREASURER' ||
    firebaseUser?.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

  const currentRole: UserRole = isActualAdmin ? previewRole : accountRole;

  // Merge public + private member docs safely (PII isolated)
  const members: Member[] = useMemo(() => {
    return publicMembers
      .slice()
      .sort((a, b) => a.serialNumber - b.serialNumber)
      .map((pub) => {
        const priv = privateMembersMap.get(pub.id);
        return {
          id: pub.id,
          serialNumber: pub.serialNumber,
          fullName: pub.fullName,
          occupation: pub.occupation,
          admissionDate: pub.admissionDate,
          status: pub.status,
          kycStatus: pub.kycStatus,
          committeeRole: pub.committeeRole,
          avatarColor: pub.avatarColor,
          ownerUid: pub.ownerUid,
          fatherName: priv?.fatherName ?? 'সুরক্ষিত তথ্য',
          motherName: priv?.motherName ?? 'সুরক্ষিত তথ্য',
          dob: priv?.dob ?? '',
          mobile: priv?.mobile ?? 'অ্যাডমিন অনুমোদিত',
          email: priv?.email ?? 'protected@fvc',
          presentAddress: priv?.presentAddress ?? 'সুরক্ষিত',
          permanentAddress: priv?.permanentAddress ?? 'সুরক্ষিত',
          nominee: {
            name: priv?.nomineeName ?? 'সুরক্ষিত',
            relation: priv?.nomineeRelation ?? '—',
            age: priv?.nomineeAge ?? 0,
            nid: priv?.nomineeNid ?? '—',
          },
        };
      });
  }, [publicMembers, privateMembersMap]);

  const activeUserId = useMemo(() => {
    if (isActualAdmin) {
      if (previewRole === accountRole) return linkedMemberId || 'FVC-001';
      if (previewRole === 'SUPER_ADMIN') return linkedMemberId || 'FVC-001';
      if (previewRole === 'TREASURER') return 'FVC-003';
      return 'FVC-078';
    }
    return linkedMemberId;
  }, [isActualAdmin, previewRole, accountRole, linkedMemberId]);

  const currentUser: Member = useMemo(() => {
    return (
      members.find((m) => m.id === activeUserId) ||
      members[0] || {
        id: activeUserId,
        serialNumber: 1,
        fullName: firebaseUser?.displayName || 'সদস্য',
        fatherName: '—',
        motherName: '—',
        dob: '',
        occupation: 'সদস্য',
        mobile: '—',
        email: firebaseUser?.email || '',
        presentAddress: '—',
        permanentAddress: '—',
        admissionDate: '2026-01-01',
        status: 'ACTIVE',
        kycStatus: 'VERIFIED',
        nominee: { name: '—', relation: '—', age: 0, nid: '—' },
        avatarColor: '#10243A',
      }
    );
  }, [members, activeUserId, firebaseUser]);

  // 1. Auth Listener & Bootstrapper
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setPublicMembers([]);
        setPrivateMembersMap(new Map());
        setLedger([]);
        setInvestments([]);
        setForumPosts([]);
        setNotices([]);
        setAuditLogs([]);
        setUserAccounts([]);
        setAuthUserId(null);
        setAuthReady(true);
        return;
      }

      try {
        const email = user.email || '';
        const acct = await ensureUserAccount(
          user.uid,
          email,
          user.displayName || 'FVC Member'
        );
        setAccountRole(acct.role);
        setPreviewRole(acct.role);
        setLinkedMemberId(acct.linkedMemberId);
        setAuthUserId(acct.userId || acct.linkedMemberId);

        const userIsAdmin =
          acct.role === 'SUPER_ADMIN' ||
          acct.role === 'TREASURER' ||
          (user.emailVerified &&
            email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase());

        if (userIsAdmin) {
          setSeedingDb(true);
          await seedCooperativeDatabaseIfNeeded(user.uid, email);
          setSeedingDb(false);
          setActivePage((prev) => (prev === 'portal' ? 'dashboard' : prev));
        }
      } catch (err) {
        setSeedingDb(false);
        setAuthError(err instanceof Error ? err.message : String(err));
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  // 2. Real-Time Firestore Subscriptions (Only when authReady && firebaseUser)
  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    const uid = firebaseUser.uid;
    const email = firebaseUser.email || '';
    const unsubs: (() => void)[] = [];

    // Public Members
    unsubs.push(
      onSnapshot(
        collection(db, 'members_public'),
        (snap) => {
          setPublicMembers(snap.docs.map((d) => d.data() as MemberPublicDoc));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'members_public')
      )
    );

    // Private Members (PII strictly scoped by role)
    if (isActualAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'members_private'),
          (snap) => {
            const next = new Map<string, MemberPrivateDoc>();
            snap.docs.forEach((d) => next.set(d.id, d.data() as MemberPrivateDoc));
            setPrivateMembersMap(next);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'members_private')
        )
      );
    } else {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'members_private'), where('ownerUid', '==', uid)),
          (snap) => {
            setPrivateMembersMap((prev) => {
              const next = new Map(prev);
              snap.docs.forEach((d) => next.set(d.id, d.data() as MemberPrivateDoc));
              return next;
            });
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'members_private')
        )
      );
    }

    // Ledger
    if (isActualAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'ledger'),
          (snap) => {
            const rows = snap.docs.map((d) => d.data() as LedgerEntry);
            rows.sort((a, b) => a.id.localeCompare(b.id));
            setLedger(rows);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'ledger')
        )
      );
    } else {
      const myAuthorQuery = query(collection(db, 'ledger'), where('authorUid', '==', uid));
      const myOwnerUidQuery = query(
        collection(db, 'ledger'),
        where('memberOwnerUid', '==', uid)
      );
      const mergeEntries = (docs: LedgerEntry[]) => {
        setLedger((prev) => {
          const map = new Map(prev.map((e) => [e.id, e]));
          docs.forEach((e) => map.set(e.id, e));
          return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
        });
      };
      unsubs.push(
        onSnapshot(
          myAuthorQuery,
          (snap) => mergeEntries(snap.docs.map((d) => d.data() as LedgerEntry)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'ledger')
        )
      );
      unsubs.push(
        onSnapshot(
          myOwnerUidQuery,
          (snap) => mergeEntries(snap.docs.map((d) => d.data() as LedgerEntry)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'ledger')
        )
      );
      if (firebaseUser.emailVerified && email) {
        const myEmailQuery = query(
          collection(db, 'ledger'),
          where('memberOwnerEmail', '==', email)
        );
        unsubs.push(
          onSnapshot(
            myEmailQuery,
            (snap) => mergeEntries(snap.docs.map((d) => d.data() as LedgerEntry)),
            (err) => handleFirestoreError(err, OperationType.LIST, 'ledger')
          )
        );
      }
    }

    // Investments
    unsubs.push(
      onSnapshot(
        collection(db, 'investments'),
        (snap) => {
          const rows = snap.docs.map((d) => d.data() as InvestmentProject);
          rows.sort((a, b) => a.id.localeCompare(b.id));
          setInvestments(rows);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'investments')
      )
    );

    // Forum Posts + Comments + Like state
    const hydrateForumPosts = async (rawPosts: Record<string, unknown>[]) => {
      const hydrated = await Promise.all(
        rawPosts.map(async (raw) => {
          const id = String(raw.id);
          const rawComments = await fetchPostComments(id);
          const topComments: ForumComment[] = [];
          const replyMap = new Map<string, ForumComment['replies']>();

          for (const rc of rawComments) {
            if (rc.parentCommentId) {
              const pId = String(rc.parentCommentId);
              const list = replyMap.get(pId) || [];
              list.push({
                id: String(rc.id),
                authorId: String(rc.authorId),
                content: String(rc.content),
                createdAt: String(rc.createdAtLabel || 'সম্প্রতি'),
              });
              replyMap.set(pId, list);
            } else {
              topComments.push({
                id: String(rc.id),
                authorId: String(rc.authorId),
                content: String(rc.content),
                createdAt: String(rc.createdAtLabel || 'সম্প্রতি'),
                replies: [],
              });
            }
          }

          for (const c of topComments) {
            c.replies = replyMap.get(c.id) || [];
          }

          let likedByMe = false;
          try {
            const likeSnap = await getDoc(doc(db, 'forum_posts', id, 'likes', uid));
            likedByMe = likeSnap.exists();
          } catch {
            likedByMe = false;
          }

          return {
            id,
            authorId: String(raw.authorId),
            title: String(raw.title),
            category: raw.category as ForumCategory,
            content: String(raw.content),
            attachmentName: raw.attachmentName ? String(raw.attachmentName) : undefined,
            createdAt: String(raw.createdAtLabel || 'সম্প্রতি'),
            likes: Number(raw.likes || 0),
            likedByMe,
            isPinned: Boolean(raw.isPinned),
            status: raw.status as ForumPost['status'],
            rejectionReason: raw.rejectionReason ? String(raw.rejectionReason) : undefined,
            comments: topComments,
          } satisfies ForumPost;
        })
      );
      setForumPosts(hydrated);
    };

    if (isActualAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'forum_posts'),
          (snap) => {
            void hydrateForumPosts(snap.docs.map((d) => d.data()));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'forum_posts')
        )
      );
    } else {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'forum_posts'), where('status', '==', 'APPROVED')),
          (snap) => {
            void hydrateForumPosts(snap.docs.map((d) => d.data()));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'forum_posts')
        )
      );
    }

    // Notices
    unsubs.push(
      onSnapshot(
        collection(db, 'notices'),
        (snap) => {
          setNotices(snap.docs.map((d) => d.data() as NoticeItem));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'notices')
      )
    );

    // Audit Logs & Registered Accounts (Admin only)
    if (isActualAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'audit_logs'),
          (snap) => {
            const rows = snap.docs.map((d) => d.data() as AuditLogEntry);
            rows.sort((a, b) => b.id.localeCompare(a.id));
            setAuditLogs(rows);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs')
        )
      );
      unsubs.push(
        onSnapshot(
          collection(db, 'users'),
          (snap) => {
            const rows = snap.docs.map((d) => d.data() as UserAccountRecord);
            rows.sort((a, b) => {
              const rank = (r: UserRole) =>
                r === 'SUPER_ADMIN' ? 0 : r === 'TREASURER' ? 1 : 2;
              return rank(a.role) - rank(b.role) || a.linkedMemberId.localeCompare(b.linkedMemberId);
            });
            setUserAccounts(rows);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'users')
        )
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, firebaseUser, isActualAdmin]);

  const pendingCount = useMemo(() => {
    const lCount = ledger.filter((e) => e.status === 'PENDING').length;
    const pCount = forumPosts.filter((p) => p.status === 'PENDING').length;
    const kCount = members.filter((m) => m.kycStatus === 'PENDING').length;
    return lCount + pCount + kCount;
  }, [ledger, forumPosts, members]);

  const appendAudit = async (
    action: string,
    target: string,
    previousValue: string,
    newValue: string
  ) => {
    if (!firebaseUser) return;
    const log: AuditLogEntry = {
      id: `AUD-${Date.now()}`,
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
    await saveAuditLogToFirestore(log, firebaseUser.uid);
  };

  // Auth Handlers
  const handleGoogleLogin = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(formatFirebaseAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleUserIdLogin = async (userId: string, password: string) => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await loginWithUserIdAndPassword(userId, password);
    } catch (err) {
      setAuthError(formatFirebaseAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleUserIdRegister = async (payload: {
    userId: string;
    password: string;
    displayName: string;
    linkedMemberId: string;
  }) => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await registerMemberWithUserId(payload);
    } catch (err) {
      setAuthError(formatFirebaseAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleCreateUserAccount = async (payload: {
    userId: string;
    password: string;
    displayName: string;
    role: UserRole;
    linkedMemberId: string;
  }) => {
    try {
      const created = await provisionUserAccountByAdmin(payload);
      await appendAudit(
        'নতুন ইউজার অ্যাকাউন্ট তৈরি',
        `${created.userId} (${created.linkedMemberId})`,
        'নতুন',
        `${created.displayName} — ${created.role}`
      );
    } catch (err) {
      throw new Error(formatFirebaseAuthError(err));
    }
  };

  const handleUpdateUserAccess = async (
    account: UserAccountRecord,
    newRole: UserRole,
    newLinkedMemberId: string
  ) => {
    await updateUserRoleAndLinkByAdmin(account, newRole, newLinkedMemberId);
    await appendAudit(
      'ইউজার রোল ও সদস্য লিংক পরিবর্তন',
      account.userId || account.linkedMemberId,
      `${account.role} (${account.linkedMemberId})`,
      `${newRole} (${newLinkedMemberId})`
    );
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActivePage('portal');
  };

  const handleChangeRole = (role: UserRole) => {
    if (isActualAdmin) {
      setPreviewRole(role);
    }
  };

  const handleLinkMemberId = async (memberId: string) => {
    if (!firebaseUser) return;
    setLinkedMemberId(memberId);
    await updateUserLinkedMember(firebaseUser.uid, memberId);
  };

  // Member Update & KYC Handlers
  const handleUpdateMember = async (updated: Member) => {
    const prevMember = members.find((m) => m.id === updated.id);
    await saveMemberToFirestore(updated);
    await appendAudit(
      'সদস্য তথ্য হালনাগাদ',
      updated.id,
      prevMember?.fullName || '',
      `${updated.fullName} (${updated.status})`
    );
  };

  const handleVerifyKyc = async (memberId: string) => {
    await verifyMemberKycInFirestore(memberId);
    await appendAudit('KYC যাচাই অনুমোদন', memberId, 'PENDING', 'VERIFIED');
  };

  // Ledger / Payment Handlers
  const handleAddPayment = async (payload: {
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
    if (!firebaseUser) return;
    const member = members.find((m) => m.id === payload.memberId);
    const isAdminAutoApprove = isActualAdmin && currentRole !== 'MEMBER';
    const category =
      payload.subCategory === 'ADMISSION' ? 'ADMISSION' : 'INSTALLMENT';

    const newEntry: LedgerEntry = {
      id: `TXN-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 89)}`,
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
      memberOwnerUid: member?.ownerUid,
      memberOwnerEmail: member?.email,
      approvedBy: isAdminAutoApprove ? currentUser.fullName : 'অপেক্ষমাণ',
      status: isAdminAutoApprove ? 'APPROVED' : 'PENDING',
      paymentSubCategory: payload.subCategory,
      monthKey: payload.monthKey,
      monthLabel: payload.monthLabel,
      monthsCount: category === 'INSTALLMENT' ? 1 : undefined,
      coveredMonths: payload.monthKey ? [payload.monthKey] : undefined,
      paymentMethod: payload.paymentMethod,
      referenceNo: payload.referenceNo,
      receiptNo: payload.receiptNo,
      remarks: payload.remarks,
      attachmentName: payload.attachmentName,
      submittedBy: currentUser.id,
      authorUid: firebaseUser.uid,
    };

    await saveLedgerEntryToFirestore(newEntry, firebaseUser.uid);
    if (isAdminAutoApprove) {
      await syncCooperativeSummary(members.length, [...ledger, newEntry]);
    }
    await appendAudit(
      'পেমেন্ট ভাউচার এন্ট্রি',
      `${newEntry.id} (${payload.memberId})`,
      'নতুন',
      `${formatBDT(payload.amount)} (${newEntry.status})`
    );
  };

  const handleApproveLedger = async (entryId: string) => {
    const target = ledger.find((e) => e.id === entryId);
    await updateLedgerStatusInFirestore(entryId, 'APPROVED', currentUser.fullName);
    const nextLedger = ledger.map((e) =>
      e.id === entryId ? { ...e, status: 'APPROVED' as const } : e
    );
    await syncCooperativeSummary(members.length, nextLedger);
    if (target) {
      await appendAudit(
        'আর্থিক ভাউচার অনুমোদন',
        target.id,
        'PENDING',
        `APPROVED (${formatBDT(target.credit || target.debit)})`
      );
    }
  };

  const handleRejectLedger = async (entryId: string, reason: string) => {
    const target = ledger.find((e) => e.id === entryId);
    await updateLedgerStatusInFirestore(entryId, 'REJECTED', currentUser.fullName, reason);
    if (target) {
      await appendAudit('ভাউচার বাতিল', target.id, 'PENDING', `REJECTED: ${reason}`);
    }
  };

  // Investment & Dividend Handlers
  const handleAddInvestment = async (project: InvestmentProject) => {
    if (!firebaseUser) return;
    await saveInvestmentToFirestore(project);
    let nextLedger = ledger;
    if (project.capitalInvested > 0) {
      const txn: LedgerEntry = {
        id: `TXN-INV-${Date.now().toString().slice(-6)}`,
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
      await saveLedgerEntryToFirestore(txn, firebaseUser.uid);
      nextLedger = [...ledger, txn];
    }
    await syncCooperativeSummary(members.length, nextLedger);
    await appendAudit(
      'নতুন বিনিয়োগ প্রকল্প নিবন্ধন',
      project.id,
      'নতুন',
      `${project.name} (${formatBDT(project.capitalInvested)})`
    );
  };

  const handleRecordInvestmentReturn = async (
    investmentId: string,
    amount: number,
    note: string
  ) => {
    if (!firebaseUser) return;
    const proj = investments.find((i) => i.id === investmentId);
    const nextRealized = (proj?.realizedReturn || 0) + amount;
    await updateInvestmentReturnInFirestore(investmentId, nextRealized);

    const txn: LedgerEntry = {
      id: `TXN-RET-${Date.now().toString().slice(-6)}`,
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
    await saveLedgerEntryToFirestore(txn, firebaseUser.uid);
    await syncCooperativeSummary(members.length, [...ledger, txn]);
    await appendAudit(
      'বিনিয়োগ মুনাফা পোস্টিং',
      investmentId,
      formatBDT(proj?.realizedReturn || 0),
      formatBDT(nextRealized)
    );
  };

  const handleDistributeDividend = async (
    totalPool: number,
    method: DividendMethod,
    payouts: { memberId: string; amount: number }[]
  ) => {
    if (!firebaseUser) return;
    const today = new Date().toISOString().slice(0, 10);
    const stamp = Date.now().toString().slice(-5);
    const memberEmailMap = new Map(members.map((m) => [m.id, m.email]));
    const memberUidMap = new Map(members.map((m) => [m.id, m.ownerUid]));
    const newEntries: LedgerEntry[] = payouts
      .filter((p) => p.amount > 0)
      .map((p, idx) => ({
        id: `TXN-DIV-${stamp}-${idx + 1}`,
        date: today,
        category: 'DIVIDEND_PAYOUT',
        debit: p.amount,
        credit: 0,
        description: `লভ্যাংশ বণ্টন (${method}) — সদস্য ${p.memberId}`,
        memberId: p.memberId,
        memberOwnerUid: memberUidMap.get(p.memberId),
        memberOwnerEmail: memberEmailMap.get(p.memberId),
        approvedBy: currentUser.fullName,
        status: 'APPROVED',
        paymentMethod: 'BANK_TRANSFER',
        receiptNo: `RCP-DIV-${p.memberId}`,
      }));

    await saveBatchDividendEntriesToFirestore(newEntries, firebaseUser.uid);
    await syncCooperativeSummary(members.length, [...ledger, ...newEntries]);
    await appendAudit(
      'লভ্যাংশ বণ্টন ও লেজার পোস্টিং',
      `${payouts.length} জন সদস্য`,
      'অবণ্টনকৃত',
      `${formatBDT(totalPool)} (${method})`
    );
  };

  // Forum Handlers
  const handleCreatePost = async (payload: {
    title: string;
    category: ForumCategory;
    content: string;
    attachmentName?: string;
  }) => {
    if (!firebaseUser) return;
    const isAdminAutoApprove = isActualAdmin && currentRole !== 'MEMBER';
    const newPost: ForumPost = {
      id: `POST-${Date.now().toString().slice(-6)}`,
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
    await saveForumPostToFirestore(newPost, firebaseUser.uid);
    await appendAudit(
      'ফোরাম আলোচনা দাখিল',
      newPost.id,
      'খসড়া',
      `${newPost.title} (${newPost.status})`
    );
  };

  const handleToggleLike = async (postId: string) => {
    if (!firebaseUser) return;
    const post = forumPosts.find((p) => p.id === postId);
    if (!post) return;
    await toggleForumLikeInFirestore(postId, firebaseUser.uid, post.likedByMe, post.likes);
  };

  const handleAddComment = async (
    postId: string,
    content: string,
    parentCommentId?: string
  ) => {
    if (!firebaseUser) return;
    const commentId = `${parentCommentId ? 'RPL' : 'CMT'}-${Date.now()}`;
    await addForumCommentToFirestore(
      postId,
      commentId,
      currentUser.id,
      firebaseUser.uid,
      content,
      parentCommentId
    );
    // Optimistically reflect comment while snapshot refreshes
    setForumPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        if (!parentCommentId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                id: commentId,
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
                      id: commentId,
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

  const handleApprovePost = async (postId: string) => {
    await updateForumPostInFirestore(postId, { status: 'APPROVED' });
    await appendAudit('ফোরাম পোস্ট অনুমোদন', postId, 'PENDING', 'APPROVED');
  };

  const handleRejectPost = async (postId: string, reason: string) => {
    await updateForumPostInFirestore(postId, {
      status: 'REJECTED',
      rejectionReason: reason,
    });
    await appendAudit('ফোরাম পোস্ট বাতিল', postId, 'PENDING', `REJECTED: ${reason}`);
  };

  const handleTogglePin = async (postId: string) => {
    const post = forumPosts.find((p) => p.id === postId);
    if (!post) return;
    await updateForumPostInFirestore(postId, { isPinned: !post.isPinned });
  };

  // Notice Handlers
  const handleCreateNotice = async (payload: {
    title: string;
    details: string;
    priority: NoticePriority;
    expiresAt: string;
    isPinned: boolean;
  }) => {
    const notice: NoticeItem = {
      id: `NTC-${Date.now().toString().slice(-5)}`,
      title: payload.title,
      details: payload.details,
      priority: payload.priority,
      expiresAt: payload.expiresAt,
      isPinned: payload.isPinned,
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: `${currentUser.fullName}`,
    };
    await saveNoticeToFirestore(notice);
    await appendAudit('জরুরি নোটিশ প্রকাশ', notice.id, 'নতুন', notice.title);
  };

  const handleDeleteNotice = async (id: string) => {
    await deleteNoticeFromFirestore(id);
    await appendAudit('নোটিশ অপসারণ', id, 'সক্রিয়', 'মুছে ফেলা হয়েছে');
  };

  const receiptMember = useMemo(
    () =>
      receiptEntry?.memberId
        ? members.find((m) => m.id === receiptEntry.memberId)
        : undefined,
    [receiptEntry, members]
  );

  // Clean Auth Loading Screen
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex flex-col items-center justify-center p-6 gap-4">
        <FvcCrest size={56} />
        <div className="flex items-center gap-2 text-sm font-semibold text-[#10243A]">
          <Loader2 className="w-4 h-4 animate-spin text-[#087F68]" />
          <span>Future Vision Capital — ক্লাউড ডাটাবেস সংযোগ যাচাই হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F6FA] text-[#10243A]">
      <TopBar
        activePage={activePage}
        onNavigate={setActivePage}
        onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
        currentRole={currentRole}
        onChangeRole={handleChangeRole}
        currentUser={currentUser}
        isAuthenticated={Boolean(firebaseUser)}
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
            {seedingDb && (
              <div className="mb-4 bg-[#10243A] text-white rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-[#D6A84B]" />
                <span>
                  প্রথমবার চালুর জন্য ১১১ জন সদস্য, কিস্তি লেজার ও বিনিয়োগ তথ্য Firebase
                  Firestore-এ সংরক্ষণ করা হচ্ছে...
                </span>
              </div>
            )}

            {!firebaseUser && activePage !== 'portal' ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md mx-auto my-8 space-y-5">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-fit">
                    <FvcCrest size={48} />
                  </div>
                  <h2 className="text-lg font-bold text-[#10243A]">
                    অ্যাডমিন বা সদস্য লগইন করুন
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    আপনার নির্ধারিত ইউজার আইডি ও পাসওয়ার্ড দিয়ে লগইন করুন।
                  </p>
                </div>

                {authError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 font-medium">
                    {authError}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (gateUserId.trim() && gatePassword) {
                      void handleUserIdLogin(gateUserId.trim(), gatePassword);
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block font-semibold text-[#10243A] mb-1">
                      ইউজার আইডি / ইমেইল
                    </label>
                    <input
                      type="text"
                      required
                      value={gateUserId}
                      onChange={(e) => setGateUserId(e.target.value)}
                      placeholder="যেমন: FVC-002 বা FVC-078"
                      className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#10243A] mb-1">পাসওয়ার্ড</label>
                    <input
                      type="password"
                      required
                      value={gatePassword}
                      onChange={(e) => setGatePassword(e.target.value)}
                      placeholder="পাসওয়ার্ড লিখুন"
                      className="w-full px-3 py-2 bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authBusy}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#087F68] hover:bg-[#066956] disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-[#F1CE7C]" />
                    {authBusy ? 'যাচাই হচ্ছে...' : 'ইউজার আইডি দিয়ে লগইন করুন'}
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={authBusy}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#10243A] text-xs font-semibold cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#087F68]" />
                    Google দিয়ে লগইন করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePage('portal')}
                    className="text-xs text-[#087F68] hover:underline font-semibold cursor-pointer text-center py-1"
                  >
                    নতুন সদস্য অ্যাকাউন্ট তৈরি করতে পোর্টালে যান →
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                    userAccounts={userAccounts}
                    currentRole={currentRole}
                    onApproveLedger={handleApproveLedger}
                    onRejectLedger={handleRejectLedger}
                    onApprovePost={handleApprovePost}
                    onRejectPost={handleRejectPost}
                    onVerifyKyc={handleVerifyKyc}
                    onCreateNotice={handleCreateNotice}
                    onDeleteNotice={handleDeleteNotice}
                    onOpenReceipt={setReceiptEntry}
                    onCreateUserAccount={handleCreateUserAccount}
                    onUpdateUserAccess={handleUpdateUserAccess}
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
                    isAuthenticated={Boolean(firebaseUser)}
                    authUserId={authUserId}
                    authEmail={firebaseUser?.email}
                    authBusy={authBusy}
                    authError={authError}
                    onUserIdLogin={handleUserIdLogin}
                    onUserIdRegister={handleUserIdRegister}
                    onGoogleLogin={handleGoogleLogin}
                    onLogout={handleLogout}
                    onLinkMemberId={firebaseUser ? handleLinkMemberId : undefined}
                    onOpenReceipt={setReceiptEntry}
                  />
                )}
              </>
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
