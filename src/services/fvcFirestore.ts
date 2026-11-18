import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  generate111Members,
  generateSeedLedger,
  INITIAL_AUDIT_LOGS,
  INITIAL_FORUM_POSTS,
  INITIAL_INVESTMENTS,
  INITIAL_NOTICES,
} from '../data/mockData';
import { auth, db, handleFirestoreError, OperationType, secondaryAuth } from '../firebase';
import {
  AuditLogEntry,
  ForumPost,
  InvestmentProject,
  LedgerEntry,
  Member,
  NoticeItem,
  UserAccountRecord,
  UserRole,
} from '../types/fvc';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'tanvirmostofa2010.maxbtl@gmail.com';
const AUTH_SYNTHETIC_DOMAIN = 'auth.futurevisioncapital.org';

function clampStr(val: string | undefined | null, max: number): string {
  if (!val) return '';
  return val.slice(0, max);
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

export function userIdToAuthEmail(rawUserId: string): string {
  const trimmed = rawUserId.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  const sanitized = trimmed.replace(/[^a-z0-9._\-]/g, '');
  if (!sanitized) return '';
  return `${sanitized}@${AUTH_SYNTHETIC_DOMAIN}`;
}

export function extractFriendlyUserId(email: string, fallbackMemberId?: string): string {
  const clean = email.trim();
  if (clean.toLowerCase().endsWith(`@${AUTH_SYNTHETIC_DOMAIN}`)) {
    return clean.slice(0, clean.length - AUTH_SYNTHETIC_DOMAIN.length - 1).toUpperCase();
  }
  if (fallbackMemberId) return fallbackMemberId;
  return clean.split('@')[0] || 'USER';
}

export function formatFirebaseAuthError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('auth/operation-not-allowed') || msg.includes('CONFIGURATION_NOT_FOUND')) {
    return 'Firebase Console-এ Email/Password লগইন এখনো চালু করা হয়নি। Authentication > Sign-in method থেকে Email/Password Enable করুন অথবা Google দিয়ে লগইন করুন।';
  }
  if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
    return 'ইউজার আইডি বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার যাচাই করুন।';
  }
  if (msg.includes('auth/email-already-in-use')) {
    return 'এই ইউজার আইডি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি আছে।';
  }
  if (msg.includes('auth/weak-password')) {
    return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
  }
  if (msg.includes('auth/invalid-email')) {
    return 'সঠিক ইউজার আইডি দিন (ইংরেজি অক্ষর, সংখ্যা বা হাইফেন ব্যবহার করুন, যেমন: FVC-078 বা admin1)।';
  }
  if (msg.includes('auth/too-many-requests')) {
    return 'অতিরিক্ত চেষ্টার কারণে সাময়িকভাবে লগইন স্থগিত আছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }
  return msg;
}

export type UserAccountDoc = UserAccountRecord;

export async function ensureUserAccount(
  uid: string,
  email: string,
  displayName: string,
  explicitUserId?: string,
  explicitLinkedMemberId?: string
): Promise<UserAccountDoc> {
  const userRef = doc(db, 'users', uid);
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(userRef);
    const isBootstrap = email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

    if (snap.exists()) {
      const data = snap.data() as UserAccountDoc;
      return {
        uid: data.uid,
        userId: data.userId || extractFriendlyUserId(data.email || email, data.linkedMemberId),
        email: data.email,
        displayName: data.displayName,
        role: isBootstrap ? 'SUPER_ADMIN' : data.role,
        linkedMemberId: data.linkedMemberId,
      };
    }

    const defaultRole: UserRole = isBootstrap ? 'SUPER_ADMIN' : 'MEMBER';
    const defaultMemberId = explicitLinkedMemberId || (isBootstrap ? 'FVC-001' : 'FVC-078');
    const resolvedUserId = clampStr(
      explicitUserId || extractFriendlyUserId(email, defaultMemberId),
      64
    );
    const payload = {
      uid,
      userId: resolvedUserId,
      email: clampStr(email, 200),
      displayName: clampStr(displayName || resolvedUserId || 'FVC User', 150),
      role: defaultRole,
      linkedMemberId: clampStr(defaultMemberId, 32),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, payload);

    if (isBootstrap) {
      await setDoc(doc(db, 'admins', uid), payload);
    }

    return {
      uid,
      userId: resolvedUserId,
      email: payload.email,
      displayName: payload.displayName,
      role: defaultRole,
      linkedMemberId: payload.linkedMemberId,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loginWithUserIdAndPassword(
  rawUserId: string,
  password: string
): Promise<void> {
  const authEmail = userIdToAuthEmail(rawUserId);
  if (!authEmail) {
    throw new Error('সঠিক ইউজার আইডি প্রদান করুন।');
  }
  await signInWithEmailAndPassword(auth, authEmail, password);
}

export async function registerMemberWithUserId(params: {
  userId: string;
  password: string;
  displayName: string;
  linkedMemberId: string;
}): Promise<UserAccountDoc> {
  const authEmail = userIdToAuthEmail(params.userId);
  if (!authEmail) {
    throw new Error('সঠিক ইউজার আইডি প্রদান করুন (ইংরেজি অক্ষর বা সংখ্যা)।');
  }
  const cred = await createUserWithEmailAndPassword(auth, authEmail, params.password);
  const cleanName = clampStr(params.displayName.trim() || params.userId.trim(), 150);
  await updateProfile(cred.user, { displayName: cleanName }).catch(() => undefined);
  return await ensureUserAccount(
    cred.user.uid,
    authEmail,
    cleanName,
    params.userId.trim(),
    params.linkedMemberId
  );
}

export async function assignMemberOwnershipToUid(
  memberId: string,
  targetUid: string,
  targetEmail?: string
): Promise<void> {
  const cleanMemberId = clampStr(memberId, 32);
  if (!cleanMemberId) return;
  const path = `members_public/${cleanMemberId}`;
  try {
    const pubRef = doc(db, 'members_public', cleanMemberId);
    const privRef = doc(db, 'members_private', cleanMemberId);
    const [pubSnap, privSnap, ledgerSnap] = await Promise.all([
      getDoc(pubRef),
      getDoc(privRef),
      getDocs(query(collection(db, 'ledger'), where('memberId', '==', cleanMemberId))),
    ]);

    const ops: Array<{ ref: ReturnType<typeof doc>; data: Record<string, unknown> }> = [];
    if (pubSnap.exists()) {
      ops.push({
        ref: pubRef,
        data: { ownerUid: targetUid, updatedAt: serverTimestamp() },
      });
    }
    if (privSnap.exists()) {
      ops.push({
        ref: privRef,
        data: stripUndefined({
          ownerUid: targetUid,
          memberOwnerEmail: targetEmail ? clampStr(targetEmail, 200) : undefined,
          updatedAt: serverTimestamp(),
        }),
      });
    }
    for (const d of ledgerSnap.docs) {
      ops.push({
        ref: d.ref,
        data: stripUndefined({
          memberOwnerUid: targetUid,
          memberOwnerEmail: targetEmail ? clampStr(targetEmail, 200) : undefined,
          updatedAt: serverTimestamp(),
        }),
      });
    }

    for (let i = 0; i < ops.length; i += 400) {
      const batch = writeBatch(db);
      for (const op of ops.slice(i, i + 400)) {
        batch.update(op.ref, op.data);
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function provisionUserAccountByAdmin(params: {
  userId: string;
  password: string;
  displayName: string;
  role: UserRole;
  linkedMemberId: string;
}): Promise<UserAccountDoc> {
  const cleanUserId = clampStr(params.userId.trim(), 64);
  const authEmail = userIdToAuthEmail(cleanUserId);
  if (!authEmail) {
    throw new Error('সঠিক ইউজার আইডি প্রদান করুন (ইংরেজি অক্ষর বা সংখ্যা)।');
  }
  const cleanName = clampStr(params.displayName.trim() || cleanUserId, 150);
  const cleanMemberId = clampStr(params.linkedMemberId || 'FVC-001', 32);

  // Create Firebase Auth account on isolated secondary instance so current admin stays logged in
  const cred = await createUserWithEmailAndPassword(
    secondaryAuth,
    authEmail,
    params.password
  );
  const newUid = cred.user.uid;
  await updateProfile(cred.user, { displayName: cleanName }).catch(() => undefined);
  await firebaseSignOut(secondaryAuth).catch(() => undefined);

  const path = `users/${newUid}`;
  try {
    const payload = {
      uid: newUid,
      userId: cleanUserId,
      email: clampStr(authEmail, 200),
      displayName: cleanName,
      role: params.role,
      linkedMemberId: cleanMemberId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'users', newUid), payload);
    if (params.role === 'SUPER_ADMIN' || params.role === 'TREASURER') {
      batch.set(doc(db, 'admins', newUid), payload);
    }
    await batch.commit();

    await assignMemberOwnershipToUid(cleanMemberId, newUid, authEmail);

    return {
      uid: newUid,
      userId: cleanUserId,
      email: authEmail,
      displayName: cleanName,
      role: params.role,
      linkedMemberId: cleanMemberId,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserRoleAndLinkByAdmin(
  target: UserAccountDoc,
  newRole: UserRole,
  newLinkedMemberId: string
): Promise<void> {
  const path = `users/${target.uid}`;
  try {
    const cleanMemberId = clampStr(newLinkedMemberId, 32);
    await updateDoc(doc(db, 'users', target.uid), {
      role: newRole,
      linkedMemberId: cleanMemberId,
      updatedAt: serverTimestamp(),
    });

    if (newRole === 'SUPER_ADMIN' || newRole === 'TREASURER') {
      await setDoc(doc(db, 'admins', target.uid), {
        uid: target.uid,
        userId: clampStr(target.userId || extractFriendlyUserId(target.email, cleanMemberId), 64),
        email: clampStr(target.email, 200),
        displayName: clampStr(target.displayName, 150),
        role: newRole,
        linkedMemberId: cleanMemberId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(doc(db, 'admins', target.uid)).catch(() => undefined);
    }

    if (cleanMemberId) {
      await assignMemberOwnershipToUid(cleanMemberId, target.uid, target.email);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserLinkedMember(
  uid: string,
  linkedMemberId: string
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      linkedMemberId: clampStr(linkedMemberId, 32),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function seedCooperativeDatabaseIfNeeded(
  adminUid: string,
  adminEmail: string
): Promise<boolean> {
  const markerPath = 'members_public/FVC-001';
  try {
    const markerSnap = await getDoc(doc(db, 'members_public', 'FVC-001'));
    if (markerSnap.exists()) {
      return false;
    }

    const members = generate111Members();
    const seedLedger = generateSeedLedger(members);

    // Queue all write operations into safe batches of <= 420 writes each
    const ops: Array<{ ref: ReturnType<typeof doc>; data: Record<string, unknown> }> = [];

    for (const m of members) {
      const ownerEmail = m.serialNumber === 1 ? adminEmail : m.email;
      const pubPayload: Record<string, unknown> = stripUndefined({
        id: m.id,
        serialNumber: m.serialNumber,
        fullName: clampStr(m.fullName, 150),
        occupation: clampStr(m.occupation, 150),
        admissionDate: clampStr(m.admissionDate, 32),
        status: m.status,
        kycStatus: m.kycStatus,
        committeeRole: m.committeeRole ? clampStr(m.committeeRole, 120) : undefined,
        avatarColor: clampStr(m.avatarColor, 32),
        ownerUid: m.serialNumber === 1 ? adminUid : undefined,
        updatedAt: serverTimestamp(),
      });
      ops.push({ ref: doc(db, 'members_public', m.id), data: pubPayload });

      const privPayload: Record<string, unknown> = stripUndefined({
        id: m.id,
        ownerUid: m.serialNumber === 1 ? adminUid : undefined,
        memberOwnerEmail: clampStr(ownerEmail, 200),
        fatherName: clampStr(m.fatherName, 150),
        motherName: clampStr(m.motherName, 150),
        dob: clampStr(m.dob, 32),
        mobile: clampStr(m.mobile, 32),
        email: clampStr(m.email, 200),
        presentAddress: clampStr(m.presentAddress, 300),
        permanentAddress: clampStr(m.permanentAddress, 300),
        nomineeName: clampStr(m.nominee.name, 150),
        nomineeRelation: clampStr(m.nominee.relation, 64),
        nomineeAge: m.nominee.age,
        nomineeNid: clampStr(m.nominee.nid, 64),
        updatedAt: serverTimestamp(),
      });
      ops.push({ ref: doc(db, 'members_private', m.id), data: privPayload });
    }

    for (const entry of seedLedger) {
      const ledgerPayload = stripUndefined({
        id: entry.id,
        date: clampStr(entry.date, 32),
        category: entry.category,
        debit: entry.debit,
        credit: entry.credit,
        description: clampStr(entry.description, 500),
        memberId: entry.memberId ? clampStr(entry.memberId, 32) : undefined,
        memberOwnerEmail: entry.memberOwnerEmail
          ? clampStr(entry.memberOwnerEmail, 200)
          : undefined,
        investmentId: entry.investmentId ? clampStr(entry.investmentId, 32) : undefined,
        approvedBy: clampStr(entry.approvedBy, 150),
        status: entry.status,
        paymentSubCategory: entry.paymentSubCategory,
        monthKey: entry.monthKey,
        monthLabel: entry.monthLabel,
        monthsCount: entry.monthsCount,
        coveredMonths: entry.coveredMonths?.slice(0, 12),
        paymentMethod: entry.paymentMethod,
        referenceNo: entry.referenceNo ? clampStr(entry.referenceNo, 80) : undefined,
        receiptNo: entry.receiptNo ? clampStr(entry.receiptNo, 80) : undefined,
        remarks: entry.remarks ? clampStr(entry.remarks, 400) : undefined,
        attachmentName: entry.attachmentName ? clampStr(entry.attachmentName, 200) : undefined,
        submittedBy: entry.submittedBy,
        authorUid: adminUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      ops.push({ ref: doc(db, 'ledger', entry.id), data: ledgerPayload });
    }

    for (const inv of INITIAL_INVESTMENTS) {
      ops.push({
        ref: doc(db, 'investments', inv.id),
        data: {
          ...inv,
          updatedAt: serverTimestamp(),
        },
      });
    }

    for (const post of INITIAL_FORUM_POSTS) {
      ops.push({
        ref: doc(db, 'forum_posts', post.id),
        data: stripUndefined({
          id: post.id,
          authorId: post.authorId,
          authorUid: adminUid,
          title: clampStr(post.title, 250),
          category: post.category,
          content: clampStr(post.content, 4000),
          attachmentName: post.attachmentName ? clampStr(post.attachmentName, 200) : undefined,
          createdAtLabel: clampStr(post.createdAt, 64),
          likes: post.likes,
          isPinned: post.isPinned,
          status: post.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      });

      for (const c of post.comments) {
        ops.push({
          ref: doc(db, 'forum_posts', post.id, 'comments', c.id),
          data: {
            id: c.id,
            postId: post.id,
            authorId: c.authorId,
            authorUid: adminUid,
            content: clampStr(c.content, 1500),
            createdAtLabel: clampStr(c.createdAt, 64),
            createdAt: serverTimestamp(),
          },
        });
        for (const r of c.replies) {
          ops.push({
            ref: doc(db, 'forum_posts', post.id, 'comments', r.id),
            data: {
              id: r.id,
              postId: post.id,
              parentCommentId: c.id,
              authorId: r.authorId,
              authorUid: adminUid,
              content: clampStr(r.content, 1500),
              createdAtLabel: clampStr(r.createdAt, 64),
              createdAt: serverTimestamp(),
            },
          });
        }
      }
    }

    for (const n of INITIAL_NOTICES) {
      ops.push({
        ref: doc(db, 'notices', n.id),
        data: {
          ...n,
          updatedAt: serverTimestamp(),
        },
      });
    }

    for (const a of INITIAL_AUDIT_LOGS) {
      ops.push({
        ref: doc(db, 'audit_logs', a.id),
        data: {
          ...a,
          actorUid: adminUid,
          createdAt: serverTimestamp(),
        },
      });
    }

    // Commit in chunks of 400
    for (let i = 0; i < ops.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = ops.slice(i, i + 400);
      for (const op of chunk) {
        batch.set(op.ref, op.data);
      }
      await batch.commit();
    }

    await syncCooperativeSummary(members.length, seedLedger);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, markerPath);
  }
}

export async function syncCooperativeSummary(
  totalMembers: number,
  ledgerEntries: LedgerEntry[]
): Promise<void> {
  const path = 'cooperative_summary/stats';
  try {
    let collectedCapital = 0;
    let activeInvestmentOut = 0;
    let realizedReturn = 0;
    let operatingExpense = 0;

    for (const entry of ledgerEntries) {
      if (entry.status !== 'APPROVED') continue;
      if (entry.category === 'ADMISSION' || entry.category === 'INSTALLMENT') {
        collectedCapital += entry.credit;
      } else if (entry.category === 'INVESTMENT_OUT') {
        activeInvestmentOut += entry.debit;
      } else if (entry.category === 'INVESTMENT_RETURN') {
        realizedReturn += entry.credit;
      } else if (entry.category === 'EXPENSE') {
        operatingExpense += entry.debit;
      }
    }

    await setDoc(doc(db, 'cooperative_summary', 'stats'), {
      totalMembers,
      collectedCapital,
      activeInvestmentOut,
      realizedReturn,
      operatingExpense,
      netProfit: realizedReturn - operatingExpense,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveMemberToFirestore(member: Member): Promise<void> {
  const pubPath = `members_public/${member.id}`;
  try {
    const batch = writeBatch(db);
    batch.update(
      doc(db, 'members_public', member.id),
      stripUndefined({
        fullName: clampStr(member.fullName, 150),
        occupation: clampStr(member.occupation, 150),
        status: member.status,
        kycStatus: member.kycStatus,
        committeeRole: member.committeeRole ? clampStr(member.committeeRole, 120) : undefined,
        updatedAt: serverTimestamp(),
      })
    );
    batch.update(doc(db, 'members_private', member.id), {
      fatherName: clampStr(member.fatherName, 150),
      mobile: clampStr(member.mobile, 32),
      presentAddress: clampStr(member.presentAddress, 300),
      nomineeName: clampStr(member.nominee.name, 150),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, pubPath);
  }
}

export async function verifyMemberKycInFirestore(memberId: string): Promise<void> {
  const path = `members_public/${memberId}`;
  try {
    await updateDoc(doc(db, 'members_public', memberId), {
      kycStatus: 'VERIFIED',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveLedgerEntryToFirestore(
  entry: LedgerEntry,
  authorUid: string
): Promise<void> {
  const path = `ledger/${entry.id}`;
  try {
    await setDoc(
      doc(db, 'ledger', entry.id),
      stripUndefined({
        id: entry.id,
        date: clampStr(entry.date, 32),
        category: entry.category,
        debit: entry.debit,
        credit: entry.credit,
        description: clampStr(entry.description, 500),
        memberId: entry.memberId ? clampStr(entry.memberId, 32) : undefined,
        memberOwnerUid: entry.memberOwnerUid ? clampStr(entry.memberOwnerUid, 128) : undefined,
        memberOwnerEmail: entry.memberOwnerEmail
          ? clampStr(entry.memberOwnerEmail, 200)
          : undefined,
        investmentId: entry.investmentId ? clampStr(entry.investmentId, 32) : undefined,
        approvedBy: clampStr(entry.approvedBy, 150),
        status: entry.status,
        paymentSubCategory: entry.paymentSubCategory,
        monthKey: entry.monthKey,
        monthLabel: entry.monthLabel,
        monthsCount: entry.monthsCount,
        coveredMonths: entry.coveredMonths?.slice(0, 12),
        paymentMethod: entry.paymentMethod,
        referenceNo: entry.referenceNo ? clampStr(entry.referenceNo, 80) : undefined,
        receiptNo: entry.receiptNo ? clampStr(entry.receiptNo, 80) : undefined,
        remarks: entry.remarks ? clampStr(entry.remarks, 400) : undefined,
        attachmentName: entry.attachmentName ? clampStr(entry.attachmentName, 200) : undefined,
        submittedBy: entry.submittedBy,
        rejectionReason: entry.rejectionReason
          ? clampStr(entry.rejectionReason, 300)
          : undefined,
        authorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateLedgerStatusInFirestore(
  entryId: string,
  status: 'APPROVED' | 'REJECTED',
  approvedBy: string,
  rejectionReason?: string
): Promise<void> {
  const path = `ledger/${entryId}`;
  try {
    await updateDoc(
      doc(db, 'ledger', entryId),
      stripUndefined({
        status,
        approvedBy: clampStr(approvedBy, 150),
        rejectionReason: rejectionReason ? clampStr(rejectionReason, 300) : undefined,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveBatchDividendEntriesToFirestore(
  entries: LedgerEntry[],
  authorUid: string
): Promise<void> {
  const path = 'ledger/batch_dividend';
  try {
    for (let i = 0; i < entries.length; i += 400) {
      const batch = writeBatch(db);
      for (const entry of entries.slice(i, i + 400)) {
        batch.set(
          doc(db, 'ledger', entry.id),
          stripUndefined({
            id: entry.id,
            date: clampStr(entry.date, 32),
            category: entry.category,
            debit: entry.debit,
            credit: entry.credit,
            description: clampStr(entry.description, 500),
            memberId: entry.memberId,
            memberOwnerUid: entry.memberOwnerUid ? clampStr(entry.memberOwnerUid, 128) : undefined,
            memberOwnerEmail: entry.memberOwnerEmail,
            approvedBy: clampStr(entry.approvedBy, 150),
            status: entry.status,
            paymentMethod: entry.paymentMethod,
            receiptNo: entry.receiptNo,
            authorUid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveInvestmentToFirestore(
  project: InvestmentProject
): Promise<void> {
  const path = `investments/${project.id}`;
  try {
    await setDoc(doc(db, 'investments', project.id), {
      ...project,
      name: clampStr(project.name, 200),
      description: clampStr(project.description, 1000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateInvestmentReturnInFirestore(
  investmentId: string,
  newRealizedReturn: number
): Promise<void> {
  const path = `investments/${investmentId}`;
  try {
    await updateDoc(doc(db, 'investments', investmentId), {
      realizedReturn: newRealizedReturn,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveForumPostToFirestore(
  post: ForumPost,
  authorUid: string
): Promise<void> {
  const path = `forum_posts/${post.id}`;
  try {
    await setDoc(
      doc(db, 'forum_posts', post.id),
      stripUndefined({
        id: post.id,
        authorId: post.authorId,
        authorUid,
        title: clampStr(post.title, 250),
        category: post.category,
        content: clampStr(post.content, 4000),
        attachmentName: post.attachmentName ? clampStr(post.attachmentName, 200) : undefined,
        createdAtLabel: clampStr(post.createdAt, 64),
        likes: post.likes,
        isPinned: post.isPinned,
        status: post.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateForumPostInFirestore(
  postId: string,
  updates: Partial<{
    status: 'APPROVED' | 'REJECTED';
    rejectionReason: string;
    isPinned: boolean;
  }>
): Promise<void> {
  const path = `forum_posts/${postId}`;
  try {
    await updateDoc(
      doc(db, 'forum_posts', postId),
      stripUndefined({
        ...updates,
        rejectionReason:
          updates.rejectionReason !== undefined
            ? clampStr(updates.rejectionReason, 300)
            : undefined,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleForumLikeInFirestore(
  postId: string,
  uid: string,
  currentlyLiked: boolean,
  currentLikesCount: number
): Promise<void> {
  const path = `forum_posts/${postId}/likes/${uid}`;
  try {
    const batch = writeBatch(db);
    const likeRef = doc(db, 'forum_posts', postId, 'likes', uid);
    const postRef = doc(db, 'forum_posts', postId);

    if (currentlyLiked) {
      batch.delete(likeRef);
      batch.update(postRef, {
        likes: Math.max(0, currentLikesCount - 1),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(likeRef, {
        uid,
        createdAt: serverTimestamp(),
      });
      batch.update(postRef, {
        likes: currentLikesCount + 1,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function addForumCommentToFirestore(
  postId: string,
  commentId: string,
  authorId: string,
  authorUid: string,
  content: string,
  parentCommentId?: string
): Promise<void> {
  const path = `forum_posts/${postId}/comments/${commentId}`;
  try {
    await setDoc(
      doc(db, 'forum_posts', postId, 'comments', commentId),
      stripUndefined({
        id: commentId,
        postId,
        parentCommentId,
        authorId,
        authorUid,
        content: clampStr(content, 1500),
        createdAtLabel: 'এইমাত্র',
        createdAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchPostComments(postId: string) {
  const path = `forum_posts/${postId}/comments`;
  try {
    const snap = await getDocs(collection(db, 'forum_posts', postId, 'comments'));
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveNoticeToFirestore(notice: NoticeItem): Promise<void> {
  const path = `notices/${notice.id}`;
  try {
    await setDoc(doc(db, 'notices', notice.id), {
      ...notice,
      title: clampStr(notice.title, 250),
      details: clampStr(notice.details, 2000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteNoticeFromFirestore(noticeId: string): Promise<void> {
  const path = `notices/${noticeId}`;
  try {
    await deleteDoc(doc(db, 'notices', noticeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAuditLogToFirestore(
  log: AuditLogEntry,
  actorUid: string
): Promise<void> {
  const path = `audit_logs/${log.id}`;
  try {
    await setDoc(doc(db, 'audit_logs', log.id), {
      id: clampStr(log.id, 64),
      timestamp: clampStr(log.timestamp, 64),
      actorName: clampStr(log.actorName, 150),
      actorId: clampStr(log.actorId, 32),
      actorUid,
      actorRole: log.actorRole,
      action: clampStr(log.action, 200),
      target: clampStr(log.target, 200),
      previousValue: clampStr(log.previousValue, 300),
      newValue: clampStr(log.newValue, 300),
      txHash: clampStr(log.txHash, 64),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
