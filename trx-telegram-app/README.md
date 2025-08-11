# TRX Earn - Telegram Mini App

A Telegram Mini App where users can earn TRX by watching ads, completing tasks, and referring others.

## Features

- 🎯 **Earn TRX by watching ads** - 0.005 TRX per ad with 15-second cooldown
- ✅ **Complete tasks** - Join Telegram channels/bots for TRX rewards
- 👥 **Referral system** - Earn 0.05 TRX + 10% commission from referrals
- 💳 **Wallet management** - Set TRX address and withdraw (min 3.5 TRX)
- 📱 **Mobile-optimized UI** - Modern, responsive design with smooth animations
- 🔐 **Admin panel** - Manage users, approve withdrawals, create tasks

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **State Management**: Zustand
- **Telegram**: Telegram Mini App SDK
- **Deployment**: Vercel

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `database/schema.sql`
3. Get your project URL and API keys from Settings > API

### 2. Telegram Bot Setup

1. Create a new bot with [@BotFather](https://t.me/BotFather)
2. Get your bot token
3. Set up Mini App with your bot:
   ```
   /setmenubutton
   [Your Bot]
   TRX Earn
   https://your-app.vercel.app
   ```

### 3. Environment Variables

Create `.env.local` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 4. Local Development

```bash
npm install
npm run dev
```

### 5. Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Database Schema

The app uses the following main tables:

- `users` - User profiles and balances
- `transactions` - All TRX transactions
- `withdrawals` - Withdrawal requests
- `tasks` - Available tasks
- `user_tasks` - Completed tasks
- `referrals` - Referral relationships
- `ad_views` - Ad viewing history

## Admin Panel

Access the admin panel at `/admin` to:

- Approve/reject withdrawal requests
- Manage users (view details, block/unblock)
- Create and manage tasks
- View app settings

## API Endpoints

- `POST /api/users` - Create/update user
- `GET /api/users?telegramId=123` - Get user by Telegram ID
- `POST /api/ads/watch` - Record ad view
- `GET /api/ads/watch?userId=123` - Check ad cooldown status
- `POST /api/withdrawals` - Request withdrawal
- `GET /api/withdrawals?userId=123` - Get user withdrawals
- `GET /api/tasks` - Get available tasks
- `POST /api/tasks` - Complete task

## Referral System

1. Users get unique referral links based on their Telegram ID
2. Referrals must watch 5 ads to be verified
3. Verified referrals earn the referrer:
   - 0.05 TRX instant bonus
   - 10% commission on all future withdrawals

## Security Features

- Row Level Security (RLS) on all tables
- User authentication via Telegram
- Admin-only operations protected
- Input validation on all forms
- TRX address validation

## Mobile Optimization

- Responsive design for all screen sizes
- Touch-friendly interface
- Smooth animations and transitions
- Optimized for Telegram WebView

## Deployment Notes

- All environment variables must be set in Vercel
- Database schema must be applied to Supabase
- Telegram bot must be configured with Mini App URL
- Admin panel is accessible without authentication (add auth if needed)

## Support

For issues or questions, contact the development team or create an issue in the repository.
