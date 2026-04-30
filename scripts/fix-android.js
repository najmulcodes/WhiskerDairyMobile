

const fs = require('fs');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');

if (!fs.existsSync(androidDir)) {
  console.log('[fix-android] android/ not found. Run: npx expo prebuild --clean first.');
  process.exit(0);
}

// ── Fix 1: settings.gradle ────────────────────────────────────────────────────
const settingsPath = path.join(androidDir, 'settings.gradle');

if (fs.existsSync(settingsPath)) {
  // Gradle requires forward slashes even on Windows
  const autolinkAndroid = path.resolve(
    __dirname, '..', 'node_modules', 'expo-modules-autolinking', 'android'
  ).replace(/\\/g, '/');

  let content = fs.readFileSync(settingsPath, 'utf8');
  const original = content;

  const lines = content.split('\n').map(line => {
    if (line.includes('includeBuild') && line.includes('expo-modules-autolinking')) {
      // Preserve indentation, replace only the includeBuild(...) expression
      const indent = line.match(/^(\s*)/)[1];
      return `${indent}includeBuild("${autolinkAndroid}")`;
    }
    return line;
  });

  content = lines.join('\n');

  if (content !== original) {
    fs.writeFileSync(settingsPath, content, 'utf8');
    console.log('✅ settings.gradle: static includeBuild path set');
    console.log('   →', autolinkAndroid);
  } else {
    // Fallback: the line format changed. Print file for manual check.
    console.warn('⚠️  settings.gradle: no matching includeBuild line found.');
    console.warn('   Check android/settings.gradle for a line containing:');
    console.warn('   includeBuild + expo-modules-autolinking');
  }
} else {
  console.warn('⚠️  android/settings.gradle not found');
}

// ── Fix 2: gradle-wrapper.properties ─────────────────────────────────────────
const GRADLE_VERSION = '8.6';
const propsPath = path.join(
  androidDir, 'gradle', 'wrapper', 'gradle-wrapper.properties'
);

if (fs.existsSync(propsPath)) {
  let content = fs.readFileSync(propsPath, 'utf8');
  const fixed = content.replace(/gradle-[\d.]+-all/g, `gradle-${GRADLE_VERSION}-all`);
  if (fixed !== content) {
    fs.writeFileSync(propsPath, fixed, 'utf8');
    console.log(`✅ Gradle wrapper: pinned to ${GRADLE_VERSION}`);
  } else {
    console.log(`ℹ️  Gradle wrapper: already ${GRADLE_VERSION}`);
  }
} else {
  console.warn('⚠️  gradle-wrapper.properties not found');
}

console.log('\n[fix-android] Complete. Run: npx expo run:android');