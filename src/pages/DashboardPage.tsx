import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, Castle, ArrowRight } from 'lucide-react';
import { buildingsApi } from '@/api/buildings';
import type { Village, Castle as CastleType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();
  const [villages, setVillages] = useState<Village[]>([]);
  const [castles, setCastles] = useState<CastleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch castles and villages for all subjects
        const [castlesData, englishVillages, mathVillages, readingVillages, scienceVillages] = await Promise.all([
          buildingsApi.getCastles(),
          buildingsApi.getVillages('english'),
          buildingsApi.getVillages('math'),
          buildingsApi.getVillages('reading'),
          buildingsApi.getVillages('science'),
        ]);
        setCastles(castlesData);
        setVillages([...englishVillages, ...mathVillages, ...readingVillages, ...scienceVillages]);
      } catch (error) {
        console.error('Failed to fetch buildings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Admin';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500">{getGreeting()}</p>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {firstName}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/villages"
          className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-300"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <Map className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Villages</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '-' : villages.length}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/castles"
          className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-300"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <Castle className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Castles</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '-' : castles.length}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Recent Villages */}
      {!isLoading && villages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Villages</h2>
            <Link
              to="/villages"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {villages.slice(0, 5).map((village, index) => (
              <Link
                key={village.id}
                to={`/villages/${village.id}/passages`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-sm font-medium text-gray-600">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{village.title}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Castles */}
      {!isLoading && castles.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Castles</h2>
            <Link
              to="/castles"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {castles.slice(0, 5).map((castle, index) => (
              <div
                key={castle.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-sm font-medium text-gray-600">
                  {index + 1}
                </span>
                <span className="font-medium text-gray-900">{castle.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && villages.length === 0 && castles.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-500">No buildings yet. Start by creating a village or castle.</p>
          <div className="mt-4 flex justify-center gap-4">
            <Link
              to="/villages"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Map className="h-4 w-4" />
              Add Village
            </Link>
            <Link
              to="/castles"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Castle className="h-4 w-4" />
              Add Castle
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
