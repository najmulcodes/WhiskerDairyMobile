const fs = require('fs');
const path = require('path');

const GRADLE_VERSION = '8.6';
const PROPS_PATH = path.join(
  __dirname,
  '..',
  'android',
  'gradle',
  'wrapper',
  'gradle-wrapper.properties'
);

if (!fs.existsSync(PROPS_PATH)) {
  console.log('[fix-gradle-wrapper] android/gradle/wrapper/gradle-wrapper.properties not found — skipping.');
  process.exit(0);
}

let content = fs.readFileSync(PROPS_PATH, 'utf8');
const original = content;

// Replace any gradle-X.Y-all or gradle-X.Y.Z-all with the target version
content = content.replace(
  /gradle-[\d.]+-all/,
  `gradle-${GRADLE_VERSION}-all`
);

if (content === original) {
  console.log(`[fix-gradle-wrapper] Already on Gradle ${GRADLE_VERSION} — no change needed.`);
} else {
  fs.writeFileSync(PROPS_PATH, content, 'utf8');
  console.log(`[fix-gradle-wrapper] ✅ Pinned Gradle wrapper to ${GRADLE_VERSION}`);
}
