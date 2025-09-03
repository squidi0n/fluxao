# Newsletter System Test Guide

## Testing Checklist

### ✅ GDPR Compliance Tests

#### Double Opt-in Flow
1. **Subscribe with valid email**:
   ```bash
   curl -X POST http://localhost:3000/api/newsletter/subscribe \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "firstName": "Test",
       "lastName": "User",
       "consentGiven": true,
       "marketingConsent": true,
       "consentText": "I agree to receive newsletters",
       "consentVersion": "v1.0"
     }'
   ```
   - ✅ Should return success message
   - ✅ Should send verification email
   - ✅ Should log consent in database

2. **Verify email**:
   - Click verification link in email
   - ✅ Should mark subscriber as verified
   - ✅ Should update doubleOptIn to true
   - ✅ Should show success page

3. **Attempt duplicate signup**:
   - Use same email again
   - ✅ Should return "already subscribed" message

#### Unsubscribe Flow
1. **One-click unsubscribe**:
   ```
   GET /api/newsletter/unsubscribe?token=subscriber-unsubscribe-token
   ```
   - ✅ Should immediately unsubscribe
   - ✅ Should log consent withdrawal
   - ✅ Should show unsubscribe confirmation page
   - ✅ Should offer feedback form

2. **Feedback submission**:
   - Submit unsubscribe feedback
   - ✅ Should store feedback for analysis
   - ✅ Should show thank you message

### ✅ Email Delivery Tests

#### Template Generation
1. **Weekly AI Roundup**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/newsletter/create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer admin-token" \
     -d '{
       "templateId": "weekly-ai-roundup",
       "useAutofill": true,
       "autofillConfig": {
         "dateRange": "last_week",
         "categories": ["ki-tech"],
         "maxArticles": 3,
         "sortBy": "mixed"
       },
       "testMode": true,
       "testEmails": ["admin@fluxao.com"]
     }'
   ```
   - ✅ Should generate HTML email with FluxAO branding
   - ✅ Should include auto-selected articles
   - ✅ Should have proper unsubscribe links
   - ✅ Should send to test email

2. **Breaking News Alert**:
   - Use `tech-breakthrough-alert` template
   - ✅ Should have urgent styling
   - ✅ Should prioritize most recent article

3. **Monthly Digest**:
   - Use `monthly-digest` template
   - ✅ Should include statistics section
   - ✅ Should categorize articles properly

#### Email Headers
Verify all test emails contain:
- ✅ `List-Unsubscribe` header
- ✅ `List-Unsubscribe-Post` header  
- ✅ `List-ID` header
- ✅ `Feedback-ID` header
- ✅ Proper `From` and `Reply-To` headers

### ✅ Tracking & Analytics Tests

#### Open Tracking
1. **Open tracking pixel**:
   ```
   GET /api/newsletter/track/open?s=subscriber-id&c=campaign-id
   ```
   - ✅ Should return 1x1 transparent PNG
   - ✅ Should log open interaction
   - ✅ Should not double-track within 5 minutes

#### Click Tracking
1. **Click tracking**:
   ```
   GET /api/newsletter/track/click?url=https://fluxao.com/article&s=subscriber-id&c=campaign-id
   ```
   - ✅ Should redirect to original URL
   - ✅ Should log click interaction
   - ✅ Should include UTM parameters

### ✅ Admin Interface Tests

#### Newsletter Creation
1. **Access admin interface**:
   - Go to `/admin/newsletter`
   - ✅ Should require admin authentication
   - ✅ Should show newsletter creation form

2. **Create newsletter with autofill**:
   - Select template
   - Configure autofill settings
   - ✅ Should preview generated content
   - ✅ Should show article count and sources

3. **Send test newsletter**:
   - Enable test mode
   - Add test email addresses
   - ✅ Should send to test emails only
   - ✅ Should mark with [TEST] prefix

### ✅ Data Protection Tests

#### Consent Logging
1. **Check consent records**:
   ```sql
   SELECT * FROM newsletter_consents WHERE subscriberId = 'test-subscriber-id';
   ```
   - ✅ Should have signup consent record
   - ✅ Should include hashed IP address
   - ✅ Should include user agent
   - ✅ Should include consent text and version

2. **GDPR data export**:
   ```bash
   curl -X GET /api/admin/subscribers/export?email=test@example.com \
     -H "Authorization: Bearer admin-token"
   ```
   - ✅ Should return all subscriber data
   - ✅ Should include consent history
   - ✅ Should include interaction history

#### Data Deletion
1. **Right to be forgotten**:
   ```bash
   curl -X DELETE /api/admin/subscribers/delete \
     -H "Authorization: Bearer admin-token" \
     -d '{"email": "test@example.com", "reason": "user_request"}'
   ```
   - ✅ Should delete subscriber record
   - ✅ Should anonymize historical data
   - ✅ Should log deletion action

### ✅ Performance Tests

#### Bulk Sending
1. **Create test subscribers**:
   ```sql
   INSERT INTO newsletter_subscribers (email, status, firstName, lastName, unsubscribeToken)
   SELECT 
     'test' || generate_series(1,1000) || '@example.com',
     'verified',
     'Test',
     'User' || generate_series(1,1000),
     gen_random_uuid()
   ```

2. **Send to large list**:
   - Create newsletter for 1000+ subscribers
   - ✅ Should batch emails (50 per batch)
   - ✅ Should complete without timeout
   - ✅ Should maintain delivery rate >95%

### ✅ Security Tests

#### Input Validation
1. **Invalid email addresses**:
   ```bash
   curl -X POST /api/newsletter/subscribe \
     -d '{"email": "invalid-email", "consentGiven": true}'
   ```
   - ✅ Should return validation error

2. **Missing consent**:
   ```bash
   curl -X POST /api/newsletter/subscribe \
     -d '{"email": "test@example.com", "consentGiven": false}'
   ```
   - ✅ Should require consent

3. **SQL injection attempts**:
   - Test with malicious email inputs
   - ✅ Should be prevented by Prisma

#### Authentication
1. **Admin endpoints without auth**:
   ```bash
   curl -X POST /api/admin/newsletter/create
   ```
   - ✅ Should return 401 Unauthorized

2. **Invalid tokens**:
   ```bash
   curl -X GET /api/newsletter/unsubscribe?token=invalid-token
   ```
   - ✅ Should return error page

## Automated Test Runner

Create a test script to run all checks:

```javascript
// test-newsletter-system.js
const tests = [
  { name: 'Subscribe with valid email', test: testSubscribe },
  { name: 'Verify double opt-in', test: testVerification },
  { name: 'One-click unsubscribe', test: testUnsubscribe },
  { name: 'Create newsletter', test: testNewsletterCreation },
  { name: 'Track email opens', test: testOpenTracking },
  { name: 'Track email clicks', test: testClickTracking },
];

async function runAllTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.test();
      console.log(`✅ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

runAllTests();
```

## Production Readiness Checklist

Before going live, ensure:

### ✅ Infrastructure
- [ ] Domain DNS configured (SPF, DKIM, DMARC)
- [ ] SSL certificate installed
- [ ] Environment variables configured
- [ ] Database backups automated
- [ ] Error monitoring setup (Sentry)

### ✅ Legal Compliance
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Cookie policy covers analytics
- [ ] GDPR compliance reviewed by legal team
- [ ] Data processing agreements signed

### ✅ Email Deliverability
- [ ] Domain reputation established
- [ ] Feedback loops configured
- [ ] Bounce handling automated
- [ ] Complaint handling automated
- [ ] Sender score monitored

### ✅ Monitoring
- [ ] Email delivery monitoring
- [ ] Open/click rate alerts
- [ ] Bounce rate alerts
- [ ] System performance monitoring
- [ ] Security breach detection

### ✅ Documentation
- [ ] Admin user guide created
- [ ] API documentation complete
- [ ] Incident response procedures
- [ ] Data breach response plan
- [ ] Regular audit schedule

## Emergency Procedures

### System Outage
1. Check email service status
2. Review system logs
3. Notify subscribers if extended outage
4. Implement backup sending mechanism

### GDPR Breach
1. Stop all email sending
2. Assess data exposure
3. Notify authorities within 72 hours
4. Notify affected subscribers
5. Document incident and response

### High Bounce Rate
1. Pause email sending immediately
2. Review recent campaigns for issues
3. Check domain reputation
4. Clean subscriber list
5. Investigate content for spam triggers

### Deliverability Drop
1. Monitor feedback loops
2. Check blacklist status
3. Review engagement metrics
4. Adjust sending frequency
5. Re-authenticate domain if needed

This comprehensive test guide ensures the newsletter system meets all requirements and operates reliably in production.