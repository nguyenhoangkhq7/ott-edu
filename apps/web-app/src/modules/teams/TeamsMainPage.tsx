"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import SectionTitle from "@/shared/components/ui/SectionTitle";
import TeamCard from "@/shared/components/ui/TeamCard";
import SearchInput from "@/shared/components/ui/SearchInput";
import AddTeamMemberModal from "./AddTeamMemberModal";
import type { TeamSection } from "@/shared/types/teams";
import { teamApi, Team } from "@/services/api/teamApi";

export default function TeamsMainPage() {
  const [searchValue, setSearchValue] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State cho modal thêm thành viên
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState("");
  
  // 1. State để quản lý việc đóng/mở các Section
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    classes: true,
    teams: true,
  });

  // 2. State để quản lý dropdown "Join or create team"
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  // Fetch danh sách lớp học từ backend
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await teamApi.getAll();
        console.log("Team API Payload:", response); // Log để kiểm tra thực tế dữ liệu
        setTeams(response || []);
        setError(null);
      } catch (err) {
        console.error("Fetch teams error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch teams");
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Chuyển đổi Team từ backend thành TeamSection format
  const teamSections: TeamSection[] = useMemo(
    () => {
      if (teams.length === 0) {
        return [
          {
            id: "classes",
            title: "Classes",
            items: [],
          },
        ];
      }

      return [
        {
          id: "classes",
          title: "Classes",
          items: teams.map((team, index) => ({
            id: team.id.toString(),
            name: team.name,
            subtitle: team.description || "Lớp học",
            initials: team.name.substring(0, 2).toUpperCase(),
            accentColor: ["#8269db", "#ff6b6b", "#2ecc71", "#3498db"][index % 4],
            meta: `${team.joinCode} · Active class`,
          })),
        },
      ];
    },
    [teams]
  );

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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4">
              <div className="inline-block">
                <div className="animate-spin">
                  <svg
                    className="h-12 w-12 text-slate-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Loading teams...
            </h3>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-red-100 p-6">
              <svg
                viewBox="0 0 24 24"
                className="h-12 w-12 text-red-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Failed to load teams
            </h3>
            <p className="text-slate-500 max-w-md mb-4">
              {error}
            </p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                const fetchTeams = async () => {
                  try {
                    setLoading(true);
                    const response = await teamApi.getAll();
                    setTeams(response || []);
                    setError(null);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to fetch teams");
                    setTeams([]);
                  } finally {
                    setLoading(false);
                  }
                };
                fetchTeams();
              }}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Try again
            </button>
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
                  {section.items.map((item) => {
                    // Find the team object to get ID
                    const teamObj = teams.find(t => t.id.toString() === item.id);
                    const teamId = teamObj?.id || 0;
                    
                    return (
                      <div key={item.id} className="relative group">
                        <Link href={`/teams/${item.id}`} className="block hover:opacity-95 transition-opacity">
                          <TeamCard item={item} />
                        </Link>
                        
                        {/* Add Member Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedTeamId(teamId);
                            setSelectedTeamName(item.name);
                            setShowAddMemberModal(true);
                          }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-lg"
                          title="Add member"
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
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

      {/* Add Team Member Modal */}
      {selectedTeamId && (
        <AddTeamMemberModal
          teamId={selectedTeamId}
          teamName={selectedTeamName}
          isOpen={showAddMemberModal}
          onClose={() => {
            setShowAddMemberModal(false);
            setSelectedTeamId(null);
            setSelectedTeamName("");
          }}
          onSuccess={() => {
            // Refresh teams list
            const fetchTeams = async () => {
              try {
                const response = await teamApi.getAll();
                setTeams(response || []);
              } catch (err) {
                console.error("Failed to refresh teams:", err);
              }
            };
            fetchTeams();
          }}
        />
      )}
    </div>
  );
}