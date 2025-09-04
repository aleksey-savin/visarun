/**
 * Utility functions for user-related operations
 */

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  permissions: string[];
}

/**
 * Get the display name for a user
 * Priority: firstName + lastName > email username > "User"
 */
export function getUserDisplayName(
  user: User | null,
  userEmail?: string | null,
  userFirstName?: string | null,
  userLastName?: string | null
): string {
  // Use individual parameters if provided (from auth context)
  if (userFirstName || userLastName) {
    return `${userFirstName || ''} ${userLastName || ''}`;
  }

  // Use user object if provided
  if (user?.firstName && user?.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  // Fall back to first name only
  if (userFirstName) {
    return userFirstName;
  }
  if (user?.firstName) {
    return user.firstName;
  }

  // Fall back to email username
  const email = userEmail || user?.email;
  if (email) {
    const username = email.split('@')[0];
    if (username) {
      return username;
    }
  }

  // Final fallback
  return 'User';
}

/**
 * Get user initials for avatar displays
 * Priority: firstName + lastName initials > email initials > "U"
 */
export function getUserInitials(
  user: User | null,
  userEmail?: string | null,
  userFirstName?: string | null,
  userLastName?: string | null
): string {
  // Use individual parameters if provided (from auth context)
  if (userFirstName && userLastName) {
    return `${userFirstName.charAt(0)}${userLastName.charAt(0)}`.toUpperCase();
  }

  // Use user object if provided
  if (user?.firstName && user?.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  // Fall back to first name only
  if (userFirstName) {
    return userFirstName.charAt(0).toUpperCase();
  }
  if (user?.firstName) {
    return user.firstName.charAt(0).toUpperCase();
  }

  // Fall back to email
  const email = userEmail || user?.email;
  if (email) {
    const username = email.split('@')[0];
    if (username && username.length > 0) {
      return username.charAt(0).toUpperCase();
    }
  }

  // Final fallback
  return 'U';
}

/**
 * Get the user's full name if available, otherwise return null
 */
export function getUserFullName(
  user: User | null,
  userFirstName?: string | null,
  userLastName?: string | null
): string | null {
  // Use individual parameters if provided (from auth context)
  if (userFirstName && userLastName) {
    return `${userFirstName} ${userLastName}`;
  }

  // Use user object if provided
  if (user?.firstName && user?.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  return null;
}
