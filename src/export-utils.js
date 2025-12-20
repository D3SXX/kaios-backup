/**
 * Shared export utilities for the application
 * Used by both app and tests
 */

import Papa from "papaparse";
import { js2xml } from "xml-js";

// Classes for data models
export class SmsMessage {
  constructor(obj) {
    this.type = obj.type;
    this.id = obj.id;
    this.threadId = obj.threadId;
    this.iccId = obj.iccId;
    this.delivery = obj.delivery;
    this.deliveryStatus = obj.deliveryStatus;
    this.sender = obj.sender;
    this.receiver = obj.receiver;
    this.body = obj.body;
    this.messageClass = obj.messageClass;
    this.timestamp = obj.timestamp;
    this.sentTimestamp = obj.sentTimestamp;
    this.deliveryTimestamp = obj.deliveryTimestamp;
    this.read = obj.read;
  }

  toJSON() {
    return {
      type: this.type || null,
      id: this.id || null,
      threadId: this.threadId || null,
      iccId: this.iccId || null,
      delivery: this.delivery || null,
      deliveryStatus: this.deliveryStatus || null,
      sender: this.sender || null,
      receiver: this.receiver || null,
      body: this.body || null,
      messageClass: this.messageClass || null,
      timestamp: this.timestamp || null,
      sentTimestamp: this.sentTimestamp || null,
      deliveryTimestamp: this.deliveryTimestamp || null,
      read: this.read || null,
    };
  }
}

export class MmsMessage {
  constructor(obj) {
    this.type = obj.type;
    this.id = obj.id;
    this.threadId = obj.threadId;
    this.iccId = obj.iccId;
    this.delivery = obj.delivery;
    this.deliveryInfo = obj.deliveryInfo;
    this.sender = obj.sender;
    this.receivers = obj.receivers;
    this.timestamp = obj.timestamp;
    this.sentTimestamp = obj.sentTimestamp;
    this.read = obj.read;
    this.subject = obj.subject;
    this.smil = obj.smil;
    this.attachments = obj.attachments;
    this.expiryDate = obj.expiryDate;
    this.readReportRequested = obj.readReportRequested;
  }

  toJSON() {
    return {
      type: this.type || null,
      id: this.id || null,
      threadId: this.threadId || null,
      iccId: this.iccId || null,
      delivery: this.delivery || null,
      deliveryInfo: Array.isArray(this.deliveryInfo)
        ? this.deliveryInfo
            .map((info) => ({
              deliveryStatus: info.deliveryStatus || null,
              deliveryTimestamp: info.deliveryTimestamp || null,
              readStatus: info.readStatus || null,
              readTimestamp: info.readTimestamp || null,
              receiver: info.receiver || null,
            }))
            .map((info) =>
              Object.entries(info)
                .filter(([_, v]) => v !== null)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" ")
            )
            .join("; ")
        : null,
      sender: this.sender || null,
      receivers: Array.isArray(this.receivers)
        ? this.receivers.join("; ")
        : null,
      timestamp: this.timestamp || null,
      sentTimestamp: this.sentTimestamp || null,
      read: this.read || null,
      subject: this.subject || null,
      smil: this.smil || null,
      attachments: Array.isArray(this.attachments)
        ? this.attachments
            .map((attachment) => {
              if (attachment.content instanceof File) {
                return `filename: ${attachment.location}, type: ${attachment.content.type}, size: ${attachment.content.size}`;
              }
              return Object.entries(attachment)
                .filter(([_, v]) => v !== null)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" ");
            })
            .join("; ")
        : null,
      expiryDate: this.expiryDate || null,
      readReportRequested: this.readReportRequested || null,
    };
  }
}

export class Contact {
  constructor(obj) {
    this.id = obj.id;
    this.published = obj.published;
    this.updated = obj.updated;
    this.bday = obj.bday;
    this.anniversary = obj.anniversary;
    this.sex = obj.sex;
    this.genderIdentity = obj.genderIdentity;
    this.ringtone = obj.ringtone;
    this.photo = obj.photo;
    this.adr = obj.adr;
    this.email = obj.email;
    this.url = obj.url;
    this.impp = obj.impp;
    this.tel = obj.tel;
    this.name = obj.name;
    this.honorificPrefix = obj.honorificPrefix;
    this.givenName = obj.givenName;
    this.phoneticGivenName = obj.phoneticGivenName;
    this.additionalName = obj.additionalName;
    this.familyName = obj.familyName;
    this.phoneticFamilyName = obj.phoneticFamilyName;
    this.honorificSuffix = obj.honorificSuffix;
    this.nickname = obj.nickname;
    this.category = obj.category;
    this.org = obj.org;
    this.jobTitle = obj.jobTitle;
    this.note = obj.note;
    this.key = obj.key;
    this.group = obj.group;
  }

  toJSON() {
    return {
      id: this.id,
      published:
        this.published instanceof Date
          ? this.published.toISOString()
          : this.published,
      updated:
        this.updated instanceof Date
          ? this.updated.toISOString()
          : this.updated,
      bday: this.bday instanceof Date ? this.bday.toISOString() : this.bday,
      anniversary:
        this.anniversary instanceof Date
          ? this.anniversary.toISOString()
          : this.anniversary,
      sex: this.sex,
      genderIdentity: this.genderIdentity,
      ringtone: this.ringtone,
      photo: Array.isArray(this.photo)
        ? this.photo
            .map((blob) =>
              blob
                ? `name: ${blob.name}, lastModified: ${blob.lastModified}, lastModifiedDate: ${blob.lastModifiedDate}, size: ${blob.size}, type: ${blob.type}`
                : ""
            )
            .join("; ")
        : null,
      adr: Array.isArray(this.adr)
        ? this.adr
            .map((addr) => {
              if (!addr) return "";
              const type = Array.isArray(addr.type)
                ? `type: ${addr.type.join(",")}`
                : "";
              const address = [
                `street: ${addr.streetAddress || ""}`,
                `city: ${addr.locality || ""}`,
                `region: ${addr.region || ""}`,
                `postal: ${addr.postalCode || ""}`,
                `country: ${addr.countryName || ""}`,
              ].filter((part) => part.endsWith(":") === false);
              return [type, ...address].filter(Boolean).join(", ");
            })
            .join("; ")
        : null,
      email: Array.isArray(this.email)
        ? this.email
            .map((emailObj) => {
              if (!emailObj) return "";
              const type = Array.isArray(emailObj.type)
                ? emailObj.type.join(",")
                : "";
              return `type: ${type}, value: ${emailObj.value || ""}`;
            })
            .join("; ")
        : null,
      url: Array.isArray(this.url)
        ? this.url
            .map(
              (field) => `type: ${field.type.join(",")}, value: ${field.value}`
            )
            .join("; ")
        : null,
      impp: Array.isArray(this.impp)
        ? this.impp
            .map(
              (field) => `type: ${field.type.join(",")}, value: ${field.value}`
            )
            .join("; ")
        : null,
      tel: Array.isArray(this.tel)
        ? this.tel
            .map((telObj) => {
              if (!telObj) return "";
              const type = Array.isArray(telObj.type)
                ? telObj.type.join(",")
                : "";
              return `type: ${type}, value: ${telObj.value || ""}`;
            })
            .join("; ")
        : null,
      name: Array.isArray(this.name) ? this.name.join("; ") : null,
      honorificPrefix: Array.isArray(this.honorificPrefix)
        ? this.honorificPrefix.join("; ")
        : null,
      givenName: Array.isArray(this.givenName)
        ? this.givenName.join("; ")
        : null,
      phoneticGivenName: Array.isArray(this.phoneticGivenName)
        ? this.phoneticGivenName.join("; ")
        : null,
      additionalName: Array.isArray(this.additionalName)
        ? this.additionalName.join("; ")
        : null,
      familyName: Array.isArray(this.familyName)
        ? this.familyName.join("; ")
        : null,
      phoneticFamilyName: Array.isArray(this.phoneticFamilyName)
        ? this.phoneticFamilyName.join("; ")
        : null,
      honorificSuffix: Array.isArray(this.honorificSuffix)
        ? this.honorificSuffix.join("; ")
        : null,
      nickname: Array.isArray(this.nickname) ? this.nickname.join("; ") : null,
      category: Array.isArray(this.category) ? this.category.join("; ") : null,
      org: Array.isArray(this.org) ? this.org.join("; ") : null,
      jobTitle: Array.isArray(this.jobTitle) ? this.jobTitle.join("; ") : null,
      note: Array.isArray(this.note) ? this.note.join("; ") : null,
      key: Array.isArray(this.key) ? this.key.join("; ") : null,
      group: Array.isArray(this.group) ? this.group.join("; ") : null,
    };
  }
}

// Helper functions
export function objectToString(obj) {
  let string = "";
  for (let key in obj) {
    if (obj[key] != null && typeof obj[key] === "object") {
      if (obj[key][0] != null && typeof obj[key][0] === "object") {
        for (let i in obj[key]) {
          string += `${key}:\n`;
          for (let k in obj[key][0]) {
            if (obj[key][i][k] instanceof Blob) {
              string += `size: ${obj[key][i][k]["size"]}\ntype: ${obj[key][i][k]["type"]}\n`;
            } else {
              string += `${k}: ${obj[key][i][k]}\n`;
            }
          }
        }
      } else {
        string += `${key}: ${obj[key]}\n`;
      }
    } else {
      string += `${key}: ${obj[key]}\n`;
    }
  }
  return string;
}

export function objectToCsv(obj, debugPrint = null) {
  try {
    const plainObjects = obj.map((item) => {
      if (
        item instanceof SmsMessage ||
        item instanceof MmsMessage ||
        item instanceof Contact
      ) {
        return item.toJSON();
      }
      return item;
    });

    if (debugPrint) {
      debugPrint(`Converting ${plainObjects.length} items to CSV`);
    }

    const result = Papa.unparse(plainObjects, {
      header: true,
      delimiter: ",",
      quotes: true,
    });

    if (debugPrint) {
      debugPrint(`CSV conversion completed, length: ${result.length}`);
    }
    return result;
  } catch (err) {
    if (debugPrint) {
      debugPrint(`Error converting to CSV: ${err.message}`, "error");
    }
    return "";
  }
}

// Export functions for testing (pure functions that don't depend on DOM/APIs)
export function exportSmsToJson(smsArray) {
  let json = "";
  for (let index in smsArray) {
    json += JSON.stringify(
      new SmsMessage(smsArray[index]).toJSON(),
      null,
      2
    );
    json += ",";
  }
  return "[" + json.slice(0, -1) + "]";
}

export function exportMmsToJson(mmsArray) {
  let json = "";
  for (let index in mmsArray) {
    json += JSON.stringify(
      new MmsMessage(mmsArray[index]).toJSON(),
      null,
      2
    );
    json += ",";
  }
  return "[" + json.slice(0, -1) + "]";
}

export function exportContactsToJson(contactsArray) {
  const contactObjects = contactsArray.map(c => new Contact(c));
  return JSON.stringify(contactObjects, null, 2);
}

export function exportSmsToTxt(smsArray) {
  let plainText = "";
  for (let i = 0; i < smsArray.length; i++) {
    const message = new SmsMessage(smsArray[i]);
    plainText += objectToString(message.toJSON());
    plainText += "\n";
  }
  return plainText;
}

export function exportMmsToTxt(mmsArray) {
  let plainText = "";
  for (let i = 0; i < mmsArray.length; i++) {
    const message = new MmsMessage(mmsArray[i]);
    plainText += objectToString(message.toJSON());
    plainText += "\n";
  }
  return plainText;
}

export function exportContactsToTxt(contactsArray) {
  let plainText = "";
  for (let i = 0; i < contactsArray.length; i++) {
    const contact = new Contact(contactsArray[i]);
    plainText += objectToString(contact.toJSON());
    plainText += "\n";
  }
  return plainText;
}

export function exportSmsToCsv(smsArray) {
  const obj = smsArray.map((item) => new SmsMessage(item).toJSON());
  return objectToCsv(obj);
}

export function exportMmsToCsv(mmsArray) {
  const obj = mmsArray.map((item) => new MmsMessage(item).toJSON());
  return objectToCsv(obj);
}

export function exportContactsToCsv(contactsArray) {
  const contacts = contactsArray.map((item) => new Contact(item).toJSON());
  return objectToCsv(contacts);
}

export function exportContactsToGoogleCsv(contactsArray) {
  const contacts = contactsArray.map((contact) => {
    const photo = contact.photo ? contact.photo[0].name : "";
    const googleBday = contact.bday
      ? `${contact.bday.getFullYear()}-${
          contact.bday.getMonth() + 1
        }-${contact.bday.getDate()}`
      : "";

    return {
      Name: contact.name ? contact.name[0] : "",
      "Given Name": contact.givenName
        ? contact.givenName.join(" ")
        : "",
      "Additional Name": contact.additionalName
        ? contact.additionalName[0]
        : "",
      "Family Name": contact.familyName
        ? contact.familyName.join(" ")
        : "",
      "Name Suffix": contact.honorificSuffix || "",
      Nickname: contact.nickname || "",
      Birthday: googleBday,
      Gender: contact.genderIdentity || "",
      Notes: contact.note || "",
      Photo: photo,
      "Organization 1 - Name": contact.org ? contact.org[0] : "",
      "Organization 1 - Title": contact.jobTitle || "",
      "Website 1 - Value": contact.url ? contact.url : "",
      "Phone 1 - Type": contact.tel?.[0]?.type?.[0] || "",
      "Phone 1 - Value": contact.tel?.[0]?.value || "",
      "Phone 2 - Type": contact.tel?.[1]?.type?.[0] || "",
      "Phone 2 - Value": contact.tel?.[1]?.value || "",
      "E-mail 1 - Value": contact.email?.[0]?.value || "",
      "E-mail 2 - Value": contact.email?.[1]?.value || "",
      "Address 1 - Street": contact.adr?.[0]?.streetAddress || "",
      "Address 1 - City": contact.adr?.[0]?.locality || "",
      "Address 1 - Postal Code": contact.adr?.[0]?.postalCode || "",
      "Address 1 - Country": contact.adr?.[0]?.countryName || "",
      "Address 1 - Region": contact.adr?.[0]?.region || "",
    };
  });
  return objectToCsv(contacts);
}

export function exportContactsToOutlookCsv(contactsArray) {
  const contacts = contactsArray.map((contact) => {
    const outlookBday = contact.bday
      ? `${contact.bday.getDate()}/${
          contact.bday.getMonth() + 1
        }/${contact.bday.getFullYear()}`
      : "";
    return {
      "First Name": contact.givenName
        ? contact.givenName.join(" ")
        : "",
      "Last Name": contact.familyName
        ? contact.familyName.join(" ")
        : "",
      Suffix: contact.honorificSuffix || "",
      Nickname: contact.nickname || "",
      "E-mail Address": contact.email?.[0]?.value || "",
      "E-mail 2 Address": contact.email?.[1]?.value || "",
      "Mobile Phone": contact.tel?.[0]?.value || "",
      "Mobile Phone 2": contact.tel?.[1]?.value || "",
      "Job Title": contact.jobTitle || "",
      Company: contact.org ? contact.org[0] : "",
      "Home Street": contact.adr?.[0]?.streetAddress || "",
      "Home City": contact.adr?.[0]?.locality || "",
      "Home State": contact.adr?.[0]?.region || "",
      "Home Postal Code": contact.adr?.[0]?.postalCode || "",
      "Home Country/Region": contact.adr?.[0]?.countryName || "",
      "Web Page": contact.url ? contact.url : "",
      Birthday: outlookBday,
      Notes: contact.note || "",
      Gender: contact.genderIdentity || "",
    };
  });
  return objectToCsv(contacts);
}

export function exportSmsToXml(smsArray) {
  let xmlText = `<smses>\n`;
  for (let index in smsArray) {
    xmlText += `<sms>${js2xml(new SmsMessage(smsArray[index]).toJSON(), {
      compact: true,
      spaces: 4,
      indentation: "    ",
      fullTagEmptyElement: true,
    })}</sms>`;
  }
  xmlText += `</smses>\n`;
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlText;
}

export function exportMmsToXml(mmsArray) {
  let xmlText = `<mmses>\n`;
  for (let index in mmsArray) {
    xmlText += `<mms>${js2xml(new MmsMessage(mmsArray[index]).toJSON(), {
      compact: true,
      spaces: 4,
      indentation: "    ",
      fullTagEmptyElement: true,
    })}</mms>`;
  }
  xmlText += `</mmses>\n`;
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlText;
}

export function exportContactsToXml(contactsArray) {
  let xmlText = `<contacts>\n`;
  for (let index in contactsArray) {
    const contact = new Contact(contactsArray[index]);
    xmlText += `<contact>${js2xml(contact.toJSON(), {
      compact: true,
      spaces: 4,
      indentation: "    ",
      fullTagEmptyElement: true,
    })}</contact>`;
  }
  xmlText += `</contacts>\n`;
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlText;
}
