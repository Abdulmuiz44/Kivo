/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv/config');
const baseConfig = require('./app.json');

module.exports = ({ config }) => {
  const mergedConfig = {
    ...baseConfig.expo,
    ...config,
  };

  const googleAuth = {
    ...(mergedConfig.extra?.googleAuth ?? {}),
    androidClientId:
      process.env.GOOGLE_ANDROID_CLIENT_ID ?? mergedConfig.extra?.googleAuth?.androidClientId ?? '',
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID ?? mergedConfig.extra?.googleAuth?.iosClientId ?? '',
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID ?? mergedConfig.extra?.googleAuth?.webClientId ?? '',
    expoClientId: process.env.GOOGLE_EXPO_CLIENT_ID ?? mergedConfig.extra?.googleAuth?.expoClientId ?? '',
  };

  const plugins = Array.from(new Set([...(mergedConfig.plugins ?? []), 'expo-web-browser']));

  return {
    ...mergedConfig,
    plugins,
    extra: {
      ...mergedConfig.extra,
      supabaseUrl: process.env.SUPABASE_URL ?? mergedConfig.extra?.supabaseUrl ?? '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? mergedConfig.extra?.supabaseAnonKey ?? '',
      nexaApiUrl: process.env.NEXA_API_URL ?? mergedConfig.extra?.nexaApiUrl ?? '',
      googleAuth,
    },
  };
};
