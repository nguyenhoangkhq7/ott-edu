"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateClassForm from '@/modules/teams/CreateClassForm';
import CancelClassForm from '@/modules/teams/CancelClassForm';

export default function DemoPage() {
  const router = useRouter();
  const [demoView, setDemoView] = useState<'menu' | 'create' | 'cancel'>('menu');

  return (
    <div>
      {demoView === 'menu' && (
        <div className="flex flex-col items-center justify-center min-h-full w-full pt-10 pb-20 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full mx-4 border border-slate-200">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">Class Management Demo</h1>
            <p className="text-center text-slate-500 mb-8">Select a feature to preview</p>

            <div className="space-y-3">
              <button
                onClick={() => setDemoView('create')}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 group"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create Class
              </button>

              <button
                onClick={() => setDemoView('cancel')}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 group"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Cancel Class
              </button>
            </div>

            <button
              onClick={() => router.push('/teams')}
              className="w-full mt-6 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all"
            >
              Back to Teams
            </button>
          </div>
        </div>
      )}

      {demoView === 'create' && (
        <CreateClassForm onBack={() => setDemoView('menu')} />
      )}

      {demoView === 'cancel' && (
        <CancelClassForm onBack={() => setDemoView('menu')} />
      )}
    </div>
  );
}
