# Ezra Admin Dashboard

Modern, production-ready admin dashboard for the Ezra service marketplace platform.

## 🚀 Features

### Phase 1 - Core Features (Implemented)
- ✅ Admin Authentication & Authorization
- ✅ Dashboard Home with Real-time Metrics
- ✅ Responsive Layout with Sidebar Navigation
- ✅ Supabase Integration

### Phase 2 - Management Features (Coming Soon)
- 🔜 User Management
- 🔜 Provider KYC Approvals
- 🔜 Transaction Monitoring
- 🔜 Analytics & Reports

### Phase 3 - Advanced Features (Planned)
- 📋 Content Moderation
- 📋 Promotional Codes Management
- 📋 Support Ticket System
- 📋 Referral & Rewards Management
- 📋 Audit Logs
- 📋 System Settings

## 📦 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase
- **Icons:** Lucide React
- **Charts:** Recharts

## 🛠️ Setup

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Admin user in your Supabase database

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd ezra-admin-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```

4. **Edit `.env.local` with your Supabase credentials:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 🔐 Authentication

The dashboard requires admin authentication. To create an admin user:

1. Sign up a user in your Supabase Auth
2. Update the user's role in the `profiles` table:
   ```sql
   UPDATE profiles
   SET role = 'admin', is_active = true
   WHERE email = 'your-admin@email.com';
   ```

## 📁 Project Structure

```
ezra-admin-dashboard/
├── app/
│   ├── dashboard/          # Dashboard pages
│   │   ├── layout.tsx      # Dashboard layout with sidebar
│   │   ├── page.tsx        # Dashboard home
│   │   ├── users/          # User management
│   │   ├── providers/      # Provider KYC
│   │   ├── transactions/   # Transaction monitoring
│   │   └── ...
│   ├── login/              # Login page
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/             # Reusable components
│   └── ui/                 # UI components
├── lib/
│   └── supabase.ts         # Supabase client & API
├── public/                 # Static assets
└── ...config files
```

## 🎨 Color Scheme

- **Primary:** Orange (#FF9800) - Ezra brand color
- **Navy:** Dark Blue (#1B365D) - Secondary brand color
- **Background:** Light Gray (#F9FAFB)

## 📊 Dashboard Features

### Home Dashboard
- Total users count
- Active providers
- Pending KYC approvals (with urgent indicator)
- Active bookings
- Platform revenue
- Recent activity feed

### Responsive Design
- Mobile-friendly sidebar navigation
- Collapsible menu for tablets/mobile
- Optimized for desktop, tablet, and mobile

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel --prod
```

### Deploy to Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `.next` folder to Netlify

## 🔒 Security

- Admin role verification on every request
- Protected routes with authentication checks
- Secure Supabase RLS policies
- Environment variables for sensitive data

## 📝 Development

### Adding New Pages

1. Create a new folder in `app/dashboard/`
2. Add `page.tsx` file
3. Update navigation in `app/dashboard/layout.tsx`

### API Integration

All API calls go through `lib/supabase.ts`. Example:

```typescript
import { adminAPI } from '@/lib/supabase';

const users = await adminAPI.getUsers({ role: 'customer' });
```

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` exists with correct values
- Restart the dev server after adding env variables

### Authentication Issues
- Verify user has `role = 'admin'` in profiles table
- Check Supabase RLS policies allow admin access
- Clear browser cache and cookies

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and rebuild

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review Supabase logs for API errors
- Ensure all database tables and RLS policies are set up

## 🎯 Roadmap

- [x] Project setup & authentication
- [x] Dashboard home with metrics
- [ ] User management interface
- [ ] Provider KYC approval workflow
- [ ] Transaction monitoring
- [ ] Analytics dashboard
- [ ] Support ticket system
- [ ] Promotional codes management

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ for Ezra Service Marketplace**
