# GitHub Configuration
> GitHub Actions workflows, automation, and repository settings for Intelli-Task-Hub

This directory contains GitHub Actions workflows, issue templates, and repository configuration that enable CI/CD automation, code quality checks, and streamlined development workflows.

## Table of Contents
- [Overview](#overview)
- [Workflows](#workflows)
- [Configuration](#configuration)
- [Issue Templates](#issue-templates)
- [Security](#security)

## Overview

### Purpose
- **CI/CD Pipeline** - Automated testing, building, and deployment
- **Code Quality** - Automated linting, type checking, and security scanning
- **Automation** - Issue management, dependency updates, and release management
- **Repository Governance** - Branch protection, pull request policies, and team workflows

### GitHub Features Used
- **GitHub Actions** - Workflow automation and CI/CD
- **Dependabot** - Automated dependency updates
- **Branch Protection** - Code review and merge policies
- **Issue Templates** - Standardized issue reporting
- **Pull Request Templates** - Standardized contribution guidelines

## Workflows

### Continuous Integration (`.github/workflows/ci.yml`)

#### Overview
```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

#### Jobs
- **Setup** - Install dependencies and setup environment
- **Type Check** - TypeScript type checking across packages
- **Lint** - Code linting and formatting checks
- **Test** - Unit tests with coverage reporting
- **Build** - Build verification for all packages
- **Security Scan** - Security vulnerability scanning

#### Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual workflow dispatch

### Audio Worklet Tests (`.github/workflows/audioworklet-tests.yml`)

#### Overview
```yaml
name: AudioWorklet Tests
on:
  push:
    paths: ['lib/integrations-openai-ai-react/**']
  pull_request:
    paths: ['lib/integrations-openai-ai-react/**']
```

#### Jobs
- **Browser Testing** - Test AudioWorklet functionality across browsers
- **Compatibility Testing** - Verify browser API compatibility
- **Performance Testing** - Audio processing performance benchmarks

### Dependency Management (`.github/dependabot.yml`)

#### Configuration
```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
      time: '09:00'
    open-pull-requests-limit: 5
    reviewers:
      - 'dependabot[bot]'
    assignees:
      - 'dependabot[bot]'
```

#### Update Groups
- **Production Dependencies** - Weekly updates for production dependencies
- **Development Dependencies** - Bi-weekly updates for dev dependencies
- **Security Updates** - Immediate updates for security vulnerabilities
- **Major Version Updates** - Monthly review of major version updates

## Configuration

### Branch Protection Rules

#### Main Branch Protection
- **Required Reviews** - Minimum 2 reviewers
- **Required Status Checks** - All CI checks must pass
- **Dismiss Stale Reviews** - Auto-dismiss stale PRs when new commits pushed
- **Require Up-to-Date Branch** - PR must be up-to-date with target branch
- **Include Administrators** - Admins can bypass protection rules

#### Develop Branch Protection
- **Required Reviews** - Minimum 1 reviewer
- **Required Status Checks** - Core CI checks must pass
- **Auto-merge** - Auto-merge passing PRs from maintainers

### Repository Settings

#### Default Branch
- **Main Branch** - `main` (protected)
- **Development Branch** - `develop` (protected)

#### Merge Methods
- **Squash and Merge** - Default for PRs to main
- **Create Merge Commit** - Allowed for hotfixes
- **Rebase and Merge** - Allowed for feature branches

#### Issue Management
- **Auto-close Issues** - Auto-close issues when referenced in PRs
- **Lock Issues** - Lock inactive issues after 30 days
- **Project Boards** - Automated issue assignment to project boards

## Issue Templates

### Bug Report (`.github/ISSUE_TEMPLATE/bug_report.md`)

#### Template Structure
```markdown
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g. iOS, Android, Windows, macOS]
- Browser: [e.g. chrome, safari, firefox]
- Version: [e.g. 1.0.0]

## Additional Context
Add any other context about the problem here.
```

### Feature Request (`.github/ISSUE_TEMPLATE/feature_request.md`)

#### Template Structure
```markdown
---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## Feature Description
A clear and concise description of what you want to happen.

## Use Case
Describe why this feature would be useful and what problem it solves.

## Proposed Solution
If you have a specific solution in mind, describe it here.

## Alternatives Considered
Describe any alternative solutions or features you've considered.

## Additional Context
Add any other context, mockups, or screenshots about the feature request here.
```

### Documentation Issue (`.github/ISSUE_TEMPLATE/documentation.md`)

#### Template Structure
```markdown
---
name: Documentation
about: Report issues with documentation
title: '[DOCS] '
labels: documentation
assignees: ''
---

## Documentation Issue
A clear and concise description of what the documentation issue is.

## Location in Documentation
- Page/Section: [e.g. API Reference > Authentication]
- URL: [link to the documentation page]

## Problem Description
Describe what's wrong with the documentation.

## Suggested Fix
If you have a suggestion for how to fix the documentation, please describe it here.

## Additional Context
Add any other context about the documentation issue here.
```

## Pull Request Templates

### Default Template (`.github/pull_request_template.md`)

#### Template Structure
```markdown
## Description
Brief description of changes made in this pull request.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] My changes follow the existing code style
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules

## Checklist
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules
```

## Security

### Security Scanning

#### CodeQL Analysis
```yaml
name: CodeQL
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Daily at 2 AM UTC on Monday

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
```

#### Dependency Scanning
```yaml
name: Dependency Review
on:
  pull_request:
    branches: [main]

jobs:
  dependency-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
```

### Security Policies

#### Vulnerability Disclosure
- **Private Reporting** - Security vulnerabilities reported privately
- **Response Time** - 48 hour initial response, 7 day fix timeline
- **Credit** - Security researchers credited in security advisories
- **Bounty Program** - Potential bounty program for critical vulnerabilities

#### Security Best Practices
- **Secrets Management** - GitHub Secrets for sensitive data
- **Access Control** - Principle of least privilege for workflows
- **Audit Trail** - Comprehensive audit logging for security events
- **Regular Updates** - Automated security updates and patching

## Monitoring and Alerts

### Workflow Monitoring

#### Status Checks
- **Build Status** - Real-time build status monitoring
- **Test Results** - Automated test result notifications
- **Performance Metrics** - Build time and resource usage tracking
- **Error Rates** - Automated error rate monitoring and alerting

#### Notification Channels
- **Slack Integration** - Build status notifications to Slack
- **Email Alerts** - Critical failure email notifications
- **GitHub Status** - Status updates via GitHub status API
- **Dashboard** - Centralized monitoring dashboard

### Performance Metrics

#### Build Performance
```yaml
# Performance monitoring in workflows
- name: Build Performance
  run: |
    echo "Build started at $(date)"
    # Build commands here
    echo "Build completed at $(date)"
    echo "Total build time: $((SECONDS)) seconds"
```

#### Test Performance
```yaml
# Test performance tracking
- name: Test Performance
  run: |
    # Run tests with timing
    pnpm test -- --reporter=json > test-results.json
    # Parse and report test performance metrics
```

## Development Workflow

### Local Development Setup

#### GitHub CLI Setup
```bash
# Install GitHub CLI
curl -fsSL https://cli.github.com/packages/github-cli.sh | sh

# Authenticate with GitHub
gh auth login

# Clone repository with GitHub CLI
gh repo clone TrevorPLam/Intelli-Task-Hub
```

#### Local Workflow Testing
```bash
# Test workflows locally using act
npm install -g act

# Run specific workflow
act -j test

# Run workflow with specific event
act -j test -e pull_request
```

### Workflow Development

#### Creating New Workflows
```yaml
# .github/workflows/new-workflow.yml
name: New Workflow
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  new-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: pnpm install
      - name: Run workflow
        run: echo "Workflow execution"
```

#### Workflow Best Practices
- **Idempotency** - Workflows should be idempotent and safe to re-run
- **Caching** - Use GitHub Actions caching for dependencies and build artifacts
- **Parallel Execution** - Parallelize independent jobs for faster execution
- **Error Handling** - Comprehensive error handling and reporting
- **Security** - Avoid exposing secrets in logs and artifacts

## Troubleshooting

### Common Issues

#### Workflow Failures
```bash
# Debug workflow failures
gh run view --log

# Check workflow logs
gh run list

# Retry failed workflow
gh run rerun <run-id>
```

#### Permission Issues
```bash
# Check repository permissions
gh api repos/TrevorPLam/Intelli-Task-Hub

# Update permissions if needed
gh repo edit TrevorPLam/Intelli-Task-Hub --add-admin
```

#### Caching Issues
```bash
# Clear GitHub Actions cache
gh api repos/TrevorPLam/Intelli-Task-Hub/actions/cache/delete

# Check cache usage
gh api repos/TrevorPLam/Intelli-Task-Hub/actions/cache/list
```

### Debug Mode

#### Workflow Debugging
```yaml
# Enable debug logging
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

#### Local Debugging
```bash
# Use act for local debugging
act --verbose --reuse

# Debug specific workflow
act -j test --verbose
```

## Best Practices

### Workflow Design
- **Modular Workflows** - Separate workflows for different concerns
- **Reusable Actions** - Create reusable composite actions
- **Environment-Specific** - Different configurations for dev/staging/prod
- **Fail Fast** - Fail fast on critical errors to save resources

### Security Practices
- **Secrets Management** - Use GitHub Secrets for sensitive data
- **Principle of Least Privilege** - Minimal permissions for workflows
- **Dependency Scanning** - Regular security scanning of dependencies
- **Code Review** - Security-focused code review for critical changes

### Performance Optimization
- **Parallel Execution** - Parallelize independent tasks
- **Smart Caching** - Intelligent caching strategies
- **Resource Management** - Optimize resource usage
- **Incremental Builds** - Build only what changed

## Related Documentation

- **[Development Guide](../docs/development.md)** - Development setup and workflows
- **[Security Policy](../SECURITY.md)** - Security policies and procedures
- **[Contributing Guide](../CONTRIBUTING.md)** - Contribution guidelines
- **[Code of Conduct](../CODE_OF_CONDUCT.md)** - Community guidelines

## Support

For GitHub-related issues:
- Check [GitHub Documentation](https://docs.github.com/)
- Review [GitHub Actions Documentation](https://docs.github.com/actions/)
- Submit [GitHub Issues](https://github.com/TrevorPLam/Intelli-Task-Hub/issues)

## License

MIT License - see the main project [LICENSE](../LICENSE) file for details.
