'use client';

import { Upload, Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, hyphens, and underscores',
    )
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isPublic: z.boolean(),
});

interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  avatar: string | null;
  location: string | null;
  website: string | null;
  isPublic: boolean;
}

interface ProfileEditorProps {
  user: User;
}

export function ProfileEditor({ user }: ProfileEditorProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    isPublic: user.isPublic,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setSuccess(false);
  };

  const handleSwitchChange = (name: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        // 1MB limit
        setErrors((prev) => ({ ...prev, avatar: 'Avatar must be less than 1MB' }));
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, avatar: 'Avatar must be an image file' }));
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      if (errors.avatar) {
        setErrors((prev) => ({ ...prev, avatar: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    startTransition(async () => {
      try {
        // Validate form data
        const validated = profileSchema.parse(formData);

        // Create FormData for multipart upload
        const submitData = new FormData();

        // Add profile data
        Object.entries(validated).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            submitData.append(key, value.toString());
          }
        });

        // Add avatar if selected
        if (avatarFile) {
          submitData.append('avatar', avatarFile);
        }

        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          body: submitData,
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.errors) {
            setErrors(result.errors);
          } else {
            setErrors({ submit: result.error || 'Failed to update profile' });
          }
          return;
        }

        setSuccess(true);
        setAvatarFile(null);

        // Refresh the page to show updated data
        router.refresh();

        // Redirect to profile page after 2 seconds
        setTimeout(() => {
          router.push(`/profile/${result.user.username || result.user.id}`);
        }, 2000);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ submit: 'Failed to update profile' });
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarPreview || undefined} alt="Avatar preview" />
              <AvatarFallback className="text-xl">
                {(formData.name || user.email)[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <Label htmlFor="avatar" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Upload className="w-4 h-4" />
                  Choose Photo
                </div>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </Label>
              <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max size 1MB.</p>
              {errors.avatar && <p className="text-sm text-red-600 mt-1">{errors.avatar}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Your display name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="unique-username"
              className={errors.username ? 'border-red-500' : ''}
            />
            <p className="text-sm text-gray-500">
              Used in your profile URL: /profile/{formData.username || 'username'}
            </p>
            {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              rows={3}
              className={errors.bio ? 'border-red-500' : ''}
            />
            <p className="text-sm text-gray-500">{formData.bio.length}/500 characters</p>
            {errors.bio && <p className="text-sm text-red-600">{errors.bio}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, Country"
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://yourwebsite.com"
              type="url"
              className={errors.website ? 'border-red-500' : ''}
            />
            {errors.website && <p className="text-sm text-red-600">{errors.website}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {formData.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <Label className="text-base font-medium">Public Profile</Label>
              </div>
              <p className="text-sm text-gray-500">
                {formData.isPublic
                  ? 'Your profile is visible to everyone'
                  : 'Your profile is only visible to you'}
              </p>
            </div>
            <Switch
              checked={formData.isPublic}
              onCheckedChange={(checked) => handleSwitchChange('isPublic', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Section */}
      <Card>
        <CardContent className="pt-6">
          {errors.submit && (
            <Alert className="mb-4" variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Profile updated successfully! Redirecting to your profile...
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
