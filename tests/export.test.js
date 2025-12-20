/**
 * Unit tests for data export functionality
 * Tests SMS, MMS, and Contacts export in all formats
 */

const {
  exportSmsToJson,
  exportMmsToJson,
  exportContactsToJson,
  exportSmsToTxt,
  exportMmsToTxt,
  exportContactsToTxt,
  exportSmsToCsv,
  exportMmsToCsv,
  exportContactsToCsv,
  exportContactsToGoogleCsv,
  exportContactsToOutlookCsv,
  exportSmsToXml,
  exportMmsToXml,
  exportContactsToXml,
  SmsMessage,
  MmsMessage,
  Contact
} = require('./helpers/export-helpers');

const { createMockMessages, createMockContacts } = require('./helpers/kaios-api-mock');

// Logging helper for tests
const log = {
  action: (action, data = null) => {
    console.log(`\n[ACTION] ${action}`);
    if (data) {
      console.log(`[DATA]`, typeof data === 'string' ? data.substring(0, 200) + (data.length > 200 ? '...' : '') : data);
    }
  },
  result: (format, type, result) => {
    console.log(`[RESULT] ${type} -> ${format}: ${typeof result === 'string' ? result.length + ' chars' : JSON.stringify(result).substring(0, 100)}`);
  },
  parsed: (format, type, parsed) => {
    console.log(`[PARSED] ${type} -> ${format}: ${Array.isArray(parsed) ? parsed.length + ' items' : 'object'}`);
    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log(`[SAMPLE]`, JSON.stringify(parsed[0], null, 2).substring(0, 300));
    }
  },
  validation: (check, passed) => {
    console.log(`[VALIDATION] ${check}: ${passed ? 'PASS' : 'FAIL'}`);
  }
};

describe('SMS Export Tests', () => {
  const mockSms = createMockMessages().filter(m => m.type === 'sms');

  test('should export SMS to JSON format', () => {
    log.action('Exporting SMS to JSON', { count: mockSms.length });
    const json = exportSmsToJson(mockSms);
    log.result('JSON', 'SMS', json);
    
    expect(json).toBeTruthy();
    log.validation('JSON is truthy', !!json);
    
    expect(json.startsWith('[')).toBe(true);
    log.validation('JSON starts with [', json.startsWith('['));
    
    expect(json.endsWith(']')).toBe(true);
    log.validation('JSON ends with ]', json.endsWith(']'));
    
    // Parse and validate JSON
    log.action('Parsing JSON');
    const parsed = JSON.parse(json);
    log.parsed('JSON', 'SMS', parsed);
    
    expect(Array.isArray(parsed)).toBe(true);
    log.validation('Parsed result is array', Array.isArray(parsed));
    
    expect(parsed.length).toBe(mockSms.length);
    log.validation(`Array length matches (${parsed.length} === ${mockSms.length})`, parsed.length === mockSms.length);
    
    expect(parsed[0]).toHaveProperty('type', 'sms');
    log.validation('First item has type=sms', parsed[0].type === 'sms');
    
    expect(parsed[0]).toHaveProperty('body');
    log.validation('First item has body field', 'body' in parsed[0]);
    
    expect(parsed[0]).toHaveProperty('sender');
    log.validation('First item has sender field', 'sender' in parsed[0]);
  });

  test('should export SMS to TXT format', () => {
    log.action('Exporting SMS to TXT', { count: mockSms.length });
    const txt = exportSmsToTxt(mockSms);
    log.result('TXT', 'SMS', txt);
    
    expect(txt).toBeTruthy();
    log.validation('TXT is truthy', !!txt);
    
    expect(typeof txt).toBe('string');
    log.validation('TXT is string', typeof txt === 'string');
    
    expect(txt.length).toBeGreaterThan(0);
    log.validation(`TXT length > 0 (${txt.length})`, txt.length > 0);
    
    // Validate content contains expected fields
    expect(txt).toContain('type:');
    log.validation('TXT contains type:', txt.includes('type:'));
    
    expect(txt).toContain('body:');
    log.validation('TXT contains body:', txt.includes('body:'));
    
    expect(txt).toContain('sender:');
    log.validation('TXT contains sender:', txt.includes('sender:'));
  });

  test('should export SMS to CSV format', () => {
    log.action('Exporting SMS to CSV', { count: mockSms.length });
    const csv = exportSmsToCsv(mockSms);
    log.result('CSV', 'SMS', csv);
    
    expect(csv).toBeTruthy();
    log.validation('CSV is truthy', !!csv);
    
    expect(typeof csv).toBe('string');
    log.validation('CSV is string', typeof csv === 'string');
    
    expect(csv.length).toBeGreaterThan(0);
    log.validation(`CSV length > 0 (${csv.length})`, csv.length > 0);
    
    // Parse CSV and validate
    log.action('Parsing CSV');
    const Papa = require('papaparse');
    const parsed = Papa.parse(csv, { header: true });
    log.parsed('CSV', 'SMS', parsed.data);
    
    expect(parsed.errors.length).toBe(0);
    log.validation(`CSV parse errors: ${parsed.errors.length}`, parsed.errors.length === 0);
    if (parsed.errors.length > 0) {
      console.log('[ERRORS]', parsed.errors);
    }
    
    expect(parsed.data.length).toBe(mockSms.length);
    log.validation(`CSV row count matches (${parsed.data.length} === ${mockSms.length})`, parsed.data.length === mockSms.length);
    
    expect(parsed.data[0]).toHaveProperty('type', 'sms');
    log.validation('First CSV row has type=sms', parsed.data[0]?.type === 'sms');
  });

  test('should export SMS to XML format', () => {
    log.action('Exporting SMS to XML', { count: mockSms.length });
    const xml = exportSmsToXml(mockSms);
    log.result('XML', 'SMS', xml);
    
    expect(xml).toBeTruthy();
    log.validation('XML is truthy', !!xml);
    
    expect(xml.startsWith('<?xml')).toBe(true);
    log.validation('XML starts with <?xml', xml.startsWith('<?xml'));
    
    expect(xml).toContain('<smses>');
    log.validation('XML contains <smses>', xml.includes('<smses>'));
    
    expect(xml).toContain('</smses>');
    log.validation('XML contains </smses>', xml.includes('</smses>'));
    
    expect(xml).toContain('<sms>');
    log.validation('XML contains <sms>', xml.includes('<sms>'));
    
    // Parse XML and validate structure
    log.action('Parsing XML');
    const { xml2js } = require('xml-js');
    const parsed = xml2js(xml, { compact: true, ignoreComment: true });
    log.parsed('XML', 'SMS', parsed);
    
    expect(parsed).toBeDefined();
    log.validation('XML parsed successfully', !!parsed);
    
    expect(xml).toContain('sms');
    log.validation('XML contains sms content', xml.includes('sms'));
  });
});

describe('MMS Export Tests', () => {
  const mockMms = createMockMessages().filter(m => m.type === 'mms');

  test('should export MMS to JSON format', () => {
    log.action('Exporting MMS to JSON', { count: mockMms.length });
    const json = exportMmsToJson(mockMms);
    log.result('JSON', 'MMS', json);
    
    expect(json).toBeTruthy();
    log.validation('JSON is truthy', !!json);
    
    expect(json.startsWith('[')).toBe(true);
    log.validation('JSON starts with [', json.startsWith('['));
    
    expect(json.endsWith(']')).toBe(true);
    log.validation('JSON ends with ]', json.endsWith(']'));
    
    // Parse and validate JSON
    log.action('Parsing JSON');
    const parsed = JSON.parse(json);
    log.parsed('JSON', 'MMS', parsed);
    
    expect(Array.isArray(parsed)).toBe(true);
    log.validation('Parsed result is array', Array.isArray(parsed));
    
    expect(parsed.length).toBe(mockMms.length);
    log.validation(`Array length matches (${parsed.length} === ${mockMms.length})`, parsed.length === mockMms.length);
    
    expect(parsed[0]).toHaveProperty('type', 'mms');
    log.validation('First item has type=mms', parsed[0].type === 'mms');
    
    expect(parsed[0]).toHaveProperty('subject');
    log.validation('First item has subject field', 'subject' in parsed[0]);
  });

  test('should export MMS to TXT format', () => {
    log.action('Exporting MMS to TXT', { count: mockMms.length });
    const txt = exportMmsToTxt(mockMms);
    log.result('TXT', 'MMS', txt);
    
    expect(txt).toBeTruthy();
    log.validation('TXT is truthy', !!txt);
    
    expect(typeof txt).toBe('string');
    log.validation('TXT is string', typeof txt === 'string');
    
    expect(txt.length).toBeGreaterThan(0);
    log.validation(`TXT length > 0 (${txt.length})`, txt.length > 0);
    
    // Validate content contains expected fields
    expect(txt).toContain('type:');
    log.validation('TXT contains type:', txt.includes('type:'));
    
    expect(txt).toContain('subject:');
    log.validation('TXT contains subject:', txt.includes('subject:'));
  });

  test('should export MMS to CSV format', () => {
    log.action('Exporting MMS to CSV', { count: mockMms.length });
    const csv = exportMmsToCsv(mockMms);
    log.result('CSV', 'MMS', csv);
    
    expect(csv).toBeTruthy();
    log.validation('CSV is truthy', !!csv);
    
    expect(typeof csv).toBe('string');
    log.validation('CSV is string', typeof csv === 'string');
    
    expect(csv.length).toBeGreaterThan(0);
    log.validation(`CSV length > 0 (${csv.length})`, csv.length > 0);
    
    // Parse CSV and validate
    log.action('Parsing CSV');
    const Papa = require('papaparse');
    const parsed = Papa.parse(csv, { header: true });
    log.parsed('CSV', 'MMS', parsed.data);
    
    expect(parsed.errors.length).toBe(0);
    log.validation(`CSV parse errors: ${parsed.errors.length}`, parsed.errors.length === 0);
    if (parsed.errors.length > 0) {
      console.log('[ERRORS]', parsed.errors);
    }
    
    expect(parsed.data.length).toBe(mockMms.length);
    log.validation(`CSV row count matches (${parsed.data.length} === ${mockMms.length})`, parsed.data.length === mockMms.length);
    
    expect(parsed.data[0]).toHaveProperty('type', 'mms');
    log.validation('First CSV row has type=mms', parsed.data[0]?.type === 'mms');
  });

  test('should export MMS to XML format', () => {
    log.action('Exporting MMS to XML', { count: mockMms.length });
    const xml = exportMmsToXml(mockMms);
    log.result('XML', 'MMS', xml);
    
    expect(xml).toBeTruthy();
    log.validation('XML is truthy', !!xml);
    
    expect(xml.startsWith('<?xml')).toBe(true);
    log.validation('XML starts with <?xml', xml.startsWith('<?xml'));
    
    expect(xml).toContain('<mmses>');
    log.validation('XML contains <mmses>', xml.includes('<mmses>'));
    
    expect(xml).toContain('</mmses>');
    log.validation('XML contains </mmses>', xml.includes('</mmses>'));
    
    expect(xml).toContain('<mms>');
    log.validation('XML contains <mms>', xml.includes('<mms>'));
    
    // Parse XML and validate structure
    log.action('Parsing XML');
    const { xml2js } = require('xml-js');
    const parsed = xml2js(xml, { compact: true, ignoreComment: true });
    log.parsed('XML', 'MMS', parsed);
    
    expect(parsed).toBeDefined();
    log.validation('XML parsed successfully', !!parsed);
    
    expect(xml).toContain('mms');
    log.validation('XML contains mms content', xml.includes('mms'));
  });
});

describe('Contacts Export Tests', () => {
  const mockContacts = createMockContacts();

  test('should export Contacts to JSON format', () => {
    log.action('Exporting Contacts to JSON', { count: mockContacts.length });
    const json = exportContactsToJson(mockContacts);
    log.result('JSON', 'Contacts', json);
    
    expect(json).toBeTruthy();
    log.validation('JSON is truthy', !!json);
    
    // Parse and validate JSON
    log.action('Parsing JSON');
    const parsed = JSON.parse(json);
    log.parsed('JSON', 'Contacts', parsed);
    
    expect(Array.isArray(parsed)).toBe(true);
    log.validation('Parsed result is array', Array.isArray(parsed));
    
    expect(parsed.length).toBe(mockContacts.length);
    log.validation(`Array length matches (${parsed.length} === ${mockContacts.length})`, parsed.length === mockContacts.length);
    
    expect(parsed[0]).toHaveProperty('id');
    log.validation('First item has id field', 'id' in parsed[0]);
    
    expect(parsed[0]).toHaveProperty('name');
    log.validation('First item has name field', 'name' in parsed[0]);
  });

  test('should export Contacts to TXT format', () => {
    log.action('Exporting Contacts to TXT', { count: mockContacts.length });
    const txt = exportContactsToTxt(mockContacts);
    log.result('TXT', 'Contacts', txt);
    
    expect(txt).toBeTruthy();
    log.validation('TXT is truthy', !!txt);
    
    expect(typeof txt).toBe('string');
    log.validation('TXT is string', typeof txt === 'string');
    
    expect(txt.length).toBeGreaterThan(0);
    log.validation(`TXT length > 0 (${txt.length})`, txt.length > 0);
    
    // Validate content contains expected fields
    expect(txt).toContain('id:');
    log.validation('TXT contains id:', txt.includes('id:'));
    
    expect(txt).toContain('name:');
    log.validation('TXT contains name:', txt.includes('name:'));
  });

  test('should export Contacts to CSV format (normal)', () => {
    log.action('Exporting Contacts to CSV (normal)', { count: mockContacts.length });
    const csv = exportContactsToCsv(mockContacts);
    log.result('CSV', 'Contacts', csv);
    
    expect(csv).toBeTruthy();
    log.validation('CSV is truthy', !!csv);
    
    expect(typeof csv).toBe('string');
    log.validation('CSV is string', typeof csv === 'string');
    
    expect(csv.length).toBeGreaterThan(0);
    log.validation(`CSV length > 0 (${csv.length})`, csv.length > 0);
    
    // Parse CSV and validate
    log.action('Parsing CSV');
    const Papa = require('papaparse');
    const parsed = Papa.parse(csv, { header: true });
    log.parsed('CSV', 'Contacts', parsed.data);
    
    expect(parsed.errors.length).toBe(0);
    log.validation(`CSV parse errors: ${parsed.errors.length}`, parsed.errors.length === 0);
    if (parsed.errors.length > 0) {
      console.log('[ERRORS]', parsed.errors);
    }
    
    expect(parsed.data.length).toBe(mockContacts.length);
    log.validation(`CSV row count matches (${parsed.data.length} === ${mockContacts.length})`, parsed.data.length === mockContacts.length);
    
    expect(parsed.data[0]).toHaveProperty('id');
    log.validation('First CSV row has id field', 'id' in parsed.data[0]);
  });

  test('should export Contacts to Google CSV format', () => {
    log.action('Exporting Contacts to Google CSV', { count: mockContacts.length });
    const csv = exportContactsToGoogleCsv(mockContacts);
    log.result('Google CSV', 'Contacts', csv);
    
    expect(csv).toBeTruthy();
    log.validation('CSV is truthy', !!csv);
    
    expect(typeof csv).toBe('string');
    log.validation('CSV is string', typeof csv === 'string');
    
    expect(csv.length).toBeGreaterThan(0);
    log.validation(`CSV length > 0 (${csv.length})`, csv.length > 0);
    
    // Parse CSV and validate Google format fields
    log.action('Parsing Google CSV');
    const Papa = require('papaparse');
    const parsed = Papa.parse(csv, { header: true });
    log.parsed('Google CSV', 'Contacts', parsed.data);
    
    expect(parsed.errors.length).toBe(0);
    log.validation(`CSV parse errors: ${parsed.errors.length}`, parsed.errors.length === 0);
    
    expect(parsed.data.length).toBe(mockContacts.length);
    log.validation(`CSV row count matches (${parsed.data.length} === ${mockContacts.length})`, parsed.data.length === mockContacts.length);
    
    expect(parsed.data[0]).toHaveProperty('Name');
    log.validation('Has Name field', 'Name' in parsed.data[0]);
    
    expect(parsed.data[0]).toHaveProperty('Given Name');
    log.validation('Has Given Name field', 'Given Name' in parsed.data[0]);
    
    expect(parsed.data[0]).toHaveProperty('Family Name');
    log.validation('Has Family Name field', 'Family Name' in parsed.data[0]);
    
    expect(parsed.data[0]).toHaveProperty('Phone 1 - Value');
    log.validation('Has Phone 1 - Value field', 'Phone 1 - Value' in parsed.data[0]);
    
    expect(parsed.data[0]).toHaveProperty('E-mail 1 - Value');
    log.validation('Has E-mail 1 - Value field', 'E-mail 1 - Value' in parsed.data[0]);
  });

  test('should export Contacts to Outlook CSV format', () => {
    log.action('Exporting Contacts to Outlook CSV', { count: mockContacts.length });
    const csv = exportContactsToOutlookCsv(mockContacts);
    log.result('Outlook CSV', 'Contacts', csv);
    
    expect(csv).toBeTruthy();
    log.validation('CSV is truthy', !!csv);
    
    expect(typeof csv).toBe('string');
    log.validation('CSV is string', typeof csv === 'string');
    
    expect(csv.length).toBeGreaterThan(0);
    log.validation(`CSV length > 0 (${csv.length})`, csv.length > 0);
    
    // Parse CSV and validate Outlook format fields
    log.action('Parsing Outlook CSV');
    const Papa = require('papaparse');
    const parsed = Papa.parse(csv, { header: true });
    log.parsed('Outlook CSV', 'Contacts', parsed.data);
    
    expect(parsed.errors.length).toBe(0);
    log.validation(`CSV parse errors: ${parsed.errors.length}`, parsed.errors.length === 0);
    
    expect(parsed.data.length).toBe(mockContacts.length);
    log.validation(`CSV row count matches (${parsed.data.length} === ${mockContacts.length})`, parsed.data.length === mockContacts.length);
    
    expect(parsed.data[0]).toHaveProperty('First Name');
    log.validation('Has First Name field', 'First Name' in parsed.data[0]);
    
    expect(parsed.data[0]).toHaveProperty('Last Name');
    log.validation('Has Last Name field', 'Last Name' in parsed.data[0]);
    
    expect(parsed.data[0]).toHaveProperty('Mobile Phone');
    log.validation('Has Mobile Phone field', 'Mobile Phone' in parsed.data[0]);
    
    expect(parsed.data[0]).toHaveProperty('E-mail Address');
    log.validation('Has E-mail Address field', 'E-mail Address' in parsed.data[0]);
  });

  test('should export Contacts to XML format', () => {
    log.action('Exporting Contacts to XML', { count: mockContacts.length });
    const xml = exportContactsToXml(mockContacts);
    log.result('XML', 'Contacts', xml);
    
    expect(xml).toBeTruthy();
    log.validation('XML is truthy', !!xml);
    
    expect(xml.startsWith('<?xml')).toBe(true);
    log.validation('XML starts with <?xml', xml.startsWith('<?xml'));
    
    expect(xml).toContain('<contacts>');
    log.validation('XML contains <contacts>', xml.includes('<contacts>'));
    
    expect(xml).toContain('</contacts>');
    log.validation('XML contains </contacts>', xml.includes('</contacts>'));
    
    expect(xml).toContain('<contact>');
    log.validation('XML contains <contact>', xml.includes('<contact>'));
    
    // Parse XML and validate structure
    log.action('Parsing XML');
    const { xml2js } = require('xml-js');
    const parsed = xml2js(xml, { compact: true, ignoreComment: true });
    log.parsed('XML', 'Contacts', parsed);
    
    expect(parsed).toBeDefined();
    log.validation('XML parsed successfully', !!parsed);
    
    expect(xml).toContain('contact');
    log.validation('XML contains contact content', xml.includes('contact'));
  });
});

describe('Export Data Validation', () => {
  const mockSms = createMockMessages().filter(m => m.type === 'sms');
  const mockMms = createMockMessages().filter(m => m.type === 'mms');
  const mockContacts = createMockContacts();

  test('should preserve all SMS data fields across formats', () => {
    log.action('Validating SMS data preservation across formats');
    
    log.action('Exporting SMS to JSON');
    const json = JSON.parse(exportSmsToJson(mockSms));
    log.parsed('JSON', 'SMS', json);
    
    log.action('Exporting SMS to CSV');
    const csv = require('papaparse').parse(exportSmsToCsv(mockSms), { header: true }).data;
    log.parsed('CSV', 'SMS', csv);
    
    // Compare key fields
    log.action('Comparing JSON fields to original');
    expect(json[0].id).toBe(mockSms[0].id);
    log.validation(`JSON id matches (${json[0].id} === ${mockSms[0].id})`, json[0].id === mockSms[0].id);
    
    expect(json[0].body).toBe(mockSms[0].body);
    log.validation(`JSON body matches`, json[0].body === mockSms[0].body);
    
    expect(json[0].sender).toBe(mockSms[0].sender);
    log.validation(`JSON sender matches`, json[0].sender === mockSms[0].sender);
    
    log.action('Comparing CSV fields to original');
    expect(csv[0].id).toBe(String(mockSms[0].id));
    log.validation(`CSV id matches (${csv[0].id} === ${String(mockSms[0].id)})`, csv[0].id === String(mockSms[0].id));
    
    expect(csv[0].body).toBe(mockSms[0].body);
    log.validation(`CSV body matches`, csv[0].body === mockSms[0].body);
    
    expect(csv[0].sender).toBe(mockSms[0].sender);
    log.validation(`CSV sender matches`, csv[0].sender === mockSms[0].sender);
  });

  test('should preserve all MMS data fields across formats', () => {
    log.action('Validating MMS data preservation across formats');
    
    log.action('Exporting MMS to JSON');
    const json = JSON.parse(exportMmsToJson(mockMms));
    log.parsed('JSON', 'MMS', json);
    
    log.action('Exporting MMS to CSV');
    const csv = require('papaparse').parse(exportMmsToCsv(mockMms), { header: true }).data;
    log.parsed('CSV', 'MMS', csv);
    
    // Compare key fields
    log.action('Comparing JSON fields to original');
    expect(json[0].id).toBe(mockMms[0].id);
    log.validation(`JSON id matches (${json[0].id} === ${mockMms[0].id})`, json[0].id === mockMms[0].id);
    
    expect(json[0].subject).toBe(mockMms[0].subject);
    log.validation(`JSON subject matches`, json[0].subject === mockMms[0].subject);
    
    expect(json[0].sender).toBe(mockMms[0].sender);
    log.validation(`JSON sender matches`, json[0].sender === mockMms[0].sender);
    
    log.action('Comparing CSV fields to original');
    expect(csv[0].id).toBe(String(mockMms[0].id));
    log.validation(`CSV id matches (${csv[0].id} === ${String(mockMms[0].id)})`, csv[0].id === String(mockMms[0].id));
    
    expect(csv[0].subject).toBe(mockMms[0].subject);
    log.validation(`CSV subject matches`, csv[0].subject === mockMms[0].subject);
    
    expect(csv[0].sender).toBe(mockMms[0].sender);
    log.validation(`CSV sender matches`, csv[0].sender === mockMms[0].sender);
  });

  test('should preserve all Contact data fields across formats', () => {
    log.action('Validating Contact data preservation across formats');
    
    log.action('Exporting Contacts to JSON');
    const json = JSON.parse(exportContactsToJson(mockContacts));
    log.parsed('JSON', 'Contacts', json);
    
    log.action('Exporting Contacts to CSV');
    const csv = require('papaparse').parse(exportContactsToCsv(mockContacts), { header: true }).data;
    log.parsed('CSV', 'Contacts', csv);
    
    // Compare key fields
    log.action('Comparing JSON fields to original');
    expect(json[0].id).toBe(mockContacts[0].id);
    log.validation(`JSON id matches (${json[0].id} === ${mockContacts[0].id})`, json[0].id === mockContacts[0].id);
    
    expect(json[0].name).toContain(mockContacts[0].name[0]);
    log.validation(`JSON name contains original name`, json[0].name.includes(mockContacts[0].name[0]));
    
    log.action('Comparing CSV fields to original');
    expect(csv[0].id).toBe(mockContacts[0].id);
    log.validation(`CSV id matches (${csv[0].id} === ${mockContacts[0].id})`, csv[0].id === mockContacts[0].id);
    
    expect(csv[0].name).toContain(mockContacts[0].name[0]);
    log.validation(`CSV name contains original name`, csv[0].name.includes(mockContacts[0].name[0]));
  });

  test('should handle empty arrays gracefully', () => {
    log.action('Testing empty array handling');
    
    log.action('Testing SMS empty array');
    expect(() => exportSmsToJson([])).not.toThrow();
    log.validation('SMS empty array export does not throw', true);
    
    log.action('Testing MMS empty array');
    expect(() => exportMmsToJson([])).not.toThrow();
    log.validation('MMS empty array export does not throw', true);
    
    log.action('Testing Contacts empty array');
    expect(() => exportContactsToJson([])).not.toThrow();
    log.validation('Contacts empty array export does not throw', true);
    
    log.action('Validating SMS empty result');
    const smsJson = JSON.parse(exportSmsToJson([]));
    expect(smsJson).toEqual([]);
    log.validation('SMS empty result is empty array', Array.isArray(smsJson) && smsJson.length === 0);
    
    log.action('Validating Contacts empty result');
    const contactsJson = JSON.parse(exportContactsToJson([]));
    expect(contactsJson).toEqual([]);
    log.validation('Contacts empty result is empty array', Array.isArray(contactsJson) && contactsJson.length === 0);
  });
});
