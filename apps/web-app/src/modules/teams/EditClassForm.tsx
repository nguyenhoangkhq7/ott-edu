"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EditClassFormProps {
  onBack: () => void;
  classData?: {
    id: string;
    name: string;
    code: string;
    description: string;
    initials: string;
    accentColor: string;
    maxStudents?: number;
    currentStudents?: number;
    department?: string;
    school?: string;
    createdAt?: string;
  };
}

interface FormData {
  name: string;
  code: string;
  description: string;
  maxStudents: number;
  department: string;
}

export default function EditClassForm({ onBack, classData }: EditClassFormProps) {
  const router = useRouter();
  
  const mockClassData = classData || {
    id: '1',
    name: 'Advanced Mathematics - Section B',
    code: 'MATH101-B',
    description: 'Advanced Mathematics course covering calculus, linear algebra, and differential equations for second-year students.',
    initials: 'AM',
    accentColor: '#3498db',
    maxStudents: 50,
    currentStudents: 28,
    department: 'Mathematics',
    school: 'Faculty of Science',
    createdAt: '2024-01-15',
  };

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: mockClassData.name,
    code: mockClassData.code,
    description: mockClassData.description,
    maxStudents: mockClassData.maxStudents || 50,
    department: mockClassData.department || '',
  });

  // UI State
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
    // Clear error for this field
    setErrors(prev => ({
      ...prev,
      [field]: '',
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Class name is required';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Class code is required';
    }
    if (formData.code.trim().length < 3) {
      newErrors.code = 'Class code must be at least 3 characters';
    }
    if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    if (formData.maxStudents < 1) {
      newErrors.maxStudents = 'Maximum students must be at least 1';
    }
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call API để lưu thông tin lớp học
      // await updateClassAPI(mockClassData.id, formData);
      
      setShowSuccessModal(true);
      setHasChanges(false);
    } catch {
      alert('Failed to save class information. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FORM CHỈNH SỬA LỚP HỌC */}
      <div className="flex flex-col items-center justify-center min-h-full w-full pt-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
          
          <button onClick={onBack} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="p-8">
            {/* HEADER */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Edit class information</h2>
              <p className="text-sm text-gray-500">Update the details for this class. Changes will be reflected immediately.</p>
            </div>

            {/* CLASS PREVIEW CARD */}
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-6 mb-8">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0"
                  style={{ backgroundColor: mockClassData.accentColor }}
                >
                  {mockClassData.initials}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-600 font-semibold mb-0.5">Current Class</p>
                  <h3 className="text-lg font-semibold text-gray-900">{mockClassData.name}</h3>
                  <p className="text-sm text-gray-600">Code: {mockClassData.code}</p>
                </div>
              </div>
            </div>

            {/* FORM FIELDS */}
            <div className="space-y-6">
              {/* Class Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Advanced Mathematics - Section B"
                  className={`w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Class Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class Code <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="e.g., MATH101-B"
                  className={`w-full border rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    errors.code ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                <p className="text-xs text-gray-500 mt-1">Unique identifier for this class</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what this class covers..."
                  className={`w-full border rounded-lg p-3 text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  maxLength={500}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                <div className="mt-1 flex justify-between">
                  <span className="text-xs text-gray-500">Minimum 10 characters required</span>
                  <span className="text-xs text-gray-400">{formData.description.length}/500</span>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Max Students */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Students <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    max="500"
                    value={formData.maxStudents}
                    onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || 0)}
                    className={`w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                      errors.maxStudents ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.maxStudents && <p className="text-red-500 text-xs mt-1">{errors.maxStudents}</p>}
                  {mockClassData.currentStudents && (
                    <p className="text-xs text-gray-500 mt-1">Currently: {mockClassData.currentStudents} students</p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className={`w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                      errors.department ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a department</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Literature">Literature</option>
                    <option value="History">History</option>
                  </select>
                  {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                </div>
              </div>

              {/* School & Created Info - Read Only */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">School</p>
                    <p className="text-sm text-gray-900 font-medium">{mockClassData.school}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">Created</p>
                    <p className="text-sm text-gray-900 font-medium">{mockClassData.createdAt}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* INFO BOX */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 mt-8">
              <div className="text-blue-400 shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                All enrolled students will be notified if you change the class name or code. Other metadata updates are automatic.
              </p>
            </div>
          </div>

          {/* FOOTER - ACTION BUTTONS */}
          <div className="border-t border-gray-100 bg-gray-50/50 p-6 flex justify-between gap-3">
            <button 
              onClick={onBack}
              className="px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              <button 
                disabled={!hasChanges || isLoading}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  hasChanges && !isLoading
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Reset
              </button>
              <button 
                onClick={handleSave}
                disabled={!hasChanges || isLoading}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  hasChanges && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL XÁC NHẬN */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm changes</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to save these changes? This action cannot be undone.
            </p>

            {/* Changed Fields Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-700 mb-3">Fields to be updated:</p>
              <ul className="space-y-2 text-xs text-gray-600">
                {formData.name !== mockClassData.name && <li>✓ Class name</li>}
                {formData.code !== mockClassData.code && <li>✓ Class code</li>}
                {formData.description !== mockClassData.description && <li>✓ Description</li>}
                {formData.maxStudents !== mockClassData.maxStudents && <li>✓ Max students capacity</li>}
                {formData.department !== mockClassData.department && <li>✓ Department</li>}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÀNH CÔNG */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Gradient border bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-linear-to-r from-green-500 to-emerald-400"></div>

            {/* Success Icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              {/* Decorator dots */}
              <div className="absolute top-1 right-2 w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="absolute bottom-2 left-0 w-3 h-3 bg-emerald-300 rounded-full"></div>
              {/* Circle with checkmark */}
              <div className="absolute inset-0 m-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
            </div>

            {/* Notification Content */}
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Changes saved</h3>
            <p className="text-center text-slate-500 text-sm mb-8 leading-relaxed">
              The class information has been updated successfully. All changes are now live.
            </p>

            {/* Action Buttons */}
            <button
              onClick={() => router.push('/teams')}
              className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 mb-3 transition-all shadow-sm"
            >
              Back to Class
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
