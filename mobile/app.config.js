/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv/config');
const baseConfig = require('./app.json');

module.exports = ({ config }) => {
  const mergedConfig = {
    ...baseConfig.expo,
    ...config,
  };

  return {
    ...mergedConfig,
    extra: {
      ...mergedConfig.extra,
      supabaseUrl: process.env.SUPABASE_URL ?? mergedConfig.extra?.supabaseUrl ?? '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? mergedConfig.extra?.supabaseAnonKey ?? '',
      nexaApiUrl: process.env.NEXA_API_URL ?? mergedConfig.extra?.nexaApiUrl ?? '',
    },
  };
};
