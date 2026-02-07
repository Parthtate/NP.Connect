# Production Deployment Guide

## Pre-Deployment Checklist

Before deploying to production, ensure the following:

- [ ] `.env` file is NOT committed to version control
- [ ] `.env.example` is committed with placeholder values
- [ ] Production Supabase project is created
- [ ] Database schema has been deployed to production Supabase
- [ ] Production build succeeds without errors
- [ ] TypeScript compiles without errors
- [ ] All environment variables are configured for production

## Environment Setup

### 1. Create Production Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com)
2. Create a new project for production
3. Note down the Project URL and anon key

### 2. Deploy Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/schema-invite-system.sql`
3. Paste and run in the SQL Editor
4. Verify all tables are created
5. Verify Row Level Security is enabled on all tables

### 3. Configure Authentication

1. In Supabase Dashboard, go to Authentication → Providers
2. Enable Email/Password provider
3. For production, keep "Confirm email" enabled
4. Configure email templates under Authentication → Email Templates
5. Set up custom SMTP (optional but recommended for production)

### 4. Set Environment Variables

Create a `.env` file (or configure in your deployment platform):

```bash
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

**IMPORTANT:** Never commit this file to Git!

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via GitHub:**
   - Push your code to GitHub
   - Import the repository in Vercel
   - Configure environment variables in Vercel dashboard
   - Deploy

3. **Configure Environment Variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - These will be injected during build

4. **Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Option 2: Netlify

1. **Connect Repository:**
   - Push code to GitHub
   - Import repository in Netlify

2. **Build Settings:**
   - Build Command: `npm run build`
   - Publish Directory: `dist`

3. **Environment Variables:**
   - Go to Site Settings → Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Option 3: Self-Hosted (Docker)

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create nginx.conf:**
   ```nginx
   server {
     listen 80;
     location / {
       root /usr/share/nginx/html;
       index index.html;
       try_files $uri $uri/ /index.html;
     }
   }
   ```

3. **Build and Run:**
   ```bash
   docker build -t nppmt-hrms .
   docker run -p 80:80 nppmt-hrms
   ```

### Option 4: Static Hosting (Cloudflare Pages, GitHub Pages, etc.)

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the `dist` folder to your hosting service

3. Configure environment variables in your hosting platform

## Post-Deployment Steps

### 1. Create Admin User

1. Go to Supabase Dashboard → Authentication → Users
2. Add a new user with admin email
3. After user is created, go to Table Editor → profiles
4. Find the user's profile and update `role` to `'ADMIN'`

### 2. Verify Deployment

1. Visit your deployed application
2. Test login with the admin user
3. Verify all features work:
   - Dashboard loads
   - Employee management
   - Attendance tracking
   - Leave applications
   - Payroll viewing

### 3. Security Checklist

- [ ] HTTPS is enabled
- [ ] Environment variables are not exposed in frontend
- [ ] Supabase RLS policies are active
- [ ] API keys are properly secured
- [ ] CORS is properly configured in Supabase

## Monitoring & Maintenance

### Database Backups

Supabase automatically backs up your database. Additional steps:

1. Enable Point-in-Time Recovery (PITR) in Supabase dashboard
2. Set up regular database snapshots
3. Document restore procedures

### Error Monitoring

Consider integrating error monitoring:

1. **Sentry**: Add Sentry SDK for error tracking
2. **LogRocket**: For session replay and debugging
3. **Supabase Logs**: Monitor database logs in Supabase dashboard

### Performance Monitoring

1. Monitor Supabase database performance
2. Check API request metrics
3. Monitor page load times
4. Review bundle size

### Updates & Maintenance

1. Keep dependencies updated:
   ```bash
   npm outdated
   npm update
   ```

2. Monitor Supabase for service updates
3. Review and update RLS policies as needed
4. Backup database before major changes

## Troubleshooting

### Build Fails

1. Check Node.js version (should be 18+)
2. Clear cache: `rm -rf node_modules package-lock.json && npm install`
3. Check for TypeScript errors: `npx tsc --noEmit`

### Environment Variables Not Loading

1. Verify variables start with `VITE_`
2. Restart development server after adding variables
3. For production, verify variables are set in deployment platform

### Authentication Issues

1. Verify Supabase URL and keys are correct
2. Check CORS settings in Supabase
3. Verify RLS policies are not blocking requests
4. Check browser console for auth errors

### RLS Policy Errors

1. Go to Supabase Dashboard → SQL Editor
2. Run: `SELECT * FROM pg_policies;` to view all policies
3. Verify policies match `schema-invite-system.sql`
4. Test policies with different user roles

## Rollback Procedure

If deployment fails:

1. **Vercel/Netlify**: Redeploy previous version from dashboard
2. **Docker**: Keep previous image tags, rollback with:
   ```bash
   docker run -p 80:80 nppmt-hrms:previous-version
   ```
3. **Database**: Restore from Supabase backup in dashboard

## Support

For issues:
1. Check application logs
2. Check Supabase logs
3. Review RLS policies
4. Verify environment variables
5. Check network tab in browser DevTools
