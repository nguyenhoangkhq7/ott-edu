import React from 'react';
import Link from 'next/link';

// Danh sách cấu hình các loại Team
const TEAM_TYPES = [
  { id: 'class', title: 'Class', description: 'Discussions, group projects, and assignments.', badge: 'Recommended for teachers', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg> },
  { id: 'plc', title: 'Professional Learning Community', description: 'Educator working group and collaboration.', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  { id: 'staff', title: 'Staff', description: 'School administration, management, and development.', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg> },
  { id: 'other', title: 'Other', description: 'Clubs, study groups, or after-school activities.', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg> },
];

interface SelectTeamTypeProps {
  selectedType: string;
  setSelectedType: (type: string) => void;
  onNextStep: () => void;
}

export default function SelectTeamType({ selectedType, setSelectedType, onNextStep }: SelectTeamTypeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full max-w-4xl pt-10 pb-20 animate-in fade-in duration-300">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Select a team type</h1>
        <p className="text-gray-500 text-lg">Choose the type of workspace that best fits your needs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-10">
        {TEAM_TYPES.map((team) => {
          const isSelected = selectedType === team.id;
          return (
            <div
              key={team.id}
              onClick={() => setSelectedType(team.id)}
              className={`relative flex flex-col items-center text-center p-8 bg-white rounded-xl cursor-pointer transition-all duration-200 border-2 
                ${isSelected ? 'border-blue-600 shadow-md' : 'border-transparent hover:border-gray-300 shadow-sm'}
              `}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white rounded-full p-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
              <div className={`flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                {team.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{team.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{team.description}</p>
              {team.badge && (
                <span className="mt-auto text-xs font-bold text-blue-600 uppercase tracking-wide">{team.badge}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mb-10">
        <Link href="/teams">
          <button className="px-8 py-2.5 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </Link>
        <button 
          className="px-8 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
          onClick={onNextStep}
        >
          Next Step
        </button>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">?</div>
        Need help choosing? <a href="#" className="text-blue-600 hover:underline">View comparison guide</a>
      </div>
    </div>
  );
}