# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables

**Required for Production:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key (safe to expose, RLS enforced)
- `APP_URL` - Your production domain

**Setup Instructions:**
1. Copy `.env.production.example` to `.env.production`
2. Fill in all required values from your Supabase project
3. Never commit `.env.production` to version control
4. Use your hosting provider's secrets manager (Vercel, Netlify, etc.)

### 2. Supabase Configuration

**Row Level Security (RLS):**
- Ensure all tables have RLS enabled
- Create appropriate policies for read/write access
- Test RLS rules thoroughly before deployment

**Database Backups:**
- Enable automated backups in Supabase settings
- Test restore procedures regularly

**Authentication:**
- Configure email providers in Supabase Auth
- Set up password reset email templates
- Enable MFA if available for your plan

### 3. Code Quality

**Run Before Deploying:**
```bash
# Type checking
npm run build

# Linting
npm run lint

# Fix linting issues
npm run lint -- --fix
```

### 4. Security Best Practices

**Environment Variables:**
- ✅ `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are safe in frontend (prefixed with `VITE_`)
- ❌ NEVER expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
- ❌ NEVER hardcode credentials in source code
- ❌ NEVER commit `.env.production` to version control

**API Security:**
- All API endpoints use Supabase RLS policies
- Service operations use Edge Functions with service role key
- Request validation is enforced on all inputs

**Dependencies:**
- Keep dependencies updated regularly
- Run `npm audit` to check for vulnerabilities
- Review dependency licenses before using in production

### 5. Performance Optimization

**Build Output:**
- Production builds use minification and code splitting
- Tree-shaking removes unused code
- Lazy loading for routes improves initial load

**Monitoring Build Size:**
- Check `vite build` output for chunk sizes
- Warning threshold is set to 500kb per chunk
- Use dynamic imports for large features

### 6. Debug Mode

**Disable in Production:**
- Debug mode is controlled by `VITE_DEBUG` environment variable
- Ensure `VITE_DEBUG` is NOT set in production
- Debug utilities use `isDebug()` to conditionally enable logging

**What Debug Mode Does:**
- Enables detailed console logging
- Activates React Query DevTools
- Logs Supabase API errors
- Window-accessible debug flag `window.__EW_DEBUG__`

### 7. Database Migrations

**Before Deploying Schema Changes:**
1. Test migrations locally
2. Backup production database
3. Run migrations in staging first
4. Verify application still works after migration
5. Schedule migrations during low-traffic periods if possible

### 8. Monitoring & Logging

**Recommended:**
- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor Supabase analytics
- Track application performance metrics
- Set up alerts for critical errors

### 9. Deployment Steps

**Option 1: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# Then redeploy to use new environment variables
```

**Option 2: Other Hosting Providers**
1. Build: `npm run build`
2. Output directory: `dist/`
3. Set environment variables in hosting dashboard
4. Deploy the `dist/` folder

### 10. Post-Deployment

**Verification:**
- Test all authentication flows
- Verify database connections work
- Check that RLS policies enforce correctly
- Monitor error logs for issues
- Test on various browsers and devices

**Monitoring:**
- Set up uptime monitoring
- Monitor error rates and performance
- Check database query performance
- Review user reports of issues

## Rollback Procedures

If deployment causes issues:
1. Identify the problem through logs
2. Revert to previous commit: `git revert [commit-hash]`
3. Redeploy with rollback
4. Investigate root cause
5. Fix and redeploy when ready

## Maintenance

**Regular Tasks:**
- Weekly: Review error logs
- Monthly: Update dependencies
- Monthly: Review database performance
- Quarterly: Security audit
- Quarterly: Disaster recovery drill

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Check React Router docs: https://reactrouter.com/
3. Check Vite docs: https://vitejs.dev/
4. Open an issue in your repository
