'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

interface RankingUser {
  id: number;
  name: string;
  role: string;
  doorsKnocked: number;
  leadsGenerated: number;
  projectsClosed: number;
  score: number;
  badges: { id: number; name: string; icon: string }[];
}

interface MiniRankingProps {
  currentUserId?: number;
}

export function MiniRanking({ currentUserId }: MiniRankingProps) {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      const res = await fetch('/api/ranking/mini');
      const data = await res.json();
      setRanking(data);
    } catch (error) {
      console.error('Error fetching ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No hay datos de ranking disponibles
      </div>
    );
  }

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">{position + 1}</span>;
    }
  };

  const currentUser = ranking.find((u) => u.id === currentUserId);
  const currentUserPosition = currentUser ? ranking.indexOf(currentUser) : -1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Top Performers</h3>
      </div>

      <div className="space-y-3">
        {ranking.slice(0, 5).map((user, index) => (
          <div
            key={user.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              user.id === currentUserId
                ? 'bg-primary/10 border-2 border-primary'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <div className="flex-shrink-0">{getMedalIcon(index)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{user.name}</p>
                <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                  {user.role}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                <span>🚪 {user.doorsKnocked}</span>
                <span>📈 {user.leadsGenerated}</span>
                <span>✅ {user.projectsClosed}</span>
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold text-primary">{user.score}</div>
              <div className="text-xs text-gray-500">puntos</div>
            </div>

            {user.badges.length > 0 && (
              <div className="flex-shrink-0 flex gap-1">
                {user.badges.slice(0, 3).map((badge) => (
                  <span key={badge.id} title={badge.name} className="text-lg">
                    {badge.icon}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {currentUserPosition >= 5 && currentUser && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border-2 border-primary/30">
            <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">
              {currentUserPosition + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentUser.name} (Tú)</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                <span>🚪 {currentUser.doorsKnocked}</span>
                <span>📈 {currentUser.leadsGenerated}</span>
                <span>✅ {currentUser.projectsClosed}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{currentUser.score}</div>
              <div className="text-xs text-gray-500">puntos</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
