# Deployment Guide

This project is ready for production deployment. Follow these steps to deploy safely and securely.

## Quick Start

### 1. Set Environment Variables

Before deploying, ensure these environment variables are configured in your hosting provider:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
APP_URL=https://your-domain.com
NODE_ENV=production
```

**Never:**
- Commit `.env.production` to git
- Expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code
- Use hardcoded credentials

### 2. Local Testing

```bash
# Install dependencies
npm install

# Run type checking
npm run build

# Run linting
npm run lint

# Start dev server
npm run dev
```

### 3. Deployment

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Connect and deploy
vercel --prod
```

Then set environment variables in the Vercel dashboard and redeploy.

#### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

# Serve the dist folder with a static server
CMD ["npx", "serve", "-s", "dist"]
```

#### Other Platforms

1. Build: `npm run build`
2. Output: `dist/` directory
3. Set environment variables in your platform
4. Serve `dist/` as a static site

## Security Checklist

- ✅ Supabase credentials in environment variables
- ✅ Row Level Security (RLS) policies enabled
- ✅ TypeScript strict mode enabled
- ✅ ESLint validation passing
- ✅ Dependencies audited
- ✅ Debug mode disabled in production
- ✅ No console.log in production builds
- ✅ Build minification enabled

## Production Build Output

The production build includes:

- **Minified code**: All JavaScript is minified with Terser
- **Code splitting**: Large dependencies split into separate chunks
- **Source maps disabled**: Reduced bundle size for security
- **Tree-shaking**: Unused code removed

Bundle size: ~93KB gzipped (main bundle)

## Monitoring & Maintenance

### Essential Monitoring

1. **Error Tracking**: Use Sentry, LogRocket, or similar
2. **Performance**: Monitor Core Web Vitals
3. **Uptime**: Set up uptime monitoring
4. **Database**: Monitor Supabase metrics

### Regular Maintenance

- **Weekly**: Check error logs
- **Monthly**: Update dependencies (`npm update`)
- **Monthly**: Run security audit (`npm audit`)
- **Quarterly**: Review and rotate secrets
- **Quarterly**: Test disaster recovery

## Rollback Procedures

If deployment has issues:

1. Identify the problem through logs
2. Revert the deployment to the previous version
3. Investigate root cause
4. Fix and test locally
5. Redeploy when ready

## Environment Variables Explained

| Variable | Purpose | Safe for Browser |
|----------|---------|------------------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Anon key (RLS enforced) | ✅ Yes |
| `APP_URL` | Application URL for redirects | ✅ Yes |
| `NODE_ENV` | Build mode (production) | ✅ Yes |
| `VITE_DEBUG` | Enable debug mode (set to false) | ❌ Never in prod |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key (backend only) | ❌ Never |

## Common Issues & Solutions

### Issue: "VITE_SUPABASE_URL is undefined"
**Solution**: Ensure environment variables are set in your hosting provider's dashboard and redeploy.

### Issue: "Too many dependencies in bundle"
**Solution**: The app uses code splitting. Check `dist/assets/` for chunk sizes. If any exceed 500KB, investigate lazy loading.

### Issue: "RLS policy denies access"
**Solution**: Check Supabase project settings. Ensure RLS policies allow reads from authenticated users.

### Issue: "Build fails with TypeScript errors"
**Solution**: Run `npm run build` locally to see errors. All TypeScript errors must be fixed before deployment.

## Performance Optimization

The production build includes several optimizations:

1. **Route-based code splitting**: Each route is a separate chunk
2. **Vendor chunking**: React, Router, Query in separate bundles
3. **CSS optimization**: Tailwind purges unused styles
4. **Asset compression**: gzip compression for all assets
5. **Minification**: All code minified with Terser

## SSL/HTTPS

Always use HTTPS in production. Most hosting providers (Vercel, Netlify, etc.) provide free SSL certificates.

## Database Backups

Supabase automatically backs up your database. To manually backup:

1. Go to Supabase dashboard
2. Navigate to Backups
3. Create a manual backup
4. Download if needed

## Support & Troubleshooting

- **Supabase Docs**: https://supabase.com/docs
- **React Router Docs**: https://reactrouter.com/
- **Vite Docs**: https://vitejs.dev/
- **GitHub Issues**: Check your repository's issue tracker

## Next Steps

1. Configure environment variables
2. Test the production build locally
3. Deploy to staging first
4. Verify all functionality works
5. Deploy to production
6. Monitor logs and errors
