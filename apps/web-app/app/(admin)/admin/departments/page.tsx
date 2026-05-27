"use client";

import { useEffect, useState } from "react";
import {
  getSchools,
  renameSchool,
  getDepartmentsBySchool,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/services/api/admin.service";
import type { School, Department } from "@/shared/types/admin";
import AddDepartmentModal from "@/modules/admin/components/AddDepartmentModal";
import EditDepartmentModal from "@/modules/admin/components/EditDepartmentModal";
import DeleteDepartmentModal from "@/modules/admin/components/DeleteDepartmentModal";
import { useAuth } from "@/shared/providers/AuthProvider";

export default function DepartmentsPage() {
  const { user, setUser } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  // School Rename State
  const [isRenamingSchool, setIsRenamingSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [schoolError, setSchoolError] = useState<string | null>(null);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const schoolList = await getSchools();
      setSchools(schoolList);
      if (schoolList.length > 0) {
        setSelectedSchool(schoolList[0]);
        setNewSchoolName(schoolList[0].name);
      }
    } catch (err) {
      console.error("Failed to fetch schools", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    if (!selectedSchool) return;
    setIsRefreshing(true);
    try {
      const deptList = await getDepartmentsBySchool(selectedSchool.id);
      setDepartments(deptList);
    } catch (err) {
      console.error("Failed to fetch departments", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [selectedSchool]);

  const handleRenameSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !newSchoolName.trim()) return;

    setIsRenamingSchool(true);
    setSchoolError(null);
    try {
      await renameSchool(selectedSchool.id, newSchoolName);
      // Update school states
      const updatedSchools = schools.map((s) =>
        s.id === selectedSchool.id ? { ...s, name: newSchoolName } : s
      );
      setSchools(updatedSchools);
      setSelectedSchool({ ...selectedSchool, name: newSchoolName });
      
      // Update authenticated user's schoolName in global auth state
      if (user && user.schoolId === selectedSchool.id) {
        setUser({
          ...user,
          schoolName: newSchoolName,
        });
      }

      alert("Đổi tên trường thành công!");
    } catch (err) {
      console.error(err);
      setSchoolError("Không thể đổi tên trường. Vui lòng thử lại.");
    } finally {
      setIsRenamingSchool(false);
    }
  };

  // CRUD Operations for Departments
  const handleAddSubmit = async (name: string) => {
    if (!selectedSchool) return;
    const newDept = await createDepartment(selectedSchool.id, name);
    setDepartments((prev) => [...prev, newDept]);
  };

  const handleEditSubmit = async (name: string) => {
    if (!editingDept) return;
    const updated = await updateDepartment(editingDept.id, name);
    setDepartments((prev) =>
      prev.map((d) => (d.id === editingDept.id ? updated : d))
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDept) return;
    await deleteDepartment(deletingDept.id);
    setDepartments((prev) => prev.filter((d) => d.id !== deletingDept.id));
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Quản lý Trường & Phòng Ban
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập danh sách khoa/phòng ban và thay đổi thông tin trường học.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          disabled={!selectedSchool}
          className="flex items-center gap-2 px-4.5 py-2.5 rounded-lg bg-[#005fb8] hover:bg-blue-700 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm Phòng Ban / Khoa
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm gap-3">
          <svg viewBox="0 0 24 24" className="h-8 w-8 animate-spin text-[#005fb8]" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2v4M12 18v4" />
          </svg>
          <span className="text-xs font-medium text-slate-400">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: School configuration & selection */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* School Selector Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Chọn Trường học
              </h2>
              <div className="flex flex-col gap-2">
                {schools.map((school) => {
                  const isSelected = selectedSchool?.id === school.id;
                  return (
                    <button
                      key={school.id}
                      onClick={() => setSelectedSchool(school)}
                      className={`text-left p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-50 border-blue-200 text-[#005fb8]"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate pr-2">{school.name}</span>
                      {isSelected && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#005fb8]" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* School Renaming Card */}
            {selectedSchool && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Đổi Tên Trường
                </h2>

                <form onSubmit={handleRenameSchoolSubmit} className="flex flex-col gap-3">
                  {schoolError && (
                    <div className="p-2.5 bg-red-50 text-[11px] font-semibold text-red-600 rounded-lg border border-red-200">
                      {schoolError}
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tên hiện tại</label>
                    <input
                      type="text"
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      required
                      disabled={isRenamingSchool}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isRenamingSchool || newSchoolName === selectedSchool.name}
                    className="h-10 w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {isRenamingSchool ? "Đang cập nhật..." : "Cập nhật tên trường"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right panel: Department CRUD table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="border-b border-slate-200 px-5 py-4 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase">
                    Danh Sách Khoa & Phòng Ban ({departments.length})
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Trường: {selectedSchool?.name || "Chưa chọn"}
                  </p>
                </div>
                {isRefreshing && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin text-[#005fb8]" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2v4" />
                  </svg>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/30 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">ID</th>
                      <th className="px-5 py-3">Tên Phòng Ban / Khoa</th>
                      <th className="px-5 py-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {departments.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-10 text-center text-slate-400 font-medium">
                          Chưa có khoa hay phòng ban nào được đăng ký dưới trường này.
                        </td>
                      </tr>
                    ) : (
                      departments.map((dept) => (
                        <tr key={dept.id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-5 py-3.5 text-slate-400 font-mono text-[10px]">
                            #{dept.id}
                          </td>
                          <td className="px-5 py-3.5 text-slate-700 font-semibold">
                            {dept.name}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingDept(dept)}
                                className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                title="Đổi tên"
                              >
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeletingDept(dept)}
                                className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-red-100 bg-red-50/20 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                title="Xóa"
                              >
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddDepartmentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddSubmit}
        schoolName={selectedSchool?.name || ""}
      />

      <EditDepartmentModal
        isOpen={editingDept !== null}
        onClose={() => setEditingDept(null)}
        onSubmit={handleEditSubmit}
        department={editingDept}
      />

      <DeleteDepartmentModal
        isOpen={deletingDept !== null}
        onClose={() => setDeletingDept(null)}
        onConfirm={handleDeleteConfirm}
        department={deletingDept}
      />
    </div>
  );
}
