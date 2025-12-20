/**
 * Export helper functions for testing
 */

// Import all export utilities from the shared module
import {
  SmsMessage,
  MmsMessage,
  Contact,
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
} from '../../src/export-utils.js';

module.exports = {
  SmsMessage,
  MmsMessage,
  Contact,
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
};
