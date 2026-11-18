import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'অপ্রত্যাশিত ত্রুটি ঘটেছে।',
    };
  }

  render() {
    if (this.state.hasError) {
      let parsedError = this.state.message;
      try {
        const json = JSON.parse(this.state.message);
        if (json?.error) {
          parsedError = `${json.error} (${json.operationType} @ ${json.path || 'unknown'})`;
        }
      } catch {
        // plain string message
      }

      return (
        <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-bold text-[#10243A]">
                সিস্টেম বা ডাটাবেস সংযোগে ত্রুটি
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ডাটাবেস অপারেশনের সময় একটি নিরাপত্তা বা সংযোগ ত্রুটি পাওয়া গেছে। অনুগ্রহ করে পেজটি রিলোড করে আবার চেষ্টা করুন।
            </p>
            <div className="bg-[#F3F6FA] border border-slate-200 rounded-lg p-3 text-[11px] font-mono-id text-slate-700 break-words">
              {parsedError}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10243A] text-white text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              পুনরায় লোড করুন
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
