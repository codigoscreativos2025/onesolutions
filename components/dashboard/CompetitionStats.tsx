'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Award, Target, DoorOpen, CheckCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface UserStats {
  id: number;
  name: string;
  doorsKnocked: number;
  leadsGenerated: number;
  projectsClosed: number;
}

interface ComparisonData {
  myStats: {
    doorsKnocked: number;
    leadsGenerated: number;
    projectsClosed: number;
  };
  rankings: {
    doorsKnocked: UserStats[];
    leadsGenerated: UserStats[];
    projectsClosed: UserStats[];
  };
}

export function CompetitionStats() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComparisonData();
  }, []);

  const fetchComparisonData = async () => {
    try {
      const res = await fetch('/api/metrics/comparison');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const myUserId = parseInt(session?.user?.id || '0');

  const getMyPosition = (ranking: UserStats[]) => {
    const index = ranking.findIndex(u => u.id === myUserId);
    return index === -1 ? ranking.length + 1 : index + 1;
  };

  const getMaxValue = (ranking: UserStats[], metric: keyof Omit<UserStats, 'id' | 'name'>) => {
    return Math.max(...ranking.map(u => u[metric] as number), 1);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Award className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Tu Posición en el Ranking</h2>
      </div>

      <div className="space-y-6">
        {/* Puertas Tocadas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">Puertas Tocadas</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              #{getMyPosition(data.rankings.doorsKnocked)} de {data.rankings.doorsKnocked.length}
            </span>
          </div>
          <div className="space-y-2">
            {data.rankings.doorsKnocked.slice(0, 5).map((user, index) => {
              const isMe = user.id === myUserId;
              const percentage = (user.doorsKnocked / getMaxValue(data.rankings.doorsKnocked, 'doorsKnocked')) * 100;
              return (
                <div key={user.id} className={`flex items-center gap-3 p-2 rounded-lg ${isMe ? 'bg-primary/10 border border-primary/30' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium truncate ${isMe ? 'text-primary' : ''}`}>
                        {user.name} {isMe && '(Tú)'}
                      </span>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-sm font-bold">{user.doorsKnocked}</span>
                        {!isMe && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/profile/${user.id}`)}
                            className="px-2 py-1"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-600' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leads Generados */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              <span className="font-semibold">Leads Generados</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              #{getMyPosition(data.rankings.leadsGenerated)} de {data.rankings.leadsGenerated.length}
            </span>
          </div>
          <div className="space-y-2">
            {data.rankings.leadsGenerated.slice(0, 5).map((user, index) => {
              const isMe = user.id === myUserId;
              const percentage = (user.leadsGenerated / getMaxValue(data.rankings.leadsGenerated, 'leadsGenerated')) * 100;
              return (
                <div key={user.id} className={`flex items-center gap-3 p-2 rounded-lg ${isMe ? 'bg-primary/10 border border-primary/30' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium truncate ${isMe ? 'text-primary' : ''}`}>
                        {user.name} {isMe && '(Tú)'}
                      </span>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-sm font-bold">{user.leadsGenerated}</span>
                        {!isMe && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/profile/${user.id}`)}
                            className="px-2 py-1"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-600' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Proyectos Cerrados */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              <span className="font-semibold">Proyectos Cerrados</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              #{getMyPosition(data.rankings.projectsClosed)} de {data.rankings.projectsClosed.length}
            </span>
          </div>
          <div className="space-y-2">
            {data.rankings.projectsClosed.slice(0, 5).map((user, index) => {
              const isMe = user.id === myUserId;
              const percentage = (user.projectsClosed / getMaxValue(data.rankings.projectsClosed, 'projectsClosed')) * 100;
              return (
                <div key={user.id} className={`flex items-center gap-3 p-2 rounded-lg ${isMe ? 'bg-primary/10 border border-primary/30' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium truncate ${isMe ? 'text-primary' : ''}`}>
                        {user.name} {isMe && '(Tú)'}
                      </span>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-sm font-bold">{user.projectsClosed}</span>
                        {!isMe && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/profile/${user.id}`)}
                            className="px-2 py-1"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-600' :
                          'bg-purple-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
