import React from "react";
import { ChatMode } from "../types";
import { Plus } from "lucide-react";

interface SidebarTabsProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onOpenCreateGroup?: () => void;
}

export const SidebarTabs: React.FC<SidebarTabsProps> = ({
  currentMode,
  onModeChange,
  onOpenCreateGroup,
}) => {
  return (
    <div className="mx-4 my-3 flex rounded-2xl bg-slate-100 p-1.5">
      <button
        type="button"
        onClick={() => onModeChange("private")}
        className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
          currentMode === "private"
            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        Chat 1-1
      </button>
      <button
        type="button"
        onClick={() => onModeChange("class")}
        className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
          currentMode === "class"
            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        Chat Nhóm
      </button>
      <button
        onClick={onOpenCreateGroup}
        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
        title="Tạo nhóm mới"
      >
        <Plus size={20} />
      </button>
    </div>
  );
};
