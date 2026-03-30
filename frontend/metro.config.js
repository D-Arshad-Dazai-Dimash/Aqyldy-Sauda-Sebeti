const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  const {
    resolver: { sourceExts, assetExts },
  } = defaultConfig;

  const config = {
    transformer: {
      // SVG файлдарын трансформациялау үшін
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
      // Мына жол маңызды: ол активтерді (images) дұрыс өңдеуге көмектеседі
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      // SVG-ні assetExts-тен алып тастап, sourceExts-ке қосамыз
      assetExts: assetExts.filter((ext) => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
    },
  };

  return mergeConfig(defaultConfig, config);
})();