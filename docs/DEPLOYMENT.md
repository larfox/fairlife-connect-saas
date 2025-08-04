# Deployment Guide

This document outlines the deployment process for the Health Fair Management System.

## Overview

Our deployment strategy uses:
- **Staging Environment**: For testing and validation
- **Production Environment**: For live application
- **Automated CI/CD**: GitHub Actions for automated deployments
- **Manual Deployment**: Scripts for manual deployments when needed

## Environments

### Staging
- **URL**: `https://staging-app.yourdomain.com`
- **Branch**: `develop`
- **Purpose**: Testing, integration, and validation
- **Deployment**: Automatic on push to `develop`

### Production
- **URL**: `https://app.yourdomain.com`
- **Branch**: `main`
- **Purpose**: Live application for end users
- **Deployment**: Automatic on release creation

## Automated Deployment (Recommended)

### Staging Deployment
1. Push changes to `develop` branch
2. GitHub Actions automatically:
   - Runs tests and linting
   - Builds the application
   - Deploys to staging environment
   - Runs post-deployment checks

### Production Deployment
1. Create a release using the version bump workflow
2. GitHub Actions automatically:
   - Runs full test suite
   - Builds production-optimized bundle
   - Deploys to production environment
   - Creates deployment record
   - Sends notifications

### Using GitHub Actions

#### Triggering a Release
```bash
# Method 1: Use GitHub UI
# Go to Actions → Version Bump → Run workflow

# Method 2: Use the version bump script
./scripts/version-bump.sh minor
git push origin main --tags
```

## Manual Deployment

### Prerequisites
- Node.js 18+
- Access to deployment servers
- Environment variables configured
- SSH keys set up (if deploying to servers)

### Using Deployment Scripts

#### Deploy to Staging
```bash
./scripts/deploy.sh staging
```

#### Deploy to Production
```bash
./scripts/deploy.sh production
```

### Manual Steps

#### 1. Prepare for Deployment
```bash
# Ensure you're on the correct branch
git checkout main  # for production
git checkout develop  # for staging

# Pull latest changes
git pull origin main

# Install dependencies
npm ci

# Run tests
npm run lint
npm run build
```

#### 2. Build Application
```bash
# For production
npm run build

# For staging
npm run build:dev
```

#### 3. Deploy Files
```bash
# Example: Deploy to server via rsync
rsync -avz dist/ user@server:/var/www/html/

# Example: Deploy to cloud platform
# Follow your platform-specific deployment commands
```

## Environment Configuration

### Environment Variables
Create environment-specific configuration:

#### Staging
```bash
# .env.staging
VITE_APP_ENV=staging
VITE_API_URL=https://api-staging.yourdomain.com
VITE_SUPABASE_URL=your-staging-supabase-url
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
```

#### Production
```bash
# .env.production
VITE_APP_ENV=production
VITE_API_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### Supabase Configuration
- **Staging**: Use a separate Supabase project for staging
- **Production**: Use the main Supabase project
- Ensure RLS policies are properly configured
- Set up proper authentication providers

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations run (if any)
- [ ] Backup production database (for production deployments)

### During Deployment
- [ ] Monitor deployment logs
- [ ] Verify build completes successfully
- [ ] Check application starts correctly
- [ ] Validate environment-specific configurations

### Post-Deployment
- [ ] Run smoke tests
- [ ] Verify all major features work
- [ ] Check error monitoring (if configured)
- [ ] Update deployment documentation
- [ ] Notify team of successful deployment

## Rollback Procedures

### Quick Rollback
If issues are detected immediately after deployment:

```bash
# Using Git (if source code issue)
git revert <commit-hash>
git push origin main

# Re-deploy previous version
git checkout <previous-tag>
./scripts/deploy.sh production
```

### Database Rollback
If database changes need to be reverted:

1. Restore from backup
2. Run rollback migrations (if available)
3. Verify data integrity

### Infrastructure Rollback
If infrastructure changes cause issues:

1. Revert infrastructure changes
2. Re-deploy application
3. Monitor for stability

## Monitoring and Alerts

### Application Monitoring
- Monitor application logs for errors
- Set up uptime monitoring
- Configure performance monitoring
- Monitor user experience metrics

### Deployment Monitoring
- GitHub Actions notifications
- Slack/email alerts for deployment status
- Error tracking integration
- Performance regression detection

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

#### Environment Variable Issues
- Verify all required variables are set
- Check variable naming (VITE_ prefix required)
- Validate variable values

#### Deployment Failures
- Check deployment logs
- Verify server access and permissions
- Ensure adequate disk space
- Check network connectivity

### Getting Help
1. Check deployment logs in GitHub Actions
2. Review error messages carefully
3. Consult team members
4. Check project documentation
5. Create an issue if problem persists

## Security Considerations

### Secrets Management
- Never commit secrets to repository
- Use GitHub Secrets for CI/CD
- Rotate secrets regularly
- Use environment-specific secrets

### Access Control
- Limit deployment access to authorized users
- Use deployment environments with protection rules
- Enable required reviews for production deployments
- Audit deployment access regularly

### Security Scanning
- Automated dependency scanning
- Container security scanning (if using containers)
- Code security analysis
- Regular security updates

## Performance Optimization

### Build Optimization
- Code splitting and lazy loading
- Asset optimization (images, fonts)
- Bundle size monitoring
- Tree shaking and dead code elimination

### Deployment Optimization
- CDN usage for static assets
- Gzip/Brotli compression
- Caching strategies
- Progressive web app features

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and update deployment scripts
- Clean up old builds and artifacts
- Update documentation
- Review and improve deployment processes

### Quarterly Reviews
- Deployment process efficiency
- Security review
- Performance analysis
- Tool and platform evaluation
- Team feedback and improvements