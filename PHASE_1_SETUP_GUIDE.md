# Phase 1 Implementation - Setup Guide

## What Was Implemented

You now have **4 major new features** fully integrated into your admin dashboard:

1. **Support Tickets System** - Real ticket management connected to your mobile app
2. **Broadcasts with OneSignal** - Send push notifications to all users
3. **Feature Flags** - Toggle features on/off without deploying app
4. **Referrals System** - Track and manage user referrals and rewards

All features work with the **demo/live toggle** - you can test with demo data and switch to live when ready!

---

## Setup Instructions

### Step 1: Run Database Migrations

You need to run 4 SQL schema files in your Supabase SQL Editor:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Navigate to: SQL Editor (left sidebar)

2. **Run These Schemas (in order):**

**Schema 1: Support Tickets**
```sql
-- Copy and paste from: supabase/support_tickets_schema.sql
-- This creates: support_tickets, ticket_messages tables
```

**Schema 2: Broadcasts**
```sql
-- Copy and paste from: supabase/broadcasts_schema.sql
-- This creates: broadcasts, broadcast_recipients tables
```

**Schema 3: Feature Flags**
```sql
-- Copy and paste from: supabase/feature_flags_schema.sql
-- This creates: feature_flags, feature_flag_history tables
```

**Schema 4: Referrals** (Optional - might already exist in your Ezra-app)
```sql
-- Copy and paste from: supabase/referral_schema.sql
-- This creates: share_history, referral_codes, referral_conversions, referral_rewards tables
-- SKIP if these tables already exist!
```

3. **Verify Tables Were Created**
   - Go to: Table Editor (left sidebar)
   - You should see the new tables listed

---

### Step 2: Configure OneSignal (Required for Broadcasts)

OneSignal is needed to send push notifications to users.

1. **Get Your OneSignal Credentials**
   - Go to: https://onesignal.com/
   - Log in to your account
   - Select your Ezra app
   - Go to Settings → Keys & IDs
   - Copy:
     - **App ID** (looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
     - **REST API Key** (looks like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

2. **Add to Environment Variables**

   Open your `.env.local` file and add these lines:

   ```bash
   # OneSignal Configuration
   NEXT_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id_here
   ONESIGNAL_API_KEY=your_onesignal_rest_api_key_here
   ```

   Replace `your_onesignal_app_id_here` and `your_onesignal_rest_api_key_here` with your actual credentials.

3. **Restart Your Dev Server**
   ```bash
   # Press Ctrl+C to stop the current server
   npm run dev
   ```

---

### Step 3: Test Everything

1. **Start in Demo Mode**
   - Open your admin dashboard
   - Click the toggle in the header (should show "Demo" with amber dot)
   - Navigate to these pages to see demo data:
     - Support Tickets
     - Broadcasts
     - Feature Flags
     - Referrals

2. **Switch to Live Mode**
   - Click the toggle (should change to "Live" with green dot)
   - The pages will now connect to your Supabase database
   - Initially, they'll be empty (no data yet)

3. **Test OneSignal Connection**
   - Go to Integrations page
   - Click "Test Connection" for OneSignal
   - Should show "Connected" if credentials are correct

---

## How Each Feature Works

### 1. Support Tickets

**What it does:**
- Users can submit tickets from the mobile app
- Tickets appear in the admin dashboard
- Admins can respond, assign, and resolve tickets

**How to use:**
1. Go to Support Tickets page
2. View all tickets with filters (status, priority, category)
3. Click a ticket to view details
4. Assign to yourself or another admin
5. Add messages to communicate with user
6. Mark as resolved when done

**Mobile App Integration:**
- Users submit tickets via Support page in app
- They see ticket status and can reply to messages
- Get notifications when admin responds

---

### 2. Broadcasts (OneSignal)

**What it does:**
- Send push notifications to all users at once
- Target specific audiences (all users, customers only, providers only)
- Track delivery, opens, and clicks

**How to use:**
1. Go to Broadcasts page
2. Click "Create Broadcast"
3. Fill in:
   - Title (notification heading)
   - Message (notification body)
   - Target audience (all, customers, providers)
   - Optional: action URL, image
4. Choose:
   - Send Now (immediate)
   - Schedule for Later (set date/time)
5. Track results:
   - See how many received it
   - How many opened it
   - How many clicked it

**Important:**
- Broadcasts are ACTUALLY SENT to users when in live mode!
- Test with demo mode first to see how it works
- Always double-check message before sending

---

### 3. Feature Flags

**What it does:**
- Turn features on/off without deploying new app version
- Gradual rollouts (e.g., enable for 20% of users)
- A/B testing different features
- Emergency kill switch for broken features

**How to use:**
1. Go to Feature Flags page
2. Click "Create Flag"
3. Set:
   - Key (e.g., `chat_feature`)
   - Name (display name)
   - Description
   - Category (experimental, beta, stable)
   - Targeting:
     - All users
     - Percentage rollout
     - Specific user roles
     - Specific user IDs
4. Toggle on/off anytime
5. Mobile app checks flags on startup and adjusts features

**Examples:**
- `dark_mode` - Enable dark theme
- `new_payment_flow` - Try new checkout
- `referral_program` - Enable referrals

---

### 4. Referrals

**What it does:**
- Track user referrals and rewards
- See who's sharing your app
- Manage referral rewards and payouts
- View top referrers

**How to use:**
1. Go to Referrals page
2. View:
   - Total shares and conversions
   - Top referrers (most successful)
   - Pending rewards (need to be paid)
   - Referral statistics
3. Approve/deny rewards
4. Track referral codes
5. See conversion funnel (signup → booking → payment)

**Mobile App Integration:**
- Users can share the app via WhatsApp, SMS, email
- Get unique referral codes
- Earn rewards when referred users sign up
- Track their referral stats in app

---

## API Methods Available

All features are accessible via the unified `adminAPI`:

```typescript
import { adminAPI } from '@/lib/supabase';

// Support Tickets
await adminAPI.getSupportTickets({ status: 'open' });
await adminAPI.getTicketById(ticketId);
await adminAPI.getTicketStats();

// Broadcasts
await adminAPI.getBroadcasts({ status: 'sent' });
await adminAPI.getBroadcastStats();
await adminAPI.sendBroadcast(broadcastId);

// Feature Flags
await adminAPI.getFeatureFlags({ enabled: true });
await adminAPI.getFlagStats();
await adminAPI.toggleFlag(flagId, true);

// Referrals
await adminAPI.getReferralStats();
await adminAPI.getTopReferrers(10);
await adminAPI.getPendingRewards();
```

---

## Demo vs Live Mode

**Demo Mode** (amber dot):
- Shows realistic fake data
- Safe to experiment with
- No changes saved
- No notifications sent
- Perfect for testing UI

**Live Mode** (green dot):
- Connects to real Supabase database
- Changes are permanent
- Broadcasts actually send notifications
- Shows real user data
- Use when ready for production

**Toggle Location:**
- Top-right corner of dashboard header
- Click to switch between modes
- Mode is saved and persists

---

## Troubleshooting

### Tables Not Found
- Make sure you ran all 4 SQL schemas in Supabase
- Check Table Editor to verify tables exist
- Refresh browser after running schemas

### OneSignal Not Working
- Verify credentials in `.env.local` are correct
- Make sure you restarted dev server after adding env vars
- Check OneSignal dashboard - is app configured?
- Test connection in Integrations page

### Demo Data Not Showing
- Check browser console for errors
- Make sure toggle is in Demo mode (amber dot)
- Try clearing browser cache and refreshing

### Live Mode Shows No Data
- This is normal if tables are empty
- Create some test data:
  - Create a ticket manually in Supabase
  - Send a test broadcast
  - Create a test feature flag
- Or switch back to demo mode to see example data

---

## Next Steps

Now that Phase 1 is complete, you can:

1. **Test in Demo Mode**
   - Explore all 4 new features
   - See how the UI works
   - Understand the workflows

2. **Run Database Migrations**
   - Copy/paste the 4 SQL schemas
   - Verify tables were created

3. **Configure OneSignal**
   - Add your OneSignal credentials
   - Test the connection

4. **Switch to Live Mode**
   - Connect to real database
   - Start using the features

5. **Mobile App Integration**
   - Users can submit support tickets
   - Receive broadcast notifications
   - App respects feature flags
   - Share referral codes

---

## What's Next? (Optional Phase 2)

If you want to add more features later:

- **Twilio SMS Integration** - Send SMS notifications
- **Banners & CMS** - Update app content without deploying
- **Geo Service Areas** - Manage provider coverage areas
- **Localization** - Manage translations dynamically
- **Enhanced Analytics** - Real-time charts and insights

Let me know when you're ready for Phase 2!

---

## Files Created

### Database Schemas (run in Supabase):
- `supabase/support_tickets_schema.sql`
- `supabase/broadcasts_schema.sql`
- `supabase/feature_flags_schema.sql`
- `supabase/referral_schema.sql`

### Services (automatically used):
- `lib/services/support-tickets-supabase.ts`
- `lib/services/broadcasts-supabase.ts`
- `lib/services/feature-flags-supabase.ts`
- `lib/services/referrals-supabase.ts`

### Admin API (already updated):
- `lib/admin-api.ts` - Now includes all 4 new features

---

## Summary

✅ **4 Major Features Implemented:**
1. Support Tickets System
2. Broadcasts with OneSignal
3. Feature Flags
4. Referrals System

✅ **All Features:**
- Work with demo/live toggle
- Have realistic demo data for testing
- Connect to Supabase when in live mode
- Include full CRUD operations

✅ **Production Ready:**
- Type-safe operations
- Error handling
- RLS security policies
- Audit trails and history
- Statistics and reporting

**Your admin dashboard is now complete with all essential features!** 🚀

Just run the database migrations, add your OneSignal credentials, and you're ready to go live!
