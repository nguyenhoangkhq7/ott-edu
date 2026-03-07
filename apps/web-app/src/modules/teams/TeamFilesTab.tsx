import React, { useState, useRef, useEffect } from 'react';

export default function TeamFilesTab() {
  // SỬA Ở ĐÂY: Đổi tên state thành activeMenuId cho đồng bộ
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);

  // Refs để xử lý click ra ngoài (click outside) thì đóng menu
  const menuRef = useRef<HTMLDivElement>(null);
  const newButtonRef = useRef<HTMLDivElement>(null);
  const uploadButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
      if (newButtonRef.current && !newButtonRef.current.contains(event.target as Node)) {
        setIsNewMenuOpen(false);
      }
      if (uploadButtonRef.current && !uploadButtonRef.current.contains(event.target as Node)) {
        setIsUploadMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dữ liệu mẫu (Giả lập)
  const files = [
    { id: '1', name: 'Lecture Slides', type: 'folder', modified: '2 hours ago', author: 'Dr. Aris Thorne', initials: 'AT' },
    { id: '2', name: 'Assignment Briefs', type: 'folder', modified: 'Yesterday at 3:15 PM', author: 'Dr. Aris Thorne', initials: 'AT' },
    { id: '3', name: 'Course_Syllabus_Fall2024.pdf', type: 'pdf', modified: 'Aug 24, 2024', author: 'Dr. Aris Thorne', initials: 'AT' },
    { id: '4', name: 'Practice_Problems_Set1.docx', type: 'doc', modified: 'Aug 26, 2024', author: 'Dr. Aris Thorne', initials: 'AT' },
    { id: '5', name: 'Student_Grades_Draft.xlsx', type: 'xls', modified: 'Just now', author: 'Dr. Aris Thorne', initials: 'AT' },
  ];

  // Hàm render Icon dựa vào loại file
  const renderIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>;
      case 'pdf':
        return <div className="w-6 h-6 rounded bg-red-100 text-red-500 flex items-center justify-center font-bold text-[8px]">PDF</div>;
      case 'doc':
        return <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[8px]">DOC</div>;
      case 'xls':
        return <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[8px]">XLS</div>;
      default:
        return <svg className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>;
    }
  };

  return (
    <>
      <div className="flex-1 min-w-0 animate-in fade-in duration-300">
        
        {/* THANH CÔNG CỤ (ACTION BAR) */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4 relative">
          <div className="flex items-center gap-4">
            
            {/* Nút NEW + Dropdown */}
            <div className="relative" ref={newButtonRef}>
              <button 
                onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                className="bg-[#1868f0] hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New
                <svg className={`w-3.5 h-3.5 transition-transform ${isNewMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {isNewMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                    Folder
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[6px]">DOC</div>
                    Word document
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[6px]">XLS</div>
                    Excel workbook
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-[6px]">PPT</div>
                    PowerPoint
                  </button>
                </div>
              )}
            </div>

            {/* Nút UPLOAD + Dropdown */}
            <div className="relative" ref={uploadButtonRef}>
              <button 
                onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)}
                className="text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2 transition-colors px-2 py-1 rounded-md hover:bg-slate-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload
                <svg className={`w-3.5 h-3.5 transition-transform ${isUploadMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {isUploadMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Files
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                    Folder
                  </button>
                </div>
              )}
            </div>

            <button className="text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2 transition-colors px-2 py-1 rounded-md hover:bg-slate-50 hidden sm:flex">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Sync
            </button>
            <button className="text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2 transition-colors px-2 py-1 rounded-md hover:bg-slate-50 hidden sm:flex">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button>
            <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
          </div>
        </div>

        {/* BẢNG DANH SÁCH FILE */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm pb-10 min-h-[400px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 w-7/12">Name</th>
                <th className="px-6 py-4 w-2/12">Modified</th>
                <th className="px-6 py-4 w-2/12">Modified By</th>
                <th className="px-6 py-4 w-1/12 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {/* Duyệt qua mảng files để hiển thị */}
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50/80 transition-colors group relative">
                  
                  <td className="px-6 py-4 flex items-center gap-3 cursor-pointer">
                    {renderIcon(file.type)}
                    <span className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{file.name}</span>
                  </td>
                  
                  <td className="px-6 py-4 text-slate-500">{file.modified}</td>
                  
                  <td className="px-6 py-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{file.initials}</div>
                    <span className="text-slate-600 truncate">{file.author}</span>
                  </td>

                  {/* Cột chứa nút 3 chấm */}
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block" ref={activeMenuId === file.id ? menuRef : null}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          setActiveMenuId(activeMenuId === file.id ? null : file.id);
                        }}
                        className={`p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all ${activeMenuId === file.id ? 'opacity-100 bg-slate-200 text-slate-800' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
                      </button>

                      {/* Dropdown Menu của từng dòng */}
                      {activeMenuId === file.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-in zoom-in-95 duration-100 origin-top-right">
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            Open
                          </button>
                          
                          {/* Ẩn nút download nếu là thư mục */}
                          {file.type !== 'folder' && (
                            <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              Download
                            </button>
                          )}
                          
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            Copy link
                          </button>
                          
                          <div className="h-px bg-slate-100 my-1"></div>
                          
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Rename
                          </button>
                          
                          <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 group/delete">
                            <svg className="w-4 h-4 text-red-400 group-hover/delete:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>

                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </div>

      {/* WIDGETS BÊN PHẢI */}
      <div className="w-80 hidden xl:block space-y-10 animate-in fade-in duration-300 ml-8">
        
        {/* Storage Information */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Storage Information</h3>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-slate-900 text-2xl leading-none">1.2 GB <span className="text-sm font-medium text-slate-500">used</span></span>
              <span className="text-xs font-medium text-slate-400 mb-0.5">of 10 GB</span>
            </div>
            
            <div className="w-full h-2 bg-slate-100 rounded-full mb-6 overflow-hidden flex">
              <div className="h-full bg-blue-600" style={{ width: '45%' }}></div>
              <div className="h-full bg-red-500" style={{ width: '15%' }}></div>
              <div className="h-full bg-amber-400" style={{ width: '10%' }}></div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                  <span className="text-slate-600 font-medium">Documents</span>
                </div>
                <span className="text-slate-900 font-bold">650 MB</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <span className="text-slate-600 font-medium">Media</span>
                </div>
                <span className="text-slate-900 font-bold">420 MB</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <span className="text-slate-600 font-medium">Others</span>
                </div>
                <span className="text-slate-900 font-bold">130 MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Recent Activity</h3>
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 leading-snug mb-1">
                  You uploaded <span className="text-blue-600 cursor-pointer hover:underline">Lecture_Slides_Week4.pptx</span>
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2 Hours ago</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 leading-snug mb-1">
                  You modified <span className="text-blue-600 cursor-pointer hover:underline">Student_Grades_Draft.xlsx</span>
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Just now</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 leading-snug mb-1">
                  New folder <span className="text-blue-600 cursor-pointer hover:underline">Final Projects</span> created
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yesterday</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}