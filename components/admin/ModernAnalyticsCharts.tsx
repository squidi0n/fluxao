'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, Activity, Users, Eye, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface WeeklyStats {
  date: string;
  posts: number;
  users: number;
  views: number;
}

interface ModernAnalyticsChartsProps {
  weeklyStats: WeeklyStats[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

export function ModernAnalyticsCharts({ weeklyStats }: ModernAnalyticsChartsProps) {
  // Format data for charts
  const chartData = weeklyStats.map(stat => ({
    ...stat,
    date: new Date(stat.date).toLocaleDateString('de-DE', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  // Calculate totals and trends
  const totalViews = chartData.reduce((sum, day) => sum + day.views, 0);
  const totalUsers = chartData.reduce((sum, day) => sum + day.users, 0);
  const totalPosts = chartData.reduce((sum, day) => sum + day.posts, 0);

  // Create engagement data for pie chart
  const engagementData = [
    { name: 'Views', value: totalViews, color: '#3B82F6' },
    { name: 'Users', value: totalUsers * 10, color: '#10B981' }, // Multiply for better visualization
    { name: 'Posts', value: totalPosts * 50, color: '#F59E0B' }, // Multiply for better visualization
  ];

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Main Traffic Chart */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="p-8 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Traffic Analytics
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Views und Content Performance der letzten 7 Tage
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalViews.toLocaleString('de-DE')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Views</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{totalUsers}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">New Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{totalPosts}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Posts</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="postsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis 
                dataKey="date" 
                className="text-sm"
                tick={{ fontSize: 12, fill: 'currentColor' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                className="text-sm"
                tick={{ fontSize: 12, fill: 'currentColor' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  fontSize: '14px'
                }}
                labelStyle={{ color: '#374151', fontWeight: '600' }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#3B82F6"
                strokeWidth={3}
                fill="url(#viewsGradient)"
                name="Views"
              />
              <Area
                type="monotone"
                dataKey="posts"
                stroke="#10B981"
                strokeWidth={3}
                fill="url(#postsGradient)"
                name="Posts"
              />
            </AreaChart>
          </ResponsiveContainer>
          
          {/* Enhanced Legend */}
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full shadow-lg"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Views</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-400 rounded-full shadow-lg"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Posts</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth Trend */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  User Growth
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tägliche Registrierungen
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis 
                  dataKey="date"
                  className="text-xs"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    fontSize: '13px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                  name="Neue Nutzer"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Distribution */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Engagement Mix
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Content Performance
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {engagementData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                      fontSize: '13px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4">
              {engagementData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}