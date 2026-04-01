'use client';

import React, { useState, useMemo } from 'react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Member' | 'Guest';
  status: 'Active' | 'Away' | 'Pending';
  joinDate: string;
  avatar?: string;
}

interface FilterState {
  searchTerm: string;
  role: string[];
  status: string[];
  sortBy: 'name' | 'joinDate' | 'activity';
}

export default function TeamMembersTab() {
  // Mock data - sẽ thay bằng API call
  const mockMembers: TeamMember[] = [
    { id: '1', name: 'Alex Rivera', email: 'a.rivera@school.edu', role: 'Owner', status: 'Active', joinDate: '2024-01-15', avatar: '👨' },
    { id: '2', name: 'Marcus Chen', email: 'm.chen@school.edu', role: 'Member', status: 'Away', joinDate: '2024-02-20', avatar: '👨' },
    { id: '3', name: 'Jordan Day', email: 'j.day@school.edu', role: 'Member', status: 'Active', joinDate: '2024-03-10', avatar: '👨' },
    { id: '4', name: 'Elena Sofia', email: 'e.sofia@school.edu', role: 'Member', status: 'Pending', joinDate: '2024-04-01', avatar: '👩' },
  ];

  // State
  const [currentTab, setCurrentTab] = useState<'Students' | 'Teachers'>('Students');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    role: [],
    status: [],
    sortBy: 'name',
  });

  // Filtered members
  const filteredMembers = useMemo(() => {
    let result = mockMembers;

    // Search filter
    if (filters.searchTerm) {
      const query = filters.searchTerm.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(query) || 
        m.email.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (filters.role.length > 0) {
      result = result.filter(m => filters.role.includes(m.role));
    }

    // Status filter
    if (filters.status.length > 0) {
      result = result.filter(m => filters.status.includes(m.status));
    }

    // Sorting
    if (filters.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'joinDate') {
      result.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
    }

    return result;
  }, [filters]);

  // Stats
  const stats = {
    total: mockMembers.length,
    capacity: 50,
    onlineNow: mockMembers.filter(m => m.status === 'Active').length,
    teachers: mockMembers.filter(m => m.role === 'Owner').length,
    pending: mockMembers.filter(m => m.status === 'Pending').length,
  };

  const handleToggleRole = (role: string) => {
    setFilters(prev => ({
      ...prev,
      role: prev.role.includes(role)
        ? prev.role.filter(r => r !== role)
        : [...prev.role, role],
    }));
  };

  const handleToggleStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }));
  };

  const handleReset = () => {
    setFilters({
      searchTerm: '',
      role: [],
      status: [],
      sortBy: 'name',
    });
  };

  return (
    <div className="flex gap-6">
      {/* ========== LEFT: MAIN CONTENT ========== */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Members</h1>
          
          {/* Tabs & Actions */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setCurrentTab('Students')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  currentTab === 'Students'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setCurrentTab('Teachers')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  currentTab === 'Teachers'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                Teachers
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Bulk Invite
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Add Member
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search members by name or email..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={() => setShowFilterModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              FILTER
            </button>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Member Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === 'Owner'
                        ? 'bg-purple-100 text-purple-800'
                        : member.role === 'Member'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        member.status === 'Active' ? 'bg-green-500' :
                        member.status === 'Away' ? 'bg-yellow-500' :
                        'bg-gray-300'
                      }`}></div>
                      <span className="text-sm text-gray-700">{member.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-gray-600 hover:text-gray-900 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.5 1.5H9.5A1.5 1.5 0 008 3v1H4a1 1 0 000 2v1a1 1 0 001 1h1v8a3 3 0 003 3h2a3 3 0 003-3v-8h1a1 1 0 001-1V6a1 1 0 000-2h-4V3a1.5 1.5 0 00-1.5-1.5z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
            Showing {filteredMembers.length} of {stats.total} members
          </div>
        </div>
      </div>

      {/* ========== RIGHT: SIDEBAR ========== */}
      <div className="w-72 space-y-6">
        {/* Class Limits */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            CLASS LIMITS
          </h3>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-lg font-bold text-gray-900">{stats.total}/{stats.capacity}</span>
              <span className="text-xs text-orange-600 font-medium">{Math.round((stats.total / stats.capacity) * 100)}% Capacity</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(stats.total / stats.capacity) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">You have reached {Math.round((stats.total / stats.capacity) * 100)}% of your student limit.</p>
          </div>
          <button className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Upgrade Seats →
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">QUICK STATS</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-700">Online Now</span>
              <span className="text-lg font-bold text-green-600">{stats.onlineNow}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-700">Teachers</span>
              <span className="text-lg font-bold text-blue-600">{stats.teachers}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-700">Pending Invites</span>
              <span className="text-lg font-bold text-purple-600">{stats.pending}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========== FILTER MODAL ========== */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/20">
          <div className="bg-white w-96 h-full shadow-xl overflow-y-auto animate-in slide-in-from-right">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Filters & Sorting</h2>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600">Refine your member view</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Sort By */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  SORT BY
                </h3>
                <div className="space-y-2">
                  {['Name (A-Z)', 'Recent Activity', 'Joining Date'].map((option) => (
                    <label key={option} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="radio"
                        name="sort"
                        checked={filters.sortBy === option.toLowerCase().split(' ')[0]}
                        onChange={() => setFilters(prev => ({ ...prev, sortBy: option.toLowerCase().split(' ')[0] as any }))}
                        className="w-4 h-4 border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Role */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 20H9m8-4h.01M15 16h.01M9 20H4v-2a6 6 0 0112 0v2zm6-12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  ROLE
                </h3>
                <div className="space-y-2">
                  {['Owner', 'Member', 'Guest'].map((role) => (
                    <label key={role} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={filters.role.includes(role)}
                        onChange={() => handleToggleRole(role)}
                        className="w-4 h-4 border-gray-300 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  STATUS
                </h3>
                <div className="space-y-2">
                  {['Active', 'Away', 'Pending'].map((status) => (
                    <label key={status} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status)}
                        onChange={() => handleToggleStatus(status)}
                        className="w-4 h-4 border-gray-300 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{status}</span>
                      <span className="ml-auto text-xs text-gray-500">
                        {mockMembers.filter(m => m.status === status).length}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white space-y-2">
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}