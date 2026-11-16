import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  MessageSquareText,
  ReceiptText,
  TrendingUp,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { PageId, UserRole } from '../types/fvc';
import { FvcCrest } from './FvcCrest';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  currentRole: UserRole;
  pendingCount: number;
}

interface NavItem {
  id: PageId;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  currentRole,
  pendingCount,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'অ্যাডমিন ড্যাশবোর্ড',
      shortLabel: 'ড্যাশবোর্ড',
      icon: LayoutDashboard,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'forum',
      label: 'নিউজ ও আলোচনা ফোরাম',
      shortLabel: 'ফোরাম',
      icon: MessageSquareText,
    },
    {
      id: 'members',
      label: 'সদস্য ডিরেক্টরি (১১১)',
      shortLabel: 'সদস্য',
      icon: Users,
    },
    {
      id: 'installments',
      label: 'কিস্তি ও ভর্তি ফি',
      shortLabel: 'কিস্তি',
      icon: ReceiptText,
    },
    {
      id: 'investments',
      label: 'বিনিয়োগ ও লভ্যাংশ',
      shortLabel: 'বিনিয়োগ',
      icon: TrendingUp,
    },
    {
      id: 'portal',
      label: 'মেম্বার সেলফ-পোর্টাল',
      shortLabel: 'পোর্টাল',
      icon: UserCircle2,
    },
  ];

  const handleSelect = (id: PageId) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`no-print hidden lg:flex flex-col bg-[#10243A] text-white border-r border-[#1E3A5F] shrink-0 transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-[260px]'
        }`}
      >
        <div className="p-3 flex-1 flex flex-col gap-1 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-2 mb-1">
            {!collapsed && (
              <span className="text-[11px] font-semibold text-slate-400 tracking-wide">
                মডিউল নেভিগেশন
              </span>
            )}
            <button
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'সাইডবার বড় করুন' : 'সাইডবার ছোট করুন'}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-auto"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#087F68] text-white shadow-xs'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F1CE7C]' : ''}`} />
                {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                {!collapsed && item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#D6A84B] text-[#10243A] tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Cooperative Info Summary */}
        {!collapsed && (
          <div className="p-4 border-t border-white/10 text-xs text-slate-300">
            <div className="font-semibold text-[#D6A84B]">Future Vision Capital</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              সক্রিয় ভূমিকা: {currentRole === 'SUPER_ADMIN' ? 'সুপার অ্যাডমিন' : currentRole === 'TREASURER' ? 'কোষাধ্যক্ষ' : 'সাধারণ সদস্য'}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="no-print lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#10243A]/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#10243A] text-white h-full flex flex-col shadow-2xl">
            <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FvcCrest size={34} />
                <div>
                  <div className="text-sm font-bold font-display">Future Vision Capital</div>
                  <div className="text-[10px] text-[#D6A84B]">একত্রে গড়ি সমৃদ্ধ আগামী</div>
                </div>
              </div>
              <button
                onClick={onCloseMobile}
                aria-label="মেনু বন্ধ করুন"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex-1 overflow-y-auto space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#087F68] text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#D6A84B] text-[#10243A] tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Compact Bottom Navigation Bar (<= 56px height to respect 15% mobile sticky cap) */}
      <nav className="no-print lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-1 h-14 flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-medium cursor-pointer ${
                isActive ? 'text-[#087F68] font-semibold' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[56px]">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
