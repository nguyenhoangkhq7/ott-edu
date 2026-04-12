"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { teamApi } from '@/services/api/teamApi';

interface CreateClassFormProps {
  onBack: () => void;
}

export default function CreateClassForm({ onBack }: CreateClassFormProps) {
  const router = useRouter();
  
  // State lưu tên lớp học người dùng nhập vào
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State điều khiển việc Ẩn/Hiện Modal thành công
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleCreate = async () => {
    // Nếu chưa nhập tên thì cảnh báo (UX cơ bản)
    if (!className.trim()) {
      alert("Please enter a class name!");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Tạo mã tham gia ngẫu nhiên (6 ký tự)
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      await teamApi.create({
        name: className,
        description: description,
        joinCode: joinCode,
        departmentId: 1 // Mặc định là khoa 1
      });
      
      // Hiện modal thành công
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Failed to create team:", err);
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tạo lớp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FORM TẠO LỚP HỌC */}
      <div className="flex flex-col items-center justify-center min-h-full w-full pt-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white w-full max-w-xl rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
          
          <button onClick={onBack} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Create a class</h2>
              <p className="text-sm text-gray-500">Instructors use classes to organize students and assignments.</p>
            </div>

            <div className="flex items-center gap-5 mb-6">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Class Avatar</h3>
                <p className="text-xs text-gray-500 mb-2">Set a custom visual identity for your class. Recommended: 512x512px.</p>
                <button className="px-4 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                  Upload image
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g., Java Programming - K65"
                className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">Description</label>
                <span className="text-xs text-gray-400">(Optional)</span>
              </div>
              <textarea 
                placeholder="Tell your students what this class is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2.5 text-sm h-28 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              ></textarea>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex gap-3">
              <div className="text-gray-400 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                By creating this class, you will be automatically assigned as the Primary Instructor. You can invite colleagues and students once the setup is complete.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 bg-gray-50/50 p-6 flex justify-end gap-3">
            <button onClick={onBack} className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleCreate} 
              disabled={loading}
              className={`px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL THÔNG BÁO THÀNH CÔNG */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Dải viền màu dưới cùng */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-emerald-400"></div>

            {/* Icon Thành công */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              {/* Các chấm trang trí */}
              <div className="absolute top-1 right-2 w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="absolute bottom-2 left-0 w-3 h-3 bg-emerald-300 rounded-full"></div>
              {/* Vòng tròn xanh lá */}
              <div className="absolute inset-0 m-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
            </div>

            {/* Nội dung thông báo */}
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Your class is ready!</h3>
            <p className="text-center text-slate-500 text-sm mb-8 leading-relaxed">
              &quot;{className}&quot; has been successfully created. You can now start managing your curriculum and inviting students.
            </p>

            {/* Cụm Nút bấm */}
            <button
              onClick={() => router.push('/teams')}
              className="w-full bg-[#1868f0] hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 mb-3 transition-colors"
            >
              Go to Class
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>

            <button
              onClick={() => alert('Chức năng thêm thành viên đang phát triển!')}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
              Add Members now
            </button>

            <div className="text-center">
              <button
                onClick={() => router.push('/teams')}
                className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
              >
                Maybe later
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}