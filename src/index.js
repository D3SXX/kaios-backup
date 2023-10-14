"use strict";


document.activeElement.addEventListener("keydown", handleKeydown);
var key;
var row = 0;
var col = 1;
var rowLimit;
var currentDate;
var holdIndex = ["SMS", "MMS", "Logs"];
var holdValues = [false, false, false];
refreshDate();
var filename = "KaiOS_Backup/backup_" + currentDate + "/backup_" + currentDate;
var enableDebug = false;

function writeToFile(array, amount, filename, type, format) {
  let plainText = "";
  let oldFilename = filename;
  let json;
  let sdcard = navigator.getDeviceStorage("sdcard");
  console.log(
    "Trying to upload " +
      amount +
      " elements (" +
      type +
      ") to " +
      filename +
      "(" +
      format +
      ")"
  );
  switch (format) {
    case "plain":
      switch (type) {
        case "sms":
          filename = filename + "_SMS";
          for (let i = 0; i < amount; i++) {
            const message = new SMSMessage(array[i]);
            plainText += "type: " + message.type;
            plainText += " id: " + message.id;
            plainText += " threadId: " + message.threadId;
            plainText += " iccId: " + message.iccId;
            plainText += " deliveryStatus: " + message.deliveryStatus;
            plainText += " sender: " + message.sender;
            plainText += " receiver: " + message.receiver;
            plainText += " body: " + message.body;
            plainText += " messageClass: " + message.messageClass;
            plainText += " deliveryTimestamp: " + message.deliveryTimestamp;
            plainText += " read: " + message.read;
            plainText += " sentTimestamp: " + message.sentTimestamp;
            plainText += " timestamp: " + message.timestamp;
            plainText += "\n";
          }
          break;
        case "mms":
          filename = filename + "_MMS";
          for (let i = 0; i < amount; i++) {
            const message = new MMSMessage(array[i]);
            plainText += "type: " + message.type;
            plainText += " id: " + message.id;
            plainText += " threadId: " + message.threadId;
            plainText += " iccId: " + message.iccId;
            plainText += " delivery: " + message.delivery;
            plainText += " expiryDate: " + message.expiryDate;
            plainText += " attachments: " + message.attachments[0].location;
            plainText += " read: " + message.read;
            plainText += " readReportRequested: " + message.readReportRequested;
            plainText += " receivers: " + message.receivers.join(", ");
            plainText += " sentTimestamp: " + message.sentTimestamp;
            plainText += " smil: " + message.smil;
            plainText += " subject: " + message.subject;
            plainText += " timestamp: " + message.timestamp;
            plainText += "\n";
          }
          break;
        case "contact":
          filename = filename + "_Contacts";
          for (let i = 0; i < amount; i++) {
            const contact = new Contact(array[i]);
            plainText += "additionalName: " + contact.additionalName;
            plainText += " adr: " + contact.adr;
            plainText += " anniversary: " + contact.anniversary;
            plainText += " bday: " + contact.bday;
            plainText += " category: " + contact.category.join(", ");
            plainText += " email: " + contact.email;
            plainText += " familyName: " + contact.familyName.join(", ");
            plainText += " genderIdentity: " + contact.genderIdentity;
            plainText += " givenName: " + contact.givenName.join(", ");
            plainText += " group: " + contact.group;
            plainText += " honorificPrefix: " + contact.honorificPrefix;
            plainText += " honorificSuffix: " + contact.honorificSuffix;
            plainText += " id: " + contact.id;
            plainText += " impp: " + contact.impp;
            plainText += " jobTitle: " + contact.jobTitle;
            plainText += " key: " + contact.key;
            plainText += " name: " + contact.name.join(", ");
            plainText += " nickname: " + contact.nickname;
            plainText += " note: " + contact.note;
            plainText += " org: " + contact.org;
            plainText += " phoneticFamilyName: " + contact.phoneticFamilyName;
            plainText += " phoneticGivenName: " + contact.phoneticGivenName;
            plainText += " photo: " + contact.photo;
            plainText += " published: " + contact.published;
            plainText += " ringtone: " + contact.ringtone;
            plainText += " sex: " + contact.sex;
            let tel = contact.tel[0];
            plainText += " tel: " + tel.type[0] + " " + tel.value;
            plainText += " updated: " + contact.updated;
            plainText += " url: " + contact.url;
            plainText += "\n";
          }
          break;
      }
      filename = filename + ".txt";
      
      let oMyBlob = new Blob([plainText], { type: "text/plain" });
      let request = sdcard.addNamed(oMyBlob, filename);
      request.onsuccess = function () {
        alert(
          "Data was successfully written to the internal storage (" +
            filename +
            ")"
        );
      };
      request.onerror = function () {
        console.log("Error happened while trying to write to " + oldFilename);
        alert(
          "Error happened while trying to write to " +
            filename +
            " " +
            this.error
        );
      };
      break;
    case "json":

    switch (type) {
      case "sms":
        json = JSON.stringify(array, null, 2);
        filename = filename + "_SMS.json";
        break;
      case "mms":
        json  = JSON.stringify(array, null, 2);
        filename = filename + "_MMS.json";
        break;
      case "contact":
        json = JSON.stringify(array, null, 2);
        filename = filename + "_Contacts.json";
        break;
      default:
        console.log("Invalid 'type' for JSON format.");
        return;
    }

    let oMyJsonBlob = new Blob([json], {
      type: "application/json",
    });
    let requestJson = sdcard.addNamed(oMyJsonBlob, filename);
    requestJson.onsuccess = function () {
      alert(
        "Data was successfully written to the internal storage (" +
          filename +
          ")"
      );
    };
    requestJson.onerror = function () {
      console.log("Error happened while trying to write to " + oldFilename);
      alert(
        "Error happened while trying to write to " +
          filename +
          " " +
          this.error
      );
    }
    break;
  default:
    console.log("Invalid 'format'.");
    break;
}
}
function SMSMessage(message) {
  this.type = message.type || '';
  this.id = message.id || '';
  this.threadId = message.threadId || '';
  this.iccId = message.iccId || '';
  this.delivery = message.delivery || '';
  this.deliveryStatus = message.deliveryStatus || '';
  this.sender = message.sender || '';
  this.receiver = message.receiver || '';
  this.body = message.body || '';
  this.messageClass = message.messageClass || '';
  this.deliveryTimestamp = message.deliveryTimestamp || '';
  this.read = message.read || false;
  this.sentTimestamp = message.sentTimestamp || '';
  this.timestamp = message.timestamp || '';
}

function MMSMessage(message) {
  this.type = message.type || '';
  this.id = message.id || '';
  this.threadId = message.threadId || '';
  this.iccId = message.iccId || '';
  this.delivery = message.delivery || '';
  this.deliveryInfo = message.deliveryInfo || {};
  this.expiryDate = message.expiryDate || '';
  this.attachments = message.attachments || [];
  this.read = message.read || false;
  this.readReportRequested = message.readReportRequested || false;
  this.receivers = message.receivers || [];
  this.sentTimestamp = message.sentTimestamp || '';
  this.smil = message.smil || '';
  this.subject = message.subject || '';
  this.timestamp = message.timestamp || '';
}

function Contact(contact) {
  this.additionalName = contact.additionalName || null;
  this.adr = contact.adr || null;
  this.anniversary = contact.anniversary || null;
  this.bday = contact.bday || null;
  this.category = contact.category || [];
  this.email = contact.email || null;
  this.familyName = contact.familyName || [];
  this.genderIdentity = contact.genderIdentity || null;
  this.givenName = contact.givenName || [];
  this.group = contact.group || null;
  this.honorificPrefix = contact.honorificPrefix || null;
  this.honorificSuffix = contact.honorificSuffix || null;
  this.id = contact.id || '';
  this.impp = contact.impp || null;
  this.jobTitle = contact.jobTitle || null;
  this.key = contact.key || null;
  this.name = contact.name || [];
  this.nickname = contact.nickname || null;
  this.note = contact.note || null;
  this.org = contact.org || null;
  this.phoneticFamilyName = contact.phoneticFamilyName || null;
  this.phoneticGivenName = contact.phoneticGivenName || null;
  this.photo = contact.photo || null;
  this.published = contact.published || null;
  this.ringtone = contact.ringtone || null;
  this.sex = contact.sex || null;
  this.tel = contact.tel || [];
  this.updated = contact.updated || null;
  this.url = contact.url || null;
}

const smsMessages = [];
const mmsMessages = [];
const contacts = [];

function refreshDate() {
  const date = new Date();
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  currentDate = `${day}-${month}-${year}`;
}
function showDebug() {
  if(enableDebug){
  const debugElement = document.getElementById("debug");
  debugElement.innerHTML = `nav: ${key} row: ${row} (${rowLimit}) col: ${col}`;
  }
}

function isElementInFocus(element) {
  return element === document.activeElement;
}

function focusInput(id) {
  const inputElement = document.getElementById("i" + id);
  const isInFocus = isElementInFocus(inputElement);
  if (!isInFocus) {
    if (inputElement) {
      inputElement.focus();
      inputElement.value = "";
      console.log("id: i" + row + " - focused");
    }
  } else {
    const inputValue = inputElement.value;
    filename = inputValue;
    inputElement.blur();
    console.log("id: i" + row + " - unfocused");
  }
  console.log("filename is set to: " + filename);
}

function check(id) {
  const checkbox = document.getElementById("b" + id);
  if (checkbox.checked) {
    checkbox.checked = false;
    holdValues[id - 1] = false;
    console.log("id: b" + row + " - unchecked");
  } else {
    checkbox.checked = true;
    holdValues[id - 1] = true;
    console.log("id: b" + row + " - checked");
  }
  console.log("Values: " + holdValues);
}

function handleKeydown(e) {
  switch (e.key) {
    case "ArrowUp":
      nav(1);
      console.log("ArrowUp triggered");
      break;
    case "ArrowDown":
      nav(2);
      console.log("ArrowDown triggered");
      break;
    case "ArrowRight":
      nav(3);
      console.log("ArrowRight triggered");
      break;
    case "ArrowLeft":
      nav(4);
      console.log("ArrowLeft triggered");
      break;
    case "Enter":
      nav(5);
      console.log("Enter triggered");
      break;
    case "SoftRight":
      nav(6);
      console.log("SoftRight triggered");
      break;
    case "#":
      console.log("# key triggered");
      enableDebug = true;
      break;
  }
}

function nav(move) {
  key = move;
  const currentIndex = document.activeElement.tabIndex;
  const next = currentIndex + move;
  const items = document.querySelectorAll(".items");
  const targetElement = items[next];
  if (targetElement) {
    targetElement.focus();
  }

  updateMenuContainer(move);
}

function fetchSMSMessages() {
  console.log("fetchSMSMessages: Starting backup");
  let smsManager = window.navigator.mozSms || window.navigator.mozMobileMessage;
  if (!smsManager) {
    console.error("Could not get API access");
    alert("Could not get API access");
    return;
  }
  console.log("Got access to mozSms or mozMobileMessage");
  let request = smsManager.getMessages(null, false);
  if (!request) {
    console.error("Couldn't access getMessages().");
    alert("Couldn't access getMessages().");
    return;
  }
  console.log("Got access to getMessages(), starting scan");
  let amount = 0;
  request.onsuccess = function () {
    let cursor = request;
    if (!cursor.result) {
      console.log("Got the last message");
      console.log("Successfully scanned " + amount + " messages.");
      writeToFile(smsMessages, amount, filename, "sms", "plain");
      return;
    }
    const message = cursor.result;
    if (message.type == "sms") {
      const newMessage = new SMSMessage(message); // Create SMSMessage from message object
      smsMessages.push(newMessage);
      amount += 1;
      cursor.continue();
    } else {
      console.log("Not an SMS message, skipping...");
      cursor.continue();
    }
  };
  request.onerror = function () {
    console.error("Error accessing SMS messages: " + request.error.name);
    alert("Error accessing SMS messages.");
  };

}


function fetchMMSMessages() {
  console.log("fetchMMSMessages: Starting backup");

  let mmsManager = window.navigator.mozMms || window.navigator.mozMobileMessage;

  if (!mmsManager) {
    console.error("Could not get MMS API access");
    alert("Could not get MMS API access");
    return;
  }

  let request = mmsManager.getMessages(null, false);
  let amount = 0;

  request.onsuccess = function () {
    let cursor = request;
    if (!cursor.result) {
      console.log("Got the last MMS message");
      console.log("Successfully scanned " + amount + " MMS messages.");
      writeToFile(mmsMessages, amount, filename, "mms", "plain");
      saveMMSImages(mmsMessages);
      return;
    }
    const message = cursor.result;
    if (message.type == "mms") {
      const newMessage = new MMSMessage(message);
      mmsMessages.push(newMessage);
      amount += 1;
      cursor.continue();
    } else {
      console.log("Not an MMS, skipping...");
      cursor.continue();
    }
    
  };

  request.onerror = function () {
    console.error("Error accessing MMS messages: " + request.error.name);
    alert("Error accessing MMS messages.");
  };

}

function fetchCallLogs() {
  if (typeof CallLogMgr !== 'undefined') {
    initCallLogMgr(false, true, false);

    CallLogMgr.addEventListener('updated', function () {
      const callLogs = CallLogMgr.getList();
      console.log('Call Logs:', callLogs);

    });
  } else {
    console.error('CallLogMgr is not available.');
  }
}

function fetchContacts() {
  console.log("fetchContacts: Starting backup");
  if ('mozContacts' in navigator) {
    let options = {
      filterBy: [],
    };

    let request = navigator.mozContacts.find(options);

    request.onsuccess = function () {
      let allContacts = request.result;

      if (allContacts.length > 0) {
        console.log('Found ' + allContacts.length + ' contacts, proceeding...');
        for (let i = 0; i < allContacts.length; i++) {
          let currentContact = allContacts[i];
          const newContact = new Contact(currentContact);
          contacts.push(newContact);
        }
        console.log('Got the last contact');
        writeToFile(contacts, allContacts.length, filename, "contact", "plain");
      } else {
        console.log('No contacts found.');
      }
    };

    request.onerror = function () {
      console.error('Error accessing contacts: ' + request.error.name);
    };
  } else {
    console.error('Could not get API access for contacts.');
  }
}

function saveMMSImages(mmsMessages) {
  for (let i = 0; i < mmsMessages.length; i++) {
    const attachments = mmsMessages[i].attachments;
    for (let j = 0; j < attachments.length; j++) {
      const attachment = attachments[j];
      const imageFilename = 'KaiOS_Backup/backup_' + currentDate +  '/MMS_images/' + attachment.location;
      const imageUrl = attachment.content;
      saveImageToFile(imageUrl, imageFilename);
    }
  }
}

function saveImageToFile(imageUrl, filename) {
  const sdcard = navigator.getDeviceStorage('sdcard');
  const blob = new Blob([imageUrl]);
  const request = sdcard.addNamed(blob, filename);
  request.onsuccess = function () {
    console.log('Image saved as ' + filename);
  };
  request.onerror = function () {
    console.error('Error while saving image: ' + request.error.name);
  };
}


function updateMenuContainer(nav) {
  const menuContainer = document.getElementById("menu-container");
  const navbar = document.getElementById("nav-bar");
  const currentContent = menuContainer.innerHTML;
  let navbarEntry = "";
  let newEntry = "";

  if (nav == 3 || nav == 4) {
    row = 0;
    if (nav == 4) {
      col = 1;
      newEntry = `<ul>
      <li id="1">Save SMS <input type="checkbox" id="b1" name="SMS" ${
        holdValues[0] ? "checked" : ""
      }></li>
      <li id="2">Save MMS <input type="checkbox" id="b2" name="MMS" ${
        holdValues[1] ? "checked" : ""
      }></li>
      <li id="3">Save Contacts <input type="checkbox" id="b3" name="LOGS" ${
        holdValues[2] ? "checked" : ""
      }></li>
      </ul>`;
      navbarEntry =
        '<span id="l1" class="hovered">Data Selection</span> <span id="l2" class=""> Filenames </span>';
      rowLimit = 3;
    } else if (nav == 3) {
      col = 2;
      refreshDate();
      if (!filename) {
        filename = "KaiOS_Backup/backup_" + currentDate + "/backup_" + currentDate;
      }

      newEntry = ` <ul>
      <li id = 1>Filename: <input type="text" id="i1" value=${filename} nav-selectable="true" autofocus /></li>
      </ul>`;
      navbarEntry =
        '<span id="l1" class="">Data Selection</span> <span id="l2" class="hovered"> Filenames </span>';
      rowLimit = 1;
    }

    if (!currentContent.includes(newEntry)) {
      menuContainer.innerHTML = newEntry;
      navbar.innerHTML = navbarEntry;
    }
  } else if (nav == 1 || nav == 2) {
    if (row && row <= rowLimit) {
      const pastElement = document.getElementById(row);
      pastElement.classList.remove("hovered");
    }
    if (nav == 2) {
      if (row < rowLimit) {
        row++;
        const element = document.getElementById(row);
        if (element) {
          element.classList.add("hovered");
          console.log("Hover Down, row = " + row);
        }
      } else {
        row = 0;
      }
    } else {
      if (row >= 1) {
        row--;
        const element = document.getElementById(row);
        if (element) {
          element.classList.add("hovered");
          console.log("Hover Up, row = " + row);
        }
      } else {
        row = rowLimit + 1;
      }
    }
  } else if (nav == 5) {
    if (col == 1) {
      check(row);
    } else {
      focusInput(row);
    }
  } else {
    if (holdValues.every((element) => element === false)) {
      console.error("Nothing was selected to backup");
      alert("Nothing was selected to backup");
    }
    else{
      if (holdValues[0] == true){
        fetchSMSMessages();
    }
    if(holdValues[1] == true){
      fetchMMSMessages();
    }
    if(holdValues[2] == true){
      fetchContacts();
    }
  }
    
  }

  showDebug();
}

nav(4);
