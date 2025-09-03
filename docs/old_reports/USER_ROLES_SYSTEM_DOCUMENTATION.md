# FluxAO Enhanced User Roles & Settings System

## Overview

This document describes the comprehensive user roles and settings system implemented for FluxAO, featuring a 7-day trial paywall, role-based access control, and professional subscription management.

## 🎯 System Features

### 1. Role Hierarchy
- **USER** - New users with 7-day trial access
- **PREMIUM** - Paid subscribers with full content access
- **EDITOR** - External authors/contributors with content management rights
- **ADMIN** - Full system access and user management

### 2. 7-Day Paywall Logic
- New users get full access for 7 days automatically
- Content is blurred after 2nd paragraph once trial expires
- Premium users have unrestricted access
- Editors can create/edit content in assigned categories
- Admins have full access to everything

### 3. Comprehensive Settings System
Each role has access to appropriate settings:
- **Profile Management**: Name, bio, avatar, social links
- **Security Settings**: Password change, 2FA setup, security log
- **Notification Preferences**: Email, comments, mentions, security alerts
- **Privacy Controls**: Profile visibility, contact preferences
- **Subscription Management**: Plan details, billing, upgrade/downgrade
- **Editor-Specific**: Writing permissions, categories, content limits

## 🏗️ System Architecture

### Database Schema Changes

#### Enhanced User Model
```prisma
model User {
  // ... existing fields ...
  
  // Trial and subscription fields
  trialStartedAt      DateTime?
  trialEndsAt         DateTime?
  hasUsedTrial        Boolean @default(false)
  
  // Relations
  userSettings        UserSettings?
  editorPermissions   EditorPermissions[]
}

enum Role {
  ADMIN
  EDITOR
  PREMIUM  // NEW
  USER
}
```

#### New UserSettings Model
```prisma
model UserSettings {
  id                      String   @id @default(uuid())
  userId                  String   @unique
  
  // Notification preferences
  emailNotifications      Boolean  @default(true)
  newsletterSubscription  Boolean  @default(true)
  commentNotifications    Boolean  @default(true)
  mentionNotifications    Boolean  @default(true)
  securityNotifications   Boolean  @default(true)
  
  // Privacy settings
  profileVisible          Boolean  @default(true)
  showEmail               Boolean  @default(false)
  showLocation            Boolean  @default(true)
  allowDirectMessages     Boolean  @default(true)
  
  // Display preferences
  language                String   @default("de")
  timezone                String   @default("Europe/Berlin")
  dateFormat              String   @default("DD/MM/YYYY")
  theme                   String   @default("system")
  
  // Content preferences
  contentLanguages        Json?
  interestedTopics        Json?
  hideAds                 Boolean  @default(false)
  
  // Editor-specific settings
  editorBio               String?
  editorSpecialties       Json?
  authorPageVisible       Boolean  @default(true)
}
```

#### EditorPermissions Model
```prisma
model EditorPermissions {
  id                  String     @id @default(uuid())
  userId              String     
  categoryId          String?    // null = all categories
  
  // Permissions
  canCreatePosts      Boolean    @default(true)
  canEditPosts        Boolean    @default(true)
  canDeletePosts      Boolean    @default(false)
  canPublishPosts     Boolean    @default(false)
  canManageComments   Boolean    @default(false)
  canUploadMedia      Boolean    @default(true)
  
  // Content limits
  maxPostsPerMonth    Int?       // null = unlimited
  maxImagesPerPost    Int        @default(10)
  maxVideoLength      Int        @default(300)
  
  grantedBy           String     // Admin who granted permissions
}
```

### Role-Based Access Control (RBAC)

#### Updated Role Hierarchy
```typescript
const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.USER]: 0,
  [Role.PREMIUM]: 1,
  [Role.EDITOR]: 2,
  [Role.ADMIN]: 3,
};
```

#### Enhanced Permissions (policies.json)
```json
{
  "admin": {
    "*": "allow",
    "posts": ["create", "read", "update", "delete", "archive", "publish"],
    "users": ["create", "read", "update", "delete", "manage_permissions"],
    "premium_content": ["read", "create", "manage"],
    "subscription": ["read", "manage"]
  },
  "editor": {
    "posts": ["create", "read", "update", "delete:own", "archive:own"],
    "premium_content": ["read", "create:own"],
    "settings": ["read:self", "update:self"]
  },
  "premium": {
    "posts": ["read", "premium_read"],
    "premium_content": ["read"],
    "subscription": ["read:self", "manage:self"]
  },
  "user": {
    "posts": ["read", "trial_read"],
    "premium_content": ["trial_read"],
    "subscription": ["read:self", "upgrade"]
  }
}
```

## 🔧 Core Components

### 1. Trial Management System (`/lib/trial.ts`)

Key functions:
- `getUserTrialStatus(userId)` - Check current trial status
- `startTrial(userId)` - Initialize 7-day trial
- `autoStartTrialIfEligible(userId)` - Auto-start for new users
- `shouldRestrictContent(userId)` - Determine content restrictions

### 2. PaywallGuard Component (`/components/monetization/PaywallGuard.tsx`)

Features:
- Content preview with blur effect after 2nd paragraph
- Dynamic CTA based on trial status
- Upgrade prompts for expired trials
- Trial countdown notifications

### 3. Enhanced Settings Pages (`/app/profile/settings/enhanced/page.tsx`)

Comprehensive settings interface:
- **Profile Tab**: Basic information, social links, editor settings
- **Notifications Tab**: Email preferences, alert settings
- **Privacy Tab**: Visibility controls, contact preferences  
- **Appearance Tab**: Theme selection, display options
- **Subscription Tab**: Plan management, billing info
- **Security Tab**: Password change, 2FA, account deletion

### 4. Editor Management (`/app/admin/editors/page.tsx`)

Admin interface for:
- Promoting users to editor role
- Managing editor permissions by category
- Setting content limits and restrictions
- Monitoring editor activity

## 🚀 API Endpoints

### Trial Management
- `GET /api/trial/status` - Get user trial status
- `POST /api/trial/start` - Start 7-day trial

### Settings Management
- `GET /api/settings` - Fetch user settings
- `POST /api/settings` - Update user settings

### Admin Endpoints
- `GET /api/admin/users` - List users with filtering
- `POST /api/admin/users/promote` - Promote user role
- `GET|POST|DELETE /api/admin/editor-permissions` - Manage editor permissions

### Subscription (Stripe Integration)
- `POST /api/subscription/create-checkout` - Create Stripe checkout
- `GET /api/subscription/portal` - Access customer portal

## 🎨 User Interface Features

### Enhanced Pricing Page (`/pricing/enhanced`)
- Dynamic pricing based on billing cycle
- Real-time trial status display  
- Role-aware upgrade options
- Integrated Stripe checkout

### Paywall Implementation
- Gradual content blur effect
- Trial countdown notifications
- Contextual upgrade prompts
- Seamless trial activation

### Settings Dashboard
- Role-based feature availability
- Real-time settings sync
- Professional UI/UX design
- Responsive layout

## 🔐 Security Features

### Access Control
- Route-level middleware protection
- API endpoint permission checking
- Component-level role validation
- Secure session management

### Audit Logging
- All permission changes logged
- User promotion tracking
- Settings modification history
- Security event monitoring

### Data Protection
- GDPR-compliant settings
- Secure password handling
- Session security controls
- Privacy preference management

## 📱 User Experience

### New User Journey
1. **Registration** → Automatic trial activation
2. **Trial Period** → Full access for 7 days
3. **Trial Expiry** → Content restrictions with upgrade prompts
4. **Upgrade** → Seamless transition to premium

### Premium User Benefits
- Unrestricted content access
- Advanced settings options
- Priority support access
- Community features

### Editor Workflow
- Category-specific permissions
- Content creation tools
- Publish/draft management
- Analytics access

## 🛠️ Installation & Setup

### 1. Database Migration
```bash
# Apply schema changes
npx prisma db push

# Run migration script
npx tsx scripts/migrate-user-roles-system.ts
```

### 2. Environment Variables
```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Elevated Admin Emails
ELEVATED_ADMIN_EMAILS=admin@fluxao.com,superadmin@fluxao.com
```

### 3. Feature Flags (Optional)
```env
ENABLE_TRIAL_SYSTEM=true
ENABLE_EDITOR_PERMISSIONS=true
ENABLE_ADVANCED_SETTINGS=true
```

## 📊 Monitoring & Analytics

### Trial Conversion Tracking
- Trial activation rates
- Conversion to paid plans
- Content engagement during trial
- Churn analysis

### Role Usage Statistics
- Editor content creation metrics
- Admin action logging
- User settings modification patterns
- Feature adoption rates

## 🧪 Testing

### Unit Tests
- Trial logic validation
- RBAC permission checking
- Settings CRUD operations
- Payment flow testing

### Integration Tests  
- End-to-end user journeys
- Role transition scenarios
- Paywall functionality
- Stripe webhook handling

## 🚀 Deployment Considerations

### Performance Optimization
- Settings caching strategy
- Trial status optimization
- Database query efficiency
- Component lazy loading

### Scalability
- Role-based data partitioning
- Efficient permission checking
- Optimized paywall rendering
- Settings sync mechanisms

## 📈 Future Enhancements

### Planned Features
- Team management for Pro plans
- Advanced editor analytics
- Custom role definitions
- Multi-tier trial system
- A/B testing framework

### Integration Opportunities
- Third-party auth providers
- Advanced payment methods
- Enterprise SSO support
- CRM system integration

## 🎯 Business Impact

### Revenue Optimization
- Effective trial-to-paid conversion
- Reduced churn through better UX
- Tiered pricing strategy
- Premium content monetization

### User Engagement
- Improved onboarding experience
- Role-appropriate feature access
- Personalized content delivery
- Community building tools

### Operational Efficiency
- Streamlined user management
- Automated permission handling
- Comprehensive audit trails
- Scalable content moderation

---

## 📞 Support & Maintenance

For questions or issues with the user roles system:
1. Check the audit logs in `/admin/security`
2. Review user permissions in `/admin/editors`  
3. Monitor trial conversion metrics
4. Test paywall functionality regularly

**System Status**: ✅ Production Ready
**Last Updated**: 2025-08-30
**Version**: 1.0.0