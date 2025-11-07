# Action Center

The Action Center is a unified dashboard that aggregates all items requiring admin attention across the Ezra platform.

## Overview

The Action Center consolidates action items from six different queues:

1. **KYC** - Provider and customer verification reviews
2. **Bookings** - Booking confirmations, reschedules, and cancellations
3. **Refunds & Disputes** - Customer refund requests and dispute resolution
4. **Payouts** - Provider payout issues and retries
5. **Webhooks** - Failed webhook deliveries that need retry
6. **Content Flags** - Flagged reviews, profiles, and inappropriate content

## File Structure

```
app/dashboard/action-center/
├── page.tsx                    # Main Action Center page with tabs
└── README.md                   # This file

components/action-center/
├── ActionTable.tsx              # Table wrapper for action items
├── ActionRow.tsx                # Individual row with queue-specific actions
├── Filters.tsx                  # Filter controls (mine/unassigned/overdue, severity, reason)
└── NotesDrawer.tsx              # Right drawer for timeline and notes

lib/mocks/action-center/
├── data.ts                      # Static seed data for each queue
└── service.ts                   # Mock API service with simulated latency

types/
└── action-center.ts             # TypeScript interfaces and enums
```

## Current Implementation

This is a **MOCK-ONLY** implementation using static data and simulated API calls. All data is stored in-memory and will reset on page reload.

### Mock Service Layer

The service layer (`lib/mocks/action-center/service.ts`) simulates API calls with:
- Artificial latency (250-600ms) for realistic UX
- In-memory state management
- 10% failure rate on webhook retries (to demonstrate error handling)

## Wiring Real APIs

To connect to your backend, replace the mock service calls with real API calls:

### 1. Replace Service Layer

Update `lib/mocks/action-center/service.ts` (or create a new `lib/api/action-center.ts`):

```typescript
// Before (Mock)
export async function getSummary(): Promise<ActionCenterSummary> {
  await delay();
  // ... mock logic
}

// After (Real API)
export async function getSummary(): Promise<ActionCenterSummary> {
  const response = await fetch('/api/action-center/summary', {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  return response.json();
}
```

### 2. Backend Endpoints Needed

Your backend should implement these endpoints:

```
GET  /api/action-center/summary
     → Returns { totalOpen: number, queues: Record<Queue, number> }

GET  /api/action-center/:queue
     → Returns { items: ActionItem[], total: number, totalsByReason: {} }
     → Query params: page, limit, assignedTo, overdue, severity[], reasonCode[], search

POST /api/action-center/items/:id/assign
     → Assigns item to admin
     → Body: { assigneeId: string }

POST /api/action-center/items/:id/resolve
     → Marks item as resolved
     → Body: { resolution: string, note?: string }

POST /api/action-center/items/:id/snooze
     → Snoozes item until later
     → Body: { until: string (ISO) }

POST /api/action-center/items/:id/action
     → Performs queue-specific action
     → Body: { action: string, data?: any }

GET  /api/action-center/items/:id/notes
     → Returns notes/timeline for an item

POST /api/action-center/items/:id/notes
     → Adds a note
     → Body: { body: string }

POST /api/action-center/webhooks/:id/retry
     → Special endpoint for webhook retry
```

### 3. Database Schema

You'll need tables/collections for:

**action_items**
- id, queue, refType, refId, title, whoName, whoPhone
- reasonCode, status, slaAt, severity
- amountAtRisk, assigneeId, openedAt, updatedAt
- meta (JSONB/JSON field)

**action_notes**
- id, actionItemId, body, authorId, authorName, createdAt

Consider adding indexes on:
- queue + status
- assigneeId
- slaAt (for SLA queries)
- openedAt (for sorting)

### 4. SLA Computation

The mock computes SLA severity client-side. Consider moving this to the backend:

```sql
-- Example query to get overdue items
SELECT * FROM action_items
WHERE slaAt < NOW() AND status = 'open';
```

### 5. Real-time Updates

Consider adding real-time updates when new action items are created:
- WebSocket connection for live badge updates
- Server-sent events for notification toasts
- Polling fallback (every 30-60 seconds)

## Queue-Specific Actions

Each queue has its own set of actions:

| Queue | Actions |
|-------|---------|
| KYC | Approve, Reject, Request Info |
| Bookings | Confirm, Reschedule, Cancel |
| Refunds & Disputes | Approve Refund, Deny, Request Info |
| Payouts | Retry, Change Method, Request Info |
| Webhooks | Retry Now, View Payload |
| Content Flags | Approve, Hide, Strike User |

These are handled in `ActionRow.tsx` - update the `handleAction` function to call your specific business logic.

## Role-Based Access Control

The mock includes role definitions in `types/action-center.ts`:
- Super Admin: Access to all queues
- Finance Admin: Payouts, Refunds & Disputes
- Operations Admin: Bookings, KYC
- Support Admin: Bookings, Refunds & Disputes, Content Flags
- Content Admin: Content Flags only

To enforce RBAC:
1. Add auth context with current admin's role
2. Filter visible tabs based on `ROLE_PERMISSIONS`
3. Add middleware/guard for direct queue URLs
4. Return 403 for unauthorized queue access

## Features Implemented

- ✅ Unified action queue across 6 categories
- ✅ Quick filters (Mine / Unassigned / Overdue)
- ✅ Advanced filters (Severity, Reason codes)
- ✅ Search by ID, name, phone
- ✅ Queue-specific primary actions
- ✅ SLA tracking with color-coded chips
- ✅ Assign to me functionality
- ✅ Notes/timeline drawer
- ✅ Toast notifications
- ✅ Badge counts per queue
- ✅ Amount at risk display
- ✅ Keyboard shortcuts (Cmd+Enter to send note)

## Future Enhancements

- [ ] Bulk actions (select multiple items)
- [ ] Export action items to CSV
- [ ] Save filters to URL query params
- [ ] Keyboard navigation (j/k to move between rows)
- [ ] @mentions in notes
- [ ] Email notifications for overdue SLAs
- [ ] Action item templates
- [ ] Custom SLA rules per queue

## Testing

Current mock data includes:
- 5-10 items per queue
- Mixed severities (red/amber/green)
- Some overdue items
- Some assigned vs unassigned
- Various reason codes

To reset mock data: Reload the page (data is in-memory only).

## Support

For questions or issues with the Action Center, contact the platform team or file an issue in the repo.
