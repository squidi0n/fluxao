'use client';

import { User, MapPin, Globe, FileText, ChevronRight, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileSetupContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    username: '',
    bio: '',
    location: '',
    website: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({
      ...profileData,
      [e.target.id]: e.target.value,
    });
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/profile/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Redirect to profile or dashboard
      router.push('/profile');
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (step / 3) * 100;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Vervollständigen Sie Ihr Profil</h1>
        <p className="mt-2 text-muted-foreground">
          Helfen Sie anderen, Sie besser kennenzulernen
        </p>
      </div>

      <Progress value={progress} className="mb-8" />

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && 'Grundlegende Informationen'}
            {step === 2 && 'Über Sie'}
            {step === 3 && 'Zusätzliche Details'}
          </CardTitle>
          <CardDescription>
            Schritt {step} von 3
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="mr-2 inline h-4 w-4" />
                  Vollständiger Name
                </Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  placeholder="Max Mustermann"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">
                  Benutzername
                </Label>
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={handleInputChange}
                  placeholder="@maxmustermann"
                />
                <p className="text-xs text-muted-foreground">
                  Dies wird Ihre eindeutige Profil-URL sein
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <Label htmlFor="bio">
                <FileText className="mr-2 inline h-4 w-4" />
                Über Sie
              </Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={handleInputChange}
                placeholder="Erzählen Sie etwas über sich..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Kurze Beschreibung für Ihr Profil. URLs werden automatisch verlinkt.
              </p>
            </div>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="mr-2 inline h-4 w-4" />
                  Standort
                </Label>
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={handleInputChange}
                  placeholder="Berlin, Deutschland"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">
                  <Globe className="mr-2 inline h-4 w-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={profileData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>
            </>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                Zurück
              </Button>
            )}
            
            <div className={step === 1 ? 'ml-auto' : ''}>
              {step < 3 ? (
                <Button onClick={handleNext}>
                  Weiter
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading}
                  className="min-w-[100px]"
                >
                  {isLoading ? 'Speichern...' : 'Profil erstellen'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 text-center">
        <Button variant="link" onClick={() => router.push('/profile')}>
          Überspringen
        </Button>
      </div>
    </div>
  );
}