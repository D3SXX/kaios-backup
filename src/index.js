"use strict";

document.activeElement.addEventListener("keydown", handleKeydown);
var key;
var row = 0;
var col = 1;
var menuRow = 1;
var optionsRow = 1;
var rowLimit;
var colLimit;
var currentDate;
var holdIndex = ["SMS", "MMS", "Contacts"];
var holdValues = [false, false, false];
var holdValuesExport = [false, false, false, false];
var holdValuesCSV = [false, false, false];
refreshDate();
var folderPath = "KaiOS_Backup/";
var filename = folderPath + "backup_" + currentDate + "/backup_" + currentDate;
var enableDebug = false;
var startProgress = false;
var enableClear = false;
var enableMenu = false;
var enableOptions = false;

function writeToFile(array, amount, filename, type, format) {
  let plainText = "";
  let oldFilename = filename;
  let json;
  let sdcard = navigator.getDeviceStorage("sdcard");
  let xmlText = "";
  let xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  drawProgress(type, 0,1,`Writing ${type} to ${format}`)
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
            } else {
              email = "";
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
            } else {
              adr = "";
            }
            let tel = "";
            if (contact.tel) {
              let telArr = [];
              for (let i = 0; i < contact.tel.length; i++) {
                telArr[i] = contact.tel[i].value;
              }
              tel = telArr.join(" ");
            } else {
              tel = "";
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
      }
      filename = filename + ".txt";

      let oMyBlob = new Blob([plainText], { type: "text/plain" });
      let request = sdcard.addNamed(oMyBlob, filename);
      request.onsuccess = function () {
        drawProgress(type, 1,1,`Done!`);
        console.log(
          "Data was successfully written to the internal storage (" +
            filename +
            ")"
        );
      };
      request.onerror = function () {
        drawProgress(type, 1,1,`Error!`);
        console.error("Error happened at " + type + " while trying to write to " + filename + " (" + format + ")")
        alert(
          "Error happened while trying to write to " +
            filename +
            " " +
            request.error.name
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
          json = JSON.stringify(array, null, 2);
          filename = filename + "_MMS.json";
          break;
        case "contact":
          json = JSON.stringify(array, null, 2);
          filename = filename + "_Contacts.json";
          break;
        default:
          console.error("Invalid type '" + type + "' for CSV format.");
          return;
      }

      let oMyJsonBlob = new Blob([json], {
        type: "application/json",
      });
      let requestJson = sdcard.addNamed(oMyJsonBlob, filename);
      requestJson.onsuccess = function () {
        drawProgress(type, 1,1,`Done!`);
        console.log(
          "Data was successfully written to the internal storage (" +
            filename +
            ")"
        );
      };
      requestJson.onerror = function () {
        drawProgress(type, 1,1,`Error!`);
        console.error("Error happened at " + type + " while trying to write to " + filename + " (" + format + ")")
        alert(
          "Error happened while trying to write to " +
            filename +
            " " +
            requestJson.error.name
        );
      };
      break;
    case "csv":
      let csvText = "";
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
          var csvGoogleText =
            "Name,Given Name,Additional Name,Family Name,Name Suffix,Nickname,Birthday,Gender,Notes,Photo,Organization 1 - Name,Organization 1 - Title,Website 1 - Value,Phone 1 - Type,Phone 1 - Value,Phone 2 - Type,Phone 2 - Value,E-mail 1 - Value,E-mail 2 - Value,Address 1 - Street,Address 1 - City,Address 1 - Postal Code,Address 1 - Country,Address 1 - Region\r\n";
          var csvOutlookText =
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
          console.error("Invalid type '" + type + "' for CSV format.");
          return;
      }
      let oMyCsvBlob = new Blob([csvText], {
        type: "text/plain;charset=utf-8",
      });
      let requestCsv = sdcard.addNamed(oMyCsvBlob, filename);
      requestCsv.onsuccess = function () {
        drawProgress(type, 1,1,`Done!`);
        console.log(
          "Data was successfully written to the internal storage (" +
            filename +
            ")"
        );
      };
      requestCsv.onerror = function () {
        drawProgress(type, 1,1,`Error!`);
        console.error("Error happened at " + type + " while trying to write to " + filename + " (" + format + ")")
        alert(
          "Error happened while trying to write to " +
            filename +
            " " +
            requestCsv.error.name
        );
      };
      if (type == "contact"){
      let oMyGoogleCsvBlob = new Blob([csvGoogleText], {
        type: "text/plain;charset=utf-8",
      });
      let oMyOutlookCsvBlob = new Blob([csvOutlookText], {
        type: "text/plain;charset=utf-8",
      });

      let requestGoogleCsv = sdcard.addNamed(oMyGoogleCsvBlob, googleFilename);
      requestGoogleCsv.onsuccess = function () {
        drawProgress(type, 1,1,`Done!`);
        console.log(
          "Data was successfully written to the internal storage (" +
            googleFilename +
            ")"
        );
      };
      requestGoogleCsv.onerror = function () {
        drawProgress(type, 1,1,`Error!`);
        console.error("Error happened at " + type + " while trying to write to " + filename + " (" + format + ")")
        alert(
          "Error happened while trying to write to " +
            googleFilename +
            " " +
            requestGoogleCsv.error.name
        );
      };
      let requestOutlookCsv = sdcard.addNamed(
        oMyOutlookCsvBlob,
        outlookFilename
      );
      requestOutlookCsv.onsuccess = function () {
        drawProgress(type, 1,1,`Done!`);
        console.log(
          "Data was successfully written to the internal storage (" +
            outlookFilename +
            ")"
        );
      };
      requestOutlookCsv.onerror = function () {
        drawProgress(type, 1,1,`Error!`);
        console.error("Error happened at " + type + " while trying to write to " + filename + " (" + format + ")")
        alert(
          "Error happened while trying to write to " +
            outlookFilename +
            " " +
            requestOutlookCsv.error.name
        );
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
          console.error("Invalid type '" + type + "' for CSV format.");
          return;
      }

      let xmlData = xmlHeader + "\n" + xmlText;

      let oMyXmlBlob = new Blob([xmlData], { type: "text/xml;charset=utf-8" });

      let requestXml = sdcard.addNamed(oMyXmlBlob, filename);
      requestXml.onsuccess = function () {
        drawProgress(type, 1,1,`Done!`);
        console.log("Data was successfully written to the internal storage (" +
            filename +
            ")"
        );
      };
      requestXml.onerror = function () {
        drawProgress(type, 1,1,`Error!`);
        console.error("Error happened at " + type + " while trying to write to " + filename + " (" + format + ")")
        alert(
          "Error happened while trying to write to " +
            filename +
            " " +
            requestXml.error.name
        );
      };

      break;
    default:
      console.error("Invalid format '" + format + "'");
      break;
  }
  
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
function showDebug() {
  if (enableDebug) {
    const debugElement = document.getElementById("debug");
    debugElement.innerHTML = `nav: ${key} row: ${row} (${rowLimit}) col: ${col}`;
  }
}

function handleExport(data, amount, filename, type, whatToSave) {
  let formats = ["plain", "json", "csv", "xml"];
  console.log("handleExport: Starting to write " + type + " (amount)");
  for (let i = 0; i < whatToSave.length; i++) {
    if (whatToSave[i] == true) {
      writeToFile(data, amount, filename, type, formats[i]);
      console.log("Writing " + type + " to " + whatToSave[i]);
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
      console.log("id: i" + row + " - focused");
    }
  } else {
    const inputValue = inputElement.value;
    filename = inputValue;
    inputElement.blur();
    console.log("id: i" + row + " - unfocused");
  }
  if (!filename.includes(folderPath)) {
    filename = folderPath + filename;
  }
  console.log("filename is set to: " + filename);
}

function check(id,obj,arr) {
  const checkbox = document.getElementById(obj + id);
  if (checkbox.checked) {
    checkbox.checked = false;
    arr[id-1] = false;
    console.log("check() - obj: " + obj + id + " - unchecked");
  } else {
    checkbox.checked = true;
    arr[id-1] = true;
    console.log("check() - obj: " + obj + id + " - checked");
  }
  console.log("check() - values (col " + col + ") - " + arr);
}

function handleKeydown(e) {
  switch (e.key) {
    case "ArrowUp":
      nav('up');
      console.log("ArrowUp triggered");
      break;
    case "ArrowDown":
      nav('down');
      console.log("ArrowDown triggered");
      break;
    case "ArrowRight":
      nav('right');
      console.log("ArrowRight triggered");
      break;
    case "ArrowLeft":
      nav('left');
      console.log("ArrowLeft triggered");
      break;
    case "Enter":
      nav('enter');
      console.log("Enter triggered");
      break;
    case "SoftRight":
      nav('softright');
      console.log("SoftRight triggered");
      break;
    case "SoftLeft":
      nav('softleft');
      console.log("SoftLeft triggered");
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
  let randomLimit = 10000; // I have no clue what is the limit of messages, just a placeholder value 
  console.log("fetchSMSMessages: Starting backup");
  drawProgress("sms",1,3,`Staring SMS backup (1/3)`)
  let smsManager = window.navigator.mozSms || window.navigator.mozMobileMessage;
  if (!smsManager) {
    console.error("Could not get API access");
    alert("Could not get API access");
    return;
  }
  console.log("Got access to mozSms or mozMobileMessage");
  drawProgress("sms",2,3,`Staring SMS backup (2/3)`)
  let request = smsManager.getMessages(null, false);
  if (!request) {
    console.error("Couldn't access getMessages().");
    alert("Couldn't access getMessages().");
    return;
  }
  console.log("Got access to getMessages(), starting scan");
  let amount = 0;
  drawProgress("sms",3,3,`Staring SMS backup (3/3)`)
  request.onsuccess = function () {
    let cursor = request;
    if (!cursor.result) {
      console.log("Got the last message");
      console.log("Successfully scanned " + amount + " messages.");
      drawProgress("sms",1,1,`Found (${amount}/${amount})`)
      handleExport(smsMessages, amount, filename, "sms", holdValuesExport);
      return;
    }
    drawProgress("sms",amount,randomLimit,`Scanning SMSes (${amount}/?)`)
    const message = cursor.result;
    if (message.type == "sms") {
      const newMessage = new SMSMessage(message); // Create SMSMessage from message object
      smsMessages.push(newMessage);
      amount += 1;
      drawProgress("sms",amount,randomLimit,`Scanning SMSes (${amount}/?)`)
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
  let randomLimit = 10000; // I have no clue what is the limit of messages, just a placeholder value 
  console.log("fetchMMSMessages: Starting backup");
  drawProgress("mms",1,3,`Staring MMS backup (1/3)`)
  let mmsManager = window.navigator.mozMms || window.navigator.mozMobileMessage;

  if (!mmsManager) {
    console.error("Could not get MMS API access");
    alert("Could not get MMS API access");
    return;
  }
  drawProgress("mms",2,3,`Staring MMS backup (2/3)`)
  let request = mmsManager.getMessages(null, false);
  if (!request) {
    console.error("Couldn't access getMessages().");
    alert("Couldn't access getMessages().");
    return;
  }
  drawProgress("mms",3,3,`Staring MMS backup (3/3)`)
  let amount = 0;

  request.onsuccess = function () {
    let cursor = request;
    if (!cursor.result) {
      console.log("Got the last MMS message");
      console.log("Successfully scanned " + amount + " MMS messages.");
      drawProgress("mms",1,1,`Found (${amount}/${amount})`)
      handleExport(mmsMessages, amount, filename, "mms", holdValuesExport);
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
  if (typeof CallLogMgr !== "undefined") {
    initCallLogMgr(false, true, false);

    CallLogMgr.addEventListener("updated", function () {
      const callLogs = CallLogMgr.getList();
      console.log("Call Logs:", callLogs);
    });
  } else {
    console.error("CallLogMgr is not available.");
  }
}

function fetchContacts() {
  console.log("fetchContacts: Starting backup");
  drawProgress("contact",1,3,`Staring Contact backup (1/3)`)
  if ("mozContacts" in navigator) {
    let options = {
      filterBy: [],
    };
    drawProgress("contact",2,3,`Staring Contact backup (2/3)`)
    let request = navigator.mozContacts.find(options);
    if (!request) {
      console.error("Couldn't access mozContacts.");
      alert("Couldn't access mozContacts.");
      return;
    }
    drawProgress("contact",3,3,`Staring Contact backup (3/3)`)
    request.onsuccess = function () {
      let allContacts = request.result;

      if (allContacts.length > 0) {
        console.log("Found " + allContacts.length + " contacts, proceeding...");
        for (let i = 0; i < allContacts.length; i++) {
          drawProgress("contact",i,allContacts.length,`Scanning Contacts (${i}/${allContacts.length})`)
          let currentContact = allContacts[i];
          const newContact = new Contact(currentContact);
          contacts.push(newContact);
        }
        console.log("Got the last contact");
        drawProgress("contact",1,1,`Found (${allContacts.length}/${allContacts.length})`)
        handleExport(
          contacts,
          allContacts.length,
          filename,
          "contact",
          holdValuesExport
        );
      } else {
        console.log("No contacts found.");
      }
    };

    request.onerror = function () {
      console.error("Error accessing contacts: " + request.error.name);
    };
  } else {
    console.error("Could not get API access for contacts.");
  }
}

function saveMMSImages(mmsMessages) {
  for (let i = 0; i < mmsMessages.length; i++) {
    const attachments = mmsMessages[i].attachments;
    for (let j = 0; j < attachments.length; j++) {
      const attachment = attachments[j];
      const imageFilename =
        "KaiOS_Backup/backup_" +
        currentDate +
        "/MMS_images/" +
        attachment.location;
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
    console.log("Image saved as " + filename);
  };
  request.onerror = function () {
    console.error("Error while saving image: " + request.error.name);
  };
}

function startProcess(holdValues, holdValuesExport){
  if (holdValues.every((element) => element === false)) {
    console.error("Nothing was selected to backup");
    alert("Nothing was selected to backup");
  } else if (holdValuesExport.every((element) => element === false)) {
    console.error("No formats were selected to export");
    alert("No formats were selected to export");
  } else {
    
    if (holdValues[0]) {
      fetchSMSMessages();
    }
    if (holdValues[1]) {
      fetchMMSMessages();
    }
    if (holdValues[2]) {
      fetchContacts();
    }
  }
  return true;

}

function drawProgress(item, pos, amount, msg){
  if (col != 3){
    col = 3;
    colLimit = 3;
    drawMenu(col);
  }
  startProgress = true;
  
      switch (item) {
        case "sms":
          let progressBarSMS = document.getElementById("p1");
          let textMsgSMS = document.getElementById("p1-1");
          progressBarSMS.value = pos;
          progressBarSMS.max = amount;
          textMsgSMS.textContent = msg;
          break;
        case "mms":
            let progressBarMMS = document.getElementById("p2");
            let textMsgMMS = document.getElementById("p2-1");
            progressBarMMS.value = pos;
            progressBarMMS.max = amount;
            textMsgMMS.textContent = msg;
            break;
          case "contact":
              let progressBarContact = document.getElementById("p3");
              let textMsgContact = document.getElementById("p3-1");
              progressBarContact.value = pos;
              progressBarContact.max = amount;
              textMsgContact.textContent = msg;
              break;      
        }
    
}

function drawMenu(col) {
  let menu = "";
  let rowLimit;
  const menuContainer = document.getElementById("menu-container");
  const navbar = document.getElementById("nav-bar");
  let navbarEntries =
    '<span id="l1" class = "notactive">Data Selection</span> <span id="l2" class = "notactive"> Export </span><span id="l3" class = "notactive"> Progress </span>';
  switch (col) {
    case 1:
      console.log("drawMenu: menu 1 (Data Selection)");
      menu = `<ul>
      <li id="1">Save SMS<div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b1" type="checkbox" style="display: none;" ${
        holdValues[0] ? "checked" : ""
      }>
      <label class="cbx" for="b1">
          <span>
              <svg width="12px" height="9px" viewbox="0 0 12 9">
                  <polyline points="1 5 4 8 11 1"></polyline>
              </svg>
          </span>
      </label>
  </div> </li>
  <li id="2">Save MMS<div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b2" type="checkbox" style="display: none;" ${
        holdValues[1] ? "checked" : ""
      }>
      <label class="cbx" for="b2">
          <span>
              <svg width="12px" height="9px" viewbox="0 0 12 9">
                  <polyline points="1 5 4 8 11 1"></polyline>
              </svg>
          </span>
      </label>
  </div> </li>
  <li id="3">Save Contacts<div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b3" type="checkbox" style="display: none;" ${
        holdValues[2] ? "checked" : ""
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
      rowLimit = 3;
      break;

    case 2:
      console.log("drawMenu: menu 2 (Export)");
      if (!filename) {
        refreshDate();
        filename =
          folderPath + "backup_" + currentDate + "/backup_" + currentDate;
      }
      menu = "<ul>";
      menu +=
        '<li id="1">Folder Name: <input type="text" id="i1" value="' +
        filename +
        '" nav-selectable="true" autofocus /></li>';
      menu +=
        '<li id="2">Export to .txt text file<div class="checkbox-wrapper-15">';
      menu +=
        '<input class="inp-cbx" id="b1" type="checkbox" style="display: none;" ' +
        (holdValuesExport[0] ? "checked" : "") +
        ">";
      menu += '<label class="cbx" for="b1">';
      menu += "<span>";
      menu += '<svg width="12px" height="9px" viewbox="0 0 12 9">';
      menu += '<polyline points="1 5 4 8 11 1"></polyline>';
      menu += "</svg>";
      menu += "</span>";
      menu += "</label>";
      menu += "</div></li>";
      menu +=
        '<li id="3">Export to JSON format<div class="checkbox-wrapper-15">';
      menu +=
        '<input class="inp-cbx" id="b2" type="checkbox" style="display: none;" ' +
        (holdValuesExport[1] ? "checked" : "") +
        ">";
      menu += '<label class="cbx" for="b2">';
      menu += "<span>";
      menu += '<svg width="12px" height="9px" viewbox="0 0 12 9">';
      menu += '<polyline points="1 5 4 8 11 1"></polyline>';
      menu += "</svg>";
      menu += "</span>";
      menu += "</label>";
      menu += "</div></li>";
      menu +=
        '<li id="4">Export to CSV format<div class="checkbox-wrapper-15">';
      menu +=
        '<input class="inp-cbx" id="b3" type="checkbox" style="display: none;" ' +
        (holdValuesExport[2] ? "checked" : "") +
        ">";
      menu += '<label class="cbx" for="b3">';
      menu += "<span>";
      menu += '<svg width="12px" height="9px" viewbox="0 0 12 9">';
      menu += '<polyline points="1 5 4 8 11 1"></polyline>';
      menu += "</svg>";
      menu += "</span>";
      menu += "</label>";
      menu += "</div></li>";
      menu +=
        '<li id="5">Export to XML format<div class="checkbox-wrapper-15">';
      menu +=
        '<input class="inp-cbx" id="b4" type="checkbox" style="display: none;" ' +
        (holdValuesExport[3] ? "checked" : "") +
        ">";
      menu += '<label class="cbx" for="b4">';
      menu += "<span>";
      menu += '<svg width="12px" height="9px" viewbox="0 0 12 9">';
      menu += '<polyline points="1 5 4 8 11 1"></polyline>';
      menu += "</svg>";
      menu += "</span>";
      menu += "</label>";
      menu += "</div></li>";
      menu += "</ul>";

      navbarEntries =
        '<span id="l1" class = "notactive" >ata Selection</span> <span id="l2"> Export </span><span id="l3" class = "notactive"> Progress </span>';
      rowLimit = 5;
      break;

    case 3:
      console.log("drawMenu: menu 3 (Progress)");
      navbarEntries =
        '<span id="l1" class = "notactive" >ta Selection</span> <span id="l2" class = "notactive"> Export </span><span id="l3" > Progress </span>';
      menu = `<ul>
    <li id = "1"><div class="progressbar"><span id = "p1-1">SMS (Not started)</span>
    <progress id = "p1"></progress></div></li>
    <li id = "2"><div class="progressbar"><span id = "p2-1">MMS (Not started)</span>
    <progress id = "p2"></progress></div></li>    
    <li id = "3"><div class="progressbar"><span id = "p3-1">Contacts (Not started)</span>
    <progress id = "p3"></progress></div></li>    
    </ul>`;
      rowLimit = 3;
      break;
  }

  menuContainer.innerHTML = menu;
  navbar.innerHTML = navbarEntries;
  document.getElementById("l" + col).className = "hovered";
  return rowLimit;
}

function drawSoftkeys(arr){
  let softkeys = "";
  const softkeyContainer = document.getElementById("softkey");

  softkeys += `<label id="left">${arr[0]}</label>`
  softkeys += `<label id="center">${arr[1]}</label>`
  softkeys += `<label id="right">${arr[2]}</label>`
  softkeyContainer.innerHTML = softkeys;
}

function scrollHide(){
  if (col == 2){
  if (row > 4) {
    for(let i = 0; i < row - 4; i++){
    console.log('hide id:' + i+1 + ' show id: ' + row)
    document.getElementById(i+1).style.display = "none";
    document.getElementById(row).style.display = "flex";
    }
  } else if (row == 1){
    document.getElementById(1).style.display = "flex";
    document.getElementById(5).style.display = "none";
  }
}
}

function menuHover(row, pastRow, obj){
const pastElement = document.getElementById(obj + pastRow);
if(pastElement){
  pastElement.classList.remove("hovered");
}

const currentElement = document.getElementById(obj + row);
if(currentElement){
  currentElement.classList.add("hovered");
}

}

function menuNavigation(nav){
let pastRow = row;
let softkeysArr = ["","Select","Menu"];
switch(nav){
  case 'up':
    if(row > 1){
      row--;
    }
    else{
      row = rowLimit;
    }
    break;
  case 'down':
    if(row < rowLimit){
      row++;
    }
    else{
      row = 1;
    }
    break;
  case 'left':
    if(col > 1){
    col--;
    }
    else{
      col = colLimit;
    }
    row = 1;
    rowLimit = drawMenu(col);
    break;
  case 'right':
    if(col < colLimit){
      col++
    }
    else{
      col = 1;
    }
    row = 1;
    rowLimit = drawMenu(col);
    break;
  case 'enter':
    switch (col){
      case 1:
        check(row, 'b', holdValues);
        break;
      case 2:
        if(row == 1){
          focusInput(row);
        }
        else{
          check(row-1, 'b', holdValuesExport);
        }
    }
    break;
  case 'softright':
    toggleMenu();
    if(enableMenu){
      softkeysArr[2] = "Close";
      softkeysArr[0] = "";  
    }
    break;
  case 'softleft':
    if (col == 2 && row == 4){
      toggleOptions();
    }
    if(enableOptions){
      softkeysArr[2] = "";
      softkeysArr[0] = "Close"; 
    }
    if (col == 2 && row == 1){
      enableClear = true;
    }
    break;
}
if (col == 2 && row == 4 && !enableOptions && !enableMenu){
  softkeysArr[0] = "Options";
}
if (col == 2 && row == 1){
  softkeysArr[0] = "Clear";
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
menuHover(row, pastRow,'')
drawSoftkeys(softkeysArr);
}

function toggleMenu() {
  const menuContainer = document.getElementById('menu');
  if (!enableMenu) {
      menuContainer.style.opacity = '1';
      enableMenu = true;
  } else {
      menuContainer.style.opacity = '0';
      enableMenu = false;
  }
}

function toggleOptions() {
  const menuContainer = document.getElementById('options');
  const menuContent = `
  <div class="optionsItem" id='o1'>Export as a Normal CSV<div class="checkbox-wrapper-15">
    <input class="inp-cbx" id="ob1" type="checkbox" style="display: none;" ${holdValuesCSV[0] ? 'checked' : ''}>
    <label class="cbx" for="b2"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
  </div>
  </div>
  <div class="optionsItem" id='o2'>Export as a Google CSV<div class="checkbox-wrapper-15">
    <input class="inp-cbx" id="ob2" type="checkbox" style="display: none;" ${holdValuesCSV[1] ? 'checked' : ''}>
    <label class="cbx" for="b2"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
  </div>
  </div>
  <div class="optionsItem" id='o3'>Export as a Outlook CSV<div class="checkbox-wrapper-15">
    <input class="inp-cbx" id="ob3" type="checkbox" style="display: none;" ${holdValuesCSV[2] ? 'checked' : ''}>
    <label class="cbx" for="b2"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
  </div>
  </div>
`;
  
  menuContainer.innerHTML = menuContent;
  const hoverElement = document.getElementById('o' + optionsRow);
  hoverElement.classList.add('hovered')
  if (!menuContainer.classList.contains('active')) {
      menuContainer.classList.add('active');
      menuContainer.classList.remove('notactive');
      enableOptions = true;
  } else {
      menuContainer.classList.remove('active');
      menuContainer.classList.add('notactive');
      enableOptions = false;
  }
}

function navigateMenu(nav){
  let rowLimit = 2;
  let pastRow = menuRow;
  switch (nav){
    case 'up':
      if(menuRow > 1){
        menuRow--;
      }
      else{
        menuRow = rowLimit;
      }
      break;
  case 'down':
    if (menuRow < rowLimit){
      menuRow++;
    }
    else{
      menuRow = 1;
    }
  break;
  case 'enter':
    switch(menuRow){
      case 1:
        startProcess(holdValues,holdValuesExport);
        toggleMenu();
        return;
      case 2:
        alert("Made by D3SXX")
        toggleMenu();
        return;
    }
    break;
}
menuHover(menuRow, pastRow, 'm')

}

function navigateOptions(nav){
  let rowLimit = 3;
  let pastRow = optionsRow;
  switch (nav){
    case 'up':
      if(optionsRow > 1){
        optionsRow--;
      }
      else{
        optionsRow = rowLimit;
      }
      break;
  case 'down':
    if (optionsRow < rowLimit){
      optionsRow++;
    }
    else{
      optionsRow = 1;
    }
  break;
  case 'enter':
      holdValuesCSV[optionsRow-1] = !holdValuesCSV[optionsRow-1]
      const buttonElement = document.getElementById('ob' + optionsRow);
      buttonElement.checked = holdValuesCSV[optionsRow-1];
      console.log('navigateOptions() - ob' + optionsRow + ' - value: ' + holdValuesCSV[optionsRow-1])
      break;
}
menuHover(optionsRow, pastRow, 'o')

}


function updateMenuContainer(nav) {
  let softkeysArr = ["","Select","Menu"];
  if (!colLimit){
    colLimit = 3;
  }
  if (enableMenu && nav != "softright"){
    navigateMenu(nav);
    return;
  }
  if (enableOptions && nav != "softleft"){
    navigateOptions(nav);
    return;
  }
  menuNavigation(nav);
  showDebug();
}

nav('right');
nav('left');

