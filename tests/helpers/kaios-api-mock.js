/**
 * KaiOS API Mocks
 */

/**
 * Creates a mock request/cursor object
 * @param {*} initialResult - Initial result value
 * @param {Error} error - Optional error object
 * @returns {Object} Mock request object
 */
function createMockRequest(initialResult = null, error = null) {
  const request = {
    onsuccess: null,
    onerror: null,
    result: initialResult,
    error: error,
    continue: jest.fn(function() {
      if (this.onsuccess) {
        setTimeout(() => this.onsuccess.call(this), 0);
      }
      return this;
    })
  };
  return request;
}

/**
 * Creates mock SMS/MMS messages for testing
 */
function createMockMessages() {
  return [
    {
      type: 'sms',
      id: 1,
      threadId: 1,
      iccId: 'sim1',
      delivery: 'sent',
      deliveryStatus: 'success',
      sender: '+1234567890',
      receiver: '+0987654321',
      body: 'Test SMS message',
      messageClass: 'normal',
      timestamp: Date.now() - 86400000, // 1 day ago
      sentTimestamp: Date.now() - 86400000,
      deliveryTimestamp: Date.now() - 86390000,
      read: true
    },
    {
      type: 'mms',
      id: 2,
      threadId: 1,
      iccId: 'sim1',
      delivery: 'sent',
      sender: '+1234567890',
      receivers: ['+0987654321'],
      timestamp: Date.now() - 43200000, // 12 hours ago
      sentTimestamp: Date.now() - 43200000,
      read: true,
      subject: 'Test MMS',
      smil: '<smil>...</smil>',
      attachments: [],
      expiryDate: null,
      readReportRequested: false
    }
  ];
}

/**
 * Creates mock contacts for testing
 */
function createMockContacts() {
  return [
    {
      id: '1',
      name: ['John Doe'],
      givenName: ['John'],
      familyName: ['Doe'],
      tel: [{ type: ['mobile'], value: '+1234567890' }],
      email: [{ type: ['work'], value: 'john@example.com' }],
      bday: new Date('1990-05-15'),
      published: new Date(),
      updated: new Date(),
      org: ['Test Company'],
      jobTitle: 'Developer',
      adr: [{
        streetAddress: '123 Main St',
        locality: 'City',
        region: 'State',
        postalCode: '12345',
        countryName: 'Country'
      }],
      url: 'https://example.com',
      note: 'Test contact',
      genderIdentity: 'male'
    },
    {
      id: '2',
      name: ['First Last'],
      givenName: ['First'],
      familyName: ['Last'],
      tel: [
        { type: ['home'], value: '+0987654321' },
        { type: ['work'], value: '+1122334455' }
      ],
      email: [
        { type: ['personal'], value: 'test@example.com' },
        { type: ['work'], value: 'test.work@example.com' }
      ],
      bday: new Date('1985-10-20'),
      published: new Date(),
      updated: new Date(),
      org: ['Another Company'],
      jobTitle: 'Manager',
      adr: [{
        streetAddress: '456 Oak Ave',
        locality: 'Town',
        region: 'Province',
        postalCode: '67890',
        countryName: 'Another Country'
      }],
      url: 'https://test.example.com',
      note: 'Another test contact',
      genderIdentity: 'female',
      nickname: 'First'
    }
  ];
}

/**
 * Creates a mock mozMobileMessage API
 */
function createMockMobileMessage(messages = null) {
  const mockMessages = messages || createMockMessages();
  let messageIndex = 0;

  return {
    getMessages: jest.fn((filter, reverse) => {
      const request = createMockRequest();
      
      request.continue = jest.fn(function() {
        if (messageIndex < mockMessages.length) {
          this.result = mockMessages[messageIndex++];
          if (this.onsuccess) {
            setTimeout(() => this.onsuccess.call(this), 0);
          }
        } else {
          // End of cursor
          this.result = null;
          if (this.onsuccess) {
            setTimeout(() => this.onsuccess.call(this), 0);
          }
        }
        return this;
      });
      
      // Initialize cursor
      request.result = messageIndex < mockMessages.length ? mockMessages[messageIndex++] : null;
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess.call(request);
        }
      }, 0);
      
      return request;
    })
  };
}

/**
 * Creates a mock mozContacts API
 */
function createMockContactsAPI(contacts = null) {
  const mockContactsData = contacts || createMockContacts();
  
  return {
    find: jest.fn((options) => {
      const request = createMockRequest(mockContactsData);
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess.call(request);
        }
      }, 0);
      return request;
    })
  };
}

/**
 * Creates a mock DeviceStorage API
 */
function createMockDeviceStorage() {
  const storedFiles = new Map();
  
  return {
    addNamed: jest.fn((blob, name) => {
      const request = createMockRequest();
      storedFiles.set(name, blob);
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess.call(request);
        }
      }, 0);
      return request;
    }),
    get: jest.fn((name) => {
      const request = createMockRequest();
      const file = storedFiles.get(name);
      request.result = file ? { name, file } : null;
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess.call(request);
        }
      }, 0);
      return request;
    }),
    // Helper to get stored files
    _getStoredFiles: () => storedFiles
  };
}

module.exports = {
  createMockRequest,
  createMockMessages,
  createMockContacts,
  createMockMobileMessage,
  createMockContactsAPI,
  createMockDeviceStorage
};
