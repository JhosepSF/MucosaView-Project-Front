export default {
  expo: {
    ...require('./app.json').expo,
    plugins: [
      ...(require('./app.json').expo.plugins || []),
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
    ],
  },
};
