const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/**
 * Metro configuration for pnpm monorepo support
 *
 * This configuration enables Metro to correctly resolve @workspace/* packages
 * from the pnpm symlink structure. Key settings:
 *
 * - watchFolders: Points to workspace root so Metro follows symlinks outside app dir
 * - resolver.nodeModulesPaths: Includes workspace root node_modules for hoisted deps
 * - resolver.blockList: Excludes .pnpm virtual store secondary copies
 * - resolver.disableHierarchicalLookup: Prevents finding wrong versions from ancestor dirs
 * - resolver.unstable_enableSymlinks: Required for pnpm isolated dependencies (SDK 54+)
 *
 * @see https://docs.expo.dev/guides/monorepos/
 */

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// ============================================================================
// Watch folders (must include workspace root for symlink resolution)
// ============================================================================
config.watchFolders = [
  workspaceRoot,
  path.resolve(projectRoot, "node_modules"),
];

// ============================================================================
// Resolver configuration for pnpm monorepo
// ============================================================================
config.resolver = {
  ...config.resolver,
  // Include workspace root node_modules for hoisted dependencies
  nodeModulesPaths: [
    path.resolve(workspaceRoot, "node_modules"),
    path.resolve(projectRoot, "node_modules"),
  ],
  // Block pnpm virtual store to prevent duplicate module resolution
  // Matches node_modules/.pnpm/ directories
  blockList: [/node_modules\/\.pnpm\/.*/],
  // Disable hierarchical lookup to prevent finding wrong versions
  // from ancestor node_modules directories
  disableHierarchicalLookup: true,
  // Enable symlinks for pnpm isolated dependencies (Expo SDK 54+)
  unstable_enableSymlinks: true,
};

module.exports = config;
