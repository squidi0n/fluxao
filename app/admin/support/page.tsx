import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, AlertCircle, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support Tickets - Admin - FluxAO',
};

async function getSupportTickets() {
  try {
    // Check if supportTicket model exists
    const tickets = await prisma.supportTicket?.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    }).catch(() => []) || [];

    const stats = {
      total: await prisma.supportTicket?.count().catch(() => 0) || 0,
      open: await prisma.supportTicket?.count({ where: { status: 'open' } }).catch(() => 0) || 0,
      inProgress: await prisma.supportTicket?.count({ where: { status: 'in_progress' } }).catch(() => 0) || 0,
      resolved: await prisma.supportTicket?.count({ where: { status: 'resolved' } }).catch(() => 0) || 0,
    };

    return { tickets, stats };
  } catch (error) {
    // If supportTicket model doesn't exist, return empty data
    console.log('Support tickets table not found, using fallback data');
    return {
      tickets: [],
      stats: { total: 0, open: 0, inProgress: 0, resolved: 0 }
    };
  }
}

export default async function SupportPage() {
  const { tickets, stats } = await getSupportTickets();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-600 mt-1">Manage customer support requests</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{stats.open}</div>
                <div className="text-sm text-gray-600">Open</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{stats.inProgress}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.resolved}</div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium mb-2">No Support Tickets</h3>
              <p>All caught up! No support tickets at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {ticket.subject}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {ticket.ticketId} • {ticket.name || 'Anonymous'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {ticket.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Category: {ticket.category}</span>
                    <span>Created: {new Date(ticket.createdAt).toLocaleDateString('de-DE')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}