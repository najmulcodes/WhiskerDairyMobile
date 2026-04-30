const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const gradleWrapperPath = path.join(projectRoot, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');

if (!fs.existsSync(path.join(projectRoot, 'android'))) {
  console.log('[fix-android] android/ not found. Nothing to update.');
  process.exit(0);
}

if (fs.existsSync(gradleWrapperPath)) {
  let content = fs.readFileSync(gradleWrapperPath, 'utf8');
  content = content.replace(/gradle-[0-9.]+-all/g, 'gradle-8.6-all');
  fs.writeFileSync(gradleWrapperPath, content, 'utf8');
  console.log('[fix-android] Gradle wrapper pinned to 8.6.');
}
