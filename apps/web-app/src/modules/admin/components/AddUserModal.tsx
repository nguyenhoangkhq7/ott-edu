"use client";

import { useState } from "react";
import Modal from "@/shared/components/ui/Modal";
import Input from "@/shared/components/ui/Input";
import type { CreateUserPayload } from "@/services/api/admin.service";
import type { FilterOption } from "@/shared/types/admin";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload) => Promise<void>;
  roleOptions: FilterOption[];
}

export default function AddUserModal({
  isOpen,
  onClose,
  onSubmit,
  roleOptions,
}: AddUserModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("Student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exclude 'All Roles' option if present
  const selectableRoles = roleOptions.filter((opt) => opt.value !== "all");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName || !role) {
      setError("Please fill out all fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ email, password, firstName, lastName, role });
      // Reset form
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setRole("Student");
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Account" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200 animate-in fade-in">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          placeholder="john.doe@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isSubmitting}
        />

        {/* Custom select styling to fit nicely with Input.tsx */}
        <label className="flex w-full flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Assign Role</span>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer"
            >
              {selectableRoles.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
        </label>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-4.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin text-white" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2v4" />
                </svg>
                <span>Creating...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
