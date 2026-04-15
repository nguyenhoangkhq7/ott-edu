"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/services/api/axios';
import { useAppContext } from '@/shared/providers/AppContext';
import Cookies from 'js-cookie';

// --- TYPES FOR LINT FIX ---
interface BackendAttachment {
  id: string;
  fileName?: string;
  name?: string;
  fileType?: string;
  createdAt?: string;
  updatedAt?: string;
  authorName?: string;
  userId?: string;
  authorId?: string;
  fileUrl?: string;
  url?: string;
  size?: number;
}

interface MappedFile {
  id: string;
  name: string;
  type: string;
  rawDate: number;
  modified: string;
  author: string;
  initials: string;
  url: string;
  rawSize: number;
  size: string;
  isMe: boolean;
}

// ================= HELPER FUNCTIONS =================
const getInitials = (name: string) => {
  if (!name) return 'U';
  // Nếu là email, lấy phần trước dấu @
  const cleanName = name.includes('@') ? name.split('@')[0] : name;
  const parts = cleanName.trim().split(/\s+/);
  
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  // Lấy chữ cái đầu của từ ĐẦU TIÊN và từ CUỐI CÙNG
  const firstLetter = parts[0].charAt(0);
  const lastLetter = parts[parts.length - 1].charAt(0);
  return (firstLetter + lastLetter).toUpperCase();
};

const formatTime = (dateString: string | number) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today at ${timeStr}`;
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${dateStr} ${timeStr}`;
};

const formatRelativeTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} mins ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const downloadFile = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const getFileIcon = (fileName: string) => {
  const name = (fileName || '').toLowerCase();
  if (name.includes('.pdf')) return { icon: 'PDF', bg: 'bg-red-100', text: 'text-red-600' };
  if (name.match(/\.(doc|docx)$/)) return { icon: 'DOC', bg: 'bg-blue-100', text: 'text-blue-600' };
  if (name.match(/\.(xls|xlsx|csv)$/)) return { icon: 'XLS', bg: 'bg-emerald-100', text: 'text-emerald-600' };
  if (name.match(/\.(ppt|pptx)$/)) return { icon: 'PPT', bg: 'bg-orange-100', text: 'text-orange-600' };
  if (name.match(/\.(zip|rar|7z)$/)) return { icon: 'ZIP', bg: 'bg-amber-100', text: 'text-amber-600' };
  if (name.match(/\.(jpg|jpeg|png|gif)$/)) return { icon: 'IMG', bg: 'bg-purple-100', text: 'text-purple-600' };
  return { icon: 'FILE', bg: 'bg-slate-100', text: 'text-slate-500' };
};

// ================= MAIN COMPONENT =================
interface TeamFilesTabProps {
  teamId?: number;
}

export default function TeamFilesTab({ teamId: routeTeamId }: TeamFilesTabProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [files, setFiles] = useState<MappedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 

  const menuRef = useRef<HTMLDivElement>(null);
  const uploadButtonRef = useRef<HTMLDivElement>(null);
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  const hiddenFolderInputRef = useRef<HTMLInputElement>(null);

  const { userEmail, isLoaded, classId: contextClassId } = useAppContext();
  const [classId, setClassId] = useState<string | null>(null);

  useEffect(() => {
    const resolvedTeamId = routeTeamId?.toString() ?? contextClassId ?? null;
    setClassId(resolvedTeamId);
  }, [contextClassId, routeTeamId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setActiveMenuId(null);
      if (uploadButtonRef.current && !uploadButtonRef.current.contains(event.target as Node)) setIsUploadMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchFiles = useCallback(async () => {
    if (!isLoaded || !classId) return;
    try {
      setIsLoading(true);
      const response = await apiClient.get<BackendAttachment[]>(`/attachments/class/${classId}`);
      
      const currentUser = userEmail || Cookies.get('userEmail') || "";

      const mappedFiles: MappedFile[] = response.data.map((f) => {
        const displayName = f.authorName || (f.userId || f.authorId || 'User').split('@')[0];
        const isMyFile = 
            String(f.userId || f.authorId || "").toLowerCase() === currentUser.toLowerCase() || 
            String(f.authorName || "").toLowerCase() === currentUser.toLowerCase();

        return {
          id: f.id,
          name: f.fileName || f.name || 'Unnamed file',
          type: (f.fileType || f.fileName || '').toLowerCase(),
          rawDate: new Date(f.createdAt || f.updatedAt || Date.now()).getTime(),
          modified: formatTime(f.createdAt || f.updatedAt || ''),
          author: displayName,
          initials: getInitials(displayName), // Sử dụng hàm getInitials mới ở đây
          url: f.fileUrl || f.url || '',
          rawSize: f.size || 0,
          size: formatBytes(f.size || 0),
          isMe: isMyFile
        };
      });
      setFiles(mappedFiles);
    } catch {
      console.error("Error loading files");
    } finally {
      setIsLoading(false);
    }
  }, [classId, userEmail, isLoaded]);

  useEffect(() => { 
    fetchFiles(); 
  }, [fetchFiles]);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesType = true;
      if (filterType !== 'ALL') {
        const t = String(file.type);
        const isDoc = t.match(/(pdf|doc|word|xls|excel|ppt|presentation)/);
        const isMedia = t.match(/(image|video|audio|png|jpg|jpeg|mp4|mp3)/);
        if (filterType === 'DOC') matchesType = !!isDoc;
        if (filterType === 'MEDIA') matchesType = !!isMedia;
        if (filterType === 'OTHERS') matchesType = !isDoc && !isMedia;
      }
      return matchesSearch && matchesType;
    });
  }, [files, searchQuery, filterType]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !classId) return;
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setIsUploading(true);
      setIsUploadMenuOpen(false);
      await apiClient.post(`/attachments/class/${classId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchFiles();
    } catch {
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (hiddenFileInputRef.current) hiddenFileInputRef.current.value = '';
    }
  };

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !classId) return;
    setIsUploading(true);
    setIsUploadMenuOpen(false);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const formData = new FormData();
        formData.append('file', selectedFiles[i]);
        await apiClient.post(`/attachments/class/${classId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      alert(`Uploaded ${selectedFiles.length} files successfully!`);
      await fetchFiles();
    } catch {
      console.error("Folder upload error");
    } finally {
      setIsUploading(false);
      if (hiddenFolderInputRef.current) hiddenFolderInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Delete this file permanently?")) return;
    try {
      await apiClient.delete(`/attachments/${fileId}`);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch {
      alert("Delete failed.");
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleDeleteAll = async () => {
    const myFiles = files.filter(f => f.isMe);
    if (myFiles.length === 0) return alert("No personal files to delete.");
    if (!confirm(`Delete all ${myFiles.length} of your files?`)) return;
    setIsDeletingAll(true);
    try {
      await Promise.all(myFiles.map(f => apiClient.delete(`/attachments/${f.id}`)));
      await fetchFiles();
    } finally {
      setIsDeletingAll(false);
    }
  };

  const storageStats = useMemo(() => {
    let docs = 0, media = 0, others = 0;
    files.forEach(f => {
      const type = String(f.type).toLowerCase();
      if (type.match(/(pdf|doc|word|xls|excel|ppt|presentation)/)) docs += f.rawSize;
      else if (type.match(/(image|video|audio|png|jpg|jpeg|mp4|mp3)/)) media += f.rawSize;
      else others += f.rawSize;
    });
    const totalUsed = docs + media + others;
    return { docs, media, others, totalUsed, totalCapacity: 10 * 1024 * 1024 * 1024 };
  }, [files]);

  const recentActivities = useMemo(() => {
    return [...files].sort((a, b) => b.rawDate - a.rawDate).slice(0, 3);
  }, [files]);

  const handleSync = async () => {
    setIsSyncing(true);
    await fetchFiles();
    setTimeout(() => setIsSyncing(false), 500); 
  };

  return (
    <>
      <div className="flex-1 min-w-0 animate-in fade-in duration-300">
        <input type="file" ref={hiddenFileInputRef} className="hidden" onChange={handleFileUpload} />
        <input 
            type="file" 
            ref={hiddenFolderInputRef} 
            className="hidden" 
            onChange={handleFolderUpload} 
            // @ts-expect-error - webkitdirectory is not standard but works in most modern browsers
            webkitdirectory="true" 
            directory="true" 
            multiple 
        />

        <div className="flex flex-col md:flex-row items-center justify-between mb-6 border-b border-slate-200 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="relative" ref={uploadButtonRef}>
              <button onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)} disabled={isUploading || !classId}
                className="bg-[#1868f0] hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium text-sm flex items-center gap-2 px-4 py-2 rounded-md shadow-sm">
                {isUploading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/> : 
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
                Upload <svg className={`w-3 h-3 transition-transform ${isUploadMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {isUploadMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                  <button onClick={() => hiddenFileInputRef.current?.click()} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">Files</button>
                  <button onClick={() => hiddenFolderInputRef.current?.click()} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">Folder</button>
                </div>
              )}
            </div>
            <button onClick={handleSync} className="text-slate-600 hover:text-slate-900 text-sm flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50">
              <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Sync
            </button>
            <button onClick={handleDeleteAll} disabled={isDeletingAll || !classId} className="text-red-500 hover:text-red-700 disabled:text-red-300 text-sm flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete All
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input type="text" placeholder="Search files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-[#1868f0] w-64" />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-600 outline-none">
              <option value="ALL">All Types</option>
              <option value="DOC">Documents</option>
              <option value="MEDIA">Media</option>
              <option value="OTHERS">Others</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm pb-10 min-h-[400px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4 w-6/12">Name</th>
                <th className="px-6 py-4 w-2/12">Size</th>
                <th className="px-6 py-4 w-2/12"></th>
                <th className="px-6 py-4 w-2/12">Author</th>
                <th className="px-6 py-4 w-1/12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-medium">Đang tải danh sách file...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">No files found.</td>
                </tr>
              ) : (
                filteredFiles.map((file) => {
                  const { icon, bg, text } = getFileIcon(file.name);
                  return (
                    <tr key={file.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 flex items-center gap-3 cursor-pointer" onClick={() => downloadFile(file.url, file.name)}>
                        <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-[9px] ${bg} ${text}`}>{icon}</div>
                        <span className="font-medium text-slate-800 truncate max-w-[250px]">{file.name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{file.size}</td>
                      <td className="px-6 py-4 text-slate-500">{file.modified}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{file.initials}</div>
                        <span className="truncate max-w-[100px]">{file.author}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block" ref={activeMenuId === file.id ? menuRef : null}>
                          <button onClick={() => setActiveMenuId(activeMenuId === file.id ? null : file.id)} className="p-1.5 rounded-md hover:bg-slate-200 text-slate-400"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg></button>
                          {activeMenuId === file.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                              <button onClick={() => { downloadFile(file.url, file.name); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm">Download</button>
                              {file.isMe && <button onClick={() => handleDeleteFile(file.id)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm">Delete</button>}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-80 hidden xl:block space-y-10 ml-8">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Storage Usage</h3>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="mb-2"><span className="font-bold text-2xl">{formatBytes(storageStats.totalUsed, 1)}</span> <span className="text-sm text-slate-500">used of 10 GB</span></div>
            <div className="w-full h-2 bg-slate-100 rounded-full mb-6 overflow-hidden flex">
              <div className="h-full bg-blue-600" style={{ width: `${(storageStats.docs / (storageStats.totalUsed || 1)) * 100}%` }} title="Documents"></div>
              <div className="h-full bg-red-500" style={{ width: `${(storageStats.media / (storageStats.totalUsed || 1)) * 100}%` }} title="Media"></div>
              <div className="h-full bg-amber-400" style={{ width: `${(storageStats.others / (storageStats.totalUsed || 1)) * 100}%` }} title="Others"></div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600"></div>Documents</span>
                <span className="font-bold">{formatBytes(storageStats.docs, 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div>Media</span>
                <span className="font-bold">{formatBytes(storageStats.media, 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400"></div>Others</span>
                <span className="font-bold">{formatBytes(storageStats.others, 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Recent Uploads</h3>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No recent uploads...</p>
            ) : (
              recentActivities.map((file, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${file.isMe ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 truncate max-w-[180px]">{file.author} uploaded <span className="text-blue-600 underline cursor-pointer" onClick={() => downloadFile(file.url, file.name)}>{file.name}</span></p>
                    <p className="text-[10px] text-slate-400">{formatRelativeTime(file.rawDate)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
