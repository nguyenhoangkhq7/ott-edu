"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { httpService } from '@/services/api/http.service';

interface EditClassFormProps {
  onBack: () => void;
  classData: {
    id: string;
    name: string;
    description: string;
    initials: string;
    accentColor: string;
    isActive?: boolean;
    active?: boolean;
    createdAt?: string;
  };
}

interface FormData {
  name: string;
  description: string;
}

export default function EditClassForm({ onBack, classData }: EditClassFormProps) {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: classData.name,
    description: classData.description,
  });

  // UI State
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Class name is required';
    }
    if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);

    try {
      await httpService.put(`/teams/${classData.id}`, {
        name: formData.name,
        description: formData.description
      });
      setShowSuccessModal(true);
      setHasChanges(false);
    } catch (error) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const detail = err.response?.data?.message || err.message || 'Please check your role permissions.';
      alert(`Failed to save class information.\nDetails: ${detail}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-full w-full pt-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
          
          <button onClick={onBack} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Edit Class Properties</h2>
              <p className="text-sm text-gray-500">Update exact parameters matching the backend UML schema.</p>
            </div>

            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-6 mb-8">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0"
                  style={{ backgroundColor: classData.accentColor }}
                >
                  {classData.initials}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-600 font-semibold mb-0.5">Editing Class ID: {classData.id}</p>
                  <h3 className="text-lg font-semibold text-gray-900">{classData.name}</h3>
                </div>
              </div>
            </div>

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
                  placeholder="e.g., Advanced Mathematics"
                  className={`w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
                  className={`w-full border rounded-lg p-3 text-sm h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
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

              {/* Created Info - Read Only */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">Created At</p>
                    <p className="text-sm text-gray-900 font-medium">{classData.createdAt || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-12 pt-8 border-t border-red-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
              </div>
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:bg-red-50">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Cancel this class</h4>
                  <p className="text-xs text-red-700/70 max-w-sm">
                    Cancelling this class will hide it from students. Teachers will still see it as &quot;Cancelled&quot; in their history. This action requires confirmation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/teams/${classData.id}/cancel`)}
                  disabled={classData.isActive === false || classData.active === false}
                  className={`shrink-0 px-6 py-2 font-semibold rounded-lg transition-all shadow-sm active:scale-95 ${
                    (classData.isActive === false || classData.active === false)
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      : 'bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white'
                  }`}
                >
                  {(classData.isActive === false || classData.active === false) ? 'Already Cancelled' : 'Cancel Class...'}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 bg-gray-50/50 p-6 flex justify-between gap-3">
            <button 
              onClick={onBack}
              className="px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              <button 
                onClick={handleSave}
                disabled={!hasChanges || isLoading}
                className={`px-8 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  hasChanges && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm updates</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to apply these schema updates to `{classData.name}`?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-linear-to-r from-green-500 to-emerald-400"></div>
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute top-1 right-2 w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="absolute bottom-2 left-0 w-3 h-3 bg-emerald-300 rounded-full"></div>
              <div className="absolute inset-0 m-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Class Updated</h3>
            <p className="text-center text-slate-500 text-sm mb-8">
              The class core properties have been successfully saved to the database.
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.back();
                setTimeout(() => window.location.reload(), 100);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg flex justify-center gap-2 mb-3 shadow-sm"
            >
              Back to Details
            </button>
          </div>
        </div>
      )}
    </>
  );
}
