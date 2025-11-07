# Supabase Integration Guide

## Overview

Your Ezra Admin Dashboard now supports both **Demo Mode** (mock data) and **Live Mode** (real Supabase data). You can switch between them using the toggle button in the dashboard header.

## Quick Start

### 1. Set Up Supabase Database

Run the Action Center schema in your Supabase SQL editor:

```bash
# Navigate to your Supabase project at https://supabase.com/dashboard
# Go to SQL Editor
# Run the schema file:
```

Copy and execute the contents of `supabase/action_center_schema.sql`

This will create:
- `action_items` table with proper constraints
- `action_notes` table with cascade delete
- Indexes for performance
- RLS policies for admin-only access
- Triggers for auto-updating fields

### 2. Configure Supabase Client

Make sure your `lib/supabase.ts` has the correct credentials:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Switch Between Demo and Live

1. **Demo Mode** (default):
   - Uses mock data from `lib/mocks/action-center/`
   - Perfect for testing and development
   - No database required
   - Includes 30+ realistic sample items

2. **Live Mode**:
   - Connects to your Supabase database
   - Real-time data persistence
   - Requires proper database setup

Toggle between modes using the button in the dashboard header (top right, next to "Admin" badge).

## Architecture

### Service Layer Pattern

The system uses a unified service router that automatically switches between mock and Supabase services:

```
Action Center Page
       ↓
lib/services/action-center.ts (Router)
       ↓
   ┌───────────────┐
   ↓               ↓
Mock Service    Supabase Service
(Demo Mode)     (Live Mode)
```

### Files Structure

```
lib/
├── services/
│   ├── action-center.ts           # Unified router (use this in components)
│   └── action-center-supabase.ts  # Real Supabase implementation
├── mocks/
│   └── action-center/
│       ├── data.ts                # Mock seed data
│       └── service.ts             # Mock service implementation
contexts/
└── DataModeContext.tsx            # React Context for mode management
components/
└── DataModeToggle.tsx             # Toggle button component
supabase/
└── action_center_schema.sql       # Database schema
```

### Mode Detection

The current mode is stored in localStorage:

```typescript
localStorage.getItem('ezra-admin-data-mode') // 'demo' or 'live'
```

The service router checks this on every API call and routes to the appropriate implementation.

## Features

### Demo Mode Features
- ✅ Instant loading (no network calls)
- ✅ Simulated latency (250-600ms) for realistic UX
- ✅ 30+ pre-populated items across all queues
- ✅ Full CRUD operations (in-memory)
- ✅ Perfect for development and demos

### Live Mode Features
- ✅ Real Supabase database connection
- ✅ Persistent data storage
- ✅ Row Level Security (RLS) for admin-only access
- ✅ Automatic severity computation based on SLA
- ✅ Full audit trail with notes
- ✅ Cascading deletes for data integrity

## Database Schema

### action_items Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| queue | TEXT | Queue name (kyc, bookings, etc.) |
| ref_type | TEXT | Reference type (provider, customer, etc.) |
| ref_id | TEXT | Reference ID to related entity |
| title | TEXT | Item title/description |
| who_name | TEXT | Person's name |
| who_phone | TEXT | Person's phone |
| reason_code | TEXT | Reason for action (e.g., ID_MISMATCH) |
| status | TEXT | open, snoozed, or resolved |
| sla_at | TIMESTAMPTZ | SLA deadline |
| severity | TEXT | red, amber, or green (auto-computed) |
| amount_at_risk | INTEGER | Amount in cents |
| assignee_id | UUID | Assigned admin user ID |
| assignee_name | TEXT | Assigned admin name |
| meta | JSONB | Additional metadata |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update (auto-updated) |

### action_notes Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| action_item_id | UUID | FK to action_items |
| body | TEXT | Note content |
| author_id | UUID | Note author ID |
| author_name | TEXT | Note author name |
| created_at | TIMESTAMPTZ | Creation timestamp |

## Security

### Row Level Security (RLS)

All tables have RLS enabled with admin-only policies:

```sql
-- Example policy
CREATE POLICY "Admins can view all action items"
  ON action_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### Prerequisites

Your database must have:
1. `profiles` table with `role` column
2. Users with `role = 'admin'`
3. Authenticated sessions

## API Reference

All functions work identically in both Demo and Live modes:

### getSummary()
Get summary of open items by queue
```typescript
const summary = await getSummary();
// Returns: { totalOpen: number, queues: Record<Queue, number> }
```

### list(queue, params)
List items for a specific queue with filters
```typescript
const result = await list('kyc', {
  page: 1,
  limit: 20,
  assignedTo: 'me',
  overdue: true,
  severity: ['red', 'amber'],
  search: 'John'
});
// Returns: { items: ActionItem[], page, limit, total, totalsByReason }
```

### assign(id, assigneeId?)
Assign item to admin (defaults to current user)
```typescript
const item = await assign('item-id');
```

### resolve(id, resolution, note?)
Resolve an action item
```typescript
const item = await resolve('item-id', 'APPROVED', 'All documents verified');
```

### snooze(id, untilISO)
Snooze item until specific time
```typescript
const item = await snooze('item-id', '2025-11-05T14:00:00Z');
```

### addNote(id, body)
Add a note to an item
```typescript
const note = await addNote('item-id', 'Customer called to confirm');
```

### getNotes(id)
Get all notes for an item
```typescript
const notes = await getNotes('item-id');
```

### performAction(id, action, data?)
Perform queue-specific action
```typescript
const item = await performAction('item-id', 'approve_kyc', { verified: true });
```

### getItem(id)
Get single item by ID
```typescript
const item = await getItem('item-id');
```

## Testing

### Test Demo Mode
1. Click toggle to ensure "Demo" is showing (amber dot)
2. Navigate through Action Center queues
3. Perform actions (assign, resolve, add notes)
4. Data resets on page refresh

### Test Live Mode
1. Click toggle to switch to "Live" (green dot)
2. Run schema in Supabase (if not done)
3. Actions persist across page refreshes
4. Check Supabase dashboard to see data

### Verify Mode Switching
1. Create test data in Demo mode
2. Switch to Live mode (data disappears - expected)
3. Switch back to Demo mode (mock data returns)
4. Mode persists across page refreshes

## Troubleshooting

### Toggle Not Visible
- Check that DataModeProvider wraps your layout
- Verify import in dashboard layout: `import DataModeToggle from '@/components/DataModeToggle'`

### Live Mode Not Working
1. Check Supabase credentials in `.env.local`
2. Verify schema is deployed: Query `action_items` table in Supabase
3. Check browser console for errors
4. Verify user is authenticated and has admin role
5. Test RLS policies in Supabase SQL editor

### Data Not Persisting
- Make sure you're in Live mode (green dot)
- Check Supabase table has data: `SELECT * FROM action_items`
- Verify RLS policies allow your user to INSERT/UPDATE

### Mode Not Persisting
- Check browser localStorage: `localStorage.getItem('ezra-admin-data-mode')`
- Clear localStorage and try again
- Check browser console for Context errors

## Production Deployment

### Before Going Live

1. ✅ Deploy Supabase schema
2. ✅ Set up environment variables
3. ✅ Test all CRUD operations in Live mode
4. ✅ Verify RLS policies work correctly
5. ✅ Set up admin users with proper roles
6. ✅ Default to Live mode (optional):

```typescript
// In DataModeContext.tsx, change default:
const [mode, setModeState] = useState<DataMode>('live'); // Change from 'demo'
```

### Monitoring

Monitor these in production:
- Supabase connection status
- API response times
- RLS policy violations (should be zero)
- Failed actions/errors

## Next Steps

1. **Add More Queues**: Extend `Queue` type in `types/action-center.ts`
2. **Custom Actions**: Add queue-specific actions in `ActionRow.tsx`
3. **Notifications**: Trigger real notifications when items are assigned
4. **Webhooks**: Implement actual webhook retry logic in `retryWebhook()`
5. **Analytics**: Track resolution times, queue performance
6. **Bulk Actions**: Select multiple items and act on them at once

## Support

For issues or questions:
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify RLS policies with SQL queries
4. Test in Demo mode first to isolate issues

---

**Status**: ✅ Fully Integrated

All Action Center features now work with both Demo and Live data modes. The system automatically routes to the correct data source based on the toggle state.
