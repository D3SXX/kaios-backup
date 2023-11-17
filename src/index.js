"use strict";

document.activeElement.addEventListener("keydown", handleKeydown);
let key;
let currentDate;
refreshDate();
let folderPath = "KaiOS_Backup/";
let filename = folderPath + "backup_" + currentDate + "/backup_" + currentDate;
let enableClear = false;
let enableMenu = false;
let enableOptions = false;
let processLogsEntries = [0,0,0];
let scrollLimit = 0;
let captureExtraLogs = false;
let localeData;
const buildInfo = ["1.0.2d Beta","17.11.2023"];

fetch("src/locale.json")
  .then((response) => {
    return response.json();
  })
  .then((data) => initProgram(data));

function initProgram(data){
  //const userLocale = navigator.language;
  const userLocale = "en-US"
  localeData = data[userLocale];
  if(!localeData){
    localeData = data["en-US"]
  }
  console.log(`KaiOS Backup ver. ${buildInfo[0]} initialized`)
  menu.draw(1)
}

// A structure to hold values
const backupData = {
  dataTypes: ["sms", "mms", "contacts"], // Data that can be exported
  exportData: [false, false, false], // Values for dataTypes
  formatTypes: ["plain","json","csv","xml"],
  exportFormats: [false, false, false, false], // Values for formats that can be used to export data
  csvExportTypes: ["normal","google","outlook"],
  csvExportValues: [true, false, false], // Values for CSV Contacts Export
  // Method to toggle values
  toggleValue: function (index, type) {
    switch(type){
      case "exportData":
        if (index >= 0 && index < this.exportData.length) {
          this.exportData[index] = !this.exportData[index];
          return this.exportData[index];
        }
        break;
      case "exportFormats":
        if (index >= 0 && index < this.exportFormats.length) {
          this.exportFormats[index] = !this.exportFormats[index];
          return this.exportFormats[index];
        }
        break;
      case "csvExportValues":
        if (index >= 0 && index < this.csvExportValues.length) {
          this.csvExportValues[index] = !this.csvExportValues[index];
          return this.csvExportValues[index];
        }
        break;
  }
  return null;
  },
  
};

const debug = {
  enableDebug: false,
  toggle: function(){
    this.enableDebug = !this.enableDebug;
    this.print("Debug output activated");
    const debugElement = document.getElementById("debug");
    if(this.enableDebug){
      debugElement.innerHTML = 'Debug output activated';
    }
    else{
      debugElement.innerHTML = '';
    }
  },
  print: function(msg,flag = null) {
    if(this.enableDebug){
      switch(flag){
        case "error":
          console.error(msg);
          break;
        case "warning":
          console.warn(msg)
          break;
        default:
          console.log(msg);
          break;
      }
    }
  },
  show: function() {
    if (this.enableDebug) {
      const debugElement = document.getElementById("debug");
      debugElement.innerHTML = `nav: ${key} row: ${controls.row} (${controls.rowLimit}) col: ${controls.col}`;
    }
  }
}

const process = {
  progressProceeding: false,
  processesState: [],
  blockControls: false,
  smsLogs: [],
  mmsLogs: [],
  contactsLogs: [],
  start: function(arr){
    if (!this.isReady() || this.progressProceeding){
      debug.print("process.start() - Can't start (either not ready or progress is proceeding)")
      return;
    }
    debug.print("process.start() - Check passed, starting");
    this.progressProceeding = true;
    this.smsLogs = [];
    this.mmsLogs = [];
    this.contactsLogs = [];
    this.processesState = arr.slice();
    this.blockControls = true;
    let softkeysArr = ["",localeData[0]["softCenter"],""];
    drawSoftkeys(softkeysArr);
    controls.updateLimits(undefined,3);
    if (backupData.exportData[0]) {
      fetchSMSMessages();
    }
    if (backupData.exportData[1]) {
      fetchMMSMessages();
    }
    if (backupData.exportData[2]) {
      fetchContacts();
    }
  },
  stop: function(){
    debug.print("process.stop() - releasing controls");
    toast("Backup Complete!");
    this.progressProceeding = false;
    this.blockControls = false;
    menu.draw();
  },
  isReady: function(){
    if (backupData.exportData.every((element) => element === false)) {
      debug.print("process.isReady() - Nothing was selected to backup","error");
      alert("Nothing was selected to backup");
      return false;
    } 
    else if (backupData.exportFormats.every((element) => element === false)) {
      debug.print("process.isReady() - No formats were selected to export","error");
      alert("No formats were selected to export");
      return false;
    }
    else{
      debug.print("process.isReady() - Pass");
      return true;
    }
  },
  isDone: function(){
    if(this.processesState.every((element) => element === false)){
      debug.print("process.isDone() - Calling process.stop()")
      this.stop()
      return true;
    }
    else{
      return false;
    }
  },
  jobDone: function(type) {
    debug.print(`process.jobDone() - ${type} is set to false`);
    switch(type){
      case "sms":
        this.processesState[0] = false;
        break;
      case "mms":
        this.processesState[1] = false;
        break;
      case "contact":
        this.processesState[2] = false;
        break;
    }
    this.isDone();
  },

}

const controls = {
  row: 1,
  col: 1,
  rowMenu: 0,
  colMenu: 0,
  rowMenuLimit: 0,
  colMenuLimit: 0,
  rowLimit: 0,
  colLimit: 0,
  resetControls: function (type = "", extra = ""){
    let col = `col${extra}`
    let row = `row${extra}`
    switch (type){
      case "col":
        this[col] = 1;
        break;
      case "row":
        this[row] = 1;
        break;
      default:
        this[col] = 1
        this[row] = 1;
        break;
    }
    debug.print(`controls.resetControls() - ${type + extra} - reset`);
  },
  increase: function (type){
    let limit = type+"Limit";
      if(this[type] < this[limit]){
        this[type]++;
      }
      else{
        this[type] = 1;
       }
    debug.print(`controls.increase() - ${type}: ${this[type]}`);
  },
  decrease: function(type){
    let limit = type+"Limit";
        if(this[type] > 1){
          this[type]--;
          }
          else{
            this[type] = this[limit];
          }
          debug.print(`controls.decrease() - ${type}: ${this[type]}`);
  },
  updateLimits: function(col = this.colLimit,row = this.rowLimit, type = ""){
    let colLimit = `col${type}Limit`;
    let rowLimit = `row${type}Limit`;
    this[colLimit] = col;
    this[rowLimit] = row;
    debug.print(`controls.updateLimits() - New limits for col and row are set to ${col} and ${row}`);
  },
  updateControls: function(col = this.col, row = this.row){
    this.col = col;
    this.row = row;
    debug.print(`controls.updateControls() - col: ${this.col} row: ${this.row}`);
  }
}

const menu = {
  draw: function(col = controls.col){
    controls.updateControls(col);
    controls.resetControls("row");
    const menuContainer = document.getElementById("menu-container");
    let data;
    data = getMenuData(col);
    menuContainer.innerHTML = data[0];
    this.updateNavbar(data[1])
    menuNavigation(null); // Make a different function to change softkeys
    document.getElementById("l" + controls.col).className = "hovered";
    document.getElementById(controls.row).className = "hovered"
  },
  updateNavbar: function(navbarArr){    
    const navbarContainer = document.getElementById("nav-bar");
    navbarContainer.innerHTML = navbarArr;
  }
}

function writeToFile(array, amount, filename, type, format) {
  let plainText = "";
  let json;
  let sdcard = navigator.getDeviceStorage("sdcard");
  let xmlText = "";
  let xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  drawProgress(type, 0,1,`${type} - ${localeData[3]['writing']} ${format}`)
  debug.print(`writeToFile() - Trying to upload ${amount} element(s) (type: ${type}) to filepath: ${filename} (format: ${format})`);
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
            if (contact.photo) {
              contact.photo = contact.photo[0].name;
            }
            let email = "";
            let emailArr = [];
            if (contact.email) {
              for (let i = 0; i < contact.email.length; i++) {
                emailArr[i] = contact.email[i].value;
              }
              email = emailArr.join(" ");
            }
            let adr = "";
            let adrArr = [];
            if (contact.adr) {
              for (let i = 0; i < contact.adr.length; i++) {
                adrArr[i] =
                  contact.adr[i].countryName +
                  "," +
                  contact.adr[i].locality +
                  "," +
                  contact.adr[i].postalCode +
                  "," +
                  contact.adr[i].region +
                  "," +
                  contact.adr[i].streetAddress;
              }
              adr = adrArr.join(" ");
            }
            let tel = "";
            if (contact.tel) {
              let telArr = [];
              for (let i = 0; i < contact.tel.length; i++) {
                telArr[i] = contact.tel[i].value;
              }
              tel = telArr.join(" ");
            }
            plainText += "additionalName: " + contact.additionalName;
            plainText += " adr: " + adr;
            plainText += " anniversary: " + contact.anniversary;
            plainText += " bday: " + contact.bday;
            plainText += " category: " + contact.category.join(", ");
            plainText += " email: " + email;
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
            plainText += " tel: " + tel;
            plainText += " updated: " + contact.updated;
            plainText += " url: " + contact.url;
            plainText += "\n";
          }
          break;
      default:
        debug.print(`writeToFile() - Invalid type: ${type} for plain format, returning..`, "error");
        return;
      }
      filename = filename + ".txt";

      let oMyBlob = new Blob([plainText], { type: "text/plain" });
      let request = sdcard.addNamed(oMyBlob, filename);
      request.onsuccess = function () {
        drawProgress(type, 1,1,`${type} - ${localeData[3]['done']} .txt!`);
        debug.print(`writeToFile() - Data was successfully written to the internal storage (${filename})`);
      };
      request.onerror = function () {
        drawProgress(type, 1,1,`${type} - ${localeData[3]['errorOnFile']} .txt`);
        debug.print(`writeToFile() - Error happened at type: ${type} while trying to write to ${filename} (format: ${format}) - ${request.error.name}`,"error");
        alert(`Error happened while trying to write to ${filename} - ${request.error.name}`);
      };
      break;
    case "json":
      switch (type) {
        case "sms":
          json = JSON.stringify(array, null, 2);
          filename = filename + "_SMS.json";
          break;
        case "mms":
          json = JSON.stringify(array, null, 2);
          filename = filename + "_MMS.json";
          break;
        case "contact":
          json = JSON.stringify(array, null, 2);
          filename = filename + "_Contacts.json";
          break;
        default:
          debug.print(`writeToFile() - Invalid type: ${type} for CSV format, returning..`, "error");
          return;
      }

      let oMyJsonBlob = new Blob([json], {
        type: "application/json",
      });
      let requestJson = sdcard.addNamed(oMyJsonBlob, filename);
      requestJson.onsuccess = function () {
        drawProgress(type, 1,1,`${type} - ${localeData[3]['done']} JSON!`);
        debug.print(`writeToFile() - Data was successfully written to the internal storage (${filename})`);
      };
      requestJson.onerror = function () {
        drawProgress(type, 1,1,`${type} - ${localeData[3]['errorOnFile']} JSON`);
        debug.print(`writeToFile() - Error happened at type: ${type} while trying to write to ${filename} (format: ${format}) - ${requestJson.error.name}`,"error");
        alert(`Error happened while trying to write to ${filename} - ${requestJson.error.name}`);
      };
      break;
    case "csv":
      let csvText = "";
      let csvGoogleText = "";
      let csvOutlookText = "";
      switch (type) {
        case "sms":
          csvText +=
            "type,id,threadId,iccId,deliveryStatus,sender,receiver,body,messageClass,deliveryTimestamp,read,sentTimestamp,timestamp\n";
          for (let i = 0; i < amount; i++) {
            const message = new SMSMessage(array[i]);
            csvText += `"${message.type}","${message.id}","${
              message.threadId
            }","${message.iccId}","${message.deliveryStatus}","${
              message.sender
            }","${message.receiver}","${message.body.replace(/"/g, '""')}","${
              message.messageClass
            }","${message.deliveryTimestamp}","${message.read}","${
              message.sentTimestamp
            }","${message.timestamp}"\r\n`;
          }
          filename = filename + "_SMS.csv";
          break;
        case "mms":
          csvText +=
            "type,id,threadId,iccId,delivery,expiryDate,attachments,read,readReportRequested,receivers,sentTimestamp,smil,subject,timestamp\n";
          for (let i = 0; i < amount; i++) {
            const message = new MMSMessage(array[i]);
            csvText += `"${message.type}","${message.id}","${
              message.threadId
            }","${message.iccId}","${message.delivery}","${
              message.expiryDate
            }","${message.attachments[0].location}","${message.read}","${
              message.readReportRequested
            }","${message.receivers.join(",")}","${
              message.sentTimestamp
            }","${message.smil.replace(/"/g, '""').replace(/\r?\n/g, " ")}","${
              message.subject
            }","${message.timestamp}"\r\n`;
          }
          filename = filename + "_MMS.csv";
          break;
        case "contact":
          let csvGoogleText =
            "Name,Given Name,Additional Name,Family Name,Name Suffix,Nickname,Birthday,Gender,Notes,Photo,Organization 1 - Name,Organization 1 - Title,Website 1 - Value,Phone 1 - Type,Phone 1 - Value,Phone 2 - Type,Phone 2 - Value,E-mail 1 - Value,E-mail 2 - Value,Address 1 - Street,Address 1 - City,Address 1 - Postal Code,Address 1 - Country,Address 1 - Region\r\n";
          let csvOutlookText =
            "First Name,Last Name,Suffix,Nickname,E-mail Address,E-mail 2 Address,Mobile Phone,Mobile Phone 2,Job Title,Company,Home Street,Home City,Home State,Home Postal Code,Home Country/Region,Web Page,Birthday,Notes,Gender\r\n";
          csvText +=
            "additionalName,adr,anniversary,bday,category,email,familyName,genderIdentity,givenName,group,honorificPrefix,honorificSuffix,id,impp,jobTitle,key,name,nickname,note,org,phoneticFamilyName,phoneticGivenName,photo,published,ringtone,sex,tel,updated,url\r\n";

          for (let i = 0; i < amount; i++) {
            const contact = new Contact(array[i]);
            if (contact.photo) {
              contact.photo = contact.photo[0].name;
            }
            let email = "";
            let emailArr = [];
            if (contact.email) {
              for (let i = 0; i < contact.email.length; i++) {
                emailArr[i] = contact.email[i].value;
              }
              email = emailArr.join("; ");
            } else {
              email = null;
            }
            let adr = "";
            let adrArr = [];
            if (contact.adr) {
              for (let i = 0; i < contact.adr.length; i++) {
                adrArr[i] =
                  contact.adr[i].countryName +
                  "," +
                  contact.adr[i].locality +
                  "," +
                  contact.adr[i].postalCode +
                  "," +
                  contact.adr[i].region +
                  "," +
                  contact.adr[i].streetAddress;
              }
              adr = adrArr.join("; ");
            } else {
              adr = null;
            }
            let tel = "";
            if (contact.tel) {
              let telArr = [];
              for (let i = 0; i < contact.tel.length; i++) {
                telArr[i] = contact.tel[i].value;
              }
              tel = telArr.join("; ");
            } else {
              tel = null;
            }
            if (contact.bday) {
              const date = new Date(contact.bday);
              const day = date.getUTCDate();
              const month = date.getUTCMonth() + 1;
              const year = date.getUTCFullYear();
              contact.bday = `${day.toString().padStart(2, "0")}.${month
                .toString()
                .padStart(2, "0")}.${year}`;
            }
            csvText += `"${contact.additionalName || ""}","${adr || ""}","${
              contact.anniversary || ""
            }","${contact.bday || ""}","${contact.category.join(",") || ""}","${
              email || ""
            }","${contact.familyName.join(",") || ""}","${
              contact.genderIdentity || ""
            }","${contact.givenName.join(",") || ""}","${
              contact.group || ""
            }","${contact.honorificPrefix || ""}","${
              contact.honorificSuffix || ""
            }","${contact.id || ""}","${contact.impp || ""}","${
              contact.jobTitle || ""
            }","${contact.key || ""}","${contact.name.join(",") || ""}","${
              contact.nickname || ""
            }","${contact.note || ""}","${contact.org || ""}","${
              contact.phoneticFamilyName || ""
            }","${contact.phoneticGivenName || ""}","${contact.photo || ""}","${
              contact.published || ""
            }","${contact.ringtone || ""}","${contact.sex || ""}","${tel}","${
              contact.updated || ""
            }","${contact.url || ""}"\r\n`;
            csvGoogleText += `${contact.name ? contact.name[0] : ""},${
              contact.givenName.join(" ") || ""
            },${contact.additionalName ? contact.additionalName[0] : ""},${
              contact.familyName.join(" ") || ""
            },${contact.honorificSuffix || ""},${contact.nickname || ""},${
              contact.bday || ""
            },${contact.genderIdentity || ""},${contact.note || ""},${
              contact.photo || ""
            },${contact.jobTitle || ""},${contact.org ? contact.org[0] : ""},${
              contact.url ? contact.url : ""
            },${contact.tel ? contact.tel[0].type[0] : ""},${
              contact.tel ? contact.tel[0].value : ""
            },${
              contact.tel ? (contact.tel[1] ? contact.tel[1].type[0] : "") : ""
            },${
              contact.tel ? (contact.tel[1] ? contact.tel[1].value : "") : ""
            },${contact.email ? contact.email[0].value : ""},${
              contact.email
                ? contact.email[1]
                  ? contact.email[1].value
                  : ""
                : ""
            },${contact.adr ? contact.adr[0].streetAddress : ""},${
              contact.adr ? contact.adr[0].locality : ""
            },${contact.adr ? contact.adr[0].postalCode : ""},${
              contact.adr ? contact.adr[0].countryName : ""
            },${contact.adr ? contact.adr[0].region : ""}\r\n`;
            csvOutlookText += `${contact.givenName.join(" ") || ""},${
              contact.familyName.join(" ") || ""
            },${contact.honorificSuffix || ""},${contact.nickname || ""},${
              contact.email ? contact.email[0].value : ""
            },${
              contact.email
                ? contact.email[1]
                  ? contact.email[1].value
                  : ""
                : ""
            },${contact.tel ? contact.tel[0].value : ""},${
              contact.tel ? (contact.tel[1] ? contact.tel[1].value : "") : ""
            },${contact.jobTitle || ""},${contact.org ? contact.org[0] : ""},${
              contact.adr ? contact.adr[0].streetAddress : ""
            },${contact.adr ? contact.adr[0].locality : ""},${
              contact.adr ? contact.adr[0].region : ""
            },${contact.adr ? contact.adr[0].postalCode : ""},${
              contact.adr ? contact.adr[0].countryName : ""
            },${contact.url ? contact.url : ""},${contact.bday || ""},${
              contact.note || ""
            },${contact.genderIdentity || ""}\r\n`;
          }
          var googleFilename = filename + "_Google_Contacts.csv";
          var outlookFilename = filename + "_Outlook_Contacts.csv";
          filename = filename + "_Contacts.csv";
          break;
        default:
          debug.print(`writeToFile() - Invalid type: ${type} for CSV format, returning..`, "error");
          return;
      }
      let oMyCsvBlob = new Blob([csvText], {
        type: "text/plain;charset=utf-8",
      });
      if(backupData.csvExportValues[0]){
      let requestCsv = sdcard.addNamed(oMyCsvBlob, filename);
      requestCsv.onsuccess = function () {
        drawProgress(type, 1,1,`${type} - ${localeData[3]['done']} CSV!`);
        debug.print(`writeToFile() - Data was successfully written to the internal storage (${filename})`);
      };
      requestCsv.onerror = function () {
        drawProgress(type, 1,1,`${type} - ${localeData[3]['errorOnFile']} CSV`);
        debug.print(`writeToFile() - "Error happened at type: ${type} while trying to write to ${filename} (format: ${format}) - ${requestCsv.error.name}`,"error");
        alert(`Error happened while trying to write to ${filename} - ${requestCsv.error.name}`);
      };
    }
    if(backupData.csvExportValues[1] && type=="contact"){
      let oMyGoogleCsvBlob = new Blob([csvGoogleText], {
        type: "text/plain;charset=utf-8",
      });
      let requestGoogleCsv = sdcard.addNamed(oMyGoogleCsvBlob, googleFilename);
      requestGoogleCsv.onsuccess = function () {
        drawProgress(type, 1,1,`${type} - ${localeData[3]['done']} Google CSV!`);
        debug.print(`writeToFile() - Data was successfully written to the internal storage (${googleFilename})`);
      };
      requestGoogleCsv.onerror = function () {
        drawProgress(type, 1,1,`${type} - ${localeData[3]['errorOnFile']} Google CSV`);
        debug.print(`writeToFile() - "Error happened at type: ${type} while trying to write to ${outlookFilename} (format: ${format}) - ${requestCsv.error.name}`,"error");
        alert(`Error happened while trying to write to ${googleFilename} - ${requestGoogleCsv.error.name}`);
      };
    }
    if(backupData.csvExportValues[2] && type=="contact"){
      let oMyOutlookCsvBlob = new Blob([csvOutlookText], {
        type: "text/plain;charset=utf-8",
      });
      let requestOutlookCsv = sdcard.addNamed(
        oMyOutlookCsvBlob,
        outlookFilename
      );
      requestOutlookCsv.onsuccess = function () {
        drawProgress(type, 1,1,`Done writing Outlook CSV!`);
        debug.print(`writeToFile() - Data was successfully written to the internal storage (${outlookFilename})`);
      };
      requestOutlookCsv.onerror = function () {
        drawProgress(type, 1,1,`Error - Couldn't write to file`);
        debug.print(`writeToFile() - "Error happened at type: ${type} while trying to write to ${outlookFilename} (format: ${format}) - ${requestOutlookCsv.error.name}`,"error");
        alert(`Error happened while trying to write to ${outlookFilename} - ${requestOutlookCsv.error.name}`);
      };
    }
      break;
    case "xml":
      switch (type) {
        case "sms":
          xmlText += `<smsMessages>\n`;
          for (let i = 0; i < amount; i++) {
            const message = new SMSMessage(array[i]);
            xmlText += `  <message>\n`;
            xmlText += `    <type>${message.type || ""}</type>\n`;
            xmlText += `    <id>${message.id || ""}</id>\n`;
            xmlText += `    <threadId>${message.threadId || ""}</threadId>\n`;
            xmlText += `    <iccId>${message.iccId || ""}</iccId>\n`;
            xmlText += `    <deliveryStatus>${
              message.deliveryStatus || ""
            }</deliveryStatus>\n`;
            xmlText += `    <sender>${message.sender || ""}</sender>\n`;
            xmlText += `    <receiver>${message.receiver || ""}</receiver>\n`;
            xmlText += `    <body>${message.body || ""}</body>\n`;
            xmlText += `    <messageClass>${
              message.messageClass || ""
            }</messageClass>\n`;
            xmlText += `    <deliveryTimestamp>${
              message.deliveryTimestamp || ""
            }</deliveryTimestamp>\n`;
            xmlText += `    <read>${message.read || ""}</read>\n`;
            xmlText += `    <sentTimestamp>${
              message.sentTimestamp || ""
            }</sentTimestamp>\n`;
            xmlText += `    <timestamp>${
              message.timestamp || ""
            }</timestamp>\n`;
            xmlText += `  </message>\n`;
          }
          xmlText += `</smsMessages>\n`;
          filename = filename + "_SMS.xml";
          break;

        case "mms":
          xmlText += `<mmsMessages>\n`;
          for (let i = 0; i < amount; i++) {
            const message = new MMSMessage(array[i]);
            xmlText += `  <message>\n`;
            xmlText += `    <type>${message.type || ""}</type>\n`;
            xmlText += `    <id>${message.id || ""}</id>\n`;
            xmlText += `    <threadId>${message.threadId || ""}</threadId>\n`;
            xmlText += `    <iccId>${message.iccId || ""}</iccId>\n`;
            xmlText += `    <delivery>${message.delivery || ""}</delivery>\n`;
            xmlText += `    <expiryDate>${
              message.expiryDate || ""
            }</expiryDate>\n`;
            xmlText += `    <attachments>${
              message.attachments[0].location || ""
            }</attachments>\n`;
            xmlText += `    <read>${message.read || ""}</read>\n`;
            xmlText += `    <readReportRequested>${
              message.readReportRequested || ""
            }</readReportRequested>\n`;
            xmlText += `    <receivers>${
              message.receivers.join(", ") || ""
            }</receivers>\n`;
            xmlText += `    <sentTimestamp>${
              message.sentTimestamp || ""
            }</sentTimestamp>\n`;
            xmlText += `    <smil>${message.smil || ""}</smil>\n`;
            xmlText += `    <subject>${message.subject || ""}</subject>\n`;
            xmlText += `    <timestamp>${
              message.timestamp || ""
            }</timestamp>\n`;
            xmlText += `  </message>\n`;
          }
          xmlText += `</mmsMessages>\n`;
          filename = filename + "_MMS.xml";
          break;

        case "contact":
          xmlText += `<contacts>\n`;
          for (let i = 0; i < amount; i++) {
            const contact = new Contact(array[i]);
            xmlText += `  <contact>\n`;
            xmlText += `    <additionalName>${
              contact.additionalName || ""
            }</additionalName>\n`;
            if (contact.adr) {
              for (let j = 0; j < contact.adr.length; j++) {
                xmlText += `    <adr>${
                  contact.adr[j].countryName +
                  "," +
                  contact.adr[j].locality +
                  "," +
                  contact.adr[j].postalCode +
                  "," +
                  contact.adr[j].region +
                  "," +
                  contact.adr[j].streetAddress
                }</adr>\n`;
              }
            } else {
              xmlText += `    <adr></adr>\n`;
            }
            xmlText += `    <anniversary>${
              contact.anniversary || ""
            }</anniversary>\n`;
            xmlText += `    <bday>${contact.bday || ""}</bday>\n`;
            xmlText += `    <category>${
              contact.category.join(",") || ""
            }</category>\n`;

            if (contact.email) {
              for (let j = 0; j < contact.email.length; j++) {
                xmlText += `    <email>${contact.email[j].value}</email>\n`;
              }
            } else {
              xmlText += `    <email></email>\n`;
            }

            xmlText += `    <familyName>${
              contact.familyName.join(",") || ""
            }</familyName>\n`;
            xmlText += `    <genderIdentity>${
              contact.genderIdentity || ""
            }</genderIdentity>\n`;

            if (contact.givenName) {
              xmlText += `    <givenName>${contact.givenName.join(
                ","
              )}</givenName>\n`;
            } else {
              xmlText += `    <givenName></givenName>\n`;
            }

            xmlText += `    <group>${contact.group || ""}</group>\n`;
            xmlText += `    <honorificPrefix>${
              contact.honorificPrefix || ""
            }</honorificPrefix>\n`;
            xmlText += `    <honorificSuffix>${
              contact.honorificSuffix || ""
            }</honorificSuffix>\n`;
            xmlText += `    <id>${contact.id || ""}</id>\n`;

            if (contact.impp) {
              xmlText += `    <impp>${contact.impp.join(" ")}</impp>\n`;
            } else {
              xmlText += `    <impp></impp>\n`;
            }

            xmlText += `    <jobTitle>${contact.jobTitle || ""}</jobTitle>\n`;
            xmlText += `    <key>${contact.key || ""}</key>\n`;
            xmlText += `    <name>${contact.name.join(",") || ""}</name>\n`;
            xmlText += `    <nickname>${contact.nickname || ""}</nickname>\n`;
            xmlText += `    <note>${contact.note || ""}</note>\n`;
            xmlText += `    <org>${contact.org || ""}</org>\n`;
            xmlText += `    <phoneticFamilyName>${
              contact.phoneticFamilyName || ""
            }</phoneticFamilyName>\n`;

            if (contact.phoneticGivenName) {
              xmlText += `    <phoneticGivenName>${contact.phoneticGivenName.join(
                ","
              )}</phoneticGivenName>\n`;
            } else {
              xmlText += `    <phoneticGivenName></phoneticGivenName>\n`;
            }
            if (contact.photo) {
              contact.photo = contact.photo[0].name;
            }
            xmlText += `    <photo>${contact.photo || ""}</photo>\n`;
            xmlText += `    <published>${
              contact.published || ""
            }</published>\n`;
            xmlText += `    <ringtone>${contact.ringtone || ""}</ringtone>\n`;
            xmlText += `    <sex>${contact.sex || ""}</sex>\n`;

            if (contact.tel) {
              for (let j = 0; j < contact.tel.length; j++) {
                xmlText += `    <tel>${contact.tel[j].value}</tel>\n`;
              }
            } else {
              xmlText += `    <tel></tel>\n`;
            }

            xmlText += `    <updated>${contact.updated || ""}</updated>\n`;
            xmlText += `    <url>${contact.url || ""}</url>\n`;

            xmlText += `  </contact>\n`;
          }
          xmlText += `</contacts>\n`;
          filename = filename + "_Contacts.xml";
          break;

        default:
          debug.print(`writeToFile() - Invalid type: ${type} for CSV format, returning..`, "error");
          return;
      }

      let xmlData = xmlHeader + "\n" + xmlText;

      let oMyXmlBlob = new Blob([xmlData], { type: "text/xml;charset=utf-8" });

      let requestXml = sdcard.addNamed(oMyXmlBlob, filename);
      requestXml.onsuccess = function () {
        drawProgress(type, 1,1,`Done writing XML file!`);
        debug.print(`writeToFile() - Data was successfully written to the internal storage (${filename})`);
      };
      requestXml.onerror = function () {
        drawProgress(type, 1,1,`Error - Couldn't write to file`);
        debug.print(`writeToFile() - "Error happened at type: ${type} while trying to write to ${filename} (format: ${format}) - ${requestXml.error.name}`,"error");
        alert(`Error happened while trying to write to ${filename} - ${requestXml.error.name}`);
      };

      break;
    default:
      debug.print(`writeToFile() - Invalid format: ${format}, returning..`, "error");
      break;
  }
  process.jobDone(type)
}
function SMSMessage(message) {
  this.type = message.type || "";
  this.id = message.id || "";
  this.threadId = message.threadId || "";
  this.iccId = message.iccId || "";
  this.delivery = message.delivery || "";
  this.deliveryStatus = message.deliveryStatus || "";
  this.sender = message.sender || "";
  this.receiver = message.receiver || "";
  this.body = message.body || "";
  this.messageClass = message.messageClass || "";
  this.deliveryTimestamp = message.deliveryTimestamp || "";
  this.read = message.read || false;
  this.sentTimestamp = message.sentTimestamp || "";
  this.timestamp = message.timestamp || "";
}

function MMSMessage(message) {
  this.type = message.type || "";
  this.id = message.id || "";
  this.threadId = message.threadId || "";
  this.iccId = message.iccId || "";
  this.delivery = message.delivery || "";
  this.deliveryInfo = message.deliveryInfo || {};
  this.expiryDate = message.expiryDate || "";
  this.attachments = message.attachments || [];
  this.read = message.read || false;
  this.readReportRequested = message.readReportRequested || false;
  this.receivers = message.receivers || [];
  this.sentTimestamp = message.sentTimestamp || "";
  this.smil = message.smil || "";
  this.subject = message.subject || "";
  this.timestamp = message.timestamp || "";
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
  this.id = contact.id || "";
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

function handleExport(data, amount, filename, type) {
  let formats = ["plain", "json", "csv", "xml"];
  debug.print(`handleExport() - Starting to write type: ${type} (amount: ${amount})`);
  for (let i = 0; i < backupData.exportFormats.length; i++) {
    if (backupData.exportFormats[i]) {
      writeToFile(data, amount, filename, type, formats[i]);
      debug.print(`handleExport() - Calling writeToFile() to write type: ${type} to format: ${formats[i]}`);
    }
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
      debug.print(`focusInput() - id: i${id} - focused`);
    }
  } else {
    const inputValue = inputElement.value;
    filename = inputValue;
    inputElement.blur();
    debug.print(`focusInput() - id: i${id} - unfocused`);
  }
  if (!filename.includes(folderPath)) {
    filename = folderPath + filename;
    menu.draw();
  }
  debug.print(`focusInput() - filename is set to: ${filename}`);
}

function check(id,obj,type) {
  const checkbox = document.getElementById(obj + id);
  const value = backupData.toggleValue(id-1,type)
  checkbox.checked = value;
  debug.print(`check() - obj: ${obj}${id} - ${value}`);
  debug.print(`check() - Values for col: ${controls.col} - ${backupData.exportData}`);
}

function handleKeydown(e) {
  debug.print(`${e.key} triggered`);
  switch (e.key) {
    case "ArrowUp":
      nav('up');
      break;
    case "ArrowDown":
      nav('down');
      break;
    case "ArrowRight":
      nav('right');
      break;
    case "ArrowLeft":
      nav('left');
      break;
    case "Enter":
      nav('enter');
      break;
    case "SoftRight":
      nav('softright');
      break;
    case "SoftLeft":
      nav('softleft');
      break;
    case "#":
      debug.toggle()
      break;
    case "Backspace":
      if(closeMenus()){
        e.preventDefault();
      }
      break;
  }
}

function closeMenus(){
  if (enableMenu){
    updateMenuContainer("softright");
    return true;
  }
  else if(enableOptions){
    if(!updateMenuContainer("softright")){
      updateMenuContainer("softleft");
    }
    return true;
  }
  return false;
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
  let randomLimit = 10000; // I have no clue what is the limit of messages, just a placeholder value 
  debug.print("fetchSMSMessages() - Starting backup");
  drawProgress("sms",1,3,`${localeData['3']['startSMS']} (1/3)`)
  let smsManager = window.navigator.mozSms || window.navigator.mozMobileMessage;
  if (!smsManager) {
    drawProgress("sms", 1,1,`Error - Couldn't get API access`);
    debug.print("fetchSMSMessages() - Couldn't get API access, returning..","error");
    alert("Couldn't get SMS API access");
    return;
  }
  debug.print("fetchSMSMessages() - Got access to mozSms or mozMobileMessage");
  drawProgress("sms",2,3,`${localeData['3']['startSMS']} (2/3)`)
  let request = smsManager.getMessages(null, false);
  if (!request) {
    drawProgress("sms", 1,1,`Error - Couldn't access getMessages()`);
    debug.print("fetchSMSMessages() - Couldn't access getMessages(), returning..", "error");
    alert("Couldn't access getMessages().");
    return;
  }
  debug.print("fetchSMSMessages() - Got access to getMessages(), starting scan");
  let amount = 0;
  drawProgress("sms",3,3,`${localeData['3']['startSMS']} (3/3)`)
  request.onsuccess = function () {
    let cursor = request;
    if (!cursor.result) {
      debug.print(`fetchSMSMessages() - Successfully scanned ${amount} message(s), calling handleExport()`);
      drawProgress("sms",1,1,`Found ${amount}/${amount} items`)
      handleExport(smsMessages, amount, filename, "sms");
      return;
    }
    const message = cursor.result;
    if (message.type == "sms") {
      const newMessage = new SMSMessage(message); // Create SMSMessage from message object
      smsMessages.push(newMessage);
      amount += 1;
      drawProgress("sms",amount,randomLimit,`Scanning SMSes (${amount}/?)`)
      cursor.continue();
    } else {
      debug.print("fetchSMSMessages() - Not an SMS message, skipping..");
      cursor.continue();
    }
  };
  request.onerror = function () {
    debug.print(`fetchSMSMessages() - Error accessing SMS messages: ${request.error.name}`);
    alert(`Error accessing SMS messages - ${request.error.name}`);
  };
}

function fetchMMSMessages() {
  let randomLimit = 10000; // I have no clue what is the limit of messages, just a placeholder value 
  debug.print("fetchMMSMessages() -  Starting backup");
  drawProgress("mms",1,3,`Staring MMS backup (1/3)`)
  let mmsManager = window.navigator.mozMms || window.navigator.mozMobileMessage;

  if (!mmsManager) {
    drawProgress("mms", 1,1,`Error - Couldn't get API access`);
    debug.print("fetchMMSMessages() - Could not get MMS API access, returning..","error");
    alert("Couldn't get MMS API access");
    return;
  }
  debug.print("fetchMMSMessages() - Got access to mozMms or mozMobileMessage");
  drawProgress("mms",2,3,`Staring MMS backup (2/3)`)
  let request = mmsManager.getMessages(null, false);
  if (!request) {
    drawProgress("mms", 1,1,`Error - Couldn't access getMessages()`);
    debug.print("fetchMMSMessages() - Couldn't access getMessages().","error");
    alert("Couldn't access getMessages().");
    return;
  }
  debug.print("fetchMMSMessages() - Got access to getMessages(), starting scan");
  drawProgress("mms",3,3,`Staring MMS backup (3/3)`)
  let amount = 0;

  request.onsuccess = function () {
    let cursor = request;
    if (!cursor.result) {
      debug.print(`fetchMMSMessages() - Successfully scanned ${amount} messages, calling handleExport()`);
      drawProgress("mms",1,1,`Found ${amount}/${amount} items`)
      handleExport(mmsMessages, amount, filename, "mms");
      saveMMSImages(mmsMessages);
      return;
    }
    drawProgress("mms",amount,randomLimit,`Scanning MMSes (${amount}/?)`)
    const message = cursor.result;
    if (message.type == "mms") {
      const newMessage = new MMSMessage(message);
      mmsMessages.push(newMessage);
      amount += 1;
      drawProgress("mms",amount,randomLimit,`Scanning MMSes (${amount}/?)`)
      cursor.continue();
    } else {
      debug.print("fetchMMSMessages() - Not an MMS, skipping...");
      cursor.continue();
    }
  };

  request.onerror = function () {
    debug.print(`fetchMMSMessages() - Error accessing SMS messages: ${request.error.name}`);
    alert(`Error accessing MMS messages - ${request.error.name}`);
  };
}

function fetchContacts() {
  debug.print("fetchContacts() - Starting backup");
  drawProgress("contact",1,3,`Staring Contact backup (1/3)`)
  if ("mozContacts" in navigator) {
    let options = {
      filterBy: [],
    };
    drawProgress("contact",2,3,`Staring Contact backup (2/3)`)
    let request = navigator.mozContacts.find(options);
    if (!request) {
      drawProgress("contact", 1,1,`Error - Couldn't access mozContacts`);
      debug.print("fetchContacts() - Couldn't access mozContacts, returning..","error");
      alert("Couldn't access mozContacts.");
      return;
    }
    debug.print("fetchContacts() - Got access to mozContacts, starting scan");
    drawProgress("contact",3,3,`Staring Contact backup (3/3)`)
    request.onsuccess = function () {
      let allContacts = request.result;

      if (allContacts.length > 0) {
        debug.print(`Found ${allContacts.length} contact(s), proceeding...`);
        for (let i = 0; i < allContacts.length; i++) {
          drawProgress("contact",i,allContacts.length,`Scanning Contacts (${i}/${allContacts.length})`)
          let currentContact = allContacts[i];
          const newContact = new Contact(currentContact);
          contacts.push(newContact);
        }
        debug.print("fetchContacts() - Got the last contact");
        drawProgress("contact",1,1,`Found ${allContacts.length}/${allContacts.length} items`)
        handleExport(contacts,allContacts.length,filename,"contact");
      } else {
        debug.print("fetchContacts() - No contacts found, returning..","warning");
        drawProgress("contact",1,1,`Found 0 contacts`)
        return;
      }
    };

    request.onerror = function () {
      debug.print(`fetchContacts() - Error accessing contacts - ${request.error.name}, returning`,"error");
      alert(`Error accessing contacts - ${request.error.name}.`)
      drawProgress("contact",1,1,`Error - Can't access contacts`)
      return;
    };
  } else {
    debug.print(`fetchContacts() - Could not get API access for contacts, returning`,"error");
    drawProgress("contact",1,1,`Error - Can't access contacts`)
    return;
  }
}

function saveMMSImages(mmsMessages) {
  for (let i = 0; i < mmsMessages.length; i++) {
    const attachments = mmsMessages[i].attachments;
    for (let j = 0; j < attachments.length; j++) {
      const attachment = attachments[j];
      const imageFilename =`KaiOS_Backup/backup_${currentDate}/MMS_images/${attachment.location}`;
      const imageUrl = attachment.content;
      saveImageToFile(imageUrl, imageFilename);
    }
  }
}

function saveImageToFile(imageUrl, filename) {
  const sdcard = navigator.getDeviceStorage("sdcard");
  const blob = new Blob([imageUrl]);
  const request = sdcard.addNamed(blob, filename);
  request.onsuccess = function () {
    debug.print(`saveImageToFile() - Image saved as ${filename}`);
  };
  request.onerror = function () {
    debug.print(`saveImageToFile() - Error while saving image ${filename} - ${request.error.name}`,"error");
  };
}


function drawProgress(item, pos, amount, msg){
  if (controls.col != 3){
    controls.updateControls(3);
    menu.draw();
  }
      switch (item) {
        case "sms":
          let progressBarSMS = document.getElementById("p1");
          let textMsgSMS = document.getElementById("p1-1");
          progressBarSMS.value = pos;
          progressBarSMS.max = amount;
          textMsgSMS.textContent = msg;
          if(captureExtraLogs){
            process.smsLogs.push(msg);
          }
          else{
            if(!msg.includes('Scanning')){
              process.smsLogs.push(msg);
            }
          }      
          break;
        case "mms":
            let progressBarMMS = document.getElementById("p2");
            let textMsgMMS = document.getElementById("p2-1");
            progressBarMMS.value = pos;
            progressBarMMS.max = amount;
            textMsgMMS.textContent = msg;
            if(captureExtraLogs){
              process.mmsLogs.push(msg);
            }
            else{
              if(!msg.includes('Scanning')){
                process.mmsLogs.push(msg);
              }
            }
            break;
          case "contact":
              let progressBarContact = document.getElementById("p3");
              let textMsgContact = document.getElementById("p3-1");
              progressBarContact.value = pos;
              progressBarContact.max = amount;
              textMsgContact.textContent = msg;
              if(captureExtraLogs){
                process.contactsLogs.push(msg);
              }
              else{
                if(!msg.includes('Scanning')){
                  process.contactsLogs.push(msg);
                }
              }
              break;      
        }
    
}

function getMenuData(col) {
  let menu = "";
  let navbarEntries =
  `<span id="l1" class = "notactive">${localeData[1]["index"]}</span> <span id="l2" class = "notactive"> ${localeData[2]["index"]} </span><span id="l3" class = "notactive"> ${localeData[3]["index"]} </span>`;
  switch (col) {
    case 1:
      menu = `<ul>
      <li id="1">${localeData[1]["1"]}<div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b1" type="checkbox" style="display: none;" ${
        backupData.exportData[0] ? "checked" : ""
      }>
      <label class="cbx" for="b1">
          <span>
              <svg width="12px" height="9px" viewbox="0 0 12 9">
                  <polyline points="1 5 4 8 11 1"></polyline>
              </svg>
          </span>
      </label>
  </div> </li>
  <li id="2">${localeData[1]["2"]}<div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b2" type="checkbox" style="display: none;" ${
        backupData.exportData[1] ? "checked" : ""
      }>
      <label class="cbx" for="b2">
          <span>
              <svg width="12px" height="9px" viewbox="0 0 12 9">
                  <polyline points="1 5 4 8 11 1"></polyline>
              </svg>
          </span>
      </label>
  </div> </li>
  <li id="3">${localeData[1]["3"]}<div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b3" type="checkbox" style="display: none;" ${
        backupData.exportData[2] ? "checked" : ""
      }>
      <label class="cbx" for="b3">
          <span>
              <svg width="12px" height="9px" viewbox="0 0 12 9">
                  <polyline points="1 5 4 8 11 1"></polyline>
              </svg>
          </span>
      </label>
  </div> </li>
</ul>`;
      controls.updateLimits(undefined,3);
      break;

    case 2:
      if (!filename) {
        refreshDate();
        filename =
          folderPath + "backup_" + currentDate + "/backup_" + currentDate;
      }
menu = `
  <ul>
    <li id="1">${localeData[2]["1"]} <input type="text" id="i1" value="${filename}" nav-selectable="true" autofocus /></li>
    <li id="2">${localeData[2]["2"]}<div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b1" type="checkbox" style="display: none;" ${backupData.exportFormats[0] ? "checked" : ""}>
      <label class="cbx" for="b1"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
    </div></li>
    <li id="3">${localeData[2]["3"]}<div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b2" type="checkbox" style="display: none;" ${backupData.exportFormats[1] ? "checked" : ""}>
      <label class="cbx" for="b2"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
    </div></li>
    <li id="4">${localeData[2]["4"]}<div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b3" type="checkbox" style="display: none;" ${backupData.exportFormats[2] ? "checked" : ""}>
      <label class="cbx" for="b3"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
    </div></li>
    <li id="5">${localeData[2]["5"]}<div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b4" type="checkbox" style="display: none;" ${backupData.exportFormats[3] ? "checked" : ""}>
      <label class="cbx" for="b4"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
    </div></li>
  </ul>
`;

      navbarEntries =
      `<span id="l1" class = "notactive" >${localeData[1]["index"].substring(1)}</span> <span id="l2"> ${localeData[2]["index"]} </span><span id="l3" class = "notactive"> ${localeData[3]["index"]} </span>`;
      controls.updateLimits(undefined,5);
      break;
    case 3:
      let menuEntries = [];
      process.smsLogs.length != 0 ? menuEntries.push(localeData[3]["1_1"]) : menuEntries.push(localeData[3]["1"]);
      process.mmsLogs.length != 0 ? menuEntries.push(localeData[3]["1_2"]) : menuEntries.push(localeData[3]["2"]);
      process.contactsLogs.length != 0 ? menuEntries.push(localeData[3]["1_3"]) : menuEntries.push(localeData[3]["3"]);
      navbarEntries =
      `<span id="l1" class = "notactive" >${localeData[1]["index"].substring(5)}</span> <span id="l2" class = "notactive"> ${localeData[2]["index"]} </span><span id="l3" > ${localeData[3]["index"]} </span><span id="l4" class = "notactive"> ${localeData[4]["index"]} </span>`;
      menu = `<ul>
    <li id = "1"><div class="progressbar"><span id = "p1-1">${menuEntries[0]}</span>
    <progress id = "p1"></progress></div></li>
    <li id = "2"><div class="progressbar"><span id = "p2-1">${menuEntries[1]}</span>
    <progress id = "p2"></progress></div></li>
    <li id = "3"><div class="progressbar"><span id = "p3-1">${menuEntries[2]}</span>
    <progress id = "p3"></progress></div></li>
    </ul>`;
    controls.updateLimits(undefined,3);
      break;
    case 4:
      controls.updateLimits(undefined,3);
      navbarEntries =
      `<span id="l3" class = "notactive">${localeData[3]["index"]} </span><span id="l4"> ${localeData[4]["index"]} </span>`;
      menu = `<ul>
      <li id = "1" class= "invert" style="height:80px;"><p style="font-size:20px; position:absolute; top:70px">
      KaiOS Backup</p>
      <p style="top:100px;position:absolute;">${localeData[4]["1"]} D3SXX</p>
      <img src="../assets/icons/KaiOS_Backup_56.png" style="position:absolute; right:10px; top:85px">
      </li>
      <li id = "2">${localeData[4]["2"]} ${buildInfo[0]}
      </li>
      <li id = "3">${localeData[4]["3"]} ${buildInfo[1]}
      </li>
      </ul>`
      
        break;
  }

  return [menu,navbarEntries]
}

function drawSoftkeys(arr){
  let softkeys = "";
  const softkeyContainer = document.getElementById("softkey");

  softkeys += `<label id="left">${arr[0]}</label>`
  softkeys += `<label id="center">${arr[1]}</label>`
  softkeys += `<label id="right">${arr[2]}</label>`
  softkeyContainer.innerHTML = softkeys;
}

function scrollHide(obj = ""){
  if (controls.col == 2){
  if (controls.row > 4) {
    for(let i = 0; i < controls.row - 4; i++){
    debug.print(`scrollHide() - Hide id: ${i+1} show id: ${controls.row}`)
    document.getElementById(i+1).style.display = "none";
    document.getElementById(controls.row).style.display = "flex";
    }
  } else if (controls.row == 1){
    document.getElementById(1).style.display = "flex";
    document.getElementById(5).style.display = "none";
  }
}
else if (controls.col == 3 && obj == "o"){
  let limit = 8;
  let arr;
  switch (controls.row){
    case 1:
      arr = process.smsLogs;
      break;
    case 2:
      arr = process.mmsLogs;
      break;
    case 3:
      arr = process.contactsLogs;
      break
  }
  if (limit >= arr.length){
    limit = arr.length;
  }
  if(scrollLimit < 0){
    scrollLimit = limit;
  }
  if (controls.rowMenu != 1) {
    debug.print(`scrollHide() - Show id: ${controls.rowMenu}`);
    document.getElementById(obj + controls.rowMenu).style.display = "flex";
    if(scrollLimit<controls.rowMenu){
      scrollLimit = controls.rowMenu;
    }
    if (scrollLimit-controls.rowMenu > limit-1){
      scrollLimit--;
    }
    debug.print(`scrollHide() - Current limit: ${scrollLimit}`);

    debug.print(`scrollHide() - Hiding ids > ${scrollLimit+1} and < ${scrollLimit-limit} (${arr.length+1} total ids)`);
    for(let i = scrollLimit+1;i<controls.rowMenuLimit+1;i++){
      document.getElementById(obj + i).style.display = "none";
    }
    for(let i = scrollLimit-limit; i>0;i--){
      document.getElementById(obj + i).style.display = "none";
    }
  } else if (controls.rowMenu == 1){
    debug.print(`scrollHide() - Hiding ids > ${limit+1}`);
    for (let i = 1; i< limit+1; i++){
      document.getElementById(obj + i).style.display = "flex";
    }
    scrollLimit = limit;
    for(let i = limit+1; i < controls.rowMenuLimit+1; i++){
    document.getElementById(obj + i).style.display = "none";
    }
  }
  
}
}

function menuHover(row, pastRow, obj){
const pastElement = document.getElementById(obj + pastRow);
if(pastElement){
  pastElement.classList.remove("hovered");
}

const currentElement = document.getElementById(obj + row);
if(currentElement){menu.draw
  currentElement.classList.add("hovered");
}

}

function menuNavigation(nav){
let pastRow = controls.row;
let softkeysArr = ["",localeData[0]["softCenter"],localeData[0]["softRight"]];
switch(nav){
  case 'up':
    controls.decrease("row");
    break;
  case 'down':
    controls.increase("row");
    break;
  case 'left':
    controls.decrease("col");
    menu.draw();
    break;
  case 'right':
    controls.increase("col");
    menu.draw();
    break;
  case 'enter':
    switch (controls.col){
      case 1:
        check(controls.row, 'b', "exportData");
        break;
      case 2:
        if(controls.row == 1){
          focusInput(controls.row);
        }
        else{
          check(controls.row-1, 'b', "exportFormats");
        }
        break;
      case 3:
        toggleOptions(true);
        if(enableOptions){
          softkeysArr[1] = "";
          softkeysArr[2] = "";
          softkeysArr[0] = localeData[0]["close"]; 
        }
        break;
      case 4:
        aboutTab(controls.row);
        break;

    }
    break;
  case 'softright':
    switch(controls.col){
      case 1:
      case 2:
      case 4:
        toggleMenu();
        if(enableMenu){
          softkeysArr[2] = localeData[0]["close"];
          softkeysArr[0] = "";  
        }
      break;
      case 3:
        if(!process.blockControls){
          toggleMenu();
          if(enableMenu){
            softkeysArr[2] = localeData[0]["close"];
            softkeysArr[0] = "";  
          }
        }
        
        break;
        
    }

    break;
  case 'softleft':
    switch (controls.col){
      case 1:
        break;
      case 2:
        if(controls.row == 1){
          enableClear = true;
        }
        else if(controls.row == 4){
          toggleOptions();
        }
        break;
      case 3:
        if(enableOptions){
          toggleOptions(true)
        }
    }
    if(enableOptions){
      softkeysArr[2] = "";
      softkeysArr[0] = localeData[0]["close"]; 
    }
    break;
}
if (controls.col == 2 && controls.row == 4 && !enableOptions && !enableMenu){
  softkeysArr[0] = localeData[0]["softLeftOptions"];
}
if (controls.col == 2 && controls.row == 1){
  softkeysArr[0] = localeData[0]["softLeftClear"];
}
if(process.blockControls && !enableOptions){
  softkeysArr[2] = "";
}
if (enableClear){
  let input = document.getElementById(1);
  refreshDate();
  filename = folderPath + "backup_" + currentDate + "/backup_" + currentDate; 
  let newInput = '<li id="1">Folder Name: <input type="text" id="i1" value="' +
  filename +
  '" nav-selectable="true" autofocus /></li>';
  input.innerHTML = newInput;
  enableClear = false;
}
  scrollHide();
  menuHover(controls.row, pastRow,'')
  drawSoftkeys(softkeysArr);
}

function aboutTab(row){
  switch(row){
    case 1:
      open("https://github.com/D3SXX/kaios-backup");
      break;
    case 2:
      open("https://github.com/D3SXX/kaios-backup/releases/");
      break;
    case 3:
      open("../changelog.txt")
      break;
  }
}
function toggleMenu() {
  const menuContainer = document.getElementById('menu');

  const opacity = window.getComputedStyle(menuContainer).getPropertyValue('opacity');
  if (opacity < 1) {
      const menuEntries = 3;
      let menuContent = ""; 
      for(let i = 1; i<menuEntries+1; i++){
        menuContent += `<div class="menuItem" id='m${i}'>${localeData[0][`menu_${i}`]}</div>`
      }
      menuContainer.innerHTML = menuContent;
      menuContainer.style.opacity = '1';
      enableMenu = true;
      controls.resetControls("row", "Menu");
      menuHover(controls.rowMenu, undefined, 'm')

  } else {
      menuContainer.style.opacity = '0';
      enableMenu = false;
      menuHover(undefined, controls.rowMenu, 'm')
  }
  debug.print(`toggleMenu() - enableOptions is set to ${enableMenu}`);
}

function toggleOptions(flag = false) {
  let menuContent = "";
  const menuContainer = document.getElementById('options');
  let arr;
  switch (controls.row){
    case 1:
      arr = process.smsLogs;
      break;
    case 2:
      arr = process.mmsLogs;
      break;
    case 3:
      arr = process.contactsLogs;
      break
  }
  if (flag){
    if (arr.length == 0){
      return;
    }
    menuContent += `<div class = "logs"><ul>`;
    for (let i = 0; i < arr.length; i++){
      menuContent += `<li id=o${i+1}>`;
      menuContent += arr[i];
      menuContent += `</li>`;
    }
    menuContent += `</ul></div>`;
    controls.updateLimits(1,arr.length,"Menu");
  }
  else{
    controls.updateLimits(1,3,"Menu")
  menuContent = `
  <div class="optionsItem" id='o1'>${localeData[0]["optionalMenu_1"] || "Export as a Normal CSV"}<div class="checkbox-wrapper-15">
    <input class="inp-cbx" id="ob1" type="checkbox" style="display: none;" ${backupData.csvExportValues[0] ? 'checked' : ''}>
    <label class="cbx" for="b2"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
  </div>
  </div>
  <div class="optionsItem" id='o2'>${localeData[0]["optionalMenu_2"] || "Export as a Google CSV"}<div class="checkbox-wrapper-15">
    <input class="inp-cbx" id="ob2" type="checkbox" style="display: none;" ${backupData.csvExportValues[1] ? 'checked' : ''}>
    <label class="cbx" for="b2"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
  </div>
  </div>
  <div class="optionsItem" id='o3'>${localeData[0]["optionalMenu_3"] || "Export as a Outlook CSV"}<div class="checkbox-wrapper-15">
    <input class="inp-cbx" id="ob3" type="checkbox" style="display: none;" ${backupData.csvExportValues[2] ? 'checked' : ''}>
    <label class="cbx" for="b2"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
  </div>
  </div>
`;
}
  menuContainer.innerHTML = menuContent;
  const hoverElement = document.getElementById('o' + controls.rowMenu);
  if (!menuContainer.classList.contains('active')) {
      menuContainer.classList.add('active');
      menuContainer.classList.remove('notactive');
      enableOptions = true;
      controls.resetControls("row", "Menu");
      menuHover(controls.rowMenu, undefined, 'o');
      navigateOptions();
  } else {
      menuContainer.classList.remove('active');
      menuContainer.classList.add('notactive');
      enableOptions = false;
      menuHover(undefined, controls.rowMenu, 'o')
  }
  debug.print(`toggleOptions() - enableOptions is set to ${enableOptions}`);
}

function navigateMenu(nav){
  controls.updateLimits(1,3,"Menu")
  let pastRow = controls.rowMenu;
  switch (nav){
    case 'up':
      controls.decrease("rowMenu")
      break;
  case 'down':
    controls.increase("rowMenu")
  break;
  case 'enter':
    switch(controls.rowMenu){
      case 1:
        process.start(backupData.exportData);
        toggleMenu();
        return;
      case 2:
        toggleExtraLogs();
        toggleMenu();
        return;
      case 3:
        toggleMenu();
        menu.draw(4);
        return;
    }
    break;
}
menuHover(controls.rowMenu, pastRow, 'm')

}

function toggleExtraLogs(){
  if(captureExtraLogs){
    captureExtraLogs = false;
    toast('Additional logs disabled')
  }
  else{
    captureExtraLogs = true;
    toast('Additional logs enabled')
  }
}

function navigateOptions(nav){
  let pastRow = controls.rowMenu;
  switch (nav){
    case 'up':
      controls.decrease("rowMenu")
      break;
  case 'down':
    controls.increase("rowMenu")
  break;
  case 'enter':
    backupData.csvExportValues[controls.rowMenu-1] = !backupData.csvExportValues[controls.rowMenu-1]
      const buttonElement = document.getElementById('ob' + controls.rowMenu);
      buttonElement.checked = backupData.csvExportValues[controls.rowMenu-1];
      debug.print(`navigateOptions() - Button ob${controls.rowMenu} value is set to ${backupData.csvExportValues[controls.rowMenu-1]}`)
      break;
}
menuHover(controls.rowMenu, pastRow, 'o')
scrollHide("o")

}

let timeoutID;

function toast(msg = null) {
  let toastElement = document.getElementById('toast');
  if (msg != null) {
    toastElement.classList.remove('notactive');
    toastElement.classList.add('active');
    toastElement.innerHTML = `<span>${msg}</span>`;
    debug.print('toast() - Toast activated');
    timeoutID = setTimeout(function() {
      toastElement.classList.remove('active');
      toastElement.classList.add('notactive');
      debug.print('toast() - Toast deactivated');
    }, 2 * 1000)
  }
}

function updateMenuContainer(nav) {
  debug.show();
  if (!controls.colLimit){
    controls.updateLimits(4);
  }
  if (enableMenu && nav != "softright"){
    navigateMenu(nav);
    return;
  }
  if (enableOptions && nav != "softleft"){
    navigateOptions(nav);
    return;
  }
  if (process.blockControls && (nav == "left" || nav == "right" )){
    if(!enableOptions){
      return;
    }
    else if(enableOptions && nav == "softright"){
      return false;
  }
}
  else if (process.blockControls && enableOptions && nav == "softright"){
    return;
  }
  menuNavigation(nav);
  return true;
}
