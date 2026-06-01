const fs = require("fs");
const path = require("path");

const WEBRTC_PLUGIN = "@config-plugins/react-native-webrtc";

function loadRootEnv() {
  const rootEnvPath = path.resolve(__dirname, "../../.env");
  if (!fs.existsSync(rootEnvPath)) {
    return;
  }

  const raw = fs.readFileSync(rootEnvPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function hasPluginInstalled(pluginName) {
  try {
    require.resolve(pluginName);
    return true;
  } catch {
    return false;
  }
}

module.exports = ({ config }) => {
  loadRootEnv();

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
