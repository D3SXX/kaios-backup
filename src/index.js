"use strict";

import Papa from "papaparse";
import { js2xml } from "xml-js";
import imageToBase64 from "image-to-base64/browser";

const folderPath = "KaiOS_Backup/";
let folderPathCustomName;
let localeData;
const buildInfo = ["1.0.6g Beta", "14.01.2025"];

fetch("src/locale.json")
  .then((response) => {
    return response.json();
  })
  .then((data) => initProgram(data));

function initProgram(data) {
  const userLocale = navigator.language;
  localeData = data[userLocale];
  if (!localeData) {
    localeData = data["en-US"];
  }
  draw.init();
  menu.draw(1);
  softkeys.draw();
  console.log(`KaiOS Backup ver. ${buildInfo[0]} initialized`);
}

// A structure to hold values
const backupData = {
  dataTypes: ["sms", "mms", "contact"], // Data that can be exported
  exportData: [false, false, false], // Values for dataTypes
  formatTypes: [".txt", "json", "csv", "xml"],
  exportFormats: [false, false, false, false], // Values for formats that can be used to export data
  csvExportTypes: ["normal", "google", "outlook"],
  csvExportValues: [false, false, false], // Values for CSV Contacts Export
  settingsData: ["", false, false],
  // Method to toggle values
  toggleValue: function (index, type) {
    if (index >= 0 && index < this[type].length) {
      this[type][index] = !this[type][index];
      return this[type][index];
    }
    return null;
  },
  checkValues: function (valuesArr) {
    if (this[valuesArr].every((element) => element === false)) {
      return false;
    }
    return true;
  },
};

const debug = {
  enableDebug: false,
  toggle: function () {
    this.enableDebug = !this.enableDebug;
    this.print("Debug output activated");
    const debugElement = document.getElementById("debug");
    if (this.enableDebug) {
      debugElement.innerHTML = "Debug output activated";
    } else {
      debugElement.innerHTML = "";
    }
  },
  print: function (msg, flag = null) {
    if (this.enableDebug) {
      switch (flag) {
        case "error":
          console.error(msg);
          break;
        case "warning":
          console.warn(msg);
          break;
        default:
          console.log(msg);
          break;
      }
    }
  },
  show: function (key) {
    if (this.enableDebug) {
      const debugElement = document.getElementById("debug");
      debugElement.innerHTML = `nav: ${key} row: ${controls.row} (${controls.rowLimit}) col: ${controls.col}`;
    }
  },
};

const process = {
  progressProceeding: false,
  processesState: [],

  blockControls: false,
  smsLogs: [],
  mmsLogs: [],
  contactsLogs: [],
  start: function (arr) {
    if (!this.isReady() || this.progressProceeding) {
      debug.print(
        "process.start() - Can't start (either not ready or progress is proceeding)"
      );
      return;
    }
    debug.print("process.start() - Check passed, starting");
    toast("Backup started");
    this.progressProceeding = true;
    this.smsLogs = [];
    this.mmsLogs = [];
    this.contactsLogs = [];
    this.processesState = arr.slice();
    this.blockControls = true;
    folderPathCustomName = folderPath + getBackupFolderName();
    softkeys.draw();
    draw.clearLogs();
    controls.updateLimits(undefined, 3);
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
  stop: function () {
    debug.print("process.stop() - releasing controls");
    toast(localeData["NOTIFICATIONS"]["BACKUP_COMPLETE"]);
    this.progressProceeding = false;
    this.blockControls = false;
    if (backupData.settingsData[1]) {
      draw.refreshLogs();
    }
    folderPathCustomName = "";
    softkeys.draw();
  },
  isReady: function () {
    if (backupData.exportData.every((element) => element === false)) {
      debug.print(
        "process.isReady() - Nothing was selected to backup",
        "error"
      );
      toast(localeData["ERRORS"]["NOTHING_SELECTED"]);
      return false;
    } else if (backupData.exportFormats.every((element) => element === false)) {
      debug.print(
        "process.isReady() - No formats were selected to export",
        "error"
      );
      toast(localeData["ERRORS"]["NO_FORMATS_SELECTED"]);
      return false;
    } else {
      debug.print("process.isReady() - Pass");
      return true;
    }
  },
  isDone: function () {
    if (this.processesState.every((element) => element === false)) {
      debug.print("process.isDone() - Calling process.stop()");
      this.stop();
      return true;
    } else {
      return false;
    }
  },
  jobDone: function (type) {
    debug.print(`process.jobDone() - ${type} is set to false`);
    switch (type) {
      case backupData.dataTypes[0]:
        this.processesState[0] = false;
        break;
      case backupData.dataTypes[1]:
        this.processesState[1] = false;
        break;
      case backupData.dataTypes[2]:
        this.processesState[2] = false;
        break;
    }
    this.isDone();
  },
  handleExport: function (data, type) {
    debug.print(
      `process.handleExport() - Starting write operation for type: ${type}`
    );
    for (let i = 0; i < backupData.exportFormats.length; i++)
      if (backupData.exportFormats[i]) {
        if (
          type === backupData.dataTypes[2] &&
          backupData.formatTypes[i] === "csv"
        ) {
          for (let k = 0; k < backupData.csvExportValues.length; k++) {
            if (backupData.csvExportValues[k])
              writeToFile(
                data,
                type,
                backupData.formatTypes[i],
                backupData.csvExportTypes[k]
              );
          }
        } else {
          writeToFile(data, type, backupData.formatTypes[i], undefined);
        }
        debug.print(
          `handleExport() - Calling writeToFile() to write type: ${type} to format: ${backupData.formatTypes[i]}`
        );
      }
  },
};

const controls = {
  row: 1,
  col: 1,
  rowMenu: 0,
  colMenu: 0,
  rowMenuLimit: 0,
  colMenuLimit: 0,
  rowLimit: 0,
  colLimit: 0,
  scrollLimit: 0,
  resetControls: function (type = "", extra = "") {
    let col = `col${extra}`;
    let row = `row${extra}`;
    switch (type) {
      case "col":
        this[col] = 1;
        break;
      case "row":
        this[row] = 1;
        break;
      default:
        this[col] = 1;
        this[row] = 1;
        break;
    }
    debug.print(`controls.resetControls() - ${type + extra} - reset`);
  },
  increase: function (type) {
    let limit = type + "Limit";
    if (this[type] < this[limit]) {
      this[type]++;
    } else {
      this[type] = 1;
    }
    debug.print(`controls.increase() - ${type}: ${this[type]}/${this[limit]}`);
  },
  decrease: function (type) {
    let limit = type + "Limit";
    if (this[type] > 1) {
      this[type]--;
    } else {
      this[type] = this[limit];
    }
    debug.print(`controls.decrease() - ${type}: ${this[type]}/${this[limit]}`);
  },
  updateLimits: function (col = this.colLimit, row = this.rowLimit, type = "") {
    let colLimit = `col${type}Limit`;
    let rowLimit = `row${type}Limit`;
    this[colLimit] = col;
    this[rowLimit] = row;
    debug.print(
      `controls.updateLimits() - New limits for col and row are set to ${col} and ${row}`
    );
  },
  updateControls: function (col = this.col, row = this.row) {
    this.col = col;
    this.row = row;
    debug.print(
      `controls.updateControls() - col: ${this.col} row: ${this.row}`
    );
  },
  handleSoftLeft: function () {
    switch (controls.col) {
      case 2:
        switch (controls.row) {
          case 3:
            draw.toggleOptionsMenu();
            break;
        }
        break;
      case 3:
        switch (controls.row) {
          case 1:
            var filename = folderPath + getBackupFolderName() + "/backup_";
            folderPathCustomName = "";
            document.getElementById(
              1
            ).innerHTML = `<li id="1">${localeData["SETTINGS_PAGE"]["FOLDER_NAME"]} <input type="text" id="i1" value="${filename}" nav-selectable="true" autofocus /></li>`;
            break;
        }
        break;
      case 4:
        draw.toggleLogsMenu();
        break;
    }
  },
  handleSoftRight: function () {
    switch (controls.col) {
      case 1:
      case 2:
      case 3:
      case 5:
        draw.toggleSideMenu();
        break;
      case 4:
        if (!process.blockControls) {
          draw.toggleSideMenu();
        }
        break;
    }
  },
  handleEnter: function () {
    if (draw.sideMenuState) {
      switch (controls.rowMenu) {
        case 1:
          process.start(backupData.exportData);
          draw.toggleSideMenu();
          return;
        case 2:
          menu.draw(5);
          draw.toggleSideMenu();
          return;
      }
    }
    if (draw.optionsMenuState) {
      backupData.csvExportValues[controls.rowMenu - 1] =
        !backupData.csvExportValues[controls.rowMenu - 1];
      const buttonElement = document.getElementById("ob" + controls.rowMenu);
      buttonElement.checked = backupData.csvExportValues[controls.rowMenu - 1];
      debug.print(
        `controls.handleEnter() - Button ob${
          controls.rowMenu
        } value is set to ${backupData.csvExportValues[controls.rowMenu - 1]}`
      );
      return;
    }
    if (draw.logsMenuState) {
      return;
    }
    switch (controls.col) {
      case 1:
        check(controls.row, "b", "exportData");
        break;
      case 2:
        switch (controls.row) {
          case 3:
            check(controls.row, "b", "exportFormats");
            if (backupData.exportFormats[2]) {
              if (!backupData.checkValues("csvExportValues")) {
                backupData.csvExportValues[0] = true;
                document.getElementById("ob" + 1).checked = true;
              }
            } else {
              backupData.csvExportValues = [false, false, false];
              for (let i = 1; i < backupData.csvExportValues.length + 1; i++) {
                document.getElementById("ob" + i).checked = false;
              }
            }
            break;
          default:
            check(controls.row, "b", "exportFormats");
            break;
        }
        break;
      case 3:
        switch (controls.row) {
          case 1:
            focusInput(controls.row);
            break;
          default:
            check(controls.row, "b", "settingsData");
            break;
        }
        break;
      case 4:
        if (
          draw.getLogsArr().length === 0 ||
          document.getElementById(backupData.dataTypes[controls.row - 1])
            .innerHTML === ""
        ) {
          toast("Logs are unavailable");
          return;
        }
        draw.toggleLogsMenu();
        break;
      case 5:
        aboutTab(controls.row);
        break;
    }
  },

  handleKeydown: function (e) {
    debug.print(`${e.key} triggered`);
    let rowType = "row";
    let hoverArg = "";
    if (draw.sideMenuState || draw.optionsMenuState || draw.logsMenuState) {
      rowType = rowType + "Menu";
      hoverArg = "m";
      let ignoreKey = "SoftLeft";
      if (draw.optionsMenuState) {
        hoverArg = "o";
        ignoreKey = "SoftRight";
      } else if (draw.logsMenuState) {
        hoverArg = draw.activeLogs;
        ignoreKey = "SoftRight";
      }
      if (
        e.key === "ArrowRight" ||
        e.key === "6" ||
        e.key === "ArrowLeft" ||
        e.key === "4" ||
        e.key === ignoreKey
      ) {
        return;
      }
    }
    let pastRow = controls[rowType];
    switch (e.key) {
      case "ArrowUp":
      case "2":
        controls.decrease(rowType);
        menuHover(controls[rowType], pastRow, hoverArg);
        break;
      case "ArrowDown":
      case "8":
        controls.increase(rowType);
        menuHover(controls[rowType], pastRow, hoverArg);
        break;
      case "ArrowRight":
      case "6":
        controls.increase("col");
        menu.draw();
        break;
      case "ArrowLeft":
      case "4":
        controls.decrease("col");
        menu.draw();
        break;
      case "Enter":
      case "5":
        controls.handleEnter();
        break;
      case "SoftRight":
        controls.handleSoftRight();
        break;
      case "SoftLeft":
        controls.handleSoftLeft();
        break;
      case "#":
        debug.toggle();
        break;
      case "Backspace":
        if (closeMenus()) {
          e.preventDefault();
        }
        break;
    }
    softkeys.draw();
    scrollHide(hoverArg);
    debug.show(e.key);
  },
};

const menu = {
  itemWidths: [],
  initNavbarItemWidths: function (navbarArr) {
    this.itemWidths = Array.from(navbarArr).map((item) => {
      const temp = document.createElement("span");
      temp.style.visibility = "hidden";
      temp.style.position = "absolute";
      temp.style.whiteSpace = "nowrap";
      temp.innerHTML = item.innerHTML;
      document.body.appendChild(temp);
      const width = temp.offsetWidth + 20;
      document.body.removeChild(temp);
      return width;
    });
    debug.print(
      `menu.initNavbarItemWidths() - widths: ${this.itemWidths.join(", ")}`
    );
  },

  draw: function (col = controls.col) {
    controls.updateControls(col);
    controls.resetControls("row");
    const menuContainer = document.getElementById("menu-container");
    let data;
    data = getMenuData(col);
    menuContainer.innerHTML = data;
    this.updateNavbar(col);
    document.getElementById("l" + controls.col).className = "hovered";
    document.getElementById(controls.row).className = "hovered";
  },
  updateNavbar: function (col) {
    const navbarContainer = document.getElementById("nav-bar");
    const navbarArr = navbarContainer.children;
    if (!this.itemWidths.length) {
      this.initNavbarItemWidths(navbarArr);
    }
    let scrollPosition = 0;
    for (let i = 0; i < col - 1; i++) {
      scrollPosition += this.itemWidths[i];
    }

    const selectedItemWidth = this.itemWidths[col - 1];
    const containerWidth = 320;

    scrollPosition = Math.max(
      0,
      scrollPosition - (containerWidth - selectedItemWidth) / 2
    );

    navbarContainer.style.transform = `translateX(-${scrollPosition}px)`;

    for (let i = 0; i < navbarArr.length; i++) {
      if (i === col - 1) {
        navbarArr[i].className = "hovered";
      } else {
        navbarArr[i].className = "notactive";
      }
    }
  },
};

const draw = {
  block: false,
  sideMenuState: false,
  optionsMenuState: false,
  optionalsIndexes: ["menu", "options", "logs"],
  optionalsActive: [false, false, false],
  initialized: false,
  logsData: [],
  activeLogs: "",
  toggleSideMenu: function () {
    this.sideMenuState = !this.sideMenuState;
    if (this.sideMenuState) {
      controls.rowMenu = 1;
      controls.updateLimits(0, 3, "Menu");
      document.getElementById("menu").classList.remove("hidden");
    } else {
      document.getElementById("menu").classList.add("hidden");
      menuHover(1, controls.rowMenu, "m");
    }
  },
  toggleOptionsMenu: function () {
    this.optionsMenuState = !this.optionsMenuState;
    if (this.optionsMenuState) {
      controls.rowMenu = 1;
      controls.updateLimits(0, 3, "Menu");
      document.getElementById("options").classList.remove("hidden");
    } else {
      let checkExtra = false;
      backupData.csvExportValues.forEach((element) => {
        if (element) {
          checkExtra = true;
        }
      });
      if (checkExtra && !backupData.exportFormats[2]) {
        check(controls.row, "b", "exportFormats");
      } else if (!checkExtra && backupData.exportFormats[2]) {
        check(controls.row, "b", "exportFormats");
      }

      document.getElementById("options").classList.add("hidden");
      menuHover(1, controls.rowMenu, "o");
    }
  },
  toggleLogsMenu: function () {
    const logsTypes = ["sms", "mms", "contact"];
    this.logsMenuState = !this.logsMenuState;

    if (this.logsMenuState) {
      controls.rowMenu = 1;
      this.activeLogs = logsTypes[controls.row - 1];
      menuHover(1, undefined, this.activeLogs);
      controls.updateLimits(1, this.getLogsArr().length, "Menu");
      document.getElementById(this.activeLogs).classList.remove("hidden");
      document.getElementById("logs").classList.remove("hidden");
    } else {
      menuHover(1, controls.rowMenu, this.activeLogs);
      document.getElementById("logs").classList.add("hidden");
      document.getElementById(this.activeLogs).classList.add("hidden");
      this.activeLogs = undefined;
    }
  },
  init: function () {
    if (this.initialized) {
      debug.print(`draw.init() - Already initialized, returning..`);
      return;
    }
    const menuElement = document.getElementById("menu");
    const optionsElement = document.getElementById("options");
    const logsElement = document.getElementById("logs");
    const navBarElement = document.getElementById("nav-bar");

    const optionsEntries = 3;
    const logsSelections = 3;
    let menuContent = "";

    const menuEntriesKeys = ["START_BACKUP", "ABOUT"];
    const exportEntriesKeys = ["NORMAL", "GOOGLE", "OUTLOOK"];

    for (let i = 1; i < menuEntriesKeys.length + 1; i++) {
      menuContent += `<div class="menuItem" id='m${i}'>${
        localeData["MENU"][menuEntriesKeys[i - 1]]
      }</div>`;
    }
    controls.rowMenuLimit = menuEntriesKeys.length;
    controls.rowMenu = 1;
    menuElement.innerHTML = menuContent;
    menuHover(1, undefined, "m");

    let optionsContent = "";
    for (let i = 1; i < optionsEntries + 1; i++) {
      optionsContent += `  <div class="optionsItem" id='o${i}'>${
        localeData["EXPORT_PAGE"]["CSV_OPTIONS"][exportEntriesKeys[i - 1]] ||
        "Export as a Normal CSV"
      }<div class="checkbox-wrapper-15">
          <input class="inp-cbx" id="ob${i}" type="checkbox" style="display: none;" ${
        backupData.csvExportValues[i - 1] ? "checked" : ""
      }>
          <label class="cbx" for="b2"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
          </div></div>`;
    }
    optionsElement.innerHTML = optionsContent;
    menuHover(1, undefined, "o");
    let logsContent = "";
    for (let i = 0; i < logsSelections; i++) {
      logsContent += `<div id="${backupData.dataTypes[i]}" class="hidden"></div>`;
    }
    logsElement.innerHTML = logsContent;

    navBarElement.innerHTML = `<span id="l1" class = "active">${localeData["DATA_SELECTION_PAGE"]["PAGE_TITLE"]}</span> <span id="l2" class = "notactive"> ${localeData["EXPORT_PAGE"]["PAGE_TITLE"]} </span><span id="l3" class = "notactive"> ${localeData["SETTINGS_PAGE"]["PAGE_TITLE"]} </span> <span id="l4" class = "notactive"> ${localeData["PROGRESS_PAGE"]["PAGE_TITLE"]} </span> <span id="l5" class = "notactive"> ${localeData["ABOUT_PAGE"]["PAGE_TITLE"]} </span>`;

    this.initialized = true;

    debug.print(`draw.init() - Initialized`);
  },
  refreshLogs: function () {
    debug.print("draw.refreshLogs - Refreshing logs");
    backupData.dataTypes.forEach((element) => {
      const logsElement = document.getElementById(element);
      let inner = "";
      const data = this.getLogsArr(element);
      if (data.length === 0) return;

      for (let i = 0; i < data.length; i++) {
        inner += `<li id="${element}${i + 1}"><span id="text${element}${
          i + 1
        }">${data[i]}</span></li>`;
      }
      logsElement.innerHTML = "<ul>" + inner + "</ul>";
    });
  },
  addLog: function (type, data) {
    if (backupData.settingsData[1]) {
      return;
    }
    const element = document.getElementById(type);
    const id = this.getLogsArr(type).length + 1;

    element.innerHTML += `<li id="${type}${id}"><span id="text${type}${id}">${data}</span></li>`;
    controls.updateLimits(1, id, "Menu");
  },
  clearLogs: function () {
    const logsElement = document.getElementById("logs");
    const logsSelections = 3;
    let logsContent = "";
    for (let i = 0; i < logsSelections; i++) {
      logsContent += `<div id="${backupData.dataTypes[i]}" class="hidden"></div>`;
    }
    logsElement.innerHTML = logsContent;
  },
  getActive: function (flag = false) {
    let result = false;

    for (let i = 0; i < this.optionalsActive.length; i++) {
      if (this.isActive(this.optionalsIndexes[i])) {
        result = flag
          ? this.optionalsIndexes[i] === "logs"
            ? this.activeLogs
            : this.optionalsIndexes[i][0]
          : this.optionalsIndexes[i];
        break;
      }
    }

    return result;
  },

  isActive: function (flag) {
    const index = this.optionalsIndexes.indexOf(flag);
    return this.optionalsActive[index];
  },

  getLogsArr: function (type = undefined) {
    let arr = false;
    if (!type) {
      switch (controls.row) {
        case 1:
          arr = process.smsLogs;
          break;
        case 2:
          arr = process.mmsLogs;
          break;
        case 3:
          arr = process.contactsLogs;
          break;
      }
    } else {
      switch (type) {
        case backupData.dataTypes[0]:
          arr = process.smsLogs;
          break;
        case backupData.dataTypes[1]:
          arr = process.mmsLogs;
          break;
        case backupData.dataTypes[2]:
          arr = process.contactsLogs;
          break;
      }
    }
    return arr;
  },
};

const softkeys = {
  softkeysArr: ["", "", ""],

  get: function (col = controls.col, row = controls.row) {
    switch (col) {
      case 1:
      case 5:
        this.softkeysArr = [
          "",
          localeData["SOFTKEYS"]["KEY_SELECT"],
          localeData["SOFTKEYS"]["KEY_MENU"],
        ];
        break;
      case 2:
        switch (row) {
          case 3:
            if (draw.optionsMenuState) {
              this.softkeysArr = [localeData["SOFTKEYS"]["KEY_CLOSE"], "", ""];
            } else {
              this.softkeysArr = [
                localeData["SOFTKEYS"]["KEY_OPTIONS"],
                localeData["SOFTKEYS"]["KEY_SELECT"],
                localeData["SOFTKEYS"]["KEY_MENU"],
              ];
            }
            break;
          default:
            this.softkeysArr = [
              "",
              localeData["SOFTKEYS"]["KEY_SELECT"],
              localeData["SOFTKEYS"]["KEY_MENU"],
            ];
            break;
        }
        break;
      case 3:
        switch (row) {
          case 1:
            this.softkeysArr = [
              localeData["SOFTKEYS"]["KEY_CLEAR"],
              localeData["SOFTKEYS"]["KEY_SELECT"],
              localeData["SOFTKEYS"]["KEY_MENU"],
            ];
            break;
          default:
            this.softkeysArr = [
              "",
              localeData["SOFTKEYS"]["KEY_SELECT"],
              localeData["SOFTKEYS"]["KEY_MENU"],
            ];
            break;
        }
        break;
      case 4:
        if (draw.logsMenuState) {
          this.softkeysArr = [localeData["SOFTKEYS"]["KEY_CLOSE"], "", ""];
        } else if (process.progressProceeding) {
          this.softkeysArr = ["", localeData["SOFTKEYS"]["KEY_SELECT"], ""];
        } else {
          this.softkeysArr = [
            "",
            localeData["SOFTKEYS"]["KEY_SELECT"],
            localeData["SOFTKEYS"]["KEY_MENU"],
          ];
        }
        break;
    }

    if (draw.sideMenuState && !process.progressProceeding) {
      this.softkeysArr = ["", "", localeData["SOFTKEYS"]["KEY_CLOSE"]];
    }
    return this.softkeysArr;
  },
  draw: function () {
    this.get();
    let softkeys = "";
    const softkeyContainer = document.getElementById("softkey");

    softkeys += `<label id="left">${this.softkeysArr[0]}</label>`;
    softkeys += `<label id="center">${this.softkeysArr[1]}</label>`;
    softkeys += `<label id="right">${this.softkeysArr[2]}</label>`;
    softkeyContainer.innerHTML = softkeys;
  },
};

function writeToFile(array, type, format, optionalFormat) {
  let json;
  let sdcard = navigator.getDeviceStorage("sdcard");
  let xmlText = "";
  let xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  let promise;
  const amount = array.length;
  let blob;
  let fileName = folderPathCustomName || folderPath + getBackupFolderName();
  fileName += "/backup";
  drawProgress(
    type,
    0,
    1,
    `${type} - ${localeData["PROGRESS_PAGE"]["WRITING_TO_FILE"]} ${
      optionalFormat || ""
    } ${format}`
  );
  debug.print(
    `writeToFile() - Trying to upload ${amount} element(s) (type: ${type}) to filepath: ${fileName} (format: ${format})`
  );

  switch (format) {
    case backupData.formatTypes[0]: {
      let plainText = "";
      switch (type) {
        case backupData.dataTypes[0]:
          fileName = fileName + "_SMS";
          for (let i = 0; i < amount; i++) {
            const message = array[i];
            for (let key in message) {
              plainText += `${key}: ${message[key]}\n`;
            }
            plainText += "\n";
          }
          break;
        case backupData.dataTypes[1]:
          fileName = fileName + "_MMS";
          for (let i = 0; i < amount; i++) {
            const message = array[i];
            plainText += objectToString(message);
            plainText += "\n";
          }
          break;
        case backupData.dataTypes[2]:
          fileName = fileName + "_Contacts";
          for (let i = 0; i < amount; i++) {
            const contact = array[i];
            plainText += objectToString(contact.toJSON());
            plainText += "\n";
          }
          break;
        default:
          debug.print(
            `writeToFile() - Invalid type: ${type} for plain format, returning..`,
            "error"
          );
          return;
      }
      fileName = fileName + ".txt";

      let oMyBlob = new Blob([plainText], { type: "text/plain" });
      promise = sdcard.addNamed(oMyBlob, fileName);
      break;
    }
    case backupData.formatTypes[1]: {
      switch (type) {
        case backupData.dataTypes[0]:
          json = "";
          for (let index in array) {
            json += JSON.stringify(
              new SmsMessage(array[index]).toJSON(),
              null,
              2
            );
            json += ",";
          }
          json = "[" + json.slice(0, -1) + "]";
          fileName = fileName + "_SMS.json";
          break;
        case backupData.dataTypes[1]:
          json = "";
          for (let index in array) {
            json += JSON.stringify(
              new MmsMessage(array[index]).toJSON(),
              null,
              2
            );
            json += ",";
          }
          json = "[" + json.slice(0, -1) + "]";
          fileName = fileName + "_MMS.json";
          break;
        case backupData.dataTypes[2]:
          json = JSON.stringify(array, null, 2);
          fileName = fileName + "_Contacts.json";
          break;
        default:
          debug.print(
            `writeToFile() - Invalid type: ${type} for CSV format, returning..`,
            "error"
          );
          return;
      }

      let oMyJsonBlob = new Blob([json], {
        type: "application/json",
      });
      promise = sdcard.addNamed(oMyJsonBlob, fileName);
      break;
    }
    case backupData.formatTypes[2]: {
      let csvText = "";
      let obj;
      switch (type) {
        case backupData.dataTypes[0]:
          obj = array.map((item) => new SmsMessage(item).toJSON());
          csvText = objectToCsv(obj);
          fileName = fileName + "_SMS.csv";
          break;
        case backupData.dataTypes[1]:
          obj = array.map((item) => new MmsMessage(item).toJSON());
          csvText = objectToCsv(obj);
          fileName = fileName + "_MMS.csv";
          break;
        case backupData.dataTypes[2]:
          let contacts;
          switch (optionalFormat) {
            case backupData.csvExportTypes[0]:
              contacts = array.map((item) => new Contact(item).toJSON());
              fileName = fileName + "_Contacts.csv";
              break;
            case backupData.csvExportTypes[1]:
              contacts = array.map((contact) => {
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
              fileName = fileName + "_Google_Contacts.csv";
              break;
            case backupData.csvExportTypes[2]:
              contacts = array.map((contact) => {
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
              fileName = fileName + "_Outlook_Contacts.csv";
              break;
          }
          csvText = objectToCsv(contacts);
          break;
        default:
          debug.print(
            `writeToFile() - Invalid type: ${type} for CSV format, returning..`,
            "error"
          );
          return;
      }
      blob = new Blob([csvText], {
        type: "text/plain;charset=utf-8",
      });
      promise = sdcard.addNamed(blob, fileName);
      break;
    }
    case backupData.formatTypes[3]: {
      switch (type) {
        case backupData.dataTypes[0]:
          xmlText += `<smses>\n`;
          for (let index in array) {
            xmlText += `<sms>${js2xml(new SmsMessage(array[index]).toJSON(), {
              compact: true,
              spaces: 4,
              indentation: "    ",
              fullTagEmptyElement: true,
            })}</sms>`;
          }
          xmlText += `</smses>\n`;
          fileName = fileName + "_SMS.xml";
          break;

        case backupData.dataTypes[1]:
          xmlText += `<mmses>\n`;
          for (let index in array) {
            xmlText += `<mms>${js2xml(new MmsMessage(array[index]).toJSON(), {
              compact: true,
              spaces: 4,
              indentation: "    ",
              fullTagEmptyElement: true,
            })}</mms>`;
          }
          xmlText += `</mmses>\n`;
          fileName = fileName + "_MMS.xml";
          break;

        case backupData.dataTypes[2]:
          xmlText += `<contacts>\n`;
          for (let index in array) {
            xmlText += `<contact>${js2xml(array[index].toJSON(), {
              compact: true,
              spaces: 4,
              indentation: "    ",
              fullTagEmptyElement: true,
            })}</contact>`;
          }
          xmlText += `</contacts>\n`;
          fileName = fileName + "_Contacts.xml";
          break;

        default:
          debug.print(
            `writeToFile() - Invalid type: ${type} for CSV format, returning..`,
            "error"
          );
          return;
      }

      let xmlData = xmlHeader + "\n" + xmlText;

      let oMyXmlBlob = new Blob([xmlData], { type: "text/xml;charset=utf-8" });

      promise = sdcard.addNamed(oMyXmlBlob, fileName);

      break;
    }
    default:
      debug.print(
        `writeToFile() - Invalid format: ${format}, returning..`,
        "error"
      );
      break;
  }
  promise.onsuccess = function () {
    drawProgress(
      type,
      1,
      1,
      `${type} - ${localeData["PROGRESS_PAGE"]["DONE_WRITING_TO_FILE"]} ${
        optionalFormat || ""
      } ${format}!`
    );
    debug.print(
      `writeToFile() - Data was successfully written to the internal storage (${fileName})`
    );
    process.jobDone(type);
  };
  promise.onerror = function () {
    drawProgress(
      type,
      1,
      1,
      `${type} - ${localeData["ERRORS"]["ERROR_ON_FILE"]} ${
        optionalFormat || ""
      } ${format}`
    );
    debug.print(
      `writeToFile() - Error happened at type: ${type} while trying to write to ${fileName} (format: ${format}) - ${promise.error.name}`,
      "error"
    );
    toast(
      `Error happened while trying to write to ${fileName} - ${promise.error.name}`
    );
    process.jobDone(type);
  };
}

class SmsMessage {
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

class MmsMessage {
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

class Contact {
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

function objectToCsv(obj) {
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

    debug.print(`Converting ${plainObjects.length} items to CSV`);

    const result = Papa.unparse(plainObjects, {
      header: true,
      delimiter: ",",
      quotes: true,
    });

    debug.print(`CSV conversion completed, length: ${result.length}`);
    return result;
  } catch (err) {
    debug.print(`Error converting to CSV: ${err.message}`, "error");
    return "";
  }
}

function objectToString(obj) {
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
    folderPathCustomName = inputValue;
    inputElement.blur();
    debug.print(`focusInput() - id: i${id} - unfocused`);
  }
  if (folderPathCustomName && !folderPathCustomName.includes(folderPath)) {
    folderPathCustomName = folderPath + folderPathCustomName;
    menu.draw();
  }
  debug.print(`focusInput() - filename is set to: ${folderPathCustomName}`);
}

function check(id, obj, type) {
  const checkbox = document.getElementById(obj + id);
  const value = backupData.toggleValue(id - 1, type);
  checkbox.checked = value;
  debug.print(`check() - obj: ${obj}${id} - ${value}`);
  debug.print(
    `check() - Values for col: ${controls.col} (${type}) - ${backupData[type]}`
  );
}

function closeMenus() {
  if (draw.block) {
    debug.print(`closeMenus() - Trying to close ${draw.getActive()}`);
    draw.toggle(draw.getActive());
    return true;
  }
  return false;
}

function fetchSMSMessages() {
  debug.print("fetchSMSMessages() - Starting backup");
  drawProgress(
    backupData.dataTypes[0],
    1,
    3,
    `${localeData["PROGRESS_PAGE"]["STARTING_SMS_BACKUP"]} (1/3)`
  );
  let smsManager = window.navigator.mozSms || window.navigator.mozMobileMessage;
  if (!smsManager) {
    drawProgress(
      backupData.dataTypes[0],
      1,
      1,
      `Error - Couldn't get API access`
    );
    debug.print(
      "fetchSMSMessages() - Couldn't get API access, returning..",
      "error"
    );
    toast("Couldn't get SMS API access");
    return;
  }
  debug.print("fetchSMSMessages() - Got access to mozSms or mozMobileMessage");
  drawProgress(
    backupData.dataTypes[0],
    2,
    3,
    `${localeData["PROGRESS_PAGE"]["STARTING_SMS_BACKUP"]} (2/3)`
  );
  let request = smsManager.getMessages(null, false);
  if (!request) {
    drawProgress(
      backupData.dataTypes[0],
      1,
      1,
      `Error - Couldn't access getMessages()`
    );
    debug.print(
      "fetchSMSMessages() - Couldn't access getMessages(), returning..",
      "error"
    );
    toast("Couldn't access getMessages().");
    return;
  }
  debug.print(
    "fetchSMSMessages() - Got access to getMessages(), starting scan"
  );
  drawProgress(
    backupData.dataTypes[0],
    3,
    3,
    `${localeData["PROGRESS_PAGE"]["STARTING_SMS_BACKUP"]} (3/3)`
  );
  let smsMessages = [];
  let amount = 0;
  request.onsuccess = function () {
    let cursor = request;
    if (!cursor.result) {
      debug.print(
        `fetchSMSMessages() - Successfully scanned ${smsMessages.length} message(s), calling handleExport()`
      );
      drawProgress(
        backupData.dataTypes[0],
        1,
        1,
        `${localeData["PROGRESS_PAGE"]["FOUND"]} ${smsMessages.length}/${amount} ${localeData["PROGRESS_PAGE"]["ITEMS"]}`
      );
      process.handleExport(smsMessages, backupData.dataTypes[0]);
      return;
    }
    amount++;
    const message = cursor.result;
    if (message.type == "sms") {
      smsMessages.push(message);
      drawProgress(
        backupData.dataTypes[0],
        0,
        1,
        `${localeData["PROGRESS_PAGE"]["SCANNING_SMS"]} (${smsMessages.length}/${amount})`,
        true
      );
      cursor.continue();
    } else {
      debug.print("fetchSMSMessages() - Not an SMS message, skipping..");
      cursor.continue();
    }
  };
  request.onerror = function () {
    debug.print(
      `fetchSMSMessages() - Error accessing SMS messages: ${request.error.name}`
    );
    toast(
      `${localeData["ERRORS"]["ERROR_SCANNING_SMS"]} - ${request.error.name}`
    );
  };
}

function fetchMMSMessages() {
  debug.print("fetchMMSMessages() -  Starting backup");
  drawProgress(
    backupData.dataTypes[1],
    1,
    3,
    `${localeData["PROGRESS_PAGE"]["STARTING_MMS_BACKUP"]} (1/3)`
  );
  let mmsManager = window.navigator.mozMms || window.navigator.mozMobileMessage;

  if (!mmsManager) {
    drawProgress(
      backupData.dataTypes[1],
      1,
      1,
      `Error - Couldn't get API access`
    );
    debug.print(
      "fetchMMSMessages() - Could not get MMS API access, returning..",
      "error"
    );
    toast("Couldn't get MMS API access");
    return;
  }
  debug.print("fetchMMSMessages() - Got access to mozMms or mozMobileMessage");
  drawProgress(
    backupData.dataTypes[1],
    2,
    3,
    `${localeData["PROGRESS_PAGE"]["STARTING_MMS_BACKUP"]} (2/3)`
  );
  let request = mmsManager.getMessages(null, false);
  if (!request) {
    drawProgress(
      backupData.dataTypes[1],
      1,
      1,
      `Error - Couldn't access getMessages()`
    );
    debug.print("fetchMMSMessages() - Couldn't access getMessages().", "error");
    toast("Couldn't access getMessages().");
    return;
  }
  debug.print(
    "fetchMMSMessages() - Got access to getMessages(), starting scan"
  );
  drawProgress(
    backupData.dataTypes[1],
    3,
    3,
    `${localeData["PROGRESS_PAGE"]["STARTING_MMS_BACKUP"]} (3/3)`
  );
  let mmsMessages = [];
  let amount = 0;
  request.onsuccess = function () {
    let cursor = request;
    if (!cursor.result) {
      debug.print(
        `fetchMMSMessages() - Successfully scanned ${mmsMessages.length} messages, calling handleExport()`
      );
      drawProgress(
        backupData.dataTypes[1],
        1,
        1,
        `${localeData["PROGRESS_PAGE"]["FOUND"]} ${mmsMessages.length}/${amount} ${localeData["PROGRESS_PAGE"]["ITEMS"]}`
      );
      process.handleExport(mmsMessages, backupData.dataTypes[1]);
      saveMMSContent(mmsMessages);
      return;
    }
    amount++;
    drawProgress(
      backupData.dataTypes[1],
      0,
      1,
      `${localeData["PROGRESS_PAGE"]["SCANNING_MMS"]} (${mmsMessages.length}/${amount})`,
      true
    );
    const message = cursor.result;
    if (message.type == "mms") {
      mmsMessages.push(message);
      cursor.continue();
    } else {
      debug.print("fetchMMSMessages() - Not an MMS, skipping...");
      cursor.continue();
    }
  };

  request.onerror = function () {
    debug.print(
      `fetchMMSMessages() - Error accessing MMS messages: ${request.error.name}`
    );
    toast(
      `${localeData["ERRORS"]["ERROR_SCANNING_MMS"]} - ${request.error.name}`
    );
  };
}

function fetchContacts() {
  debug.print("fetchContacts() - Starting backup");
  drawProgress(
    backupData.dataTypes[2],
    1,
    3,
    `${localeData["PROGRESS_PAGE"]["STARTING_CONTACTS_BACKUP"]} (1/3)`
  );
  if ("mozContacts" in navigator) {
    let options = {
      filterBy: [],
    };
    drawProgress(
      backupData.dataTypes[2],
      2,
      3,
      `${localeData["PROGRESS_PAGE"]["STARTING_CONTACTS_BACKUP"]} (2/3)`
    );
    let request = navigator.mozContacts.find(options);
    if (!request) {
      drawProgress(
        backupData.dataTypes[2],
        1,
        1,
        `Error - Couldn't access mozContacts`
      );
      debug.print(
        "fetchContacts() - Couldn't access mozContacts, returning..",
        "error"
      );
      toast("Couldn't access mozContacts.");
      return;
    }
    debug.print("fetchContacts() - Got access to mozContacts, starting scan");
    drawProgress(
      backupData.dataTypes[2],
      3,
      3,
      `${localeData["PROGRESS_PAGE"]["STARTING_CONTACTS_BACKUP"]} (3/3)`
    );
    request.onsuccess = function () {
      let allContacts = request.result;
      if (allContacts.length > 0) {
        debug.print(`Found ${allContacts.length} contact(s)`);
        drawProgress(
          backupData.dataTypes[2],
          1,
          1,
          `${localeData["PROGRESS_PAGE"]["FOUND"]} ${allContacts.length}/${allContacts.length} ${localeData["PROGRESS_PAGE"]["ITEMS"]}`
        );
        process.handleExport(allContacts, backupData.dataTypes[2]);
      } else {
        debug.print(
          "fetchContacts() - No contacts found, returning..",
          "warning"
        );
        drawProgress(
          backupData.dataTypes[2],
          1,
          1,
          localeData["PROGRESS_PAGE"]["NO_CONTACTS_FOUND"]
        );
      }
    };

    request.onerror = function () {
      debug.print(
        `fetchContacts() - Error accessing contacts - ${request.error.name}, returning`,
        "error"
      );
      toast(
        `${localeData["ERRORS"]["ERROR_SCANNING_CONTACTS"]} - ${request.error.name}`
      );
      drawProgress(
        backupData.dataTypes[2],
        1,
        1,
        `Error - Can't access contacts`
      );
    };
  } else {
    debug.print(
      `fetchContacts() - Could not get API access for contacts, returning`,
      "error"
    );
    drawProgress(
      backupData.dataTypes[2],
      1,
      1,
      `Error - Can't access contacts`
    );
  }
}

function saveMMSContent(mmsMessages) {
  for (let mmsMessage of mmsMessages) {
    const attachments = mmsMessage.attachments;
    for (let attachment of attachments) {
      const itemFileName = `${folderPathCustomName}/MMS_Content/${attachment.location}`;
      const itemUrl = attachment.content;
      writeItemToFile(itemUrl, itemFileName);
    }
  }
}

function writeItemToFile(itemUrl, filename) {
  const sdcard = navigator.getDeviceStorage("sdcard");
  const blob = new Blob([itemUrl]);
  const request = sdcard.addNamed(blob, filename);
  request.onsuccess = function () {
    debug.print(`writeItemToFile() - MMS Item saved as ${filename}`);
  };
  request.onerror = function () {
    debug.print(
      `writeItemToFile() - Error while saving MMS item ${filename} - ${request.error.name}`,
      "error"
    );
  };
}

function drawProgress(item, pos, amount, msg, extra = false) {
  if (controls.col != 4) {
    controls.updateControls(4);
    menu.draw();
  }
  switch (item) {
    case backupData.dataTypes[0]: {
      let progressBarSMS = document.getElementById("p1");
      let textMsgSMS = document.getElementById("p1-1");
      progressBarSMS.value = pos;
      progressBarSMS.max = amount;
      textMsgSMS.innerHTML = `<text style="padding-left: 10px;">${msg}</text>`;
      if (backupData.settingsData[1] && extra) {
        draw.addLog(item, msg);
        process.smsLogs.push(msg);
      } else if (!extra) {
        draw.addLog(item, msg);
        process.smsLogs.push(msg);
      }
      break;
    }
    case backupData.dataTypes[1]: {
      let progressBarMMS = document.getElementById("p2");
      let textMsgMMS = document.getElementById("p2-1");
      progressBarMMS.value = pos;
      progressBarMMS.max = amount;
      textMsgMMS.innerHTML = `<text style="padding-left: 10px;">${msg}</text>`;
      if (backupData.settingsData[1] && extra) {
        draw.addLog(item, msg);
        process.mmsLogs.push(msg);
      } else if (!extra) {
        draw.addLog(item, msg);
        process.mmsLogs.push(msg);
      }
      break;
    }
    case backupData.dataTypes[2]: {
      let progressBarContact = document.getElementById("p3");
      let textMsgContact = document.getElementById("p3-1");
      progressBarContact.value = pos;
      progressBarContact.max = amount;
      textMsgContact.innerHTML = `<text style="padding-left: 10px;">${msg}</text>`;
      if (backupData.settingsData[1] && extra) {
        draw.addLog(item, msg);
        process.contactsLogs.push(msg);
      } else if (!extra) {
        draw.addLog(item, msg);
        process.contactsLogs.push(msg);
      }
      break;
    }
  }
}

function getMenuData(col) {
  const colAmount = 5;
  let menu = "";
  switch (col) {
    case 1:
      menu = `<ul>
      <li id="1"><div class="entry-text">${
        localeData["DATA_SELECTION_PAGE"]["SAVE_SMS"]
      }</div><div class="checkbox-wrapper-15">
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
  <li id="2"><div class="entry-text">${
    localeData["DATA_SELECTION_PAGE"]["SAVE_MMS"]
  }</div><div class="checkbox-wrapper-15">
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
  <li id="3"><div class="entry-text">${
    localeData["DATA_SELECTION_PAGE"]["SAVE_CONTACTS"]
  }</div><div class="checkbox-wrapper-15">
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
      controls.updateLimits(colAmount, 3);
      break;

    case 2:
      menu = `
  <ul>
    <li id="1"><div class="entry-text">${
      localeData["EXPORT_PAGE"]["EXPORT_TO_TEXT_FILE"]
    }</div><div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b1" type="checkbox" style="display: none;" ${
        backupData.exportFormats[0] ? "checked" : ""
      }>
      <label class="cbx" for="b1"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
    </div></li>
    <li id="2"><div class="entry-text">${
      localeData["EXPORT_PAGE"]["EXPORT_TO_JSON_FILE"]
    }</div><div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b2" type="checkbox" style="display: none;" ${
        backupData.exportFormats[1] ? "checked" : ""
      }>
      <label class="cbx" for="b2"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
    </div></li>
    <li id="3"><div class="entry-text">${
      localeData["EXPORT_PAGE"]["EXPORT_TO_CSV_FILE"]
    }</div><div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b3" type="checkbox" style="display: none;" ${
        backupData.exportFormats[2] ? "checked" : ""
      }>
      <label class="cbx" for="b3"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
    </div></li>
    <li id="4"><div class="entry-text">${
      localeData["EXPORT_PAGE"]["EXPORT_TO_XML_FILE"]
    }</div><div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b4" type="checkbox" style="display: none;" ${
        backupData.exportFormats[3] ? "checked" : ""
      }>
      <label class="cbx" for="b4"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
    </div></li>
  </ul>
`;
      controls.updateLimits(colAmount, 4);
      break;
    case 3: {
      menu = `<ul>
            <li id="1"><div class="entry-text">${
              localeData["SETTINGS_PAGE"]["FOLDER_NAME"]
            }</div> <input type="text" id="i1" value="${
        folderPathCustomName || getBackupFolderName()
      }" nav-selectable="true" autofocus /></li>
      <li id="2"><div class="entry-text">${
        localeData["SETTINGS_PAGE"]["ADDITIONAL_LOGS"]
      }</div><div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b2" type="checkbox" style="display: none;" ${
        backupData.settingsData[1] ? "checked" : ""
      }>
      <label class="cbx" for="b2"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
    </div></li>
      <li id="3"><div class="entry-text">${
        localeData["SETTINGS_PAGE"]["CONVERT_TO_SMS_BACKUP_RESTORE"]
      }</div><div class="checkbox-wrapper-15">
      <input class="inp-cbx" id="b3" type="checkbox" style="display: none;" ${
        backupData.settingsData[2] ? "checked" : ""
      }>
      <label class="cbx" for="b3"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
    </div> </li>
        </ul>`;
      controls.updateLimits(colAmount, 3);
      break;
    }
    case 4: {
      let menuEntries = [];
      process.smsLogs.length != 0
        ? menuEntries.push(localeData["PROGRESS_PAGE"]["SMS_STARTED"])
        : menuEntries.push(localeData["PROGRESS_PAGE"]["SMS_NOT_STARTED"]);
      process.mmsLogs.length != 0
        ? menuEntries.push(localeData["PROGRESS_PAGE"]["MMS_STARTED"])
        : menuEntries.push(localeData["PROGRESS_PAGE"]["MMS_NOT_STARTED"]);
      process.contactsLogs.length != 0
        ? menuEntries.push(localeData["PROGRESS_PAGE"]["CONTACTS_STARTED"])
        : menuEntries.push(localeData["PROGRESS_PAGE"]["CONTACTS_NOT_STARTED"]);
      menu = `<ul>
          <li id="1"><div style="width: 100%;">
            <div class="progressbar"><span id="p1-1"><div class="entry-text" style="width:100%"><text>${menuEntries[0]}</text></div></span>
            <progress id="p1"></progress></div>
          </div></li>
          <li id="2"><div style="width: 100%;">
            <div class="progressbar"><span id="p2-1"><div class="entry-text" style="width:100%"><text>${menuEntries[1]}</text></div></span>
            <progress id="p2"></progress></div>
          </div></li>
          <li id="3"><div style="width: 100%;">
            <div class="progressbar"><span id="p3-1"><div class="entry-text" style="width:100%"><text>${menuEntries[2]}</text></div></span>
            <progress id="p3"></progress></div>
          </div></li>
        </ul>`;
      controls.updateLimits(colAmount, 3);
      break;
    }
    case 5:
      menu = `<ul>
      <li id = "1" class= "invert" style="height:80px; position:unset">
      <div class="entry-text">
      <p style="font-size:20px; position:absolute; top:70px">
      KaiOS Backup</p>
      <p style="top:100px;position:absolute;">${localeData["ABOUT_PAGE"]["MADE_BY"]} D3SXX</p>
      <img src="../assets/icons/KaiOS-Backup_56.png" style="position:absolute; right:10px; top:85px">
      </li>
      <li id = "2"><div class="entry-text" style="width:100%">${localeData["ABOUT_PAGE"]["BUILD"]}: ${buildInfo[0]}
      </div></li>
      <li id = "3"><div class="entry-text" style="width:100%; font-size:16px">${localeData["ABOUT_PAGE"]["RELEASE_DATE"]}: ${buildInfo[1]}
      </div></li>
      </ul>`;
      controls.updateLimits(colAmount, 3);
      break;
  }

  return menu;
}

function scrollHide(obj = "") {
  switch (controls.col) {
    case 4:
      if (obj != "m") {
        if (obj == "") {
          return;
        }
        const limit = 8; // Max amount of elements that can be shown on screen
        const entriesAmount = draw.getLogsArr().length;

        if (entriesAmount < limit) {
          return;
        }

        const scrolls = Math.ceil(entriesAmount / limit);
        const currentScrollPos = Math.ceil(controls.rowMenu / limit);
        let stopLimit = currentScrollPos * limit + 1;
        if (stopLimit > entriesAmount) {
          stopLimit = entriesAmount; // Prevent overflow
        }
        let startLimit = stopLimit - limit;

        debug.print(`scrollHide() - Object: ${obj}`);

        showElements(obj, startLimit, stopLimit);

        if (scrolls == currentScrollPos) {
          startLimit += 1; // Prevent overflow in the last scroll
        }

        hideElements(obj, 1, startLimit - 1, stopLimit, entriesAmount);
      }
      break;
  }

  function hideElement(id) {
    document.getElementById(id).style.display = "none";
  }
  function showElement(id) {
    document.getElementById(id).style.display = "flex";
  }
  function hideElements(obj, startUp, endUp, startDown, endDown) {
    debug.print(
      `scrollHide() - hideElements() - from ${startUp} upto ${endUp} and from ${startUp} upto ${startDown}`
    );
    if (startUp != 0) {
      for (let i = startUp; i <= endUp; i++) {
        hideElement(obj + i);
      }
    }
    if (startDown != endDown) {
      for (let i = startDown; i <= endDown; i++) {
        hideElement(obj + i);
      }
    }
  }

  function showElements(obj, start, end) {
    debug.print(`scrollHide() - showElements() - from ${start} upto ${end}`);
    for (let i = start; i <= end; i++) {
      showElement(obj + i);
    }
  }
}

function menuHover(row = undefined, pastRow = undefined, obj = undefined) {
  debug.print(
    `menuHover() - Row ${obj}${row} - Hover, Row ${obj}${pastRow}: Unhover`
  );

  // Remove animation from previously hovered element
  if (pastRow) {
    const pastElement = document.getElementById(obj + pastRow);
    if (pastElement) {
      pastElement.classList.remove("hovered");
      // Find and reset any animated text
      const textElement = pastElement.querySelector('span[id^="text"]');
      if (textElement) {
        textElement.style.animation = "";
        textElement.style.transform = "";
      }
    }
  }

  // Add hover and check for marquee on current element
  if (row) {
    const currentElement = document.getElementById(obj + row);
    if (currentElement) {
      currentElement.classList.add("hovered");
    }
  }
}

function aboutTab(row) {
  switch (row) {
    case 1:
      open("https://github.com/D3SXX/kaios-backup");
      break;
    case 2:
      open("https://github.com/D3SXX/kaios-backup/releases/");
      break;
    case 3:
      open("../changelog.txt");
      break;
  }
}

function toast(msg = null) {
  let toastElement = document.getElementById("toast");
  if (msg != null) {
    toastElement.classList.remove("notactive");
    toastElement.classList.add("active");
    let duration = 2000;
    if (msg.length > 26) {
      duration = msg.length * 100;
      msg = `<span style="animation:marqueeToastAnimation ${
        duration / 1000 + 1
      }s linear infinite; position:absolute; top:8px; width:500px">${msg}</span>`;
    }
    toastElement.innerHTML = `<span>${msg}</span>`;
    debug.print("toast() - Toast activated");
    setTimeout(function () {
      toastElement.classList.remove("active");
      toastElement.classList.add("notactive");
      debug.print("toast() - Toast deactivated");
    }, duration);
  }
}

function createSmsesElement(smsArray = [], mmsArray = []) {
  if (smsArray.length === 0 && mmsArray.length === 0) {
    return;
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString("<smses></smses>", "text/xml");
  const smses = xmlDoc.documentElement;

  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );

  smses.setAttribute("count", smsArray.length.toString());
  smses.setAttribute("backup_set", uuid);
  smses.setAttribute("backup_date", Date.now().toString());
  smses.setAttribute("type", "full");

  for (let i = 0; i < smsArray.length; i++) {
    const sms = createSmsElement(xmlDoc, smsArray[i]);
    smses.appendChild(sms);
  }
  for (let i = 0; i < mmsArray.length; i++) {
    const mms = createMmsElement(xmlDoc, mmsArray[i]);
    smses.appendChild(mms);
  }

  return smses;
}

function createSmsElement(doc, entry) {
  const sms = doc.createElement("sms");

  sms.setAttribute("protocol", "0");
  sms.setAttribute("address", entry.sender);
  sms.setAttribute("date", entry.timestamp.toString());
  sms.setAttribute("type", entry.delivery === "received" ? "1" : "2");
  sms.setAttribute("subject", "null");
  sms.setAttribute("body", entry.body);
  sms.setAttribute("toa", "null");
  sms.setAttribute("sc_toa", "null");
  sms.setAttribute("service_center", "null");
  sms.setAttribute("read", Number(entry.read).toString());
  sms.setAttribute("status", entry.deliveryTimestamp !== "" ? "1" : "0");
  sms.setAttribute("locked", "0");
  sms.setAttribute("date_sent", entry.sentTimestamp.toString());
  sms.setAttribute("sub_id", "1");

  let readableDate = "";
  try {
    const date = new Date(parseInt(entry.timestamp));
    readableDate = date.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  } catch {
    const date = new Date(parseInt(entry.timestamp));
    readableDate = date.toLocaleString();
  }

  sms.setAttribute("readable_date", readableDate);
  sms.setAttribute("contact_name", "(Unknown)");

  return sms;
}

function createMmsElement(doc, entry) {
  const mms = doc.createElement("mms");

  mms.setAttribute("date", entry.timestamp.toString());
  mms.setAttribute("rr", entry.readReportRequested ? "129" : "128");
  mms.setAttribute("sub", entry.subject || "null");
  mms.setAttribute("ct_t", "application/vnd.wap.multipart.related");
  mms.setAttribute("read_status", "null");
  mms.setAttribute("seen", entry.read ? "1" : "0");
  mms.setAttribute("msg_box", entry.delivery === "sent" ? "2" : "1");
  mms.setAttribute("address", entry.receivers[0]);
  mms.setAttribute("sub_cs", "null");
  mms.setAttribute("resp_st", "128");
  mms.setAttribute("retr_st", "null");
  mms.setAttribute("d_tm", "null");
  mms.setAttribute("text_only", "0");
  mms.setAttribute(
    "exp",
    entry.expiryDate !== 0 ? entry.expiryDate.toString() : "604800"
  );
  mms.setAttribute("locked", "0");
  mms.setAttribute("m_id", entry.iccId);
  mms.setAttribute("st", "null");
  mms.setAttribute("retr_txt_cs", "null");
  mms.setAttribute("retr_txt", "null");
  mms.setAttribute(
    "creator",
    entry.creator || "com.google.android.apps.messaging"
  );
  mms.setAttribute("date_sent", entry.sentTimestamp.toString());
  mms.setAttribute("read", entry.read ? "1" : "0");

  mms.setAttribute("m_size", entry.attachments[0].content.size.toString());

  mms.setAttribute("rpt_a", "null");
  mms.setAttribute("ct_cls", "null");
  mms.setAttribute("pri", "129");
  mms.setAttribute("sub_id", "1");
  mms.setAttribute("tr_id", btoa(entry.iccId));
  mms.setAttribute("resp_txt", "null");
  mms.setAttribute("ct_l", "null");
  mms.setAttribute("m_cls", "personal");
  mms.setAttribute("d_rpt", "129");
  mms.setAttribute("v", "18");
  mms.setAttribute("_id", entry.id.toString());
  mms.setAttribute("m_type", "128");

  let readableDate = "";
  try {
    const date = new Date(parseInt(entry.timestamp));
    readableDate = date.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  } catch {
    const date = new Date(parseInt(entry.timestamp));
    readableDate = date.toLocaleString();
  }

  mms.setAttribute("readable_date", readableDate);
  mms.setAttribute("contact_name", entry.receivers[0]);

  const parts = doc.createElement("parts");

  const smilPart = doc.createElement("part");
  smilPart.setAttribute("seq", "-1");
  smilPart.setAttribute("ct", "application/smil");
  smilPart.setAttribute("name", "null");
  smilPart.setAttribute("chset", "null");
  smilPart.setAttribute("cd", "null");
  smilPart.setAttribute("fn", "null");
  smilPart.setAttribute("cid", "&lt;smil&gt;");
  smilPart.setAttribute("cl", "smil.xml");
  smilPart.setAttribute("ctt_s", "null");
  smilPart.setAttribute("ctt_t", "null");
  smilPart.setAttribute("text", entry.smil || "");
  parts.appendChild(smilPart);

  entry.attachments.forEach((attachment, i) => {
    const part = doc.createElement("part");
    part.setAttribute("seq", i.toString());
    part.setAttribute("ct", attachment.content.type);
    part.setAttribute("name", "null");
    part.setAttribute("chset", "null");
    part.setAttribute("cd", "null");
    part.setAttribute("fn", "null");
    part.setAttribute("cid", `&lt;${attachment.id}&gt;`);
    part.setAttribute("cl", attachment.location);
    part.setAttribute("ctt_s", "null");
    part.setAttribute("ctt_t", "null");
    part.setAttribute("text", "null");
    part.setAttribute("data", imageToBase64(attachment.content)); // needs fix

    parts.appendChild(part);
  });

  mms.appendChild(parts);
  return mms;
}

function getBackupFolderName() {
  const date = new Date();
  return date.toISOString();
}

document.activeElement.addEventListener("keydown", controls.handleKeydown);
