import React, { useState } from 'react';
import {
  Bell,
  Building2,
  ChevronDown,
  LogIn,
  Megaphone,
  Menu,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';
import { Member, NoticeItem, PageId, UserRole } from '../types/fvc';
import { FvcCrest } from './FvcCrest';

interface TopBarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onToggleMobileMenu: () => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  currentUser: Member;
  isAuthenticated: boolean;
  notices: NoticeItem[];
  pendingCount: number;
  selectedOrgFund: string;
  onChangeOrgFund: (fund: string) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'সুপার অ্যাডমিন',
  TREASURER: 'কোষাধ্যক্ষ',
  MEMBER: 'সাধারণ সদস্য',
};

const FUND_OPTIONS = [
  'Future Vision Capital — মূল তহবিল',
  'অ্যাগ্রো ও ল্যান্ড সাব-ফান্ড',
  'সমাজকল্যাণ রিজার্ভ ফান্ড',
];

export const TopBar: React.FC<TopBarProps> = ({
  onNavigate,
  onToggleMobileMenu,
  currentRole,
  onChangeRole,
  currentUser,
  isAuthenticated,
  notices,
  pendingCount,
  selectedOrgFund,
  onChangeOrgFund,
}) => {
  const [showNotif, setShowNotif] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);

  const activeNotices = notices.filter((n) => n.isPinned || n.priority === 'URGENT');
  const tickerText =
    activeNotices.length > 0
      ? activeNotices.map((n) => `${n.title} — ${n.details}`).join('   ✦   ')
      : 'ফিউচার ভিশন ক্যাপিটাল: একত্রে গড়ি সমৃদ্ধ আগামী · ১১১ জন সদস্যের সমন্বিত তহবিল।';

  return (
    <div className="no-print sticky top-0 z-30">
      {/* Main Top Corporate Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Zone: Mobile Toggle + FVC Crest + Brand Title + Org Switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            aria-label="মেনু খুলুন"
            className="lg:hidden p-2 rounded-lg text-[#10243A] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left cursor-pointer shrink-0"
          >
            <FvcCrest size={38} />
            <div className="hidden sm:block">
              <div className="text-base font-bold text-[#10243A] font-display leading-tight whitespace-nowrap">
                Future Vision Capital
              </div>
              <div className="text-[11px] font-medium text-[#087F68] leading-tight whitespace-nowrap">
                একত্রে গড়ি সমৃদ্ধ আগামী
              </div>
            </div>
          </button>

          {/* Organization Fund Switcher (Desktop) */}
          <div className="relative hidden xl:block ml-3 pl-3 border-l border-slate-200">
            <button
              onClick={() => {
                setShowOrgMenu((v) => !v);
                setShowRoleMenu(false);
                setShowNotif(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F3F6FA] hover:bg-slate-200/70 text-xs font-medium text-[#10243A] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-[#087F68]" />
              <span className="max-w-[210px] truncate">{selectedOrgFund}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showOrgMenu && (
              <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400">
                  তহবিল শাখা পরিবর্তন করুন
                </div>
                {FUND_OPTIONS.map((fund) => (
                  <button
                    key={fund}
                    onClick={() => {
                      onChangeOrgFund(fund);
                      setShowOrgMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                      selectedOrgFund === fund
                        ? 'bg-[#087F68]/10 text-[#087F68] font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {fund}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Zone: Notifications + Role Switcher + Quick Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu((v) => !v);
                setShowNotif(false);
                setShowOrgMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-[#10243A] transition-colors whitespace-nowrap cursor-pointer"
              title="রোল পরিবর্তন করুন"
            >
              <Shield className="w-3.5 h-3.5 text-[#D6A84B]" />
              <span className="hidden sm:inline">রোল:</span>
              <span className="font-semibold text-[#087F68]">{ROLE_LABELS[currentRole]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400">
                  ডেমো ভূমিকা নির্বাচন (Role Switcher)
                </div>
                {(['SUPER_ADMIN', 'TREASURER', 'MEMBER'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onChangeRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                      currentRole === r
                        ? 'bg-[#10243A] text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{ROLE_LABELS[r]}</span>
                    <span className="font-mono-id text-[10px] opacity-80">
                      {r === 'SUPER_ADMIN' ? 'FVC-001' : r === 'TREASURER' ? 'FVC-003' : 'FVC-078'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotif((v) => !v);
                setShowRoleMenu(false);
                setShowOrgMenu(false);
              }}
              aria-label="নোটিফিকেশন"
              className="relative p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#10243A] transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {(notices.length > 0 || pendingCount > 0) && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#087F68] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {notices.length + pendingCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-40">
                <div className="px-4 py-3 bg-[#10243A] text-white flex items-center justify-between">
                  <span className="text-xs font-semibold">সদস্য ও অ্যাডমিন নোটিফিকেশন</span>
                  <span className="text-[11px] text-[#D6A84B] tabular-nums">
                    {pendingCount} টি অপেক্ষমাণ অনুমোদন
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {pendingCount > 0 && (
                    <button
                      onClick={() => {
                        onNavigate('dashboard');
                        setShowNotif(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-amber-50/50 transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-amber-800">
                        অনুমোদন কিউতে {pendingCount} টি এন্ট্রি অপেক্ষমাণ
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        অ্যাডমিন ড্যাশবোর্ডে গিয়ে অনুমোদন বা পর্যালোচনা করুন
                      </div>
                    </button>
                  )}
                  {notices.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        onNavigate('portal');
                        setShowNotif(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#10243A] line-clamp-1">
                          {n.title}
                        </span>
                        <span
                          className={`text-[10px] font-semibold shrink-0 ${
                            n.priority === 'URGENT' ? 'text-red-600' : 'text-[#087F68]'
                          }`}
                        >
                          {n.priority === 'URGENT' ? 'জরুরি' : 'সাধারণ'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.details}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Profile / Login Button */}
          <button
            onClick={() => onNavigate('portal')}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-[#10243A] hover:bg-[#193554] text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isAuthenticated ? (
              <>
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: currentUser.avatarColor }}
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#D6A84B]" />
                </span>
                <span className="font-mono-id font-semibold text-[#D6A84B]">{currentUser.id}</span>
                <span className="hidden md:inline max-w-[110px] truncate">{currentUser.fullName}</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-[#D6A84B]" />
                <span>পোর্টাল লগইন</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Emergency Announcement Ticker */}
      <div className="bg-[#10243A] text-white border-b border-[#D6A84B]/30 px-4 lg:px-6 h-9 flex items-center justify-between gap-4 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0 text-[#D6A84B] text-xs font-semibold">
          <Megaphone className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">জরুরি ঘোষণা:</span>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className="animate-ticker text-xs text-slate-100">
            <span className="pr-16">{tickerText}</span>
            <span className="pr-16" aria-hidden="true">
              {tickerText}
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigate('portal')}
          className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-[#D6A84B] hover:text-[#F1CE7C] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Users className="w-3 h-3" />
          সকল নোটিশ দেখুন
        </button>
      </div>
    </div>
  );
};
