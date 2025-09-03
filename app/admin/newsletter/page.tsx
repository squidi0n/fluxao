import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Users, Send, Calendar, TrendingUp, Eye, Clock, Settings, BarChart3, Target, Layers } from 'lucide-react';

import NewsletterSubscribers from '@/components/admin/NewsletterSubscribers';
import { NewsletterDashboard } from '@/components/admin/newsletter/NewsletterDashboard';
import { prisma } from '@/lib/prisma';
import { 
  AdminPageHeader, 
  AdminStatCard, 
  AdminSection,
  AdminQuickAction,
  CreateButton 
} from '@/components/admin/AdminDesignSystem';

export const metadata: Metadata = {
  title: 'Newsletter & Marketing - Admin - FluxAO',
};

async function getSubscribers() {
  return prisma.newsletterSubscriber.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async function getNewsletterIssues() {
  return prisma.newsletterIssue.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
    include: {
      _count: {
        select: {
          newsletterJobs: true
        }
      }
    }
  });
}

async function getNewsletterStats() {
  const now = new Date();
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const [totalSent, monthlyGrowth, weeklyGrowth, templates, drafts] = await Promise.all([
    prisma.newsletterIssue.count({ where: { status: 'sent' } }),
    prisma.newsletterSubscriber.count({ where: { createdAt: { gte: lastMonth } } }),
    prisma.newsletterSubscriber.count({ where: { createdAt: { gte: lastWeek } } }),
    prisma.newsletterTemplate.count(),
    prisma.newsletterDraft.count({ where: { status: 'draft' } })
  ]);
  
  return {
    totalSent,
    monthlyGrowth,
    weeklyGrowth,
    templates,
    drafts
  };
}

export default async function NewsletterPage() {
  const [subscribers, issues, stats] = await Promise.all([
    getSubscribers(),
    getNewsletterIssues(),
    getNewsletterStats()
  ]);
  const activeSubscribers = subscribers.filter((s) => s.status === 'verified');

  return (
    <div className="space-y-8">
      {/* Enhanced Professional Header */}
      <AdminPageHeader
        title="Newsletter & Marketing"
        description="Professionelles E-Mail-Marketing mit Templates, Automation und detaillierter Analytics"
        icon="Mail"
        badge={{ text: 'Live Tracking', variant: 'live', pulse: true }}
        actions={
          <CreateButton href="/admin/newsletter/create">
            Newsletter erstellen
          </CreateButton>
        }
        stats={[
          { label: 'Abonnenten', value: subscribers.length, icon: "Users" },
          { label: 'Versendet', value: stats.totalSent, icon: "Send" },
          { label: 'Wachstum (30d)', value: `+${stats.monthlyGrowth}`, icon: "TrendingUp" }
        ]}
      />

      {/* Professional KPI Cards */}
      <AdminSection 
        title="Newsletter-Performance" 
        description="Umfassende Metriken für deine E-Mail-Marketing-Kampagnen"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminStatCard
            label="Gesamte Abonnenten"
            value={subscribers.length}
            icon="Users"
            color="gray"
            trend={{
              value: `+${stats.monthlyGrowth} diesen Monat`,
              direction: stats.monthlyGrowth > 0 ? 'up' : 'neutral'
            }}
            href="/admin/newsletter/subscribers"
            subtitle="Community Größe"
          />

          <AdminStatCard
            label="Newsletter versendet"
            value={stats.totalSent}
            icon="Send"
            color="gray"
            trend={{
              value: `${((activeSubscribers.length / Math.max(subscribers.length, 1)) * 100).toFixed(0)}% Engagement`,
              direction: 'up'
            }}
            subtitle="Erfolgreiche Kampagnen"
          />

          <AdminStatCard
            label="E-Mail Templates"
            value={stats.templates}
            icon="Layers"
            color="gray"
            href="/admin/newsletter/templates"
            subtitle="Design-Vorlagen"
          />

          <AdminStatCard
            label="Wachstumsrate (7d)"
            value={`+${stats.weeklyGrowth}`}
            icon="TrendingUp"
            color="indigo"
            trend={{
              value: `${stats.weeklyGrowth > 0 ? '+' : ''}${((stats.weeklyGrowth / Math.max(subscribers.length, 1)) * 100).toFixed(1)}% Rate`,
              direction: stats.weeklyGrowth > 0 ? 'up' : 'neutral'
            }}
            subtitle="Neue Abonnenten"
            live={true}
          />
        </div>
      </AdminSection>

      {/* Marketing Quick Actions */}
      <AdminSection 
        title="Marketing-Aktionen" 
        description="Schnellzugriff auf wichtige Newsletter-Funktionen"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminQuickAction
            title="Newsletter-Kampagne"
            description="Erstelle und versende professionelle Newsletter mit unseren Templates"
            icon="Send"
            href="/admin/newsletter/create"
            color="gray"
            badge="Beliebt"
          />
          
          <AdminQuickAction
            title="Template-Editor"
            description="Designe ansprechende E-Mail-Templates mit dem visuellen Editor"
            icon="Layers"
            href="/admin/newsletter/templates"
            color="gray"
          />
          
          <AdminQuickAction
            title="Subscriber Analytics"
            description="Detaillierte Einblicke in deine Zielgruppe und deren Verhalten"
            icon="BarChart3"
            href="/admin/newsletter/analytics"
            color="gray"
            badge="Analytics"
          />

          <AdminQuickAction
            title="Automation Setup"
            description="Richte automatisierte E-Mail-Sequenzen und Trigger ein"
            icon="Target"
            href="/admin/newsletter/automation"
            color="orange"
          />
          
          <AdminQuickAction
            title="A/B Testing"
            description="Optimiere deine Kampagnen durch intelligente A/B-Tests"
            icon="BarChart3"
            href="/admin/newsletter/testing"
            color="indigo"
            badge="Pro"
          />
          
          <AdminQuickAction
            title="Export & Reports"
            description="Exportiere Daten und erstelle detaillierte Performance-Reports"
            icon="TrendingUp"
            href="/admin/newsletter/reports"
            color="red"
          />
        </div>
      </AdminSection>

      {/* Newsletter Dashboard Integration */}
      <AdminSection
        title="Kampagnen-Dashboard"
        description="Aktuelle und geplante Newsletter-Kampagnen im Überblick"
      >
        <NewsletterDashboard issues={issues} subscribers={activeSubscribers} stats={stats} />
      </AdminSection>

      {/* Subscriber Management */}
      <AdminSection
        title="Subscriber-Management"
        description="Verwalte deine E-Mail-Liste und analysiere das Abonnenten-Verhalten"
      >
        <NewsletterSubscribers subscribers={subscribers} />
      </AdminSection>
    </div>
  );
}
