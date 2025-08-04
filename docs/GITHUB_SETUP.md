# GitHub Setup Guide

This guide walks you through setting up GitHub for proper version management and deployment automation.

## Quick Setup Checklist

- [ ] Repository created and connected
- [ ] Branch protection rules configured
- [ ] GitHub Actions workflows enabled
- [ ] Dependabot configured
- [ ] Issue and PR templates set up
- [ ] Release automation configured
- [ ] Environment secrets configured
- [ ] Team access configured

## 1. Repository Setup

### Initial Configuration
1. **Connect to GitHub** (if not already done):
   - In Lovable: Click GitHub → Connect to GitHub
   - Authorize the Lovable GitHub App
   - Create repository with your project code

2. **Clone Repository Locally** (optional):
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```

### Branch Structure
Set up the following branches:
- `main`: Production-ready code
- `develop`: Development integration branch

```bash
# Create develop branch
git checkout -b develop
git push -u origin develop
```

## 2. Branch Protection Rules

Configure protection rules for your main branches:

### Main Branch Protection
1. Go to **Settings** → **Branches**
2. Click **Add rule** for `main` branch
3. Configure:
   - [ ] Require pull request reviews before merging
   - [ ] Require status checks to pass before merging
   - [ ] Require branches to be up to date before merging
   - [ ] Require linear history
   - [ ] Include administrators

### Develop Branch Protection
1. Add rule for `develop` branch
2. Configure:
   - [ ] Require pull request reviews before merging
   - [ ] Require status checks to pass before merging
   - [ ] Require branches to be up to date before merging

## 3. GitHub Actions Setup

The workflows are already created in `.github/workflows/`. To enable them:

1. **Enable Actions**: Go to **Actions** tab and enable workflows
2. **Configure Secrets** (if needed):
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Add any required deployment secrets

### Available Workflows

#### CI/CD Pipeline (`ci.yml`)
- **Triggers**: Push to main/develop, PRs
- **Features**: Testing, linting, security scanning, automated deployment
- **Environments**: Staging (develop), Production (releases)

#### Version Bump (`version-bump.yml`)
- **Trigger**: Manual workflow dispatch
- **Features**: Automated version bumping, changelog generation, PR creation

#### Release (`release.yml`)
- **Trigger**: Tag creation (v*)
- **Features**: Automated release creation, artifact uploads

#### Dependency Updates (`dependency-update.yml`)
- **Trigger**: Weekly schedule, manual dispatch
- **Features**: Automated dependency updates, security patches

## 4. Environment Configuration

### Set up Deployment Environments
1. Go to **Settings** → **Environments**
2. Create environments:
   - `staging`
   - `production`

### Configure Environment Protection Rules
For production environment:
- [ ] Required reviewers
- [ ] Wait timer (optional)
- [ ] Deployment branches (main only)

### Environment Secrets
Add secrets for each environment:
- Database connection strings
- API keys
- Deployment credentials

## 5. Release Management

### Semantic Versioning
This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (1.0.0 → 1.0.1)

### Creating Releases

#### Method 1: Automated (Recommended)
```bash
# Trigger version bump workflow
gh workflow run version-bump.yml -f version_type=minor
```

#### Method 2: Manual Script
```bash
# Make scripts executable
chmod +x scripts/version-bump.sh
chmod +x scripts/deploy.sh

# Bump version
./scripts/version-bump.sh minor
```

#### Method 3: GitHub UI
1. Go to **Actions** → **Version Bump**
2. Click **Run workflow**
3. Select version type and options
4. Review and merge the created PR
5. Tag will trigger automatic release

## 6. Dependabot Configuration

Dependabot is configured to:
- **Weekly updates**: Every Monday at 9 AM UTC
- **npm packages**: Security and version updates
- **GitHub Actions**: Workflow updates
- **Auto-assignment**: To maintainers
- **Labels**: `dependencies`, `automated`

### Reviewing Dependabot PRs
1. Check the PR description for changes
2. Review the updated packages
3. Ensure all CI checks pass
4. Merge if everything looks good

## 7. Issue and PR Templates

### Issue Templates
- **Bug Report**: For reporting bugs
- **Feature Request**: For suggesting new features

### PR Template
- **Structured format**: Description, type of change, testing
- **Checklist**: Code style, tests, documentation
- **Review requirements**: Enforced by branch protection

## 8. Team Collaboration

### Access Management
1. Go to **Settings** → **Manage access**
2. Add team members with appropriate roles:
   - **Maintainer**: Full access, can merge to main
   - **Write**: Can create branches and PRs
   - **Read**: Can view and clone repository

### Code Review Process
1. **Feature Development**:
   ```bash
   git checkout develop
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   # Create PR to develop
   ```

2. **Release Process**:
   ```bash
   # From develop to main
   git checkout main
   git checkout -b release/v1.2.0
   # Update version, changelog
   git push origin release/v1.2.0
   # Create PR to main
   ```

3. **Hotfixes**:
   ```bash
   git checkout main
   git checkout -b hotfix/critical-fix
   # Make fix
   git push origin hotfix/critical-fix
   # Create PR to main
   ```

## 9. Monitoring and Notifications

### GitHub Notifications
Configure notifications for:
- PR reviews
- Failed workflows
- Dependabot alerts
- Security alerts

### Slack Integration (Optional)
Set up Slack notifications for:
- Deployment status
- Release announcements
- Critical failures

## 10. Security Configuration

### Security Advisories
1. Enable **Security** → **Advisories**
2. Configure **Dependency graph**
3. Enable **Dependabot alerts**

### Code Scanning
1. Enable **Security** → **Code scanning**
2. Set up CodeQL analysis
3. Configure security policies

## Usage Examples

### Daily Development
```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/user-authentication
# ... make changes ...
git push origin feature/user-authentication
# Create PR via GitHub UI
```

### Version Release
```bash
# Option 1: Use GitHub Actions
gh workflow run version-bump.yml -f version_type=minor

# Option 2: Use script
./scripts/version-bump.sh minor
git push origin main --tags
```

### Emergency Hotfix
```bash
git checkout main
git pull origin main
git checkout -b hotfix/security-fix
# ... make critical fix ...
git push origin hotfix/security-fix
# Create PR, get emergency review, merge
./scripts/version-bump.sh patch
```

## Troubleshooting

### Common Issues

#### Workflow Permissions
If workflows fail due to permissions:
1. Go to **Settings** → **Actions** → **General**
2. Set **Workflow permissions** to "Read and write permissions"

#### Branch Protection Conflicts
If unable to push to protected branches:
1. Create a PR instead of direct push
2. Ensure all required checks pass
3. Get required reviews

#### Failed Deployments
1. Check workflow logs in **Actions** tab
2. Verify environment secrets are set
3. Check deployment platform status

### Getting Help
1. Check workflow logs for detailed error messages
2. Review the [Contributing Guide](../CONTRIBUTING.md)
3. Create an issue for persistent problems
4. Contact team maintainers

## Next Steps

After completing this setup:
1. **Test the workflow**: Create a small PR to verify everything works
2. **Train the team**: Share this guide with team members
3. **Customize**: Adjust workflows and settings for your specific needs
4. **Monitor**: Keep an eye on workflow performance and adjust as needed
5. **Iterate**: Continuously improve the process based on team feedback

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Keep a Changelog](https://keepachangelog.com/)

---

**Note**: Remember to customize the workflows, scripts, and documentation to match your specific deployment requirements and team preferences.