import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';

export interface SecurityValidationResult {
  valid: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean;
}

export interface SecurityConfig {
  maxRequestsPerHour: number;
  maxTokensPerDay: number;
  blockedKeywords: string[];
  suspiciousPatterns: RegExp[];
  rolePermissions: Record<string, string[]>;
}

export class SecurityValidator {
  private config: SecurityConfig = {
    maxRequestsPerHour: 100,
    maxTokensPerDay: 50000,
    blockedKeywords: [
      // System manipulation
      'DROP TABLE', 'DELETE FROM', 'TRUNCATE', 'ALTER TABLE',
      'GRANT ALL', 'REVOKE', 'CREATE USER', 'DROP USER',
      'UPDATE users SET', 'INSERT INTO users',
      
      // Code injection
      'eval(', 'exec(', 'system(', 'shell_exec', 'passthru',
      'proc_open', 'popen', 'file_get_contents',
      
      // Sensitive data access
      'password', 'private_key', 'api_key', 'secret',
      'credit_card', 'bank_account', 'ssn', 'social_security',
      
      // Harmful content generation
      'generate virus', 'create malware', 'hack into',
      'ddos attack', 'sql injection', 'xss attack',
      
      // Privacy violations
      'personal information', 'email addresses', 'phone numbers',
      'home addresses', 'private messages', 'confidential data'
    ],
    suspiciousPatterns: [
      /(?:select|union|insert|update|delete|drop)\s+.*(?:from|into|table)/gi,
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:\s*[^;]+/gi,
      /on\w+\s*=\s*["'][^"']*["']/gi,
      /\${.*?}/g, // Template injection
      /\{\{.*?\}\}/g, // Template injection
    ],
    rolePermissions: {
      'ADMIN': [
        'system-monitoring', 'user-management', 'content-generation',
        'moderation', 'analytics', 'configuration', 'all-providers'
      ],
      'EDITOR': [
        'content-generation', 'moderation', 'analytics', 'limited-providers'
      ],
      'USER': [
        'basic-content', 'limited-requests'
      ]
    }
  };

  async validateRequest(requestData: any, user: any): Promise<SecurityValidationResult> {
    try {
      // Rate limiting check
      const rateLimitResult = await this.checkRateLimit(user.id);
      if (!rateLimitResult.valid) {
        return rateLimitResult;
      }

      // Permission check
      const permissionResult = this.checkPermissions(requestData, user);
      if (!permissionResult.valid) {
        return permissionResult;
      }

      // Content safety check
      const contentResult = this.checkContentSafety(requestData);
      if (!contentResult.valid) {
        return contentResult;
      }

      // Token quota check
      const quotaResult = await this.checkTokenQuota(user.id);
      if (!quotaResult.valid) {
        return quotaResult;
      }

      // Log successful validation
      await this.logSecurityEvent({
        userId: user.id,
        action: 'request_validated',
        severity: 'low',
        details: { requestType: requestData.task || 'unknown' }
      });

      return {
        valid: true,
        severity: 'low',
        blocked: false
      };

    } catch (error) {
      logger.error({ error, userId: user.id }, 'Security validation failed');
      
      // Fail secure - block if validation fails
      return {
        valid: false,
        reason: 'Security validation error',
        severity: 'critical',
        blocked: true
      };
    }
  }

  private async checkRateLimit(userId: string): Promise<SecurityValidationResult> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    try {
      const recentRequests = await prisma.aITaskLog.count({
        where: {
          userId,
          createdAt: {
            gte: oneHourAgo
          }
        }
      });

      if (recentRequests >= this.config.maxRequestsPerHour) {
        await this.logSecurityEvent({
          userId,
          action: 'rate_limit_exceeded',
          severity: 'medium',
          details: { requestCount: recentRequests, limit: this.config.maxRequestsPerHour }
        });

        return {
          valid: false,
          reason: `Rate limit exceeded: ${recentRequests}/${this.config.maxRequestsPerHour} requests per hour`,
          severity: 'medium',
          blocked: true
        };
      }

      return {
        valid: true,
        severity: 'low',
        blocked: false
      };
    } catch (error) {
      logger.error({ error, userId }, 'Rate limit check failed');
      return {
        valid: false,
        reason: 'Rate limit check failed',
        severity: 'high',
        blocked: true
      };
    }
  }

  private checkPermissions(requestData: any, user: any): SecurityValidationResult {
    const userRole = user.role || 'USER';
    const allowedActions = this.config.rolePermissions[userRole] || [];
    
    // Check provider access
    if (requestData.provider && !this.canUseProvider(userRole, requestData.provider)) {
      return {
        valid: false,
        reason: `Provider ${requestData.provider} not allowed for role ${userRole}`,
        severity: 'medium',
        blocked: true
      };
    }

    // Check task permissions
    if (requestData.task && !this.canPerformTask(userRole, requestData.task)) {
      return {
        valid: false,
        reason: `Task ${requestData.task} not allowed for role ${userRole}`,
        severity: 'medium',
        blocked: true
      };
    }

    // Admin-only actions
    if (userRole !== 'ADMIN') {
      const adminOnlyKeywords = [
        'system config', 'user management', 'database', 'server',
        'admin', 'privilege', 'root', 'sudo'
      ];

      const content = JSON.stringify(requestData).toLowerCase();
      for (const keyword of adminOnlyKeywords) {
        if (content.includes(keyword)) {
          return {
            valid: false,
            reason: `Admin-only content detected: ${keyword}`,
            severity: 'high',
            blocked: true
          };
        }
      }
    }

    return {
      valid: true,
      severity: 'low',
      blocked: false
    };
  }

  private checkContentSafety(requestData: any): SecurityValidationResult {
    const content = JSON.stringify(requestData).toLowerCase();

    // Check for blocked keywords
    for (const keyword of this.config.blockedKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        return {
          valid: false,
          reason: `Blocked keyword detected: ${keyword}`,
          severity: 'high',
          blocked: true
        };
      }
    }

    // Check for suspicious patterns
    for (const pattern of this.config.suspiciousPatterns) {
      if (pattern.test(content)) {
        return {
          valid: false,
          reason: `Suspicious pattern detected: ${pattern.source}`,
          severity: 'high',
          blocked: true
        };
      }
    }

    // Check for potential injection attacks
    if (this.detectInjectionAttempt(content)) {
      return {
        valid: false,
        reason: 'Potential injection attack detected',
        severity: 'critical',
        blocked: true
      };
    }

    return {
      valid: true,
      severity: 'low',
      blocked: false
    };
  }

  private async checkTokenQuota(userId: string): Promise<SecurityValidationResult> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    try {
      const dailyUsage = await prisma.aITaskLog.aggregate({
        where: {
          userId,
          createdAt: {
            gte: oneDayAgo
          }
        },
        _sum: {
          tokensUsed: true
        }
      });

      const tokensUsed = dailyUsage._sum.tokensUsed || 0;
      
      if (tokensUsed >= this.config.maxTokensPerDay) {
        await this.logSecurityEvent({
          userId,
          action: 'token_quota_exceeded',
          severity: 'medium',
          details: { tokensUsed, limit: this.config.maxTokensPerDay }
        });

        return {
          valid: false,
          reason: `Daily token quota exceeded: ${tokensUsed}/${this.config.maxTokensPerDay}`,
          severity: 'medium',
          blocked: true
        };
      }

      return {
        valid: true,
        severity: 'low',
        blocked: false
      };
    } catch (error) {
      logger.error({ error, userId }, 'Token quota check failed');
      return {
        valid: false,
        reason: 'Token quota check failed',
        severity: 'high',
        blocked: true
      };
    }
  }

  private canUseProvider(role: string, provider: string): boolean {
    const providerPermissions = {
      'claude': ['ADMIN', 'EDITOR'],
      'openai': ['ADMIN', 'EDITOR'],
      'gemini': ['ADMIN', 'EDITOR'],
      'llama': ['ADMIN'], // Local only, admin access
      'cohere': ['ADMIN']
    };

    const allowedRoles = providerPermissions[provider] || [];
    return allowedRoles.includes(role);
  }

  private canPerformTask(role: string, task: string): boolean {
    const taskPermissions = {
      'content-generation': ['ADMIN', 'EDITOR'],
      'analysis': ['ADMIN', 'EDITOR'],
      'moderation': ['ADMIN', 'EDITOR'],
      'summarization': ['ADMIN', 'EDITOR'],
      'translation': ['ADMIN', 'EDITOR'],
      'SEO-optimization': ['ADMIN', 'EDITOR'],
      'trend-analysis': ['ADMIN'],
      'monitoring': ['ADMIN'],
      'multi-provider': ['ADMIN']
    };

    const allowedRoles = taskPermissions[task] || ['USER'];
    return allowedRoles.includes(role);
  }

  private detectInjectionAttempt(content: string): boolean {
    // SQL Injection patterns
    const sqlPatterns = [
      /(\b(select|union|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|into|set|where|table)\b)/gi,
      /(\b(or|and)\b.*[=<>].*\b(or|and)\b)/gi,
      /(;|\||&|`|\$\(|\$\{)/g
    ];

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /on\w+\s*=\s*["'][^"']*["']/gi,
      /javascript:\s*[^;]+/gi
    ];

    // Command injection patterns
    const cmdPatterns = [
      /(\||;|&|`|\$\(|\$\{).*(rm|cat|ls|ps|kill|chmod|chown|wget|curl|nc|telnet)/gi,
      /(eval|exec|system|shell_exec|passthru|proc_open)\s*\(/gi
    ];

    const allPatterns = [...sqlPatterns, ...xssPatterns, ...cmdPatterns];
    
    return allPatterns.some(pattern => pattern.test(content));
  }

  private async logSecurityEvent(event: {
    userId: string;
    action: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: any;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          userId: event.userId,
          action: event.action,
          severity: event.severity,
          details: JSON.stringify(event.details),
          timestamp: new Date()
        }
      });

      // Alert on high/critical events
      if (event.severity === 'high' || event.severity === 'critical') {
        logger.warn({
          userId: event.userId,
          action: event.action,
          severity: event.severity,
          details: event.details
        }, 'High severity security event');
        
        // Could trigger immediate alerts here
        await this.triggerSecurityAlert(event);
      }
    } catch (error) {
      logger.error({ error, event }, 'Failed to log security event');
    }
  }

  private async triggerSecurityAlert(event: any): Promise<void> {
    // In production, this would trigger immediate notifications
    // to security team, potentially block user, etc.
    logger.error({
      userId: event.userId,
      action: event.action,
      severity: event.severity
    }, 'SECURITY ALERT triggered');
  }

  async getSecurityStats(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalEvents: number;
    blockedRequests: number;
    topThreats: Array<{ action: string; count: number }>;
    riskUsers: Array<{ userId: string; eventCount: number }>;
  }> {
    const timeAgo = new Date();
    switch (timeRange) {
      case 'day':
        timeAgo.setDate(timeAgo.getDate() - 1);
        break;
      case 'week':
        timeAgo.setDate(timeAgo.getDate() - 7);
        break;
      case 'month':
        timeAgo.setMonth(timeAgo.getMonth() - 1);
        break;
    }

    try {
      const [totalEvents, topThreats, riskUsers] = await Promise.all([
        // Total security events
        prisma.securityEvent.count({
          where: {
            timestamp: { gte: timeAgo }
          }
        }),

        // Top threat types
        prisma.securityEvent.groupBy({
          by: ['action'],
          where: {
            timestamp: { gte: timeAgo }
          },
          _count: {
            action: true
          },
          orderBy: {
            _count: {
              action: 'desc'
            }
          },
          take: 5
        }),

        // Users with most security events
        prisma.securityEvent.groupBy({
          by: ['userId'],
          where: {
            timestamp: { gte: timeAgo },
            severity: {
              in: ['medium', 'high', 'critical']
            }
          },
          _count: {
            userId: true
          },
          orderBy: {
            _count: {
              userId: 'desc'
            }
          },
          take: 10
        })
      ]);

      const blockedRequests = topThreats
        .filter(threat => threat.action.includes('exceeded') || threat.action.includes('blocked'))
        .reduce((sum, threat) => sum + threat._count.action, 0);

      return {
        totalEvents,
        blockedRequests,
        topThreats: topThreats.map(threat => ({
          action: threat.action,
          count: threat._count.action
        })),
        riskUsers: riskUsers.map(user => ({
          userId: user.userId,
          eventCount: user._count.userId
        }))
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get security stats');
      throw error;
    }
  }

  async adjustSecurityLevel(level: 'low' | 'medium' | 'high'): Promise<void> {
    // Adjust security thresholds based on threat level
    switch (level) {
      case 'high':
        this.config.maxRequestsPerHour = 50;
        this.config.maxTokensPerDay = 25000;
        break;
      case 'medium':
        this.config.maxRequestsPerHour = 75;
        this.config.maxTokensPerDay = 37500;
        break;
      case 'low':
      default:
        this.config.maxRequestsPerHour = 100;
        this.config.maxTokensPerDay = 50000;
        break;
    }

    logger.info({ securityLevel: level, config: this.config }, 'Security level adjusted');
  }

  // Content filtering for responses
  filterAIResponse(response: string, context: any): { 
    filtered: string; 
    blocked: boolean; 
    reasons: string[] 
  } {
    let filtered = response;
    const reasons: string[] = [];
    let blocked = false;

    // Remove sensitive information patterns
    const sensitivePatterns = [
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, reason: 'Email address removed' },
      { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, reason: 'Phone number removed' },
      { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, reason: 'Credit card number removed' },
      { pattern: /\b[A-Z0-9]{20,}\b/g, reason: 'Potential API key removed' }
    ];

    for (const { pattern, reason } of sensitivePatterns) {
      if (pattern.test(filtered)) {
        filtered = filtered.replace(pattern, '[FILTERED]');
        reasons.push(reason);
      }
    }

    // Check for harmful content
    const harmfulKeywords = [
      'illegal', 'hack', 'exploit', 'virus', 'malware',
      'personal information', 'private data', 'confidential'
    ];

    const lowerResponse = response.toLowerCase();
    for (const keyword of harmfulKeywords) {
      if (lowerResponse.includes(keyword)) {
        blocked = true;
        reasons.push(`Potentially harmful content detected: ${keyword}`);
        break;
      }
    }

    if (blocked) {
      filtered = 'Response blocked due to safety concerns. Please rephrase your request.';
    }

    return { filtered, blocked, reasons };
  }
}

