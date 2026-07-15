const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// markdown-it (via react-native-markdown-display) imports the bare "punycode"
// module, which is no longer bundled with Node/React Native. Alias it to the
// userland package installed in node_modules.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  punycode: require.resolve('punycode/'),
};

module.exports = config;
