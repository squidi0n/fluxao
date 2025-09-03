'use client';

import { MessageCircle, X, Send, ChevronDown, Bug, Lightbulb, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

type FeedbackType = 'bug' | 'feature' | 'improvement';

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('improvement');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
        setIsMinimized(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          message: message.trim(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setMessage('');
        setFeedbackType('improvement');
      }
    } catch (error) {
      // console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackIcons = {
    bug: <Bug className="h-4 w-4" />,
    feature: <Lightbulb className="h-4 w-4" />,
    improvement: <Heart className="h-4 w-4" />,
  };

  const feedbackLabels = {
    bug: 'Report a Bug',
    feature: 'Request Feature',
    improvement: 'Suggestion',
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
        aria-label="Open feedback widget"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <Card className="shadow-2xl border-2">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary/5">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Quick Feedback</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="font-semibold mb-1">Thank you!</p>
                <p className="text-sm text-muted-foreground">Your feedback has been received.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Feedback Type */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">What's on your mind?</Label>
                  <RadioGroup
                    value={feedbackType}
                    onValueChange={(value) => setFeedbackType(value as FeedbackType)}
                  >
                    <div className="space-y-2">
                      {Object.entries(feedbackLabels).map(([type, label]) => (
                        <label
                          key={type}
                          className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-accent"
                        >
                          <RadioGroupItem value={type} />
                          <div className="flex items-center gap-2 flex-1">
                            {feedbackIcons[type as FeedbackType]}
                            <span className="text-sm">{label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="feedback-message" className="text-sm font-medium mb-2 block">
                    Your message
                  </Label>
                  <Textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Tell us about your ${feedbackType === 'bug' ? 'issue' : feedbackType === 'feature' ? 'idea' : 'suggestion'}...`}
                    rows={4}
                    className="resize-none text-sm"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Send Feedback
                      </span>
                    )}
                  </Button>
                </div>

                {/* Footer Link */}
                <div className="pt-2 border-t">
                  <a
                    href="/feedback"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Need more help? Visit our feedback page →
                  </a>
                </div>
              </form>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
