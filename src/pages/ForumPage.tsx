import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  MessageCircle,
  Pin,
  Plus,
  Search,
  Send,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';
import { ForumCategory, ForumPost, Member, UserRole } from '../types/fvc';
import { getInitials, toBengaliDigits } from '../utils/formatters';

interface ForumPageProps {
  posts: ForumPost[];
  members: Member[];
  currentUser: Member;
  currentRole: UserRole;
  onCreatePost: (payload: {
    title: string;
    category: ForumCategory;
    content: string;
    attachmentName?: string;
  }) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, content: string, parentCommentId?: string) => void;
  onApprovePost: (postId: string) => void;
  onRejectPost: (postId: string, reason: string) => void;
  onTogglePin: (postId: string) => void;
}

const FORUM_CATEGORIES: ForumCategory[] = [
  'প্রস্তাবনা',
  'বিনিয়োগ ধারণা',
  'সাধারণ সভা',
  'সমাজকল্যাণ',
  'বিবিধ',
];

export const ForumPage: React.FC<ForumPageProps> = ({
  posts,
  members,
  currentUser,
  currentRole,
  onCreatePost,
  onToggleLike,
  onAddComment,
  onApprovePost,
  onRejectPost,
  onTogglePin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ForumCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<'FEED' | 'PENDING'>('FEED');
  const [showNewModal, setShowNewModal] = useState(false);

  // New Post Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ForumCategory>('প্রস্তাবনা');
  const [content, setContent] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  // Comment & Reply inputs keyed by postId / commentId
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  const isAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'TREASURER';
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const pendingPostsCount = useMemo(
    () => posts.filter((p) => p.status === 'PENDING').length,
    [posts]
  );

  const visiblePosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts
      .filter((p) => {
        if (statusFilter === 'PENDING') {
          if (p.status !== 'PENDING') return false;
          if (!isAdmin && p.authorId !== currentUser.id) return false;
        } else {
          // Main feed shows APPROVED posts + currentUser's own PENDING posts
          if (p.status === 'REJECTED') return false;
          if (p.status === 'PENDING' && !isAdmin && p.authorId !== currentUser.id) return false;
        }

        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
        if (q) {
          const author = memberMap.get(p.authorId);
          const matchText =
            p.title.toLowerCase().includes(q) ||
            p.content.toLowerCase().includes(q) ||
            (author?.fullName.toLowerCase().includes(q) ?? false) ||
            p.authorId.toLowerCase().includes(q);
          if (!matchText) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return 0;
      });
  }, [posts, statusFilter, isAdmin, currentUser.id, selectedCategory, searchQuery, memberMap]);

  const handleSubmitNewPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onCreatePost({
      title: title.trim(),
      category,
      content: content.trim(),
      attachmentName,
    });
    setTitle('');
    setContent('');
    setAttachmentName(undefined);
    setShowNewModal(false);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setAttachmentName(file.name);
    }
  };

  const handleCommentSubmit = (postId: string) => {
    const txt = (commentInputs[postId] || '').trim();
    if (!txt) return;
    onAddComment(postId, txt);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleReplySubmit = (postId: string, commentId: string) => {
    const txt = (replyInputs[commentId] || '').trim();
    if (!txt) return;
    onAddComment(postId, txt, commentId);
    setReplyInputs((prev) => ({ ...prev, [commentId]: '' }));
    setReplyOpenFor(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#10243A]">
            নিউজ ও আলোচনা ফোরাম
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            সমিতির প্রস্তাবনা, বিনিয়োগ ধারণা, সাধারণ সভার সিদ্ধান্ত ও সমাজকল্যাণমূলক আলোচনা
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#087F68] hover:bg-[#066956] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          নতুন আলোচনা শুরু করুন
        </button>
      </div>

      {/* Top Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="আলোচনার শিরোনাম, বিষয়বস্তু বা সদস্য আইডি খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F3F6FA] rounded-lg self-start">
            <button
              onClick={() => setStatusFilter('FEED')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'FEED'
                  ? 'bg-white text-[#10243A] shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-[#10243A]'
              }`}
            >
              সকল ফিড
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-[#10243A] shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-[#10243A]'
              }`}
            >
              <span>পর্যালোচনায় (Pending)</span>
              {pendingPostsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold tabular-nums">
                  {toBengaliDigits(pendingPostsCount)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#10243A] text-white'
                : 'bg-[#F3F6FA] text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            সকল ক্যাটাগরি
          </button>
          {FORUM_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#10243A] text-white'
                  : 'bg-[#F3F6FA] text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Cards */}
      {visiblePosts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#10243A]">কোনো আলোচনা পাওয়া যায়নি</h3>
          <p className="text-sm text-slate-500 mt-1">
            অনুসন্ধান ফিল্টার পরিবর্তন করুন অথবা নতুন একটি আলোচনা পোস্ট জমা দিন।
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visiblePosts.map((post) => {
            const author = memberMap.get(post.authorId);
            const authorSerial = author ? toBengaliDigits(String(author.serialNumber).padStart(3, '0')) : '০০০';

            return (
              <article
                key={post.id}
                className={`bg-white border rounded-xl p-5 transition-colors ${
                  post.isPinned ? 'border-[#D6A84B]' : 'border-slate-200'
                }`}
              >
                {/* Pinned / Pending Top Notice Strip */}
                {(post.isPinned || post.status === 'PENDING') && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-3">
                      {post.isPinned && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#9E7422]">
                          <Pin className="w-3.5 h-3.5" />
                          পিন করা নোটিশ
                        </span>
                      )}
                      {post.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                          <Clock className="w-3.5 h-3.5" />
                          পর্যালোচনায় (অ্যাডমিন অনুমোদনের অপেক্ষমাণ)
                        </span>
                      )}
                    </div>

                    {isAdmin && post.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onApprovePost(post.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#087F68] hover:bg-[#066956] text-white text-xs font-medium cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          অনুমোদন করুন
                        </button>
                        <button
                          onClick={() => onRejectPost(post.id, 'নীতিমালা পরিপন্থী বা অসম্পূর্ণ তথ্য')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-red-200 text-red-700 hover:bg-red-50 text-xs font-medium cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          বাতিল
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Author Header & Clean Metadata */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: author?.avatarColor || '#10243A' }}
                    >
                      {author ? getInitials(author.fullName) : 'FV'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold text-[#10243A] truncate">
                          {author?.fullName || 'সদস্য'}
                        </span>
                        <span className="text-xs font-medium text-[#087F68] font-mono-id">
                          সদস্য #{authorSerial} ({post.authorId})
                        </span>
                        {author?.committeeRole && (
                          <span className="text-xs text-[#9E7422] font-medium">
                            · {author.committeeRole}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{post.createdAt}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-700">{post.category}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            post.status === 'APPROVED' ? 'text-[#087F68]' : 'text-amber-700'
                          }`}
                        >
                          {post.status === 'APPROVED' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> অনুমোদিত
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" /> পর্যালোচনায়
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && post.status === 'APPROVED' && (
                    <button
                      onClick={() => onTogglePin(post.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                        post.isPinned
                          ? 'bg-[#D6A84B]/15 border-[#D6A84B] text-[#9E7422]'
                          : 'border-slate-200 text-slate-500 hover:text-[#10243A]'
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                      {post.isPinned ? 'আনপিন' : 'পিন করুন'}
                    </button>
                  )}
                </div>

                {/* Post Title & Content */}
                <h2 className="text-base sm:text-lg font-bold text-[#10243A] mt-3.5 leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Attachment File Row */}
                {post.attachmentName && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F3F6FA] border border-slate-200 text-xs text-[#10243A]">
                    <FileText className="w-4 h-4 text-[#087F68]" />
                    <span className="font-mono-id">{post.attachmentName}</span>
                  </div>
                )}

                {/* Engagement Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-5">
                  <button
                    onClick={() => onToggleLike(post.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      post.likedByMe ? 'text-rose-600' : 'text-slate-600 hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.likedByMe ? 'fill-rose-600' : ''}`} />
                    <span className="tabular-nums">{toBengaliDigits(post.likes)} পছন্দ</span>
                  </button>

                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <MessageCircle className="w-4 h-4" />
                    <span className="tabular-nums">
                      {toBengaliDigits(
                        post.comments.reduce((acc, c) => acc + 1 + c.replies.length, 0)
                      )}{' '}
                      মন্তব্য
                    </span>
                  </div>
                </div>

                {/* Nested Comments & Replies */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  {post.comments.map((comment) => {
                    const cAuthor = memberMap.get(comment.authorId);
                    return (
                      <div key={comment.id} className="space-y-2">
                        <div className="flex items-start gap-2.5 bg-[#F3F6FA] rounded-lg p-3">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: cAuthor?.avatarColor || '#10243A' }}
                          >
                            {cAuthor ? getInitials(cAuthor.fullName) : 'FV'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[#10243A]">
                                {cAuthor?.fullName || comment.authorId}{' '}
                                <span className="font-mono-id text-[11px] text-[#087F68]">
                                  ({comment.authorId})
                                </span>
                              </span>
                              <span className="text-[11px] text-slate-400">{comment.createdAt}</span>
                            </div>
                            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                              {comment.content}
                            </p>
                            <button
                              onClick={() =>
                                setReplyOpenFor(replyOpenFor === comment.id ? null : comment.id)
                              }
                              className="text-[11px] font-semibold text-[#087F68] hover:underline mt-1.5 cursor-pointer"
                            >
                              উত্তর দিন
                            </button>
                          </div>
                        </div>

                        {/* Nested Replies */}
                        {comment.replies.length > 0 && (
                          <div className="pl-8 space-y-2">
                            {comment.replies.map((reply) => {
                              const rAuthor = memberMap.get(reply.authorId);
                              return (
                                <div
                                  key={reply.id}
                                  className="flex items-start gap-2 bg-slate-50 border border-slate-200/70 rounded-lg p-2.5"
                                >
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                                    style={{ backgroundColor: rAuthor?.avatarColor || '#087F68' }}
                                  >
                                    {rAuthor ? getInitials(rAuthor.fullName) : 'FV'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-semibold text-[#10243A]">
                                        {rAuthor?.fullName || reply.authorId}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        {reply.createdAt}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-700 mt-0.5">{reply.content}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Reply Input */}
                        {replyOpenFor === comment.id && (
                          <div className="pl-8 flex items-center gap-2">
                            <input
                              type="text"
                              value={replyInputs[comment.id] || ''}
                              onChange={(e) =>
                                setReplyInputs((prev) => ({
                                  ...prev,
                                  [comment.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleReplySubmit(post.id, comment.id);
                              }}
                              placeholder="আপনার উত্তর লিখুন..."
                              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                            />
                            <button
                              onClick={() => handleReplySubmit(post.id, comment.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#087F68] text-white text-xs font-medium cursor-pointer"
                            >
                              পাঠান
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* New Top-Level Comment Input */}
                  {post.status === 'APPROVED' && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommentSubmit(post.id);
                        }}
                        placeholder="আপনার মতামত বা মন্তব্য লিখুন..."
                        className="flex-1 px-3 py-2 text-xs bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                      />
                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#10243A] hover:bg-[#193554] text-white text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        মন্তব্য
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* New Discussion Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10243A]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#10243A] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">নতুন আলোচনা বা প্রস্তাবনা শুরু করুন</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  জমা দেওয়ার পর অ্যাডমিন অনুমোদন করলে এটি মূল ফিডে প্রকাশিত হবে
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewPost} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#10243A] mb-1.5">
                  শিরোনাম (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: ২০২৭ সালের বিনিয়োগ রোডম্যাপ প্রস্তাবনা"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10243A] mb-1.5">
                  ক্যাটাগরি নির্বাচন করুন
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ForumCategory)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                >
                  {FORUM_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10243A] mb-1.5">
                  বিস্তারিত বিবরণ *
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="আপনার প্রস্তাবনা বা আলোচনার বিস্তারিত যুক্তিসহ লিখুন..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F3F6FA] border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F68]"
                />
              </div>

              {/* Drag & Drop Document/Image Upload Simulation */}
              <div>
                <label className="block text-xs font-semibold text-[#10243A] mb-1.5">
                  ছবি বা ডকুমেন্ট সংযুক্তি (ঐচ্ছিক)
                </label>
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDropFile}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-[#087F68] bg-[#087F68]/5'
                      : 'border-slate-300 bg-[#F3F6FA] hover:border-[#087F68]'
                  }`}
                >
                  <UploadCloud className="w-7 h-7 text-[#087F68] mb-1.5" />
                  {attachmentName ? (
                    <span className="text-xs font-semibold text-[#087F68] font-mono-id">
                      সংযুক্ত ফাইল: {attachmentName}
                    </span>
                  ) : (
                    <>
                      <span className="text-xs font-medium text-[#10243A]">
                        এখানে ফাইল ড্র্যাগ অ্যান্ড ড্রপ করুন অথবা ক্লিক করে নির্বাচন করুন
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        PDF, XLSX, JPG বা PNG (সর্বোচ্চ ৫ মেগাবাইট)
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setAttachmentName(f.name);
                    }}
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold bg-[#087F68] hover:bg-[#066956] text-white rounded-lg cursor-pointer"
                >
                  অনুমোদনের জন্য জমা দিন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
