"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CancelClassFormProps {
  onBack: () => void;
  classData?: {
    id: string;
    name: string;
    initials: string;
    accentColor: string;
    memberCount?: number;
  };
}

export default function CancelClassForm({ onBack, classData }: CancelClassFormProps) {
  const router = useRouter();
  
  // State lưu lý do hủy
  const [cancellationReason, setCancellationReason] = useState('');
  
  // State xác nhận hiểu rõ hậu quả
  const [hasConfirmed, setHasConfirmed] = useState(false);
  
  // State điều khiển Modal thành công
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // State loading
  const [isLoading, setIsLoading] = useState(false);

  const mockClassData = classData || {
    id: '1',
    name: 'Advanced Mathematics - Section B',
    initials: 'AM',
    accentColor: '#3498db',
    memberCount: 28,
  };

  const handleCancel = async () => {
    if (!hasConfirmed) {
      alert('Please confirm that you understand the consequences');
      return;
    }

    if (cancellationReason.trim().length < 10) {
      alert('Please provide a reason for cancellation (at least 10 characters)');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call API để hủy lớp học
      // await cancelClassAPI(mockClassData.id, cancellationReason);
      
      setShowSuccessModal(true);
    } catch (error) {
      alert('Failed to cancel class. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FORM HỦY LỚP HỌC */}
      <div className="flex flex-col items-center justify-center min-h-full w-full pt-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
          
          <button onClick={onBack} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="p-8">
            {/* HEADER */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs font-semibold text-red-600 uppercase tracking-widest">Dangerous Action</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Cancel this class</h2>
              <p className="text-sm text-gray-500">This action cannot be undone. Please review all information before proceeding.</p>
            </div>

            {/* CLASS INFORMATION CARD */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg border border-gray-200 p-6 mb-8">
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-3xl shadow-md flex-shrink-0"
                  style={{ backgroundColor: mockClassData.accentColor }}
                >
                  {mockClassData.initials}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{mockClassData.name}</h3>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM9 10a6 6 0 016 6H3a6 6 0 016-6zM21 10a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                      <span>{mockClassData.memberCount || 0} students</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0 4 4 0 008 0zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18a4 4 0 00-8 0 4 4 0 008 0z" /></svg>
                      <span>Instructors & staff</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* WARNING BOX - CONSEQUENCES */}
            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-8">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-800 mb-2">This will permanently delete:</h4>
                  <ul className="text-sm text-red-700 space-y-1 ml-4">
                    <li>✓ All class materials and assignments</li>
                    <li>✓ Student submissions and grades</li>
                    <li>✓ Class discussion threads and posts</li>
                    <li>✓ All class data and records</li>
                    <li>✓ Class members will lose access</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CANCELLATION REASON */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for cancellation <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Tell us why you're cancelling this class (this helps us improve). Minimum 10 characters..."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder-gray-400"
                maxLength={500}
              />
              <div className="mt-1 flex justify-between">
                <span className="text-xs text-gray-500">Minimum 10 characters required</span>
                <span className="text-xs text-gray-400">{cancellationReason.length}/500</span>
              </div>
            </div>

            {/* CONFIRMATION CHECKBOX */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={hasConfirmed}
                  onChange={(e) => setHasConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-700">
                  I understand that cancelling this class will <strong>permanently delete</strong> all associated data and cannot be reversed. I have notified all students and staff members.
                </span>
              </label>
            </div>

            {/* INFO BOX */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 mb-8">
              <div className="text-blue-400 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                Tip: If you simply want to pause the class temporarily, consider archiving it instead. Archived classes can be restored later without losing data.
              </p>
            </div>
          </div>

          {/* FOOTER - ACTION BUTTONS */}
          <div className="border-t border-gray-100 bg-gray-50/50 p-6 flex justify-end gap-3">
            <button 
              onClick={onBack}
              className="px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Keep Class
            </button>
            <button 
              onClick={handleCancel}
              disabled={!hasConfirmed || isLoading || cancellationReason.trim().length < 10}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                hasConfirmed && cancellationReason.trim().length >= 10 && !isLoading
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Cancel Class
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL XÁC NHẬN THÀNH CÔNG */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Gradient border bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-pink-400"></div>

            {/* Success Icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              {/* Decorator dots */}
              <div className="absolute top-1 right-2 w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="absolute bottom-2 left-0 w-3 h-3 bg-pink-300 rounded-full"></div>
              {/* Circle with checkmark */}
              <div className="absolute inset-0 m-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
            </div>

            {/* Notification Content */}
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Class cancelled</h3>
            <p className="text-center text-slate-500 text-sm mb-2 leading-relaxed">
              &quot;{mockClassData.name}&quot; has been successfully cancelled.
            </p>
            <p className="text-center text-slate-500 text-xs mb-8 leading-relaxed text-gray-400">
              All students have been notified. Class data has been permanently deleted.
            </p>

            {/* Action Buttons */}
            <button
              onClick={() => router.push('/teams')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 mb-3 transition-all shadow-sm"
            >
              Back to Teams
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
