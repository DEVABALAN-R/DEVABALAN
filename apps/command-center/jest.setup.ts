// Reanimated 4 / Worklets need native modules; use their official JS mocks under Jest.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  // Not provided by the official mock; tests run with motion enabled.
  useReducedMotion: () => false,
}));
