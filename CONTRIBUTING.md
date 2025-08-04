# Contributing to Health Fair Management System

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Development Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Git

### Getting Started
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/health-fair-management.git
   cd health-fair-management
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Branch Strategy

We use Git Flow with the following branches:

- **main**: Production-ready code
- **develop**: Development branch where features are integrated
- **feature/***: New features (branched from develop)
- **hotfix/***: Critical fixes (branched from main)
- **release/***: Release preparation (branched from develop)

### Branch Naming Convention
- `feature/feature-name`
- `bugfix/bug-description`
- `hotfix/critical-fix`
- `release/v1.2.0`

## Making Changes

### 1. Create a Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes
- Follow the coding standards (see below)
- Write tests for new functionality
- Update documentation as needed

### 3. Commit Your Changes
We follow [Conventional Commits](https://conventionalcommits.org/):

```bash
git commit -m "feat: add user authentication system"
git commit -m "fix: resolve login redirect issue"
git commit -m "docs: update API documentation"
```

### Commit Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 4. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Coding Standards

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### React Components
- Use functional components with hooks
- Follow the component structure in existing files
- Use proper prop types with TypeScript interfaces
- Keep components focused and reusable

### Styling
- Use Tailwind CSS classes
- Follow the design system defined in `index.css`
- Prefer semantic tokens over direct colors
- Ensure responsive design

### File Organization
- Place components in appropriate directories
- Use index files for cleaner imports
- Keep files focused and reasonably sized
- Follow the existing folder structure

## Testing

### Running Tests
```bash
npm run test
npm run test:watch
npm run test:coverage
```

### Writing Tests
- Write unit tests for utility functions
- Write component tests for React components
- Use descriptive test names
- Aim for good test coverage

## Documentation

- Update README.md if you change setup procedures
- Add JSDoc comments for complex functions
- Update CHANGELOG.md for significant changes
- Include examples in documentation

## Pull Request Process

1. **Fill out the PR template** completely
2. **Ensure all checks pass** (CI/CD pipeline)
3. **Request review** from maintainers
4. **Address feedback** promptly
5. **Squash commits** if requested
6. **Wait for approval** before merging

### PR Requirements
- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No merge conflicts
- [ ] Approved by at least one maintainer

## Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Creating a Release
1. Create a release branch from develop
2. Update version in package.json
3. Update CHANGELOG.md
4. Create PR to main
5. After merge, tag the release
6. Deploy to production

## Code of Conduct

### Our Standards
- Be respectful and inclusive
- Provide constructive feedback
- Focus on the problem, not the person
- Help others learn and grow

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Publishing private information
- Other unprofessional conduct

## Getting Help

### Resources
- [Project Documentation](./README.md)
- [Issue Tracker](https://github.com/your-username/health-fair-management/issues)
- [Discussions](https://github.com/your-username/health-fair-management/discussions)

### Contact
- Create an issue for bugs or feature requests
- Start a discussion for questions
- Reach out to maintainers for urgent matters

## Recognition

Contributors are recognized in:
- CHANGELOG.md for significant contributions
- README.md contributors section
- Release notes for major features

Thank you for contributing! 🎉