'use client';

import {
  MessageSquare,
  Bug,
  Lightbulb,
  Heart,
  Send,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';
type Priority = 'low' | 'medium' | 'high' | 'critical';

interface FeedbackForm {
  type: FeedbackType;
  priority: Priority;
  subject: string;
  description: string;
  steps?: string;
  expected?: string;
  actual?: string;
  url?: string;
  browser?: string;
  email: string;
  attachments?: File[];
}

export default function FeedbackPage() {
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FeedbackForm>({
    type: 'improvement',
    priority: 'medium',
    subject: '',
    description: '',
    email: user?.email || '',
    attachments: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key !== 'attachments' && value) {
          formData.append(key, value.toString());
        }
      });

      // Add attachments
      form.attachments?.forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      // console.error('Feedback submission error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024); // 5MB limit

    if (files.length !== validFiles.length) {
      setError('Some files exceed the 5MB size limit');
    }

    setForm((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...validFiles].slice(0, 3), // Max 3 files
    }));
  };

  const removeFile = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index),
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your feedback has been submitted successfully. We'll review it and get back to you
              soon.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    type: 'improvement',
                    priority: 'medium',
                    subject: '',
                    description: '',
                    email: user?.email || '',
                    attachments: [],
                  });
                }}
              >
                Submit More Feedback
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = '/')}>
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Send Feedback</h1>
          <p className="text-muted-foreground">
            Help us improve FluxAO by sharing your feedback, reporting bugs, or suggesting new
            features.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type */}
          <Card>
            <CardHeader>
              <CardTitle>What type of feedback are you providing?</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={form.type}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, type: value as FeedbackType }))
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border hover:bg-accent">
                    <RadioGroupItem value="bug" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4 text-red-500" />
                        <span className="font-medium">Bug Report</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Something isn't working as expected
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border hover:bg-accent">
                    <RadioGroupItem value="feature" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">Feature Request</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Suggest a new feature or enhancement
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border hover:bg-accent">
                    <RadioGroupItem value="improvement" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-pink-500" />
                        <span className="font-medium">Improvement</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Suggest how to make something better
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border hover:bg-accent">
                    <RadioGroupItem value="other" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Other</span>
                      </div>
                      <p className="text-sm text-muted-foreground">General feedback or comments</p>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Priority Level */}
          {form.type === 'bug' && (
            <Card>
              <CardHeader>
                <CardTitle>Priority Level</CardTitle>
                <CardDescription>How severe is this issue?</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={form.priority}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, priority: value as Priority }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Low - Minor issue, workaround available
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        Medium - Significant issue, impacts functionality
                      </span>
                    </SelectItem>
                    <SelectItem value="high">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                        High - Major issue, blocks important features
                      </span>
                    </SelectItem>
                    <SelectItem value="critical">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Critical - System down, data loss, security issue
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Feedback Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>
                Provide details about your {form.type === 'bug' ? 'bug report' : 'feedback'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief summary of your feedback"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide detailed information..."
                  rows={6}
                  required
                />
              </div>

              {form.type === 'bug' && (
                <>
                  <div>
                    <Label htmlFor="steps">Steps to Reproduce</Label>
                    <Textarea
                      id="steps"
                      value={form.steps}
                      onChange={(e) => setForm((prev) => ({ ...prev, steps: e.target.value }))}
                      placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                      rows={4}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expected">Expected Behavior</Label>
                      <Textarea
                        id="expected"
                        value={form.expected}
                        onChange={(e) => setForm((prev) => ({ ...prev, expected: e.target.value }))}
                        placeholder="What should happen?"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="actual">Actual Behavior</Label>
                      <Textarea
                        id="actual"
                        value={form.actual}
                        onChange={(e) => setForm((prev) => ({ ...prev, actual: e.target.value }))}
                        placeholder="What actually happened?"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="url">Page URL</Label>
                      <Input
                        id="url"
                        type="url"
                        value={form.url}
                        onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                        placeholder="https://fluxao.com/..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="browser">Browser & Version</Label>
                      <Input
                        id="browser"
                        value={form.browser}
                        onChange={(e) => setForm((prev) => ({ ...prev, browser: e.target.value }))}
                        placeholder="e.g., Chrome 120"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* File Attachments */}
              <div>
                <Label htmlFor="attachments">Attachments (optional)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Screenshots or files that help explain your feedback (max 3 files, 5MB each)
                </p>
                <div className="space-y-2">
                  <Input
                    id="attachments"
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.txt,.log"
                    multiple
                    className="cursor-pointer"
                  />
                  {form.attachments && form.attachments.length > 0 && (
                    <div className="space-y-2">
                      {form.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <span className="text-sm truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How can we reach you about this feedback?</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  We'll only use this to respond to your feedback
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
