import { Metadata } from 'next';
import { Users, UserPlus, Shield, Activity, TrendingUp } from 'lucide-react';

import UserManagement from '@/components/admin/UserManagement';
import { prisma } from '@/lib/prisma';
import { 
  AdminPageHeader, 
  AdminStatCard, 
  AdminSection,
  CreateButton 
} from '@/components/admin/AdminDesignSystem';

export const metadata: Metadata = {
  title: 'Benutzer verwalten - Admin - FluxAO',
};

async function getUserStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const [
    allUsers,
    newUsersThisMonth,
    activeUsersThisWeek,
    adminUsers
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    }),
    prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    }),
    prisma.user.count({
      where: { lastLoginAt: { gte: sevenDaysAgo } }
    }),
    prisma.user.count({
      where: { role: 'ADMIN' }
    })
  ]);

  return {
    users: allUsers,
    stats: {
      total: allUsers.length,
      newThisMonth: newUsersThisMonth,
      activeThisWeek: activeUsersThisWeek,
      adminCount: adminUsers
    }
  };
}

export default async function UsersPage() {
  const { users, stats } = await getUserStats();

  return (
    <div className="space-y-8">
      {/* Enhanced Page Header */}
      <AdminPageHeader
        title="Benutzer & Rollen"
        description="Umfassendes Benutzermanagement mit Rollen, Berechtigungen und Community-Analytics"
        icon="Users"
        actions={
          <CreateButton href="/admin/users/new">
            Neuer Benutzer
          </CreateButton>
        }
        stats={[
          { label: 'Gesamt', value: stats.total, icon: "Users" },
          { label: 'Neue (30d)', value: stats.newThisMonth, icon: "TrendingUp" },
          { label: 'Aktive (7d)', value: stats.activeThisWeek, icon: "Activity" }
        ]}
      />

      {/* Professional User Statistics */}
      <AdminSection 
        title="Benutzer-Analytics" 
        description="Detaillierte Einblicke in deine Community und Benutzeraktivitäten"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminStatCard
            label="Registrierte Benutzer"
            value={stats.total}
            icon="Users"
            color="blue"
            href="/admin/users"
            subtitle="Gesamte Community"
          />
          
          <AdminStatCard
            label="Neue Registrierungen"
            value={stats.newThisMonth}
            icon="UserPlus"
            color="green"
            trend={{
              value: "Letzte 30 Tage",
              direction: stats.newThisMonth > 0 ? 'up' : 'neutral'
            }}
            subtitle="Monatliches Wachstum"
          />
          
          <AdminStatCard
            label="Aktive Benutzer"
            value={stats.activeThisWeek}
            icon="Activity"
            color="purple"
            live={true}
            trend={{
              value: "Letzte 7 Tage",
              direction: 'neutral'
            }}
            subtitle="Wöchentliche Aktivität"
          />
          
          <AdminStatCard
            label="Administratoren"
            value={stats.adminCount}
            icon="Shield"
            color="yellow"
            trend={{
              value: `${Math.round((stats.adminCount / stats.total) * 100)}% von Gesamt`,
              direction: 'neutral'
            }}
            subtitle="System-Administratoren"
          />
        </div>
      </AdminSection>

      {/* User Management Interface */}
      <AdminSection
        title="Benutzerverwaltung"
        description="Detaillierte Übersicht und Verwaltung aller Benutzerkonten"
      >
        <UserManagement initialUsers={JSON.parse(JSON.stringify(users))} />
      </AdminSection>
    </div>
  );
}