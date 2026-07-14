"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

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

const podiumMotion = {
  initial: { y: 40, opacity: 0, scale: 0.9 },
  animate: { y: 0, opacity: 1, scale: 1 },
};

const listMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function RankingPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<RankingData | null>(null);
  const [activeTab, setActiveTab] = useState<"setters" | "closers">("setters");

  useEffect(() => {
    fetch("/api/ranking")
      .then((res) => res.json())
      .then((data) => setData(data));
  }, []);

  const currentRanking =
    activeTab === "setters" ? data?.settersDoors : data?.closersProjects;

  const top3 = currentRanking?.slice(0, 3) ?? [];
  const rest = currentRanking?.slice(3) ?? [];

  const podiumOrder =
    top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  const myPosition =
    activeTab === "setters"
      ? data?.myPosition.doorsKnocked
      : data?.myPosition.projectsClosed;

  const myRankingItem = currentRanking?.find(
    (item) => item.id === parseInt(session?.user?.id ?? "0")
  );

  const userDisplayCount = myRankingItem?.count;
  const userDisplayPosition: number | undefined =
    myRankingItem?.position ?? (myPosition || undefined);

  const nextUpGap = (() => {
    if (!currentRanking || !myRankingItem || myRankingItem.position <= 1)
      return null;
    const prevItem = currentRanking.find(
      (item) => item.position === myRankingItem.position - 1
    );
    if (!prevItem) return null;
    return prevItem.count - myRankingItem.count + 1;
  })();

  const myRole = session?.user?.role;
  const showSettersTab = myRole === "SETTER" || myRole === "ADMIN";
  const showClosersTab = myRole === "CLOSER" || myRole === "ADMIN";

  const labelForCount = activeTab === "setters" ? "Sales" : "Proyectos";

  return (
    <div className="space-y-6 pt-4 pb-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <h1 className="font-headline text-2xl font-bold text-primary mb-1">
          Ranking Global
        </h1>
        <p className="text-on-surface-variant text-sm">
          Conocimiento es poder y los resultados son consecuencia.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-surface-container-high rounded-full">
        {showSettersTab && (
          <button
            onClick={() => setActiveTab("setters")}
            className={cn(
              "flex-1 py-3 px-4 rounded-full font-semibold text-sm transition-all duration-300",
              activeTab === "setters"
                ? "bg-primary text-on-primary shadow-lg"
                : "text-on-surface-variant"
            )}
          >
            Top 10 Setters
          </button>
        )}
        {showClosersTab && (
          <button
            onClick={() => setActiveTab("closers")}
            className={cn(
              "flex-1 py-3 px-4 rounded-full font-semibold text-sm transition-all duration-300",
              activeTab === "closers"
                ? "bg-primary text-on-primary shadow-lg"
                : "text-on-surface-variant"
            )}
          >
            Top 10 Closers
          </button>
        )}
      </div>

      {!data ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Podium Top 3 */}
          {podiumOrder.length > 0 && (
            <div className="grid grid-cols-3 gap-3 items-end pt-4">
              {podiumOrder.map((item, i) => {
                const originalRank = top3.indexOf(item) + 1;
                const isRank1 = originalRank === 1;
                const isRank2 = originalRank === 2;

                const avatarSize = isRank1 ? "w-24 h-24" : "w-16 h-16";
                const borderColor = isRank1
                  ? "border-primary shadow-[0_0_15px_rgba(0,110,0,0.3)]"
                  : isRank2
                  ? "border-circuit-grey shadow-[0_0_15px_rgba(153,71,0,0.2)]"
                  : "shadow-[0_0_15px_rgba(153,71,0,0.2)] border-secondary-container";
                const badgeColor = isRank1
                  ? "bg-primary text-on-primary"
                  : isRank2
                  ? "bg-circuit-grey text-on-surface"
                  : "bg-secondary-container text-on-secondary-container";
                const badgeSize = isRank1
                  ? "w-10 h-10 text-lg"
                  : "w-7 h-7 text-sm";

                return (
                  <motion.div
                    key={item.id}
                    className="flex flex-col items-center"
                    {...podiumMotion}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                      delay: i * 0.15,
                    }}
                  >
                    <div className={`relative ${isRank1 ? "mb-4" : "mb-3"}`}>
                      <div
                        className={cn(
                          avatarSize,
                          "rounded-full border-4 overflow-hidden",
                          borderColor,
                          isRank1 && "scale-110"
                        )}
                      >
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <Trophy
                            className={cn(
                              "text-primary",
                              isRank1 ? "w-10 h-10" : "w-6 h-6"
                            )}
                          />
                        </div>
                      </div>
                      <div
                        className={cn(
                          "absolute -top-2 -right-2 rounded-full flex items-center justify-center font-bold border-2 border-white",
                          badgeSize,
                          badgeColor
                        )}
                      >
                        {isRank1 ? (
                          <Crown className="w-5 h-5" />
                        ) : (
                          originalRank
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "font-semibold text-center",
                        isRank1
                          ? "text-primary font-headline text-sm"
                          : "text-xs"
                      )}
                    >
                      {item.name}
                    </span>
                    <span
                      className={cn(
                        "font-bold",
                        isRank1
                          ? "text-primary text-lg"
                          : "text-secondary text-sm"
                      )}
                    >
                      {item.count} {labelForCount}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Leaderboard List (4-10) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {rest.map((item, index) => {
                const isCurrentUser =
                  item.id === parseInt(session?.user?.id ?? "0");
                return (
                  <motion.div
                    key={item.id}
                    {...listMotion}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                    }}
                    className={cn(
                      "glass-panel rounded-xl p-4 flex items-center justify-between",
                      isCurrentUser && "border-primary/30 border-2 bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-6 font-bold text-on-surface-variant text-sm">
                        {item.position}
                      </span>
                      <div className="w-12 h-12 rounded-full border-2 border-circuit-grey overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-lg">
                          {item.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-sm">
                          {item.name}
                        </span>
                        {item.badges.length > 0 && (
                          <div className="flex gap-1 mt-0.5">
                            {item.badges.slice(0, 3).map((badge) => (
                              <span
                                key={badge.id}
                                title={badge.name}
                                className="text-xs"
                              >
                                {badge.icon}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-primary">
                        {item.count} {labelForCount}
                      </p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                        {activeTab === "setters"
                          ? "Puertas Tocadas"
                          : "Proyectos Cerrados"}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {/* Sticky Bottom Bar */}
      {data && userDisplayPosition !== undefined && userDisplayPosition > 0 && (
        <div className="fixed bottom-20 left-[20px] right-[20px] z-40 max-w-2xl mx-auto">
          <div className="glass-panel rounded-xl p-4 flex items-center justify-between border-primary/30 border-2 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm flex-shrink-0">
                {userDisplayPosition}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-primary text-sm">
                  Tu puesto actual
                </p>
                <p className="text-sm text-on-surface truncate">
                  {session?.user?.name ?? "Tú"}
                  {userDisplayCount !== undefined &&
                    userDisplayCount !== null &&
                    ` · ${userDisplayCount} ${labelForCount}`}
                </p>
              </div>
            </div>
            {nextUpGap && nextUpGap > 0 && (
              <div className="flex flex-col items-end flex-shrink-0 ml-3">
                <span className="text-xs text-on-surface-variant whitespace-nowrap">
                  A {nextUpGap} de subir
                </span>
                <div className="w-16 h-1 bg-circuit-grey rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (1 / (nextUpGap + 1)) * 200
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
