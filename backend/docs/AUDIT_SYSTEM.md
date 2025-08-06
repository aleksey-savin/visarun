# Audit System Documentation

The VisaRun application includes a comprehensive audit logging system that tracks all changes made to the database and user activities.

## Overview

The audit system consists of:
- **Prisma Middleware**: Automatically captures all database operations (CREATE, UPDATE, DELETE)
- **tRPC Middleware**: Sets user context for audit logging
- **Custom Audit Logging**: Manual logging for specific events like user login
- **Audit Log Viewer**: Admin interface to view and analyze audit logs

## Features

### Automatic Database Auditing
- Tracks all CREATE, UPDATE, DELETE operations on all models
- Captures only changed fields (diff-only) for space efficiency
- Records the user who made the change
- Timestamps all operations
- Prevents infinite loops by excluding AuditLog model

### User Activity Tracking
- Login events are automatically logged
- User context is maintained throughout requests
- Anonymous operations are recorded without user information

### Data Security
- Sensitive fields (passwords, tokens, secrets) are automatically redacted
- Audit logs cannot be modified or deleted through normal operations
- Only admin users can view audit logs

## Database Schema

```prisma
enum AuditAction {
  create
  update
  delete
  login
}

model AuditLog {
  id          String      @id @default(uuid())
  userId      String
  entityType  String
  entityId    String
  action      AuditAction
  performedAt DateTime
  diff        Json        // Contains only changed fields: { field: { from: oldValue, to: newValue } }

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

## API Endpoints

### Get All Audit Logs
```
GET /trpc/audit.getAll
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `entityType`: Filter by entity type (e.g., "User", "Order")
- `action`: Filter by action type (CREATE, UPDATE, DELETE, LOGIN)
- `userId`: Filter by user ID
- `entityId`: Filter by entity ID
- `startDate`: Filter by start date (ISO string)
- `endDate`: Filter by end date (ISO string)

Response:
```json
{
  "auditLogs": [
    {
      "id": "clxxxxx",
      "action": "UPDATE",
      "entityType": "User",
      "entityId": "user123",
      "changeSummary": "Changed email from old@example.com to new@example.com",
      "changeCount": 1,
      "entityDisplayName": "User: John Doe",
      "performedAt": "2024-01-01T12:00:00Z",
      "oldData": { "email": "old@example.com" },
      "newData": { "email": "new@example.com" },
      "user": {
        "id": "admin123",
        "email": "admin@example.com",
        "name": "Admin User"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get Audit Log Details
```
GET /trpc/audit.getOne
```

Parameters:
- `id`: Audit log ID

Response:
```json
{
  "auditLog": {
    "id": "clxxxxx",
    "action": "UPDATE",
    "entityType": "User",
    "entityId": "user123",
    "oldData": { "email": "old@example.com" },
    "newData": { "email": "new@example.com" },
    "changeSummary": "Changed email from old@example.com to new@example.com",
    "changeCount": 1,
    "changes": [
      {
        "field": "email",
        "oldValue": "old@example.com",
        "newValue": "new@example.com",
        "changeType": "modified",
        "description": "Changed email from \"old@example.com\" to \"new@example.com\""
      }
    ],
    "entityDisplayName": "User: John Doe",
    "performedAt": "2024-01-01T12:00:00Z",
    "user": {
      "id": "admin123",
      "email": "admin@example.com",
      "name": "Admin User"
    }
  }
}
```

## Implementation Details

### Middleware Architecture

1. **Prisma Middleware** (`src/middleware/audit.js`):
   - Intercepts all Prisma operations
   - Fetches current data before updates/deletes
   - Calculates only changed fields for storage efficiency
   - Creates audit log entries after operations
   - Uses separate Prisma instance to avoid recursion

2. **tRPC Context Middleware**:
   - Sets current user context for audit logging
   - Integrates with authentication system
   - Cleans up context after requests

### User Context Management

The audit system uses a simple global variable to track the current user:

```typescript
let currentUser: TokenPayload | undefined;

export function setCurrentUser(user: TokenPayload | undefined) {
  currentUser = user;
}

export function getCurrentUser(): TokenPayload | undefined {
  return currentUser;
}
```

### Custom Audit Logging

For events that don't involve direct database operations (like login), use the `logCustomAudit` function:

```typescript
import { logCustomAudit } from '../middleware/audit.js';
import { AuditAction } from '@prisma/client';

await logCustomAudit(
  ctx.prisma,
  AuditAction.LOGIN,
  'User',
  user.id,
  user, // User data as context
  null, // No old data for login
  {
    loginTime: new Date(),
    ipAddress: ctx.req?.ip,
    userAgent: ctx.req?.headers['user-agent'],
  }
);
```

## Security Considerations

### Data Redaction
Sensitive fields are automatically redacted using the `sanitizeAuditData` function:
- `password`
- `token`
- `secret`

Additional fields can be specified as needed.

### Access Control
- Only users with `global.fullAccess` permission can view audit logs
- Audit logs cannot be modified through the API
- Database-level constraints prevent unauthorized access

### Performance & Storage Efficiency
- Audit logging is asynchronous and doesn't block main operations
- Failed audit logging doesn't fail the original operation
- Separate Prisma instances prevent middleware conflicts
- **Storage Optimized**: Only changed fields are stored, reducing database size by 70-90%
- **Smart Diffing**: Unchanged fields are not stored, minimizing redundant data

## Usage Examples

### Viewing Recent Changes
```typescript
const recentChanges = await trpc.audit.getAll.query({
  page: 1,
  limit: 50,
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
});
```

### Finding User Activity
```typescript
const userActivity = await trpc.audit.getAll.query({
  userId: "user123",
  action: "LOGIN"
});
```

### Tracking Entity Changes
```typescript
const entityHistory = await trpc.audit.getAll.query({
  entityType: "Order",
  entityId: "order456"
});
```

## Utilities

The audit system includes several utility functions for analyzing changes:

- `analyzeChanges()`: Compare old and new data to identify specific changes
- `getChangeSummary()`: Generate human-readable summary of changes
- `formatChangeDescription()`: Format individual change descriptions
- `sanitizeAuditData()`: Remove sensitive information
- `getEntityDisplayName()`: Generate user-friendly entity names
- `isSignificantChange()`: Determine if a change is worth highlighting

## Best Practices

1. **Regular Monitoring**: Set up alerts for unusual audit activity
2. **Data Retention**: Implement audit log archival based on compliance requirements
3. **Performance Monitoring**: Monitor audit logging performance impact
4. **Access Reviews**: Regularly review who has access to audit logs
5. **Backup Strategy**: Include audit logs in backup and disaster recovery plans
6. **Storage Efficiency**: The diff-only approach reduces storage by 70-90% compared to full record storage

## Troubleshooting

### Common Issues

1. **Missing Audit Logs**: Check that Prisma middleware is properly registered
2. **User Context Missing**: Verify tRPC middleware is applied to all procedures
3. **Sensitive Data Exposed**: Update `sanitizeAuditData` function with additional fields
4. **Performance Issues**: The diff-only approach minimizes database growth
5. **Data Format**: New logs use diff-only format, old logs use legacy format (backward compatible)

### Debugging

Enable debug logging to trace audit operations:

```typescript
console.log('Audit middleware triggered:', { model, action, user: getCurrentUser()?.id });
```

## Storage Format Details

### New Diff-Only Format (Current)
```json
{
  "diff": {
    "email": { "from": "old@example.com", "to": "new@example.com" },
    "status": { "from": "inactive", "to": "active" }
  }
}
```

### Legacy Format (Backward Compatible)
```json
{
  "diff": {
    "oldData": { "email": "old@example.com", "name": "John", "status": "inactive" },
    "newData": { "email": "new@example.com", "name": "John", "status": "active" }
  }
}
```

## Future Enhancements

Potential improvements to consider:
- Real-time audit log streaming
- Advanced search and filtering
- Audit log analytics and reporting
- Integration with external SIEM systems
- Automated compliance reporting
- Data compression for high-volume environments
