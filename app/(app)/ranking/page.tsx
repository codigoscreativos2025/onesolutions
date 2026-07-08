"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Trophy, Medal, Target, Crown, Award, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Badge {
  id: number;
  name: string;
  icon?: string;
  color: string;
  role: string;
}

interface RankingItem {
  position: number;
  id: number;
  name: string;
  role: string;
  count: number;
  badges: Badge[];
}

interface RankingData {
  settersDoors: RankingItem[];
  settersProspects: RankingItem[];
  closersProjects: RankingItem[];
  myPosition: {
    doorsKnocked: number;
    prospectsGenerated: number;
    projectsClosed: number;
  };
  myBadges: Badge[];
}

export default function RankingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<RankingData | null>(null);
  const [activeTab, setActiveTab] = useState<"doors" | "prospects" | "projects">("doors");

  useEffect(() => {
    fetch("/api/ranking")
      .then((res) => res.json())
      .then((data) => setData(data));
  }, []);

  const currentRanking =
    activeTab === "doors"
      ? data?.settersDoors
      : activeTab === "prospects"
      ? data?.settersProspects
      : data?.closersProjects;

  const myPosition =
    activeTab === "doors"
      ? data?.myPosition.doorsKnocked
      : activeTab === "prospects"
      ? data?.myPosition.prospectsGenerated
      : data?.myPosition.projectsClosed;

  const isInTop10 = currentRanking?.some(
    (item) => item.id === parseInt(session?.user?.id || "0")
  );

  const myRole = session?.user?.role;
  const showDoorsTab = myRole === "SETTER" || myRole === "ADMIN";
  const showProspectsTab = myRole === "SETTER" || myRole === "ADMIN";
  const showProjectsTab = myRole === "CLOSER" || myRole === "ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          Ranking y Medallas
        </h1>
        <p className="text-on-surface-variant">
          Top performers de la plataforma
        </p>
      </div>

      {/* Mis Medallas */}
      {data?.myBadges && data.myBadges.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-on-surface">Mis Medallas</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {data.myBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{ 
                  backgroundColor: `${badge.color}15`,
                  borderColor: `${badge.color}40`
                }}
              >
                <span className="text-xl">{badge.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-on-surface">{badge.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-3">
        {showDoorsTab && (
          <button
            onClick={() => setActiveTab("doors")}
            className={`p-4 rounded-2xl glass-panel border-2 transition-all ${
              activeTab === "doors"
                ? "border-primary bg-primary/5"
                : "border-transparent"
            }`}
          >
            <Target className="w-6 h-6 text-primary mb-2 mx-auto" />
            <span className="font-semibold text-on-surface text-xs block">
              Puertas
            </span>
          </button>
        )}
        {showProspectsTab && (
          <button
            onClick={() => setActiveTab("prospects")}
            className={`p-4 rounded-2xl glass-panel border-2 transition-all ${
              activeTab === "prospects"
                ? "border-primary bg-primary/5"
                : "border-transparent"
            }`}
          >
            <Trophy className="w-6 h-6 text-secondary mb-2 mx-auto" />
            <span className="font-semibold text-on-surface text-xs block">
              Prospectos
            </span>
          </button>
        )}
        {showProjectsTab && (
          <button
            onClick={() => setActiveTab("projects")}
            className={`p-4 rounded-2xl glass-panel border-2 transition-all ${
              activeTab === "projects"
                ? "border-primary bg-primary/5"
                : "border-transparent"
            }`}
          >
            <Medal className="w-6 h-6 text-tertiary mb-2 mx-auto" />
            <span className="font-semibold text-on-surface text-xs block">
              Proyectos
            </span>
          </button>
        )}
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
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-on-surface">{item.name}</p>
                    {item.badges.length > 0 && (
                      <div className="flex gap-1">
                        {item.badges.slice(0, 3).map((badge) => (
                          <span key={badge.id} title={badge.name}>
                            {badge.icon}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant uppercase">
                    {item.role === "SETTER" ? "Setter" : "Closer"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-primary">
                    {item.count}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {activeTab === "doors" ? "puertas" : activeTab === "prospects" ? "prospectos" : "proyectos"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/profile/${item.id}`)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver Perfil
                </Button>
              </div>
            ))}
          </div>

          {!isInTop10 && myPosition && myPosition > 0 && (
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
