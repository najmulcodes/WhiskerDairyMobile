const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Only add truly non-standard binary extensions here.
// Do NOT add png/jpg — Metro handles those as image assets by default
// via imageExts. Adding them to assetExts breaks require('./image.png').
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj');

module.exports = config;