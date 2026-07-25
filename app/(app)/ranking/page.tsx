"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CheckCircle, UserPlus, DoorOpen } from "lucide-react";

interface RankingItem {
  id: number;
  name: string;
  role: string;
  phone: string | null;
  projectsClosed?: number;
  leads?: number;
  doors: number;
  leadsGenerated?: number;
}

function getMedal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

function splitName(fullName: string): [string, string] {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return [fullName, ""];
  return [parts[0], parts.slice(1).join(" ")];
}

export default function RankingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<RankingItem[] | null>(null);
  const [activeTab, setActiveTab] = useState<"trainers" | "setters">("trainers");
  const [loading, setLoading] = useState(true);
  const [defaultTabSet, setDefaultTabSet] = useState(false);

  const role = session?.user?.role;

  useEffect(() => {
    if (role === "PARTNER") {
      router.push("/leads");
      return;
    }
  }, [role, router]);

  useEffect(() => {
    if (!defaultTabSet && session?.user?.role) {
      if (session.user.role === "SETTER_JR") {
        setActiveTab("setters");
      } else if (session.user.role === "SETTER" || session.user.role === "CLOSER") {
        setActiveTab("trainers");
      }
      setDefaultTabSet(true);
    }
  }, [session, defaultTabSet]);

  const fetchData = useCallback(async (type: "trainers" | "setters") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ranking?type=${type}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === "PARTNER") return;
    const type = activeTab === "trainers" ? "trainers" : "setters";
    fetchData(type);
  }, [activeTab, fetchData, role]);

  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const isTrainers = activeTab === "trainers";
  const showTabSwitcher = role === "ADMIN";

  return (
    <div className="pt-4 pb-28 space-y-4">
      <button
        onClick={() => (window.location.href = "/ranking")}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity"
        title="Ranking"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="#f48221"
            strokeWidth="2.5"
          />
          <text
            x="16"
            y="22"
            fontFamily="Arial, sans-serif"
            fontWeight="900"
            fontSize="18"
            textAnchor="middle"
            fill="#1d1d1b"
            className="dark:fill-white"
          >
            S
          </text>
        </svg>
      </button>

      <div className="bg-[#1d1d1b] border-2 border-[#f48221] rounded-lg overflow-hidden shadow-[0_10px_30px_rgba(244,130,33,0.15)] relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-30" style={{ opacity: 0.12 }}>
          <div style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)", width: "50vw", height: "50vw", maxWidth: "500px", maxHeight: "500px", position: "absolute" }} />
          <svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" style={{ width: "35vw", maxWidth: "400px" }}>
            <polygon points="30,100 150,30 270,100 270,120 150,50 30,120" fill="#f48221"/>
            <polygon points="210,115 235,95 255,115 230,135" fill="#1d1d1b"/>
            <circle cx="150" cy="180" r="65" fill="none" stroke="#ddd" strokeWidth="18"/>
            <text x="150" y="228" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="130" textAnchor="middle" fill="#ddd">S</text>
            <g fill="#f48221">
              <text x="150" y="325" fontFamily="Arial Black,Impact,sans-serif" fontWeight="900" fontSize="95" textAnchor="middle" letterSpacing="1">ONE</text>
              <rect x="73" y="240" width="6" height="90" fill="#1d1d1b"/>
              <rect x="135" y="240" width="6" height="90" fill="#1d1d1b" transform="skewX(-25)"/>
              <rect x="228" y="240" width="8" height="90" fill="#1d1d1b"/>
            </g>
            <text x="150" y="375" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="36" textAnchor="middle" fill="#ddd" letterSpacing="2">SOLUTIONS</text>
          </svg>
        </div>

        <div className="relative z-20">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#333]">
            <div className="w-8 h-8 rounded-full bg-[#f48221] flex items-center justify-center flex-shrink-0">
              <span className="text-[#1d1d1b] font-black text-sm">S</span>
            </div>

            <div className="flex gap-1">
              {showTabSwitcher && (
                <>
                  <button
                    onClick={() => setActiveTab("trainers")}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                      isTrainers
                        ? "bg-[#f48221] text-[#1d1d1b]"
                        : "text-[#aaaaaa] hover:text-white"
                    )}
                  >
                    Trainees &amp; Closers
                  </button>
                  <button
                    onClick={() => setActiveTab("setters")}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                      !isTrainers
                        ? "bg-[#f48221] text-[#1d1d1b]"
                        : "text-[#aaaaaa] hover:text-white"
                    )}
                  >
                    Setters
                  </button>
                </>
              )}
              {!showTabSwitcher && (
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#f48221] text-[#1d1d1b]">
                  {activeTab === "trainers" ? "Trainees & Closers" : "Setters"}
                </span>
              )}
            </div>

            <div className="ml-auto text-[#f48221] font-bold text-sm">
              {data !== null ? data.length : "-"}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-[#f48221] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && data !== null && data.length === 0 && (
            <div className="flex items-center justify-center h-32 text-[#aaaaaa] text-sm">
              No hay datos disponibles
            </div>
          )}

          {!loading &&
            data !== null &&
            data.map((item, index) => {
              const rank = index + 1;
              const medal = getMedal(rank);
              const isTop3 = rank <= 3;
              const [firstName, lastName] = splitName(item.name);
              const isCurrentUser = userId !== null && item.id === userId;

              const col1 = isTrainers
                ? (item.projectsClosed ?? 0)
                : (item.leadsGenerated ?? 0);
              const col2 = isTrainers
                ? (item.leads ?? 0)
                : item.doors;
              const col3 = item.doors;

              let rankBg = "";
              if (rank === 1) rankBg = "border-l-4";
              else if (rank === 2) rankBg = "border-l-4";
              else if (rank === 3) rankBg = "border-l-4";
              const rankBorder = rank === 1 ? "#EFBF04" : rank === 2 ? "#C4C4C4" : rank === 3 ? "#CE8946" : undefined;
              const rankBgInline = rank === 1 ? "#EFBF04" : rank === 2 ? "#C4C4C4" : rank === 3 ? "#CE8946" : undefined;

              return (
                <Link
                  key={item.id}
                  href={`/profile/${item.id}`}
                  className={cn(
                    "flex items-stretch border-b border-[#333] last:border-b-0 transition-colors",
                    "hover:bg-[#2a2a28]",
                    isTop3 ? rankBg : "bg-transparent",
                    isCurrentUser && !isTop3 && "bg-[#2a2a28] border-l-2 border-l-[#f48221]"
                  )}
                  style={isTop3 ? { background: `linear-gradient(to right, ${rankBgInline || '#EFBF04'} 0%, transparent 85%)`, borderLeftColor: rankBorder } : undefined}
                >
                  <div className="w-[60px] flex items-center justify-center flex-shrink-0">
                    {isTop3 ? (
                      <span className="text-2xl">{medal}</span>
                    ) : (
                      <span className="text-[38px] font-black italic text-[#f48221]">
                        {rank}
                      </span>
                    )}
                  </div>

                  {!isTop3 && (
                    <div className="w-[70px] flex items-center justify-center flex-shrink-0">
                      <div className="w-[46px] h-[46px] bg-[#555] border-2 border-[#f48221] rounded-full flex items-center justify-center overflow-hidden">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-6 h-6 fill-[#ccc]"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col justify-center px-[15px] py-[10px] flex-1 min-w-0">
                    <span className="text-[13px] font-normal text-white uppercase tracking-[1px] italic leading-tight">
                      {firstName}
                    </span>
                    <span className="text-[22px] font-black text-white uppercase tracking-[0.5px] leading-tight max-sm:text-[16px]">
                      {lastName || firstName}
                    </span>
                  </div>

                  <div className="flex items-stretch flex-shrink-0 ml-auto">
                    <div className="w-[65px] max-sm:w-[50px] flex flex-col items-center justify-center border-l border-[#333] px-1 py-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mb-1" />
                      <span className="text-sm font-bold text-white">{col1}</span>
                    </div>
                    <div className="w-[65px] max-sm:w-[50px] flex flex-col items-center justify-center border-l border-[#333] px-1 py-2">
                      <UserPlus className="w-4 h-4 text-blue-400 mb-1" />
                      <span className="text-sm font-bold text-white">{col2}</span>
                    </div>
                    <div className="w-[65px] max-sm:w-[50px] flex flex-col items-center justify-center border-l border-[#333] px-1 py-2">
                      <DoorOpen className="w-4 h-4 text-orange-400 mb-1" />
                      <span className="text-sm font-bold text-white">{col3}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </div>
  );
}
