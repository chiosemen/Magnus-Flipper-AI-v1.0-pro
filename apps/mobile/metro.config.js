const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// 4. Add support for resolving workspace packages
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle workspace packages
  if (moduleName.startsWith('@magnus-flipper-ai/')) {
    const packageName = moduleName.split('/')[1];
    const packagePath = path.resolve(monorepoRoot, 'packages', packageName);

    // Try to resolve from packages directory
    try {
      return {
        filePath: require.resolve(packagePath),
        type: 'sourceFile',
      };
    } catch (e) {
      // Package doesn't exist, fall through to default resolution
    }
  }

  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

// 5. Add additional extensions for assets
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'db',
  'mp3',
  'ttf',
  'obj',
  'png',
  'jpg',
];

// 6. Add source extensions for TypeScript
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs',
];

// 7. Clear transformer cache
config.resetCache = true;

module.exports = config;
