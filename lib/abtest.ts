export function getVariant(userId: string, testName: string): 'A' | 'B' {
  // Simple hash-based A/B test assignment
  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  return hash % 2 === 0 ? 'A' : 'B';
}

export function trackEvent(testName: string, variant: string, event: string) {
  // Log or send to analytics
  // console.log(`A/B Test: ${testName}, Variant: ${variant}, Event: ${event}`);
}

export function trackNewsletterEvent(email: string, event: string, metadata?: any) {
  // Track newsletter-specific events
  // console.log(`Newsletter Event: ${event} for ${email}`, metadata);
}
