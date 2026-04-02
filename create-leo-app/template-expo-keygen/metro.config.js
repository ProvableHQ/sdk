const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Local `file:` deps resolve as symlinks to workspace packages.
config.watchFolders = [workspaceRoot];
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.extraNodeModules = {
  "@provablehq/provablekit": path.resolve(projectRoot, "node_modules/@provablehq/provablekit"),
  "@provablehq/provable-engine-wasm": path.resolve(projectRoot, "node_modules/@provablehq/provable-engine-wasm"),
  "@provablehq/provable-engine-react-native": path.resolve(projectRoot, "node_modules/@provablehq/provable-engine-react-native"),
  "react-native-nitro-modules": path.resolve(projectRoot, "node_modules/react-native-nitro-modules"),
};

module.exports = config;
