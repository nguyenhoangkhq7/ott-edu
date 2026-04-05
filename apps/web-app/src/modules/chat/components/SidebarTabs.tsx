import React from 'react';
import { ChatMode } from '../types';

interface SidebarTabsProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export const SidebarTabs: React.FC<SidebarTabsProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="flex p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mx-4 my-2">
      <button
        onClick={() => onModeChange('direct')}
        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
          currentMode === 'direct'
            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        Chat 1-1
      </button>
      <button
        onClick={() => onModeChange('group')}
        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
          currentMode === 'group'
            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        Chat Nhóm
      </button>
    </div>
  );
};
