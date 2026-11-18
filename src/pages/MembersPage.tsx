import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { TOTAL_EXPECTED_MONTHS_YTD } from '../data/mockData';
import { LedgerEntry, Member, UserRole } from '../types/fvc';
import {
  exportToCSV,
  formatBDT,
  formatDateBn,
  getInitials,
  toBengaliDigits,
} from '../utils/formatters';

interface MembersPageProps {
  members: Member[];
  ledger: LedgerEntry[];
  currentRole: UserRole;
  onUpdateMember: (updated: Member) => void;
}

type DirectoryFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'REGULAR' | 'IRREGULAR';

export const MembersPage: React.FC<MembersPageProps> = ({
  members,
  ledger,
  currentRole,
  onUpdateMember,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<DirectoryFilter>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Member | null>(null);

  const isAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'TREASURER';

  // Compute financial snapshot per member strictly from APPROVED ledger entries
  const memberStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        admissionPaid: number;
        installmentsPaid: number;
        installmentCount: number;
        dueMonths: number;
        dividendEarned: number;
      }
    >();

    for (const m of members) {
      map.set(m.id, {
        admissionPaid: 0,
        installmentsPaid: 0,
        installmentCount: 0,
        dueMonths: TOTAL_EXPECTED_MONTHS_YTD,
        dividendEarned: 0,
      });
    }

    for (const entry of ledger) {
      if (entry.status !== 'APPROVED' || !entry.memberId) continue;
      const stat = map.get(entry.memberId);
      if (!stat) continue;

      if (entry.category === 'ADMISSION') {
        stat.admissionPaid += entry.credit;
      } else if (entry.category === 'INSTALLMENT') {
        stat.installmentsPaid += entry.credit;
        stat.installmentCount += entry.monthsCount ?? 1;
      } else if (entry.category === 'DIVIDEND_PAYOUT') {
        stat.dividendEarned += entry.debit;
      }
    }

    for (const [id, stat] of map.entries()) {
      stat.dueMonths = Math.max(0, TOTAL_EXPECTED_MONTHS_YTD - stat.installmentCount);
      map.set(id, stat);
    }

    return map;
  }, [members, ledger]);

  const metrics = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === 'ACTIVE').length;
    const pendingKyc = members.filter((m) => m.kycStatus === 'PENDING').length;
    const committee = members.filter((m) => Boolean(m.committeeRole)).length;
    return { total, active, pendingKyc, committee };
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const stat = memberStatsMap.get(m.id);
      if (filter === 'ACTIVE' && m.status !== 'ACTIVE') return false;
      if (filter === 'INACTIVE' && m.status !== 'INACTIVE') return false;
      if (filter === 'REGULAR' && (stat?.dueMonths ?? 0) > 0) return false;
      if (filter === 'IRREGULAR' && (stat?.dueMonths ?? 0) === 0) return false;

      if (q) {
        return (
          m.fullName.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.mobile.includes(q) ||
          m.occupation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [members, memberStatsMap, filter, searchQuery]);

  const handleOpenProfile = (member: Member) => {
    setSelectedMember(member);
    setEditDraft(member);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!editDraft) return;
    onUpdateMember(editDraft);
    setSelectedMember(editDraft);
    setIsEditing(false);
  };

  const handleExportMembers = () => {
    const headers = [
      'Member ID',
      'Full Name',
      'Father Name',
      'Mobile',
      'Occupation',
      'Admission Date',
      'Status',
      'Total Admission Paid',
      'Total Installments Paid',
      'Installments Count',
      'Due Months',
    ];
    const rows = filteredMembers.map((m) => {
      const st = memberStatsMap.get(m.id);
      return [
        m.id,
        m.fullName,
        m.fatherName,
        m.mobile,
        m.occupation,
        m.admissionDate,
        m.status,
        st?.admissionPaid ?? 0,
        st?.installmentsPaid ?? 0,
        st?.installmentCount ?? 0,
        st?.dueMonths ?? 0,
      ];
    });
    exportToCSV('FVC_111_Members_Directory.csv', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#10243A]">
            সদস্য ডিরেক্টরি (১১১ জন নিবন্ধিত সদস্য)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            সকল সদস্যের ব্যক্তিগত পরিচিতি, নমিনি তথ্য, KYC অবস্থা ও কিস্তির তাৎক্ষণিক হিসাব
          </p>
        </div>

        <button
          onClick={handleExportMembers}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#10243A] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#087F68]" />
          CSV/Excel এক্সপোর্ট
        </button>
      </div>

      {/* 4 Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>মোট নিবন্ধিত সদস্য</span>
            <Users className="w-4 h-4 text-[#10243A]" />
          </div>
          <div className="text-2xl font-bold text-[#10243A] mt-2 tabular-nums">
            {toBengaliDigits(metrics.total)} জন
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono-id">FVC-001 — FVC-111</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>সক্রিয় সদস্য</span>
            <UserCheck className="w-4 h-4 text-[#087F68]" />
          </div>
          <div className="text-2xl font-bold text-[#087F68] mt-2 tabular-nums">
            {toBengaliDigits(metrics.active)} জন
          </div>
          <div className="text-[11px] text-slate-500 mt-1">নিয়মিত লেনদেনকারী</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>পেন্ডিং KYC যাচাই</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2 tabular-nums">
            {toBengaliDigits(metrics.pendingKyc)} জন
          </div>
          <div className="text-[11px] text-slate-500 mt-1">এনআইডি পর্যালোচনাধীন</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>পরিচালনা পর্ষদ</span>
            <Award className="w-4 h-4 text-[#D6A84B]" />
          </div>
          <div className="text-2xl font-bold text-[#10243A] mt-2 tabular-nums">
            {toBengaliDigits(metrics.committee)} জন
          </div>
          <div className="text-[11px] text-slate-500 mt-1">কার্যনির্বাহী কমিটি</div>
        </div>
      </div>

      {/* Search, Status Filter & View Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, সদস্য আইডি (FVC-042) বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#F3F6FA] rounded-lg overflow-x-auto">
            {(
              [
                ['ALL', 'সকল'],
                ['ACTIVE', 'সক্রিয়'],
                ['INACTIVE', 'নিষ্ক্রিয়'],
                ['REGULAR', 'নিয়মিত কিস্তি'],
                ['IRREGULAR', 'বকেয়া / অনিয়মিত'],
              ] as [DirectoryFilter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filter === key
                    ? 'bg-white text-[#10243A] shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-[#10243A]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F3F6FA] rounded-lg">
            <button
              onClick={() => setViewMode('GRID')}
              aria-label="গ্রিড ভিউ"
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'GRID' ? 'bg-white text-[#10243A] shadow-xs' : 'text-slate-500'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              aria-label="টেবিল ভিউ"
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-white text-[#10243A] shadow-xs' : 'text-slate-500'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-xs text-slate-500 font-medium">
        প্রদর্শিত হচ্ছে <strong className="text-[#10243A] tabular-nums">{toBengaliDigits(filteredMembers.length)}</strong> জন সদস্য
      </div>

      {/* Grid or Table View */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#10243A]">কোনো সদস্য পাওয়া যায়নি</p>
          <p className="text-xs text-slate-500 mt-1">অনুগ্রহ করে অনুসন্ধান শব্দ বা ফিল্টার পরিবর্তন করুন।</p>
        </div>
      ) : viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const stat = memberStatsMap.get(member.id);
            return (
              <div
                key={member.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-[#087F68]/50 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {getInitials(member.fullName)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-[#10243A] truncate">
                          {member.fullName}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono-id font-semibold text-[#087F68]">
                            {member.id}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{member.occupation}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold shrink-0 ${
                        member.status === 'ACTIVE' ? 'text-[#087F68]' : 'text-slate-500'
                      }`}
                    >
                      {member.status === 'ACTIVE' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> সক্রিয়
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" /> নিষ্ক্রিয়
                        </>
                      )}
                    </span>
                  </div>

                  {member.committeeRole && (
                    <div className="mt-2.5 text-xs font-semibold text-[#9E7422]">
                      পর্ষদ দায়িত্ব: {member.committeeRole}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">পিতার নাম:</span>
                      <span className="font-medium text-[#10243A]">{member.fatherName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">মোবাইল:</span>
                      <span className="font-mono-id font-medium text-[#10243A]">
                        {member.mobile}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ভর্তির তারিখ:</span>
                      <span className="tabular-nums">{formatDateBn(member.admissionDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">পরিশোধিত কিস্তি:</span>
                      <span className="font-semibold text-[#087F68] tabular-nums">
                        {toBengaliDigits(stat?.installmentCount ?? 0)} টি (
                        {formatBDT(stat?.installmentsPaid ?? 0)})
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenProfile(member)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#F3F6FA] hover:bg-[#10243A] text-[#10243A] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  সম্পূর্ণ প্রোফাইল দেখুন
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F3F6FA] border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">আইডি</th>
                  <th className="py-3 px-4">সদস্যের নাম ও পেশা</th>
                  <th className="py-3 px-4">মোবাইল</th>
                  <th className="py-3 px-4">অবস্থা</th>
                  <th className="py-3 px-4 text-right">মোট কিস্তি জমা</th>
                  <th className="py-3 px-4 text-right">বকেয়া মাস</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMembers.map((m) => {
                  const stat = memberStatsMap.get(m.id);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono-id font-semibold text-[#087F68]">
                        {m.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#10243A]">{m.fullName}</div>
                        <div className="text-[11px] text-slate-500">{m.occupation}</div>
                      </td>
                      <td className="py-3 px-4 font-mono-id text-slate-700">{m.mobile}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            m.status === 'ACTIVE' ? 'text-[#087F68]' : 'text-slate-500'
                          }`}
                        >
                          {m.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#10243A] tabular-nums">
                        {formatBDT(stat?.installmentsPaid ?? 0)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        <span
                          className={
                            (stat?.dueMonths ?? 0) > 0
                              ? 'text-red-600 font-semibold'
                              : 'text-[#087F68] font-medium'
                          }
                        >
                          {toBengaliDigits(stat?.dueMonths ?? 0)} মাস
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenProfile(m)}
                          className="text-[#087F68] hover:underline font-semibold cursor-pointer"
                        >
                          প্রোফাইল দেখুন
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Member Profile Modal */}
      {selectedMember && editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10243A]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-[#10243A] text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-[#D6A84B]"
                  style={{ backgroundColor: selectedMember.avatarColor }}
                >
                  {getInitials(selectedMember.fullName)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{selectedMember.fullName}</h2>
                    <span className="font-mono-id text-xs px-2 py-0.5 rounded bg-white/10 text-[#D6A84B]">
                      {selectedMember.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedMember.occupation} · ভর্তি: {formatDateBn(selectedMember.admissionDate)}
                    {selectedMember.committeeRole ? ` · ${selectedMember.committeeRole}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#087F68] hover:bg-[#066956] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    তথ্য সম্পাদনা
                  </button>
                )}
                {isAdmin && isEditing && (
                  <button
                    onClick={handleSaveEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D6A84B] text-[#10243A] text-xs font-bold cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    সেভ করুন
                  </button>
                )}
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Financial Snapshot */}
              {(() => {
                const st = memberStatsMap.get(selectedMember.id);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#F3F6FA] rounded-lg p-3.5 border border-slate-200">
                      <div className="text-[11px] text-slate-500">মোট ভর্তি ফি</div>
                      <div className="text-base font-bold text-[#10243A] mt-1 tabular-nums">
                        {formatBDT(st?.admissionPaid ?? 0)}
                      </div>
                    </div>
                    <div className="bg-[#F3F6FA] rounded-lg p-3.5 border border-slate-200">
                      <div className="text-[11px] text-slate-500">পরিশোধিত কিস্তি</div>
                      <div className="text-base font-bold text-[#087F68] mt-1 tabular-nums">
                        {formatBDT(st?.installmentsPaid ?? 0)}
                      </div>
                      <div className="text-[10px] text-slate-500 tabular-nums">
                        {toBengaliDigits(st?.installmentCount ?? 0)} টি কিস্তি
                      </div>
                    </div>
                    <div className="bg-[#F3F6FA] rounded-lg p-3.5 border border-slate-200">
                      <div className="text-[11px] text-slate-500">বকেয়া কিস্তি</div>
                      <div
                        className={`text-base font-bold mt-1 tabular-nums ${
                          (st?.dueMonths ?? 0) > 0 ? 'text-red-600' : 'text-[#087F68]'
                        }`}
                      >
                        {toBengaliDigits(st?.dueMonths ?? 0)} টি
                      </div>
                    </div>
                    <div className="bg-[#F3F6FA] rounded-lg p-3.5 border border-slate-200">
                      <div className="text-[11px] text-slate-500">অর্জিত লভ্যাংশ</div>
                      <div className="text-base font-bold text-[#9E7422] mt-1 tabular-nums">
                        {formatBDT(st?.dividendEarned ?? 0)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-bold text-[#10243A] border-b border-slate-200 pb-2 mb-3">
                  ব্যক্তিগত তথ্য ও যোগাযোগ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">পূর্ণ নাম</span>
                    {isEditing ? (
                      <input
                        value={editDraft.fullName}
                        onChange={(e) => setEditDraft({ ...editDraft, fullName: e.target.value })}
                        className="mt-1 w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                      />
                    ) : (
                      <span className="font-semibold text-[#10243A]">{selectedMember.fullName}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block">পিতার নাম</span>
                    {isEditing ? (
                      <input
                        value={editDraft.fatherName}
                        onChange={(e) => setEditDraft({ ...editDraft, fatherName: e.target.value })}
                        className="mt-1 w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                      />
                    ) : (
                      <span className="font-semibold text-[#10243A]">{selectedMember.fatherName}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block">মাতার নাম</span>
                    <span className="font-semibold text-[#10243A]">{selectedMember.motherName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">জন্মতারিখ</span>
                    <span className="font-semibold text-[#10243A] tabular-nums">
                      {formatDateBn(selectedMember.dob)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> মোবাইল নম্বর
                    </span>
                    {isEditing ? (
                      <input
                        value={editDraft.mobile}
                        onChange={(e) => setEditDraft({ ...editDraft, mobile: e.target.value })}
                        className="mt-1 w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono-id"
                      />
                    ) : (
                      <span className="font-mono-id font-semibold text-[#10243A]">
                        {selectedMember.mobile}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> ইমেইল
                    </span>
                    <span className="font-mono-id text-[#10243A]">{selectedMember.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> বর্তমান ঠিকানা
                    </span>
                    {isEditing ? (
                      <input
                        value={editDraft.presentAddress}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, presentAddress: e.target.value })
                        }
                        className="mt-1 w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                      />
                    ) : (
                      <span className="text-[#10243A]">{selectedMember.presentAddress}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block">স্থায়ী ঠিকানা</span>
                    <span className="text-[#10243A]">{selectedMember.permanentAddress}</span>
                  </div>
                  {isEditing && (
                    <div>
                      <span className="text-slate-500 block">সদস্য অবস্থা</span>
                      <select
                        value={editDraft.status}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            status: e.target.value as 'ACTIVE' | 'INACTIVE',
                          })
                        }
                        className="mt-1 w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                      >
                        <option value="ACTIVE">সক্রিয়</option>
                        <option value="INACTIVE">নিষ্ক্রিয়</option>
                      </select>
                    </div>
                  )}
                  {isEditing && (
                    <div>
                      <span className="text-slate-500 block">KYC অবস্থা</span>
                      <select
                        value={editDraft.kycStatus}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            kycStatus: e.target.value as 'VERIFIED' | 'PENDING',
                          })
                        }
                        className="mt-1 w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                      >
                        <option value="VERIFIED">যাচাইকৃত (Verified)</option>
                        <option value="PENDING">পেন্ডিং (Pending)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Nominee Details */}
              <div>
                <h3 className="text-sm font-bold text-[#10243A] border-b border-slate-200 pb-2 mb-3">
                  নমিনি সংক্রান্ত তথ্য (Nominee Details)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#F3F6FA] p-4 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">নমিনির নাম</span>
                    {isEditing ? (
                      <input
                        value={editDraft.nominee.name}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            nominee: { ...editDraft.nominee, name: e.target.value },
                          })
                        }
                        className="mt-1 w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                      />
                    ) : (
                      <span className="font-semibold text-[#10243A]">
                        {selectedMember.nominee.name}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block">সদস্যের সাথে সম্পর্ক</span>
                    <span className="font-semibold text-[#10243A]">
                      {selectedMember.nominee.relation}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">নমিনির বয়স</span>
                    <span className="font-semibold text-[#10243A] tabular-nums">
                      {toBengaliDigits(selectedMember.nominee.age)} বছর
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">জাতীয় পরিচয়পত্র নম্বর (NID)</span>
                    <span className="font-mono-id font-semibold text-[#10243A]">
                      {selectedMember.nominee.nid}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
