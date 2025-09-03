import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react';
import { Metadata } from 'next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Revenue - Admin',
};

async function getRevenueData() {
  // ECHTE DATEN AUS DER DATENBANK
  const [totalUsers, verifiedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: { not: null } } }),
  ]);

  return { totalUsers, verifiedUsers };
}

export default async function RevenuePage() {
  const data = await getRevenueData();
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Revenue Dashboard</h1>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monatsumsatz</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€0</div>
            <p className="text-xs text-gray-500 mt-1">Payment-Integration ausstehend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Registrierte User</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers.toLocaleString('de-DE')}</div>
            <p className="text-xs text-gray-500 mt-1">{data.verifiedUsers} verifiziert</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€0</div>
            <p className="text-xs text-gray-500 mt-1">Average Revenue Per User</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-500 mt-1">Noch keine Daten</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Umsatzentwicklung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <p className="text-gray-500 mb-2">Payment-System noch nicht integriert</p>
              <p className="text-sm text-gray-400">Stripe/PayPal Integration erforderlich</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Statistik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Registrierte User</span>
                <span className="text-sm text-gray-600">{data.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Verifizierte User</span>
                <span className="text-sm text-gray-600">{data.verifiedUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Unverifizierte User</span>
                <span className="text-sm text-gray-600">
                  {data.totalUsers - data.verifiedUsers}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zahlungsmethoden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-gray-500 text-center">
                Payment-Provider Integration ausstehend
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaktionen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-gray-500">
              Noch keine Transaktionen vorhanden - Payment-System nicht konfiguriert
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
