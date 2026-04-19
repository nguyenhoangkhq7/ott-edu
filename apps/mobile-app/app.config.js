const WEBRTC_PLUGIN = "@config-plugins/react-native-webrtc";

function hasPluginInstalled(pluginName) {
  try {
    require.resolve(pluginName);
    return true;
  } catch {
    return false;
  }
}

module.exports = ({ config }) => {
  const basePlugins = Array.isArray(config.plugins) ? config.plugins : [];
  const plugins = basePlugins.filter((plugin) => plugin !== WEBRTC_PLUGIN);

  if (hasPluginInstalled(WEBRTC_PLUGIN)) {
    plugins.push(WEBRTC_PLUGIN);
  }

  return {
    ...config,
    plugins,
  };
};
