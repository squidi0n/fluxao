'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Users, MapPin } from 'lucide-react';

interface VisitorLocation {
  id: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  timestamp: Date;
  userAgent: string;
  page: string;
}

interface CountryStats {
  country: string;
  count: number;
  percentage: number;
}

export default function LiveVisitorsMap() {
  const [visitors, setVisitors] = useState<VisitorLocation[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Simulated world map with SVG (simplified version)
  const worldMapSVG = (
    <svg viewBox="0 0 1000 500" className="w-full h-64">
      {/* Simplified world map paths */}
      <path
        d="M100,100 L200,80 L300,120 L400,100 L500,110 L600,95 L700,105 L800,100 L900,110 L900,400 L800,390 L700,395 L600,400 L500,390 L400,400 L300,395 L200,400 L100,395 Z"
        fill="#e5e7eb"
        stroke="#9ca3af"
        strokeWidth="1"
      />
      
      {/* Render visitor dots */}
      {visitors.slice(0, 50).map((visitor, index) => (
        <g key={visitor.id}>
          <circle
            cx={Math.min(Math.max(visitor.lng * 2.7 + 500, 50), 950)}
            cy={Math.min(Math.max(250 - visitor.lat * 2.5, 50), 450)}
            r="4"
            fill="#3b82f6"
            opacity={0.8}
            className="animate-pulse"
          >
            <animate
              attributeName="r"
              values="4;8;4"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Tooltip on hover */}
          <title>{`${visitor.city}, ${visitor.country} - ${visitor.page}`}</title>
        </g>
      ))}
    </svg>
  );

  useEffect(() => {
    // Load initial data from API if available (no mock fallback)
    const load = async () => {
      try {
        const res = await fetch('/api/analytics/live');
        if (res.ok) {
          const payload = await res.json();
          const list: VisitorLocation[] = payload.visitors || [];
          setVisitors(list);
          setActiveVisitors(list.length);
          const stats = list.reduce((acc, visitor) => {
            const existing = acc.find((s) => s.country === visitor.country);
            if (existing) existing.count++;
            else acc.push({ country: visitor.country, count: 1, percentage: 0 });
            return acc;
          }, [] as CountryStats[]);
          stats.forEach((s) => (s.percentage = list.length ? (s.count / list.length) * 100 : 0));
          setCountryStats(stats.sort((a, b) => b.count - a.count));
        }
      } catch (e) {
        // fail silently
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Live Visitors Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Live Visitors Map
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">{activeVisitors} Active</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            {worldMapSVG}
          </div>
          
          {/* Recent Visitors Stream */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recent Visitors
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {visitors.slice(0, 10).map((visitor, index) => (
                <div
                  key={visitor.id}
                  className={`flex items-center justify-between text-sm p-2 rounded ${
                    index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-blue-500" />
                    <span className="font-medium">{visitor.city}, {visitor.country}</span>
                    {index === 0 && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">NEW</span>}
                  </div>
                  <div className="text-gray-500">
                    {visitor.page}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Country Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Top Countries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {countryStats.slice(0, 8).map((stat, index) => (
              <div key={stat.country} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                  <span className="font-medium">{stat.country}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {stat.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
