"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function EditPersonalInformationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "Jane Doe",
    jobTitle: "Senior Product Designer",
    department: "Design & Creative",
    about: "Passionate designer focused on building inclusive and accessible digital experiences. Always learning, always creating.",
  });

  const [avatarUrl] = useState("/assets/avatar-placeholder.png");

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUploadNew = () => {
    console.log("Upload new photo");
  };

  const handleRemove = () => {
    console.log("Remove photo");
  };

  const handleCancel = () => {
    router.push("/account");
  };

  const handleSave = () => {
    console.log("Save changes", formData);
    router.push("/account");
  };

  const handleEditPrivacy = () => {
    router.push("/account/privacy");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Edit Personal Information</h1>
      <p className="mb-8 text-sm text-slate-500">
        Update your profile details and control how others see you across the organization.
      </p>

      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-6">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full bg-slate-100">
              <Image
                src={avatarUrl}
                alt="Profile"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Profile Picture</h3>
              <p className="mb-4 text-xs text-slate-500">JPG, GIF or PNG. Max size 2MB.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleUploadNew}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Upload New
                </button>
                <button
                  onClick={handleRemove}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="jobTitle" className="mb-2 block text-sm font-medium text-slate-700">
                Job Title
              </label>
              <input
                id="jobTitle"
                type="text"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="department" className="mb-2 block text-sm font-medium text-slate-700">
              Department
            </label>
            <select
              id="department"
              value={formData.department}
              onChange={(e) => handleInputChange("department", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Design & Creative">Design & Creative</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
            </select>
          </div>

          <div className="mt-6">
            <label htmlFor="about" className="mb-2 block text-sm font-medium text-slate-700">
              About
            </label>
            <textarea
              id="about"
              value={formData.about}
              onChange={(e) => handleInputChange("about", e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-2 text-xs text-slate-500">
              Brief description for your profile. URLs are hyperlinked.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-lg bg-blue-50 p-4">
            <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" fill="white" />
            </svg>
            <p className="text-xs text-slate-600">
              Last updated 2 days ago
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.4 4.4l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.4-4.4l4.2-4.2" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">Privacy Settings</h3>
              <p className="mt-1 text-xs text-slate-500">
                Choose what information is visible to external guests.
              </p>
            </div>
            <button
              onClick={handleEditPrivacy}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Edit privacy
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">Edit History</h3>
              <p className="mt-1 text-xs text-slate-500">
                View your profile modification history over the last 90 days.
              </p>
            </div>
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
              View history
            </button>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
