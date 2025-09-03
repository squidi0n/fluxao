'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  BookOpen,
  Settings,
  UserCheck,
  AlertCircle,
  Search
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  editorPermissions?: EditorPermission[];
}

interface EditorPermission {
  id: string;
  categoryId?: string;
  category?: { id: string; name: string; slug: string };
  canCreatePosts: boolean;
  canEditPosts: boolean;
  canDeletePosts: boolean;
  canPublishPosts: boolean;
  canManageComments: boolean;
  canUploadMedia: boolean;
  maxPostsPerMonth?: number;
  maxImagesPerPost: number;
  maxVideoLength: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function EditorsManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/users?role=EDITOR'),
        fetch('/api/admin/categories')
      ]);

      const [usersData, categoriesData] = await Promise.all([
        usersRes.json(),
        categoriesRes.json()
      ]);

      if (usersRes.ok) setUsers(usersData);
      if (categoriesRes.ok) setCategories(categoriesData);
    } catch (error) {
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const promoteToEditor = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: 'EDITOR' })
      });

      if (response.ok) {
        setMessage('Benutzer erfolgreich zum Editor befördert');
        fetchData();
      } else {
        const data = await response.json();
        setError(data.error || 'Fehler beim Befördern');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    }
  };

  const savePermissions = async (permissions: EditorPermission) => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/admin/editor-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...permissions
        })
      });

      if (response.ok) {
        setMessage('Berechtigungen erfolgreich gespeichert');
        setShowPermissionDialog(false);
        fetchData();
      } else {
        const data = await response.json();
        setError(data.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const regularUsers = filteredUsers.filter(user => user.role === 'USER');
  const editors = filteredUsers.filter(user => user.role === 'EDITOR');

  if (loading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editor-Verwaltung</h1>
        <p className="text-muted-foreground mt-2">
          Verwalte Editor-Berechtigungen und Content-Zugriff
        </p>
      </div>

      {message && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Benutzer suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Current Editors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Aktuelle Editoren ({editors.length})
            </CardTitle>
            <CardDescription>
              Benutzer mit Editor-Berechtigung und deren Zugriffe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {editors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Noch keine Editoren vorhanden
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Editor</TableHead>
                    <TableHead>Kategorien</TableHead>
                    <TableHead>Berechtigungen</TableHead>
                    <TableHead>Limits</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editors.map((editor) => (
                    <TableRow key={editor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{editor.name}</p>
                          <p className="text-sm text-muted-foreground">{editor.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {editor.editorPermissions?.map((perm) => (
                            <Badge key={perm.id} variant="outline" className="text-xs">
                              {perm.category?.name || 'Alle Kategorien'}
                            </Badge>
                          )) || <span className="text-muted-foreground text-sm">Keine</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {editor.editorPermissions?.some(p => p.canCreatePosts) && (
                            <Badge className="text-xs bg-green-100 text-green-700">Erstellen</Badge>
                          )}
                          {editor.editorPermissions?.some(p => p.canPublishPosts) && (
                            <Badge className="text-xs bg-blue-100 text-blue-700">Veröffentlichen</Badge>
                          )}
                          {editor.editorPermissions?.some(p => p.canManageComments) && (
                            <Badge className="text-xs bg-purple-100 text-purple-700">Kommentare</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {editor.editorPermissions?.[0]?.maxPostsPerMonth 
                            ? `${editor.editorPermissions[0].maxPostsPerMonth} Posts/Monat`
                            : 'Unbegrenzt'
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(editor);
                            setShowPermissionDialog(true);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Bearbeiten
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Regular Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Reguläre Benutzer ({regularUsers.length})
            </CardTitle>
            <CardDescription>
              Benutzer, die zu Editoren befördert werden können
            </CardDescription>
          </CardHeader>
          <CardContent>
            {regularUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Keine regulären Benutzer gefunden
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>Registriert</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regularUsers.slice(0, 10).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('de-DE')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => promoteToEditor(user.id)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Zu Editor machen
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permission Dialog */}
      <PermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        user={selectedUser}
        categories={categories}
        onSave={savePermissions}
      />
    </div>
  );
}

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  categories: Category[];
  onSave: (permissions: EditorPermission) => void;
}

function PermissionDialog({ 
  open, 
  onOpenChange, 
  user, 
  categories, 
  onSave 
}: PermissionDialogProps) {
  const [permissions, setPermissions] = useState<Partial<EditorPermission>>({
    canCreatePosts: true,
    canEditPosts: true,
    canDeletePosts: false,
    canPublishPosts: false,
    canManageComments: false,
    canUploadMedia: true,
    maxImagesPerPost: 10,
    maxVideoLength: 300
  });

  useEffect(() => {
    if (user?.editorPermissions?.[0]) {
      setPermissions(user.editorPermissions[0]);
    }
  }, [user]);

  const handleSave = () => {
    onSave(permissions as EditorPermission);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editor-Berechtigungen bearbeiten</DialogTitle>
          <DialogDescription>
            Lege fest, welche Aktionen {user?.name} durchführen kann
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Kategorie-Zugriff</Label>
            <Select
              value={permissions.categoryId || 'all'}
              onValueChange={(value) => 
                setPermissions(prev => ({ 
                  ...prev, 
                  categoryId: value === 'all' ? undefined : value 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h4 className="font-semibold">Berechtigungen</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Posts erstellen</Label>
                <Switch
                  checked={permissions.canCreatePosts}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, canCreatePosts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Posts bearbeiten</Label>
                <Switch
                  checked={permissions.canEditPosts}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, canEditPosts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Posts löschen</Label>
                <Switch
                  checked={permissions.canDeletePosts}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, canDeletePosts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Posts veröffentlichen</Label>
                <Switch
                  checked={permissions.canPublishPosts}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, canPublishPosts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Kommentare moderieren</Label>
                <Switch
                  checked={permissions.canManageComments}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, canManageComments: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Medien hochladen</Label>
                <Switch
                  checked={permissions.canUploadMedia}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, canUploadMedia: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="space-y-4">
            <h4 className="font-semibold">Limits</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max. Posts pro Monat</Label>
                <Input
                  type="number"
                  value={permissions.maxPostsPerMonth || ''}
                  onChange={(e) => 
                    setPermissions(prev => ({ 
                      ...prev, 
                      maxPostsPerMonth: e.target.value ? parseInt(e.target.value) : undefined 
                    }))
                  }
                  placeholder="Unbegrenzt"
                />
              </div>

              <div className="space-y-2">
                <Label>Max. Bilder pro Post</Label>
                <Input
                  type="number"
                  value={permissions.maxImagesPerPost || 10}
                  onChange={(e) => 
                    setPermissions(prev => ({ 
                      ...prev, 
                      maxImagesPerPost: parseInt(e.target.value) || 10 
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Max. Video-Länge (Sekunden)</Label>
                <Input
                  type="number"
                  value={permissions.maxVideoLength || 300}
                  onChange={(e) => 
                    setPermissions(prev => ({ 
                      ...prev, 
                      maxVideoLength: parseInt(e.target.value) || 300 
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            Berechtigungen speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}