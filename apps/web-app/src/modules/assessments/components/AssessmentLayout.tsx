import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Sub-nav for the assessment module
const SUB_NAV_ITEMS = [
  { id: 'upcoming', label: 'Upcoming Quizzes', icon: 'clipboard', href: '#' },
  { id: 'active', label: 'Active Exams', icon: 'clock', href: '/assessments' },
  { id: 'completed', label: 'Completed', icon: 'check-square', href: '/assessments/completed' },
  { id: 'resources', label: 'Resources', icon: 'book', href: '#' },
  { id: 'support', label: 'Support', icon: 'help-circle', href: '#' },
];

export default function AssessmentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Hide the standard LMS sidebar if we are actually taking the exam or viewing result
  const isTakingExam = pathname.includes('/take');
  const isViewingResults = pathname.includes('/results');

  // We can switch out sidebar content or have no sidebar based on route
  const renderSidebar = () => {
    if (isTakingExam) {
      return (
        <div className="w-64 bg-[#f3f4f6] shrink-0 border-r border-[#e5e7eb] flex flex-col items-center py-6">
          <div className="flex items-center gap-3 w-full px-6 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0"></div>
            <div>
              <h3 className="font-semibold text-sm">Advanced Pedagogy</h3>
              <p className="text-xs text-slate-500">Section A • Dr. Aris</p>
            </div>
          </div>
          <div className="w-full px-4 mb-6">
             <Link href="/assessments">
                <button className="w-full py-2 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  Return to Class
                </button>
             </Link>
          </div>
          <nav className="w-full flex-1 flex flex-col gap-1 px-4">
               {SUB_NAV_ITEMS.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.id === 'active' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
                >
                  <span className="w-5 h-5 flex items-center justify-center bg-slate-200 rounded text-xs">{item.label[0]}</span>
                  {item.label}
                </Link>
              ))}
          </nav>
        </div>
      );
    }
    if (isViewingResults) {
       return (
        <div className="w-64 bg-[#f3f4f6] shrink-0 border-r border-[#e5e7eb] flex flex-col items-center py-6">
           <div className="flex items-center gap-2 mb-8 w-full px-6">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">L</span>
              <span className="font-bold text-slate-800">LMS Workspace</span>
           </div>
           
           <nav className="w-full flex flex-col gap-2 px-4">
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-200/50">
                 Dashboard
              </Link>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-200/50">
                 Courses
              </Link>
              <Link href="/assessments" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-white text-indigo-700 shadow-sm">
                 Assignments
              </Link>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-200/50">
                 Analytics
              </Link>
           </nav>
           
           <div className="mt-auto px-6 w-full flex flex-col gap-1">
             <div className="flex items-center gap-3 mt-4">
               <div className="w-8 h-8 bg-slate-300 rounded-full"></div>
               <div>
                  <div className="text-sm font-semibold">Alex Richards</div>
                  <div className="text-xs text-slate-500">Student</div>
               </div>
             </div>
           </div>
        </div>
      );
    }
    
    // Default Active Assessment Sidebar
    return (
      <div className="w-64 bg-[#f3f4f6] shrink-0 border-r border-[#e5e7eb] flex flex-col items-center py-6">
         <div className="flex items-center gap-3 w-full px-6 mb-8">
            <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0"></div>
            <div>
              <h3 className="font-semibold text-sm">Advanced Pedagogy</h3>
              <p className="text-xs text-slate-500">Section A • Dr. Aris</p>
            </div>
         </div>
         <nav className="w-full flex-1 flex flex-col gap-1 px-4">
             {SUB_NAV_ITEMS.map(item => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.id === 'active' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
              >
                <span className="w-5 h-5 flex items-center justify-center bg-slate-200 rounded text-xs">{item.label[0]}</span>
                {item.label}
              </Link>
            ))}
         </nav>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden text-slate-900 font-sans">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-[#e5e7eb] shrink-0">
        <div className="flex items-center">
          <Link href="/assessments">
              <h1 className="text-xl font-bold text-indigo-800">Executive Workspace LMS</h1>
          </Link>
        </div>

        {/* Top Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="#" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
          <Link href="#" className="hover:text-indigo-600 transition-colors">My Courses</Link>
          <Link href="/assessments" className="text-indigo-700 border-b-2 border-indigo-600 pb-5 translate-y-[10px]">Assessments</Link>
          <Link href="#" className="hover:text-indigo-600 transition-colors">Results</Link>
        </nav>

        {/* Right Nav */}
        <div className="flex items-center gap-4">
          {!isTakingExam && (
             <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <circle cx="11" cy="11" r="8" />
                   <path d="M21 21l-4.35-4.35" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search assessments..." 
                  className="pl-9 pr-4 py-1.5 bg-slate-100 rounded-full text-sm outline-none w-64"
                />
             </div>
          )}
          <div className="flex items-center gap-3 text-slate-500">
            <button className="hover:text-slate-800">🔔</button>
            <button className="hover:text-slate-800">❓</button>
            <button className="hover:text-slate-800">⚙️</button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 cursor-pointer pl-1 pt-1">
               <span className="text-sm">👤</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {renderSidebar()}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
