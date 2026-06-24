"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Trophy, Medal, Target, Crown } from "lucide-react";

interface RankingItem {
  position: number;
  id: number;
  name: string;
  role: string;
  count: number;
}

interface RankingData {
  doorsKnocked: RankingItem[];
  projectsClosed: RankingItem[];
  myPosition: {
    doorsKnocked: number;
    projectsClosed: number;
  };
}

export default function RankingPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<RankingData | null>(null);
  const [activeTab, setActiveTab] = useState<"doors" | "projects">("doors");

  useEffect(() => {
    fetch("/api/ranking")
      .then((res) => res.json())
      .then((data) => setData(data));
  }, []);

  const currentRanking =
    activeTab === "doors" ? data?.doorsKnocked : data?.projectsClosed;
  const myPosition =
    activeTab === "doors"
      ? data?.myPosition.doorsKnocked
      : data?.myPosition.projectsClosed;
  const isInTop10 = currentRanking?.some(
    (item) => item.id === parseInt(session?.user?.id || "0")
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          Ranking
        </h1>
        <p className="text-on-surface-variant">
          Top 10 setters y closers de la plataforma
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab("doors")}
          className={`p-4 rounded-2xl glass-panel border-2 transition-all ${
            activeTab === "doors"
              ? "border-primary bg-primary/5"
              : "border-transparent"
          }`}
        >
          <Target className="w-6 h-6 text-primary mb-2" />
          <span className="font-semibold text-on-surface text-sm">
            Puertas Tocadas
          </span>
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`p-4 rounded-2xl glass-panel border-2 transition-all ${
            activeTab === "projects"
              ? "border-primary bg-primary/5"
              : "border-transparent"
          }`}
        >
          <Trophy className="w-6 h-6 text-primary mb-2" />
          <span className="font-semibold text-on-surface text-sm">
            Proyectos Cerrados
          </span>
        </button>
      </div>

      {!data ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="glass-panel rounded-2xl overflow-hidden">
            {currentRanking?.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 border-b border-outline-variant/20 last:border-0 ${
                  item.id === parseInt(session?.user?.id || "0")
                    ? "bg-primary/5"
                    : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0
                      ? "bg-primary text-on-primary"
                      : index === 1
                      ? "bg-secondary text-on-secondary"
                      : index === 2
                      ? "bg-tertiary text-on-tertiary"
                      : "bg-surface-container-highest text-on-surface-variant"
                  }`}
                >
                  {index === 0 ? (
                    <Crown className="w-5 h-5" />
                  ) : index === 1 ? (
                    <Medal className="w-5 h-5" />
                  ) : index === 2 ? (
                    <Medal className="w-5 h-5" />
                  ) : (
                    item.position
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-on-surface">{item.name}</p>
                  <p className="text-xs text-on-surface-variant uppercase">
                    {item.role}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-primary">
                    {item.count}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {activeTab === "doors" ? "puertas" : "proyectos"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {!isInTop10 && myPosition && (
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
              <p className="text-on-surface">
                Tu posición actual:{" "}
                <span className="font-bold text-primary">#{myPosition}</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
