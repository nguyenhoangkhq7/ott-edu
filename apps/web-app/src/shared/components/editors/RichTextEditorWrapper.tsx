'use client';

import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface RichTextEditorWrapperProps {
  label: string;
  placeholder?: string;
  register: UseFormRegisterReturn;
  error?: string;
  rows?: number;
}

/**
 * RichTextEditorWrapper Component
 * 
 * Currently a simple textarea, but can be easily swapped out for:
 * - react-quill (Quill)
 * - @tiptap/react (Tiptap)
 * - slate (Slate editor)
 * 
 * This wrapper keeps the API consistent regardless of the editor used.
 */
export default function RichTextEditorWrapper({
  label,
  placeholder,
  register,
  error,
  rows = 6,
}: RichTextEditorWrapperProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-900 mb-2">
        {label}
      </label>
      
      <textarea
        {...register}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm font-normal transition-colors
          ${
            error
              ? 'border-red-300 bg-red-50 text-slate-900 placeholder-red-300 focus:border-red-500 focus:outline-none'
              : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
          }`}
      />
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
