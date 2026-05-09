// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Node globals not automatically exposed in jsdom
const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

if (!global.crypto) {
  Object.defineProperty(global, 'crypto', { value: webcrypto, writable: true });
}
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

// Mock @react-google-maps/api so LoadScript doesn't try to load the real script
jest.mock('@react-google-maps/api', () => ({
  LoadScript: ({ children }) => children,
}));

// Stub the google.maps.places global used by LocationAutocomplete
global.google = {
  maps: {
    places: {
      AutocompleteSessionToken: function () {},
      AutocompleteSuggestion: {
        fetchAutocompleteSuggestions: jest.fn().mockResolvedValue({ suggestions: [] }),
      },
    },
  },
};
