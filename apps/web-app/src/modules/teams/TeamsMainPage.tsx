"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import SectionTitle from "@/shared/components/ui/SectionTitle";
import TeamCard from "@/shared/components/ui/TeamCard";
import SearchInput from "@/shared/components/ui/SearchInput";
import type { TeamSection, TeamItem } from "@/shared/types/teams";
import { httpService } from "@/services/api/http.service";

export default function TeamsMainPage() {
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // 1. State để quản lý việc đóng/mở các Section
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    classes: true,
    teams: true,
  });

  // 2. State để quản lý dropdown "Join or create team"
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const [teamSections, setTeamSections] = useState<TeamSection[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const data = await httpService.get<Array<{
          id: number;
          name: string;
          description?: string;
          schoolName?: string;
          memberCount?: number;
          isPrivate?: boolean;
          isActive?: boolean;
          active?: boolean;
        }>>('/teams/my');
        
        const mappedItems: TeamItem[] = data.map((t) => ({
          id: String(t.id),
          name: t.name,
          subtitle: t.description || t.schoolName || 'Lớp học',
          initials: t.name.substring(0, 2).toUpperCase(),
          accentColor: '#1868f0', // Có thể random màu nếu muốn
          meta: (t.isActive === false || t.active === false) 
            ? 'Cancelled Class • Inactive' 
            : `${t.memberCount} members · ${t.isPrivate === false ? 'Public class' : 'Private class'}`,
          isActive: t.isActive ?? t.active,
        }));

        setTeamSections([
          {
            id: "classes",
            title: "My Classes",
            items: mappedItems,
          }
        ]);
      } catch (error) {
        console.error("Failed to fetch teams:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const filteredTeamSections = useMemo(() => {
    if (!searchValue.trim()) {
      return teamSections;
    }

    const query = searchValue.toLowerCase();

    return teamSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const nameMatch = item.name.toLowerCase().includes(query);
          const subtitleMatch = item.subtitle?.toLowerCase().includes(query);
          const metaMatch = item.meta?.toLowerCase().includes(query);
          return nameMatch || subtitleMatch || metaMatch;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchValue, teamSections]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Teams</h1>
        
        <div className="relative">
          <button
            onClick={() => setShowTeamDropdown(!showTeamDropdown)}
            className="flex items-center gap-2 border border-slate-300 bg-white text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors"
          >
            {/* Team icon */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Join or create team
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 transition-transform ${
                showTeamDropdown ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          
          {showTeamDropdown && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-md shadow-lg border border-slate-200 z-10">
              <div className="py-1">
                <Link
                  href="/teams/create"
                  onClick={() => setShowTeamDropdown(false)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Create team
                </Link>
                <Link
                  href="/teams/join"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 border-t border-slate-100"
                  onClick={() => setShowTeamDropdown(false)}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <circle cx="18" cy="8" r="3" />
                    <path d="M18 5v6M15 8h6" />
                  </svg>
                  Join team
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md">
        <SearchInput
          label="Search teams"
          placeholder="Search teams..."
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
      </div>

      <div className="grid gap-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
            <p className="text-slate-500">Loading your teams...</p>
          </div>
        ) : filteredTeamSections.length > 0 ? (
          filteredTeamSections.map((section) => (
            <div key={section.id}>
              <SectionTitle
                title={section.title}
                isExpanded={expandedSections[section.id]}
                onToggle={() => toggleSection(section.id)}
                showToggle={section.items.length > 0}
              />
              
              {expandedSections[section.id] && (
                <div 
                  className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {section.items.map((item) => (
                    <Link href={`/teams/${item.id}`} key={item.id} className="block hover:opacity-95 transition-opacity">
                      <TeamCard item={item} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-6">
              <svg
                viewBox="0 0 24 24"
                className="h-12 w-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 005.5 8.5c0 2.29 1.51 4.04 3 5.5l6 6 6-6z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No teams found
            </h3>
            <p className="text-slate-500 max-w-md">
               We couldn&apos;t find any teams matching your search. Try adjusting your search terms or create a new team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}