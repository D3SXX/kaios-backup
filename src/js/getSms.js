
const smsMessages = [];


function fetchSMSMessages() {
  const messageManager = navigator.mozMobileMessage;

  if (!messageManager) {
    console.error('MozMobileMessageManager is not available.');
    return;
  }

  const smsFilter = {
    // Use 'sms' for SMS messages
    // Use 'mms' for MMS messages
    // Use 'all' for both SMS and MMS messages
    type: 'sms',
  };

  const smsCursor = messageManager.getMessages(smsFilter, false);

  smsCursor.onsuccess = function () {
    const message = smsCursor.result;
    if (message) {
      smsMessages.push(message);

      smsCursor.continue();
    } else {
      console.log('All SMS messages retrieved:', smsMessages);
    }
  };
  smsCursor.onerror = function () {
    console.error('Error fetching SMS messages:', smsCursor.error);
  };
}

export default { fetchSMSMessages }