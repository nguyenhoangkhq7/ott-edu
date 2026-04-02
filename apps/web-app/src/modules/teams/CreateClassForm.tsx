"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { httpService } from '@/services/api/http.service';

interface CreateClassFormProps {
  onBack: () => void;
}

interface ClassFormData {
  name: string;
  description: string;
  isPrivate: boolean;
  joinCode?: string;
}

export default function CreateClassForm({ onBack }: CreateClassFormProps) {
  const router = useRouter();
  
  // State quản lý step của form
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  
  // State quản lý dữ liệu form - dễ mapping với API
  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
    description: '',
    isPrivate: true,
    joinCode: generateJoinCode(),
  });
  
  // State điều khiển việc Ẩn/Hiện Modal thành công
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Hàm sinh mã tham gia ngẫu nhiên
  function generateJoinCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Xử lý thay đổi dữ liệu form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Xử lý thay đổi privacy
  const handlePrivacyChange = (isPrivate: boolean) => {
    setFormData(prev => ({
      ...prev,
      isPrivate,
    }));
  };

  // Xử lý bước tiếp theo
  const handleNext = () => {
    if (!formData.name.trim()) {
      alert('Please enter a class name!');
      return;
    }
    setCurrentStep(2);
  };

  // Xử lý tạo lớp học
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a class name!');
      return;
    }

    setIsLoading(true);
    try {
      // Call real backend API
      const response = await httpService.post<any>('/teams', {
        name: formData.name,
        description: formData.description,
      });

      // Update form data with the actual join code from the server
      if (response && response.joinCode) {
        setFormData(prev => ({
          ...prev,
          joinCode: response.joinCode,
        }));
      }

      // Hiện modal thành công
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error creating class:', error);
      alert(error.message || 'Failed to create class. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* STEP 1: ESSENTIALS */}
      {currentStep === 1 && (
        <div className="flex flex-col items-center justify-center min-h-screen w-full py-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg border border-gray-200 overflow-hidden relative max-h-[90vh] overflow-y-auto">
            
            {/* Close button */}
            <button onClick={onBack} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors z-10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="p-8">
              {/* Header */}
              <div className="mb-8">
                <div className="text-xs font-bold text-blue-600 tracking-widest mb-2">01 — ESSENTIALS</div>
                <h2 className="text-4xl font-bold text-gray-900 mb-3">Design the future of your classroom</h2>
                <p className="text-lg text-gray-600">Create a specialized space for collaboration, content sharing, and personalized learning journeys.</p>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Class Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Class Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Advanced Economics 101"
                    className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Description</label>
                    <span className="text-xs text-gray-500">(Optional)</span>
                  </div>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Share the goals and vision for this group..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-base h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Privacy Section */}
                <div>
                  <div className="text-xs font-bold text-gray-500 tracking-widest mb-4">02 — PRIVACY</div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Private Option */}
                    <button
                      onClick={() => handlePrivacyChange(true)}
                      className={`relative p-5 rounded-xl border-2 transition-all ${
                        formData.isPrivate 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                          formData.isPrivate 
                            ? 'border-blue-600 bg-blue-600' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {formData.isPrivate && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">Private</h3>
                          <p className="text-xs text-gray-600 mt-1">Only class owners can add members to this space.</p>
                        </div>
                      </div>
                    </button>

                    {/* Public Option */}
                    <button
                      onClick={() => handlePrivacyChange(false)}
                      className={`relative p-5 rounded-xl border-2 transition-all ${
                        !formData.isPrivate 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                          !formData.isPrivate 
                            ? 'border-blue-600 bg-blue-600' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {!formData.isPrivate && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">Public</h3>
                          <p className="text-xs text-gray-600 mt-1">Anyone in your organization can find and join.</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Join Code */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Join Code</label>
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, joinCode: generateJoinCode() }))}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={formData.joinCode}
                    readOnly
                    className="w-full border border-blue-300 rounded-lg p-2 text-sm font-mono bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-600 mt-2">Share this code with students to join your class.</p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-3 mt-8">
                <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-gray-600 leading-relaxed">
                  By creating this class, you will be automatically assigned as the Primary Instructor. You can invite colleagues and students once the setup is complete.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 p-6 flex justify-between items-center">
              <button 
                onClick={onBack} 
                className="px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">NEXT STEP</span>
                <button 
                  onClick={handleNext}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Next Step →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ADD MEMBERS (Optional) */}
      {currentStep === 2 && (
        <div className="flex flex-col items-center justify-center min-h-screen w-full py-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
            
            <div className="p-8">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Add members to <span className="text-blue-600">{formData.name}</span></h2>
                <p className="text-gray-600">Shape your cohort by inviting students and teachers to your digital workspace.</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button className="px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-t-lg">Students</button>
                <button className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900">Teachers</button>
              </div>

              {/* Search and Selected Members */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="Search for students..." 
                    className="flex-1 min-w-60 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Suggested */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Suggested Candidates</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: 'Alex Rivera', email: 'a.rivera@school.edu', avatar: '🧑' },
                      { name: 'Elena Sofia', email: 'e.sofia@school.edu', avatar: '👩' },
                      { name: 'James Wilson', email: 'j.wilson@school.edu', avatar: '🧑' },
                      { name: 'Mia Chen', email: 'm.chen@school.edu', avatar: '👩' },
                    ].map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {member.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right panel - Scale tip */}
              <div className="bg-blue-600 text-white rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <h3 className="font-semibold mb-2">Scale your Classroom</h3>
                    <p className="text-sm text-blue-100">Handing a large enrollment? Import your roster instantly via CSV and skip the manual search.</p>
                    <button className="mt-3 text-sm font-medium bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                      Import CSV →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 p-6 flex justify-between items-center">
              <button 
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={handleCreate}
                  disabled={isLoading}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isLoading ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Decorative stripe at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-emerald-400"></div>

            {/* Success Icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute top-1 right-2 w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="absolute bottom-2 left-0 w-3 h-3 bg-emerald-300 rounded-full"></div>
              <div className="absolute inset-0 m-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Content */}
            <h3 className="text-2xl font-bold text-center text-slate-900 mb-3">Class created successfully!</h3>
            <p className="text-center text-slate-600 text-sm mb-8 leading-relaxed">
              &quot;{formData.name}&quot; is ready for your students. We&apos;ve synchronized your syllabus and reading lists.
            </p>

            {/* Class Info */}
            <div className="bg-slate-50 rounded-lg p-4 mb-8">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Class Code:</span>
                  <span className="font-mono font-semibold text-gray-900">{formData.joinCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Privacy:</span>
                  <span className="font-medium text-gray-900">{formData.isPrivate ? 'Private' : 'Public'}</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <button
              onClick={() => router.push('/teams')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors mb-3"
            >
              Go to Class
            </button>

            <button
              onClick={() => setCurrentStep(1)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-lg transition-colors"
            >
              Create Another Class
            </button>
          </div>
        </div>
      )}
    </>
  );
}