module.exports = function (api) {
  api.cache(true);
  return {
    // SDK 54: babel-preset-expo adds the react-native-worklets plugin
    // automatically when react-native-worklets is installed.
    // Do NOT list 'react-native-reanimated/plugin' manually.
    presets: ['babel-preset-expo'],
  };
};
