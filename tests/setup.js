// Mock KaiOS APIs for testing
// These mocks match the actual KaiOS API structure used in the app

// Import enhanced mocks
const {
  createMockRequest,
  createMockMessages,
  createMockContacts,
  createMockMobileMessage,
  createMockContactsAPI,
  createMockDeviceStorage
} = require('./helpers/kaios-api-mock');

// Setup navigator with enhanced mocks
global.navigator = {
  ...global.navigator,
  language: 'en-US',
  mozContacts: createMockContactsAPI(),
  mozSms: null, // App checks for mozSms first, then falls back to mozMobileMessage
  mozMobileMessage: createMockMobileMessage(),
  getDeviceStorage: jest.fn((type) => createMockDeviceStorage())
};

// Mock DOM
global.document = {
  getElementById: jest.fn(() => ({
    innerHTML: '',
    textContent: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false)
    },
    style: {},
    value: '',
    checked: false,
    focus: jest.fn(),
    blur: jest.fn(),
    appendChild: jest.fn(),
    children: []
  })),
  createElement: jest.fn(() => ({
    innerHTML: '',
    textContent: '',
    id: '',
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    appendChild: jest.fn()
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  },
  activeElement: {
    addEventListener: jest.fn()
  }
};

global.window = {
  ...global.window,
  navigator: global.navigator,
  open: jest.fn()
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);
