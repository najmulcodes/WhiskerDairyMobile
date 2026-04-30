const {
  createRunOncePlugin,
  withAppBuildGradle,
  withProjectBuildGradle,
} = require('@expo/config-plugins');

function removeLine(contents, pattern) {
  return contents.replace(pattern, '');
}

function withAndroidBuildFixes(config) {
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    config.modResults.contents = removeLine(
      config.modResults.contents,
      /^\s*ndkVersion\s*=\s*["'][^"']+["']\s*[\r\n]+/m
    );

    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    config.modResults.contents = removeLine(
      config.modResults.contents,
      /^\s*ndkVersion\s+rootProject\.ext\.ndkVersion\s*[\r\n]+/m
    );

    return config;
  });

  return config;
}

module.exports = createRunOncePlugin(
  withAndroidBuildFixes,
  'with-android-build-fixes',
  '1.0.0'
);
