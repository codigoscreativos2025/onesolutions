"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
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
  const [data, setData] = useState<RankingItem[] | null>(null);
  const [activeTab, setActiveTab] = useState<"trainers" | "setters">("trainers");
  const [loading, setLoading] = useState(true);

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
    const type = activeTab === "trainers" ? "trainers" : "setters";
    fetchData(type);
  }, [activeTab, fetchData]);

  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const isTrainers = activeTab === "trainers";

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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none" style={{ fontSize: "40vw" }}>
          <div className="relative flex flex-col items-center">
            <div style={{ width: "0.8em", height: "0.8em", border: "0.06em solid currentColor", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6em", fontWeight: 900 }}>S</div>
            <div style={{ fontSize: "0.15em", fontWeight: 900, letterSpacing: "0.1em", marginTop: "0.1em" }}>ONE SOLUTIONS</div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#333]">
            <div className="w-8 h-8 rounded-full bg-[#f48221] flex items-center justify-center flex-shrink-0">
              <span className="text-[#1d1d1b] font-black text-sm">S</span>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("trainers")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  isTrainers
                    ? "bg-[#f48221] text-[#1d1d1b]"
                    : "text-[#aaaaaa] hover:text-white"
                )}
              >
                Trainis &amp; Closers
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
              if (rank === 1) rankBg = "bg-yellow-50/80 dark:bg-yellow-900/15 border-l-4 border-yellow-400";
              else if (rank === 2) rankBg = "bg-gray-50/80 dark:bg-gray-800/20 border-l-4 border-gray-300";
              else if (rank === 3) rankBg = "bg-orange-50/80 dark:bg-orange-900/15 border-l-4 border-orange-400";

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
                    <span className="text-[13px] font-normal text-[#aaaaaa] uppercase tracking-[1px] italic leading-tight">
                      {firstName}
                    </span>
                    <span className="text-[22px] font-black uppercase tracking-[0.5px] text-white leading-tight max-sm:text-[16px]">
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
