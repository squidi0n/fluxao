'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';

interface WeeklyStats {
  date: string;
  posts: number;
  users: number;
  views: number;
}

interface AnalyticsChartsProps {
  weeklyStats: WeeklyStats[];
}

export function AnalyticsCharts({ weeklyStats }: AnalyticsChartsProps) {
  // Format data for charts
  const chartData = weeklyStats.map(stat => ({
    ...stat,
    date: new Date(stat.date).toLocaleDateString('de-DE', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  return (
    <>
      {/* Views & Posts Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Wöchentlicher Traffic & Content
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Views und neue Posts der letzten 7 Tage
          </p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="postsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fontSize: 12, fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12, fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(var(--background))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                labelStyle={{ color: 'rgb(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#viewsGradient)"
                name="Views"
              />
              <Area
                type="monotone"
                dataKey="posts"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#postsGradient)"
                name="Posts"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Chart Legend */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Views</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Posts</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Users Growth Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Nutzerwachstum
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Neue Registrierungen der letzten 7 Tage
          </p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date"
                className="text-xs"
                tick={{ fontSize: 12, fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12, fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(var(--background))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                labelStyle={{ color: 'rgb(var(--foreground))' }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#10B981' }}
                name="Neue Nutzer"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="px-6 pb-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between pt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {chartData.reduce((sum, day) => sum + day.users, 0)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Gesamt (7d)</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {(chartData.reduce((sum, day) => sum + day.users, 0) / 7).toFixed(1)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Ø täglich</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">
                {chartData.length > 1 && chartData[chartData.length - 1].users > chartData[chartData.length - 2].users ? '+' : ''}
                {chartData.length > 1 ? 
                  (((chartData[chartData.length - 1].users - chartData[chartData.length - 2].users) / Math.max(chartData[chartData.length - 2].users, 1)) * 100).toFixed(0) + '%' 
                  : '0%'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">vs. gestern</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}