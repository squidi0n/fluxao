import { ForbiddenError } from './errors';
import policies from './policies.json';

// Define Role enum manually for Edge Runtime compatibility
export enum Role {
  USER = 'USER',
  PREMIUM = 'PREMIUM',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

/**
 * Role hierarchy levels for permission checking
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.USER]: 0,
  [Role.PREMIUM]: 1,
  [Role.EDITOR]: 2,
  [Role.ADMIN]: 3,
};

type Action = string;
type Resource = string;
type PolicyMap = typeof policies;

interface User {
  id: string;
  role: Role | string;
  email?: string;
}

/**
 * Check if a user has a specific role or higher
 * @param userRole User's current role
 * @param requiredRole Required role for access
 * @returns True if user has sufficient permissions
 */
export function hasRole(userRole: Role | string | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;

  const userLevel = ROLE_HIERARCHY[userRole as Role];
  const requiredLevel = ROLE_HIERARCHY[requiredRole];

  if (userLevel === undefined || requiredLevel === undefined) {
    return false;
  }

  return userLevel >= requiredLevel;
}

/**
 * Assert that a user has a specific role or throw an error
 * @param userRole User's current role
 * @param requiredRole Required role for access
 * @throws ForbiddenError if user lacks required role
 */
export function assertRole(userRole: Role | string | undefined, requiredRole: Role): void {
  if (!hasRole(userRole, requiredRole)) {
    throw new ForbiddenError(`${requiredRole} role required`);
  }
}

/**
 * Check if user is an admin
 * @param userRole User's role
 * @returns True if user is an admin
 */
export function isAdmin(userRole: Role | string | undefined): boolean {
  return hasRole(userRole, Role.ADMIN);
}

/**
 * Check if user is an editor or admin
 * @param userRole User's role
 * @returns True if user is an editor or admin
 */
export function isEditor(userRole: Role | string | undefined): boolean {
  return hasRole(userRole, Role.EDITOR);
}

/**
 * Check if user is premium or higher (premium, editor, admin)
 * @param userRole User's role
 * @returns True if user is premium or higher
 */
export function isPremiumOrHigher(userRole: Role | string | undefined): boolean {
  return hasRole(userRole, Role.PREMIUM);
}

/**
 * Check if user has access to premium content
 * @param userRole User's role
 * @returns True if user can access premium content
 */
export function hasPremiumAccess(userRole: Role | string | undefined): boolean {
  return hasRole(userRole, Role.PREMIUM);
}

/**
 * Get all roles that have access to a given role level
 * @param minimumRole Minimum required role
 * @returns Array of roles with sufficient permissions
 */
export function getRolesWithAccess(minimumRole: Role): Role[] {
  const minimumLevel = ROLE_HIERARCHY[minimumRole];
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level >= minimumLevel)
    .map(([role]) => role as Role);
}

/**
 * Check if a user can perform an action on a resource
 * @param user User object with role
 * @param action Action to perform (create, read, update, delete, etc.)
 * @param resource Resource type (posts, users, newsletter, flags, etc.)
 * @param targetUserId Optional target user ID for self-checks
 * @returns True if user can perform the action
 */
export function can(
  user: User | null | undefined,
  action: Action,
  resource: Resource,
  targetUserId?: string,
): boolean {
  if (!user) return false;

  // Check for elevated admin users from environment
  const elevatedAdmins = process.env.ELEVATED_ADMIN_EMAILS?.split(',') || [];
  if (elevatedAdmins.includes(user.email || '')) {
    return true;
  }

  const role = user.role.toLowerCase() as keyof PolicyMap;
  const rolePolicy = policies[role];

  if (!rolePolicy) return false;

  // Check for wildcard permission (admin only)
  if (rolePolicy['*'] === 'allow') return true;

  // Check resource-specific permissions
  const resourcePolicy = rolePolicy[resource as keyof typeof rolePolicy];

  if (!resourcePolicy) return false;

  if (Array.isArray(resourcePolicy)) {
    // Check for self-only permissions
    if (action.endsWith(':self')) {
      const baseAction = action.replace(':self', '');
      if (resourcePolicy.includes(`${baseAction}:self`) && targetUserId === user.id) {
        return true;
      }
      return false;
    }

    return resourcePolicy.includes(action);
  }

  return false;
}

/**
 * Assert that a user can perform an action or throw an error
 * @param user User object with role
 * @param action Action to perform
 * @param resource Resource type
 * @param targetUserId Optional target user ID for self-checks
 * @throws ForbiddenError if user lacks permission
 */
export function assertCan(
  user: User | null | undefined,
  action: Action,
  resource: Resource,
  targetUserId?: string,
): void {
  if (!can(user, action, resource, targetUserId)) {
    throw new ForbiddenError(`Cannot ${action} ${resource}`);
  }
}

/**
 * Require a specific role for a route or action
 * @param user User object or session
 * @param requiredRole Minimum required role
 * @returns User object if authorized
 * @throws ForbiddenError if user lacks required role
 */
export function requireRole(
  user: { role: Role | string } | null | undefined,
  requiredRole: Role,
): typeof user {
  if (!user || !hasRole(user.role, requiredRole)) {
    throw new ForbiddenError(`${requiredRole} role required`);
  }
  return user;
}
