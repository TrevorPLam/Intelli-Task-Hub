# @workspace/scripts

Automation and utility scripts for the Intelli-Task-Hub monorepo.

## Purpose

This package contains build scripts, automation tools, and utility functions that support the development and deployment workflow.

## Current Scripts

- `hello.ts` - Example script demonstrating the package structure

## Future Automation

Intended scripts for:
- Post-merge automation (Git hooks)
- Build pipeline utilities  
- Database migration helpers
- Development workflow automation

## Usage

Scripts can be run from the workspace root using pnpm workspace filtering:

```bash
pnpm --filter @workspace/scripts run <script-name>
```

## Development

When adding new scripts:
1. Place them in `src/` directory
2. Add corresponding scripts to `package.json`
3. Update this README with the new script's purpose
