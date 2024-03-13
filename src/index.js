"use strict";

let currentDate;
refreshDate();
let folderPath = "KaiOS_Backup/";
let filename = folderPath + "backup_" + currentDate + "/backup_" + currentDate;
let enableClear = false;
let localeData;
const buildInfo = ["1.0.4h Beta","13.03.2024"];

fetch("src/locale.json")
  .then((response) => {
    return response.json();
  })
  .then((data) => initProgram(data));

function initProgram(data){
  debug.toggle();
  const userLocale = navigator.language;
  localeData = data[userLocale];
  if(!localeData){
    localeData = data["en-US"];
  }
  draw.init();
  console.log(`KaiOS Backup ver. ${buildInfo[0]} initialized`)
  menu.draw(1)
}

// A structure to hold values
const backupData = {
  dataTypes: ["sms", "mms", "contact"], // Data that can be exported
  exportData: [false, false, false], // Values for dataTypes
  formatTypes: [".txt","json","csv","xml"],
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
  show: function(key) {
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
    softkeys.draw();
    draw.clearLogs();
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
    toast(localeData[0]["backupComplete"]);
    this.progressProceeding = false;
    this.blockControls = false;
    if(draw.captureExtraLogs){
      draw.refreshLogs();
    }
  },
  isReady: function(){
    if (backupData.exportData.every((element) => element === false)) {
      debug.print("process.isReady() - Nothing was selected to backup","error");
      toast(localeData[0]["errorNothingSelected"]);
      return false;
    } 
    else if (backupData.exportFormats.every((element) => element === false)) {
      debug.print("process.isReady() - No formats were selected to export","error");
      toast(localeData[0]["errorNoFormats"]);
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
  handleExport: function(data, type){
    debug.print(`process.handleExport() - Starting write operation for type: ${type}`);
    for(let i = 0; i<backupData.exportFormats.length; i++)
      if(backupData.exportFormats[i]){
        if(type === backupData.dataTypes[2] && backupData.formatTypes[i] === "csv"){
          for(let k = 0; k<backupData.csvExportValues.length; k++){
            if(backupData.csvExportValues[k])
            writeToFile(data,type,backupData.formatTypes[i], backupData.csvExportTypes[k]);
          }
        }
        else{
          writeToFile(data,type,backupData.formatTypes[i],undefined);
        }
        debug.print(`handleExport() - Calling writeToFile() to write type: ${type} to format: ${backupData.formatTypes[i]}`);
      }
        
      
    }
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
  scrollLimit: 0,  
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
  },
  handleSoftLeft: function(){
    switch(controls.col){
      case 2:
        switch(controls.row){
          case 1:
            refreshDate();
            filename = folderPath + "backup_" + currentDate + "/backup_" + currentDate; 
            document.getElementById(1).innerHTML = `<li id="1">${localeData[2]["1"]} <input type="text" id="i1" value="${filename}" nav-selectable="true" autofocus /></li>`;
            break;
          case 4:
            draw.toggleOptionsMenu();
            break;
        }
        break;
      case 3:
        draw.toggleLogsMenu();
        break;
    }
  },
  handleSoftRight: function(){
    switch(controls.col){
      case 1:
      case 2:
      case 4:
        draw.toggleSideMenu();
        break;
      case 3:
        if(!process.blockControls){
          draw.toggleSideMenu();
        }
        break;
    }
  },
  handleEnter: function(){
    if(draw.sideMenuState){
      switch(controls.rowMenu){
        case 1:
          process.start(backupData.exportData);
          draw.toggleSideMenu();
          return;
        case 2:
          draw.toggleExtraLogs();
          draw.toggleSideMenu();
          return;
        case 3:
          menu.draw(4);
          draw.toggleSideMenu();
          return;
      }
    }
    if(draw.optionsMenuState){
      backupData.csvExportValues[controls.rowMenu-1] = !backupData.csvExportValues[controls.rowMenu-1];
      const buttonElement = document.getElementById('ob' + controls.rowMenu);
      buttonElement.checked = backupData.csvExportValues[controls.rowMenu-1];
      debug.print(`controls.handleEnter() - Button ob${controls.rowMenu} value is set to ${backupData.csvExportValues[controls.rowMenu-1]}`);
    }
    if(draw.logsMenuState){
      return;
    }
    switch(controls.col){
      case 1:
        check(controls.row, 'b', "exportData");
        break;
      case 2:
        switch(controls.row){
          case 1:
            focusInput(controls.row);
            break;
          default:
            check(controls.row-1, 'b', "exportFormats");
            break;
        }
        break;
        case 3:
          if(draw.getLogsArr().length === 0){

            return;
          }
          draw.toggleLogsMenu();
          break;
        case 4:
          aboutTab(controls.row);
          break;
    }
  },
  
  handleKeydown: function(e) {
    debug.print(`${e.key} triggered`);
    let rowType = "row";
    let hoverArg = "";
    if(draw.sideMenuState || draw.optionsMenuState || draw.logsMenuState){
      rowType = rowType + "Menu";
      hoverArg = "m";
      let ignoreKey = "SoftLeft";
      if(draw.optionsMenuState){
        hoverArg = "o";
        ignoreKey = "SoftRight"
      }
      else if(draw.logsMenuState){
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
        debug.toggle()
        break;
      case "Backspace":
        if(closeMenus()){
          e.preventDefault();
        }
        break;
    }
    softkeys.draw();
    scrollHide(hoverArg);
    debug.show(e.key);
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

const draw = {
  block: false,
  sideMenuState: false,
  optionsMenuState: false,
  optionalsIndexes:["menu","options","logs"],
  optionalsActive: [false,false,false],
  initialized:false,
  logsData:[],
  activeLogs:"",
  toggleSideMenu: function(){
    this.sideMenuState = !this.sideMenuState;
    if (this.sideMenuState) {
      controls.rowMenu = 1;
      controls.updateLimits(0,3,"menu");
      document.getElementById("menu").classList.remove("hidden");
    } else {
      document.getElementById("menu").classList.add("hidden");
      menuHover(1, controls.rowMenu, "m")
    }
  },
  toggleOptionsMenu: function(){
    this.optionsMenuState = !this.optionsMenuState;
    if (this.optionsMenuState) {
      controls.rowMenu = 1;
      controls.updateLimits(0,3,"menu");
      document.getElementById("options").classList.remove("hidden");
    } else {
      document.getElementById("options").classList.add("hidden");
      menuHover(1, controls.rowMenu, "o")
    }
  },
  toggleLogsMenu: function(){
    const logsTypes = ["sms","mms","contact"];
    this.logsMenuState = !this.logsMenuState;
    
    if (this.logsMenuState) {
      controls.rowMenu = 1;
      this.activeLogs = logsTypes[controls.row-1];
      menuHover(1, undefined, this.activeLogs);
      controls.updateLimits(1,this.getLogsArr().length,"Menu");
      document.getElementById(this.activeLogs).classList.remove("hidden");
      document.getElementById("logs").classList.remove("hidden");
    } else {
      menuHover(1, controls.rowMenu, this.activeLogs);
      document.getElementById("logs").classList.add("hidden");
      document.getElementById(this.activeLogs).classList.add("hidden")
      this.activeLogs = undefined;
    }
  },
  init: function(){
    if(this.initialized){
      debug.print(`draw.init() - Already initialized, returning..`);
      return;
    }
        const menuElement = document.getElementById('menu');
        const optionsElement = document.getElementById('options');
        const logsElement = document.getElementById('logs');
        
        const menuEntries = 3;
        const optionsEntries = 3;
        const logsSelections = 3;
        let menuContent = ""; 
        for(let i = 1; i<menuEntries+1; i++){
          let element = `menu_${i}`
          menuContent += `<div class="menuItem" id='m${i}'>${localeData[0][element]}</div>`
        }
        controls.rowMenuLimit = menuEntries;
        controls.rowMenu = 1;
        menuElement.innerHTML = menuContent;
        menuHover(1, undefined, "m");

        let optionsContent = ""; 
        for(let i = 1; i<optionsEntries+1;i++){
          optionsContent += `  <div class="optionsItem" id='o${i}'>${localeData[0]["optionalMenu_" + i] || "Export as a Normal CSV"}<div class="checkbox-wrapper-15">
          <input class="inp-cbx" id="ob${i}" type="checkbox" style="display: none;" ${backupData.csvExportValues[i-1] ? 'checked' : ''}>
          <label class="cbx" for="b2"><span><svg width="12px" height="9px" viewbox="0 0 12 9"><polyline points="1 5 4 8 11 1"></polyline></svg></span></label>
          </div></div>`;
        }
        optionsElement.innerHTML = optionsContent
        menuHover(1, undefined, "o");
        let logsContent = "";
        for(let i = 0; i<logsSelections; i++){
          logsContent += `<div id="${backupData.dataTypes[i]}" class="hidden"></div>`
        }
        logsElement.innerHTML = logsContent;
        this.initialized = true;
    
    debug.print(`draw.init() - Initialized`);
  },
  toggleExtraLogs: function(){
    this.captureExtraLogs = !this.captureExtraLogs;
    if(this.captureExtraLogs){
      toast(localeData[0]["additionalLogsEn"]);
    }
    else{
      toast(localeData[0]["additionalLogsDis"]);
    }
    
  },
  refreshLogs: function(){
    debug.print("draw.refreshLogs - Refreshing logs")
    backupData.dataTypes.forEach(element => {
      const logsElement = document.getElementById(element);
      let inner = "";
      const data = this.getLogsArr(element);
      if(data.length === 0) return;
      for(let i = 0; i < data.length; i++){
        console.log(i, data[i])
        if(data[i].length < 26){
          inner += `<li id="${element}${i+1}"><span id="text${element}${i+1}">${data[i]}</span></li>`;
        }
        else{
          inner += `<li id="${element}${i+1}"><span style="animation:marqueeAnimation 8s linear infinite; max-height:25px; position:absolute; width:500px" id="text${element}${i+1}">${data[i]}</span></li>`;
        }
      }
      logsElement.innerHTML = "<ul>" + inner + "</ul>";
      
    });
  },
  addLog: function (type,data){
    if(this.captureExtraLogs){
      return;
    }
    const element = document.getElementById(type);
    const id = this.getLogsArr(type).length+1;
        if(data.length < 26){
          element.innerHTML += `<li id="${type}${id}"><span id="text${type}${id}">${data}</span></li>`;
        }
        else{
          element.innerHTML += `<li id="${type}${id}"><span style="animation:marqueeAnimation 8s linear infinite; max-height:25px; position:absolute; width:500px" id="text${type}${id}">${data}</span></li>`;
        }
        controls.updateLimits(1,id,"Menu");
  },
  clearLogs: function(){
    const logsElement = document.getElementById('logs');
    const logsSelections = 3;
    let logsContent = "";
    for(let i = 0; i<logsSelections; i++){
      logsContent += `<div id="${backupData.dataTypes[i]}" class="hidden"></div>`
    }
    logsElement.innerHTML = logsContent;
  },
  getActive: function(flag = false) {
    let result = false;
  
    for (let i = 0; i < this.optionalsActive.length; i++) {
      if (this.isActive(this.optionalsIndexes[i])) {
        result = flag ? (this.optionalsIndexes[i] === 'logs' ? this.activeLogs : this.optionalsIndexes[i][0]) : this.optionalsIndexes[i];
        break;
      }
    }
  
    return result;
  },

  isActive: function(flag){
    const index = this.optionalsIndexes.indexOf(flag); 
    return this.optionalsActive[index];
  },

  getLogsArr: function(type = undefined){
    let arr = false;
    if(!type){
    switch (controls.row){
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
  }
  else{
    switch (type){
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
}
}

const softkeys = {
  softkeysArr: ["","",""],

  get: function(col = controls.col, row = controls.row){
    switch(col){
      case 1:
      case 4:
        this.softkeysArr = ["",localeData[0]["softCenter"],localeData[0]["softRight"]];
        break;
      case 2:
        switch (row){
          case 1:
            this.softkeysArr = [localeData[0]["softLeftClear"],localeData[0]["softCenter"],localeData[0]["softRight"]];
            break;
          case 4:
            if(draw.optionsMenuState){
              this.softkeysArr = [localeData[0]["close"],"",""];
            }
            else{
              this.softkeysArr = [localeData[0]["softLeftOptions"],localeData[0]["softCenter"],localeData[0]["softRight"]];
            }
            break;
          default: 
            this.softkeysArr = ["",localeData[0]["softCenter"],localeData[0]["softRight"]];
            break;
          }
        break;
      case 3:
          if(draw.logsMenuState){
            this.softkeysArr = [localeData[0]["close"],"",""];
          }
          else if(process.progressProceeding){
            this.softkeysArr = ["",localeData[0]["softCenter"],""];
          }
          else{
            this.softkeysArr = ["",localeData[0]["softCenter"],localeData[0]["softRight"]];
          }
          break;
      }
      if(draw.sideMenuState && !process.progressProceeding){
        this.softkeysArr = ["","",localeData[0]["close"]];
      }
      return this.softkeysArr;
  },
  draw: function(){
    this.get();
    let softkeys = "";
    const softkeyContainer = document.getElementById("softkey");

    softkeys += `<label id="left">${this.softkeysArr[0]}</label>`;
    softkeys += `<label id="center">${this.softkeysArr[1]}</label>`;
    softkeys += `<label id="right">${this.softkeysArr[2]}</label>`;
    softkeyContainer.innerHTML = softkeys;
  }
}

function writeToFile(array, type, format, optionalFormat) {
  let plainText = "";
  let json;
  let sdcard = navigator.getDeviceStorage("sdcard");
  let xmlText = "";
  let xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  let promise;
  const amount = array.length;
  let blob;
  let fileName = filename;
  drawProgress(type, 0,1,`${type} - ${localeData[3]['writing']} ${optionalFormat || ""} ${format}`)
  debug.print(`writeToFile() - Trying to upload ${amount} element(s) (type: ${type}) to filepath: ${filename} (format: ${format})`);
  switch (format) {
    case backupData.formatTypes[0]: {
      switch (type) {
        case backupData.dataTypes[0]:
          fileName = fileName + "_SMS";
          for (let i = 0; i < amount; i++) {
            const message = new SMSMessage(array[i]);
            plainText += `type: ${message.type}\nid: ${message.id}\nthreadId: ${message.threadId}\niccId: ${message.iccId}\ndeliveryStatus: ${message.deliveryStatus}\nsender: ${message.sender}\nreceiver: ${message.receiver}\nbody: ${message.body}\nmessageClass: ${message.messageClass}\ndeliveryTimestamp: ${message.deliveryTimestamp}\nread: ${message.read}\nsentTimestamp: ${message.sentTimestamp}\ntimestamp: ${message.timestamp}\n\n`;

          }
          break;
        case backupData.dataTypes[1]:
          filename = fileName + "_MMS";
          for (let i = 0; i < amount; i++) {
            const message = new MMSMessage(array[i]);
            plainText += `type: ${message.type}\nid: ${message.id}\nthreadId: ${message.threadId}\niccId: ${message.iccId}\ndelivery: ${message.delivery}\nexpiryDate: ${message.expiryDate}\nattachments: ${message.attachments[0].location}\nread: ${message.read}\nreadReportRequested: ${message.readReportRequested}\nreceivers: ${message.receivers.join(", ")}\nsentTimestamp: ${message.sentTimestamp}\nsmil: ${message.smil}\nsubject: ${message.subject}\ntimestamp: ${message.timestamp}\n\n`;
          }
          break;
        case backupData.dataTypes[2]:
          fileName = fileName + "_Contacts";
          for (let i = 0; i < amount; i++) {
            const contact = new Contact(array[i]);
            if (contact.photo) {
              contact.photo = contact.photo[0].name;
            }
            const email = contact.email ? contact.email.map(e => e.value).join(" ") : "";
            const adr = contact.adr ? contact.adr.map(a => `${a.countryName},${a.locality},${a.postalCode},${a.region},${a.streetAddress}`).join(" ") : "";
            const tel = contact.tel ? contact.tel.map(t => t.value).join(" ") : "";
            
            plainText += `additionalName: ${contact.additionalName}\nadr: ${adr}\nanniversary: ${contact.anniversary}\nbday: ${contact.bday}\ncategory: ${contact.category.join(", ")}\nemail: ${email}\nfamilyName: ${contact.familyName.join(", ")}\ngenderIdentity: ${contact.genderIdentity}\ngivenName: ${contact.givenName.join(", ")}\ngroup: ${contact.group}\nhonorificPrefix: ${contact.honorificPrefix}\nhonorificSuffix: ${contact.honorificSuffix}\nid: ${contact.id}\nimpp: ${contact.impp}\njobTitle: ${contact.jobTitle}\nkey: ${contact.key}\nname: ${contact.name.join(", ")}\nnickname: ${contact.nickname}\nnote: ${contact.note}\norg: ${contact.org}\nphoneticFamilyName: ${contact.phoneticFamilyName}\nphoneticGivenName: ${contact.phoneticGivenName}\nphoto: ${contact.photo}\npublished: ${contact.published}\nringtone: ${contact.ringtone}\nsex: ${contact.sex}\ntel: ${tel}\nupdated: ${contact.updated}\nurl: ${contact.url}\n\n`
          }
          break;
      default:
        debug.print(`writeToFile() - Invalid type: ${type} for plain format, returning..`, "error");
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
          json = JSON.stringify(array, null, 2);
          fileName = fileName + "_SMS.json";
          break;
        case backupData.dataTypes[1]:
          json = JSON.stringify(array, null, 2);
          fileName = fileName + "_MMS.json";
          break;
        case backupData.dataTypes[2]:
          json = JSON.stringify(array, null, 2);
          fileName = fileName + "_Contacts.json";
          break;
        default:
          debug.print(`writeToFile() - Invalid type: ${type} for CSV format, returning..`, "error");
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
      switch (type) {
        case backupData.dataTypes[0]:
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
          fileName = fileName + "_SMS.csv";
          break;
        case backupData.dataTypes[1]:
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
            }","${message.receivers.join("; ")}","${
              message.sentTimestamp
            }","${message.smil.replace(/"/g, '""').replace(/\r?\n/g, " ")}","${
              message.subject
            }","${message.timestamp}"\r\n`;
          }
          fileName = fileName + "_MMS.csv";
          break;
        case backupData.dataTypes[2]:
          switch(optionalFormat){
            case backupData.csvExportTypes[0]:
              csvText =
              "additionalName,adr,anniversary,bday,category,email,familyName,genderIdentity,givenName,group,honorificPrefix,honorificSuffix,id,impp,jobTitle,key,name,nickname,note,org,phoneticFamilyName,phoneticGivenName,photo,published,ringtone,sex,tel,updated,url\r\n";
              fileName = fileName + "_Contacts.csv";
              break;
            case backupData.csvExportTypes[1]:
              csvText =
              "Name,Given Name,Additional Name,Family Name,Name Suffix,Nickname,Birthday,Gender,Notes,Photo,Organization 1 - Name,Organization 1 - Title,Website 1 - Value,Phone 1 - Type,Phone 1 - Value,Phone 2 - Type,Phone 2 - Value,E-mail 1 - Value,E-mail 2 - Value,Address 1 - Street,Address 1 - City,Address 1 - Postal Code,Address 1 - Country,Address 1 - Region\r\n";
              fileName = fileName + "_Google_Contacts.csv";
              break;
            case backupData.csvExportTypes[2]:
              csvText =
              "First Name,Last Name,Suffix,Nickname,E-mail Address,E-mail 2 Address,Mobile Phone,Mobile Phone 2,Job Title,Company,Home Street,Home City,Home State,Home Postal Code,Home Country/Region,Web Page,Birthday,Notes,Gender\r\n";
              fileName = fileName + "_Outlook_Contacts.csv";
              break;
            }  
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
          
            switch(optionalFormat){
              case backupData.csvExportTypes[0]:
                csvText += `"${contact.additionalName || ""}","${adr || ""}","${contact.anniversary || ""}","${contact.bday || ""}","${contact.category.join("; ") || ""}","${email || ""}","${contact.familyName.join("; ") || ""}","${contact.genderIdentity || ""}","${contact.givenName.join("; ") || ""}","${contact.group || ""}","${contact.honorificPrefix || ""}","${contact.honorificSuffix || ""}","${contact.id || ""}","${contact.impp || ""}","${contact.jobTitle || ""}","${contact.key || ""}","${contact.name.join("; ") || ""}","${contact.nickname || ""}","${contact.note || ""}","${contact.org || ""}","${contact.phoneticFamilyName || ""}","${contact.phoneticGivenName || ""}","${contact.photo || ""}","${contact.published || ""}","${contact.ringtone || ""}","${contact.sex || ""}","${tel}","${contact.updated || ""}","${contact.url || ""}"\r\n`;
                break;
              case backupData.csvExportTypes[1]:
                csvText += `${contact.name ? contact.name[0] : ""},${contact.givenName.join(" ") || ""},${contact.additionalName ? contact.additionalName[0] : ""},${contact.familyName.join(" ") || ""},${contact.honorificSuffix || ""},${contact.nickname || ""},${contact.bday || ""},${contact.genderIdentity || ""},${contact.note || ""},${contact.photo || ""},${contact.jobTitle || ""},${contact.org ? contact.org[0] : ""},${contact.url ? contact.url : ""},${contact.tel ? (contact.tel[0] ? contact.tel[0].type[0] : "") : ""},${contact.tel ? (contact.tel[0] ? contact.tel[0].value[0] : "") : ""},${contact.tel ? (contact.tel[1] ? contact.tel[1].type[0] : "") : ""},${contact.tel ? (contact.tel[1] ? contact.tel[1].value : "") : ""},${contact.email ? contact.email[0].value : ""},${contact.email ? (contact.email[1] ? contact.email[1].value : "") : ""},${contact.adr ? contact.adr[0].streetAddress : ""},${contact.adr ? contact.adr[0].locality : ""},${contact.adr ? contact.adr[0].postalCode : ""},${contact.adr ? contact.adr[0].countryName : ""},${contact.adr ? contact.adr[0].region : ""}\r\n`;
                break;
              case backupData.csvExportTypes[2]:
                csvText += `${contact.givenName.join(" ") || ""},${contact.familyName.join(" ") || ""},${contact.honorificSuffix || ""},${contact.nickname || ""},${contact.email ? contact.email[0].value : ""},${contact.email ? (contact.email[1] ? contact.email[1].value : "") : ""},${contact.tel ? (contact.tel[0] ? contact.tel[0].value[0] : "") : ""},${contact.tel ? (contact.tel[1] ? contact.tel[1].value : "") : ""},${contact.jobTitle || ""},${contact.org ? contact.org[0] : ""},${contact.adr ? contact.adr[0].streetAddress : ""},${contact.adr ? contact.adr[0].locality : ""},${contact.adr ? contact.adr[0].region : ""},${contact.adr ? contact.adr[0].postalCode : ""},${contact.adr ? contact.adr[0].countryName : ""},${contact.url ? contact.url : ""},${contact.bday || ""},${contact.note || ""},${contact.genderIdentity || ""}\r\n`;
                break;
              }  
          }
          
          break;
        default:
          debug.print(`writeToFile() - Invalid type: ${type} for CSV format, returning..`, "error");
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
          xmlText += `<smsMessages>\n`;
          for (let i = 0; i < amount; i++) {
            const message = new SMSMessage(array[i]);
            xmlText += `  <message>\n    <type>${message.type || ""}</type>\n    <id>${message.id || ""}</id>\n    <threadId>${message.threadId || ""}</threadId>\n    <iccId>${message.iccId || ""}</iccId>\n    <deliveryStatus>${message.deliveryStatus || ""}</deliveryStatus>\n    <sender>${message.sender || ""}</sender>\n    <receiver>${message.receiver || ""}</receiver>\n    <body>${message.body || ""}</body>\n    <messageClass>${message.messageClass || ""}</messageClass>\n    <deliveryTimestamp>${message.deliveryTimestamp || ""}</deliveryTimestamp>\n    <read>${message.read || ""}</read>\n    <sentTimestamp>${message.sentTimestamp || ""}</sentTimestamp>\n    <timestamp>${message.timestamp || ""}</timestamp>\n  </message>\n`;
          }
          xmlText += `</smsMessages>\n`;
          fileName = fileName + "_SMS.xml";
          break;

        case backupData.dataTypes[1]:
          xmlText += `<mmsMessages>\n`;
          for (let i = 0; i < amount; i++) {
            const message = new MMSMessage(array[i]);
            xmlText += `  <message>\n    <type>${message.type || ""}</type>\n    <id>${message.id || ""}</id>\n    <threadId>${message.threadId || ""}</threadId>\n    <iccId>${message.iccId || ""}</iccId>\n    <delivery>${message.delivery || ""}</delivery>\n    <expiryDate>${message.expiryDate || ""}</expiryDate>\n    <attachments>${message.attachments[0].location || ""}</attachments>\n    <read>${message.read || ""}</read>\n    <readReportRequested>${message.readReportRequested || ""}</readReportRequested>\n    <receivers>${message.receivers.join(", ") || ""}</receivers>\n    <sentTimestamp>${message.sentTimestamp || ""}</sentTimestamp>\n    <smil>${message.smil || ""}</smil>\n    <subject>${message.subject || ""}</subject>\n    <timestamp>${message.timestamp || ""}</timestamp>\n  </message>\n`;
          }
          xmlText += `</mmsMessages>\n`;
          fileName = fileName + "_MMS.xml";
          break;

        case backupData.dataTypes[2]:
          xmlText += `<contacts>\n`;
          for (let i = 0; i < amount; i++) {
            const contact = new Contact(array[i]);
            xmlText += `  <contact>\n    <additionalName>${contact.additionalName || ""}</additionalName>\n    ${contact.adr ? contact.adr.map(address => `    <adr>${address.countryName},${address.locality},${address.postalCode},${address.region},${address.streetAddress}</adr>`).join("\n") : '    <adr></adr>'}\n    <anniversary>${contact.anniversary || ""}</anniversary>\n    <bday>${contact.bday || ""}</bday>\n    <category>${contact.category.join(",") || ""}</category>\n    ${contact.email ? contact.email.map(emailEntry => `    <email>${emailEntry.value}</email>`).join("\n") : '    <email></email>'}\n    <familyName>${contact.familyName.join(",") || ""}</familyName>\n    <genderIdentity>${contact.genderIdentity || ""}</genderIdentity>\n    ${contact.givenName ? `    <givenName>${contact.givenName.join(",")}</givenName>` : '    <givenName></givenName>'}\n    <group>${contact.group || ""}</group>\n    <honorificPrefix>${contact.honorificPrefix || ""}</honorificPrefix>\n    <honorificSuffix>${contact.honorificSuffix || ""}</honorificSuffix>\n    <id>${contact.id || ""}</id>\n    ${contact.impp ? `    <impp>${contact.impp.join(" ")}</impp>` : '    <impp></impp>'}\n    <jobTitle>${contact.jobTitle || ""}</jobTitle>\n    <key>${contact.key || ""}</key>\n    <name>${contact.name.join(",") || ""}</name>\n    <nickname>${contact.nickname || ""}</nickname>\n    <note>${contact.note || ""}</note>\n    <org>${contact.org || ""}</org>\n    <phoneticFamilyName>${contact.phoneticFamilyName || ""}</phoneticFamilyName>\n    ${contact.phoneticGivenName ? `    <phoneticGivenName>${contact.phoneticGivenName.join(",")}</phoneticGivenName>` : '    <phoneticGivenName></phoneticGivenName>'}\n    ${contact.photo ? `<photo>${contact.photo}</photo>` : '    <photo></photo>'}\n    <published>${contact.published || ""}</published>\n    <ringtone>${contact.ringtone || ""}</ringtone>\n    <sex>${contact.sex || ""}</sex>\n    ${contact.tel ? contact.tel.map(phone => `    <tel>${phone.value}</tel>`).join("\n") : '    <tel></tel>'}\n    <updated>${contact.updated || ""}</updated>\n    <url>${contact.url || ""}</url>\n  </contact>`;
          }
          xmlText += `</contacts>\n`;
          fileName = fileName + "_Contacts.xml";
          break;

        default:
          debug.print(`writeToFile() - Invalid type: ${type} for CSV format, returning..`, "error");
          return;
      }

      let xmlData = xmlHeader + "\n" + xmlText;

      let oMyXmlBlob = new Blob([xmlData], { type: "text/xml;charset=utf-8" });

      promise = sdcard.addNamed(oMyXmlBlob, fileName);

      break;
    }
    default:
      debug.print(`writeToFile() - Invalid format: ${format}, returning..`, "error");
      break;
  }
  promise.onsuccess = function () {
    drawProgress(type, 1,1,`${type} - ${localeData[3]['done']} ${optionalFormat || ""} ${format}!`);
    debug.print(`writeToFile() - Data was successfully written to the internal storage (${fileName})`);
    process.jobDone(type);
  };
  promise.onerror = function () {
    drawProgress(type, 1,1,`${type} - ${localeData[3]['errorOnFile']} ${optionalFormat || ""} ${format}`);
    debug.print(`writeToFile() - Error happened at type: ${type} while trying to write to ${fileName} (format: ${format}) - ${promise.error.name}`,"error");
    toast(`Error happened while trying to write to ${fileName} - ${promise.error.name}`);
    process.jobDone(type);
  };
  
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

function closeMenus(){
  if (draw.block){
    debug.print(`closeMenus() - Trying to close ${draw.getActive()}`)
    draw.toggle(draw.getActive());
    return true;
  }
  return false;
}

function fetchSMSMessages() {
  let randomLimit = 10000; // I have no clue what is the limit of messages, just a placeholder value 
  debug.print("fetchSMSMessages() - Starting backup");
  drawProgress(backupData.dataTypes[0],1,3,`${localeData['3']['startSMS']} (1/3)`)
  let smsManager = window.navigator.mozSms || window.navigator.mozMobileMessage;
  if (!smsManager) {
    drawProgress(backupData.dataTypes[0], 1,1,`Error - Couldn't get API access`);
    debug.print("fetchSMSMessages() - Couldn't get API access, returning..","error");
    toast("Couldn't get SMS API access");
    return;
  }
  debug.print("fetchSMSMessages() - Got access to mozSms or mozMobileMessage");
  drawProgress(backupData.dataTypes[0],2,3,`${localeData['3']['startSMS']} (2/3)`)
  let request = smsManager.getMessages(null, false);
  if (!request) {
    drawProgress(backupData.dataTypes[0], 1,1,`Error - Couldn't access getMessages()`);
    debug.print("fetchSMSMessages() - Couldn't access getMessages(), returning..", "error");
    toast("Couldn't access getMessages().");
    return;
  }
  debug.print("fetchSMSMessages() - Got access to getMessages(), starting scan");
  let amount = 0;
  drawProgress(backupData.dataTypes[0],3,3,`${localeData['3']['startSMS']} (3/3)`)
  request.onsuccess = function () {
    let cursor = request;
    if (!cursor.result) {
      debug.print(`fetchSMSMessages() - Successfully scanned ${amount} message(s), calling handleExport()`);
      drawProgress(backupData.dataTypes[0],1,1,`${localeData['3']['found']} ${amount}/${amount} ${localeData['3']['items']}`)
      process.handleExport(smsMessages, backupData.dataTypes[0]);
      return;
    }
    const message = cursor.result;
    if (message.type == "sms") {
      const newMessage = new SMSMessage(message); // Create SMSMessage from message object
      smsMessages.push(newMessage);
      amount += 1;
      drawProgress(backupData.dataTypes[0],amount,randomLimit,`${localeData[3]["scanning"]} SMS (${amount}/?)`,true)
      cursor.continue();
    } else {
      debug.print("fetchSMSMessages() - Not an SMS message, skipping..");
      cursor.continue();
    }
  };
  request.onerror = function () {
    debug.print(`fetchSMSMessages() - Error accessing SMS messages: ${request.error.name}`);
    toast(`${localeData[3]["errorScanningSMS"]} - ${request.error.name}`);
  };
}

function fetchMMSMessages() {
  let randomLimit = 10000; // I have no clue what is the limit of messages, just a placeholder value 
  debug.print("fetchMMSMessages() -  Starting backup");
  drawProgress(backupData.dataTypes[1],1,3,`${localeData['3']['startMMS']} (1/3)`);
  let mmsManager = window.navigator.mozMms || window.navigator.mozMobileMessage;

  if (!mmsManager) {
    drawProgress(backupData.dataTypes[1], 1,1,`Error - Couldn't get API access`);
    debug.print("fetchMMSMessages() - Could not get MMS API access, returning..","error");
    toast("Couldn't get MMS API access");
    return;
  }
  debug.print("fetchMMSMessages() - Got access to mozMms or mozMobileMessage");
  drawProgress(backupData.dataTypes[1],2,3,`${localeData['3']['startMMS']} (2/3)`);
  let request = mmsManager.getMessages(null, false);
  if (!request) {
    drawProgress(backupData.dataTypes[1], 1,1,`Error - Couldn't access getMessages()`);
    debug.print("fetchMMSMessages() - Couldn't access getMessages().","error");
    toast("Couldn't access getMessages().");
    return;
  }
  debug.print("fetchMMSMessages() - Got access to getMessages(), starting scan");
  drawProgress(backupData.dataTypes[1],3,3,`${localeData['3']['startMMS']} (3/3)`);
  let amount = 0;

  request.onsuccess = function () {
    let cursor = request;
    if (!cursor.result) {
      debug.print(`fetchMMSMessages() - Successfully scanned ${amount} messages, calling handleExport()`);
      drawProgress(backupData.dataTypes[1],1,1,`${localeData[3]["found"]} ${amount}/${amount} ${localeData[3]["items"]}`)
      process.handleExport(mmsMessages, backupData.dataTypes[1]);
      saveMMSImages(mmsMessages);
      return;
    }
    drawProgress(backupData.dataTypes[1],amount,randomLimit,`${localeData[3]["scanning"]} MMS (${amount}/?)`,true)
    const message = cursor.result;
    if (message.type == "mms") {
      const newMessage = new MMSMessage(message);
      mmsMessages.push(newMessage);
      amount += 1;
      drawProgress(backupData.dataTypes[1],amount,randomLimit,`${localeData[3]["scanning"]} MMS (${amount}/?)`,true)
      cursor.continue();
    } else {
      debug.print("fetchMMSMessages() - Not an MMS, skipping...");
      cursor.continue();
    }
  };

  request.onerror = function () {
    debug.print(`fetchMMSMessages() - Error accessing MMS messages: ${request.error.name}`);
    toast(`${localeData[3]["errorScanningMMS"]} - ${request.error.name}`);
  };
}

function fetchContacts() {
  debug.print("fetchContacts() - Starting backup");
  drawProgress(backupData.dataTypes[2],1,3,`${localeData['3']['startContact']} (1/3)`)
  if ("mozContacts" in navigator) {
    let options = {
      filterBy: [],
    };
    drawProgress(backupData.dataTypes[2],2,3,`${localeData['3']['startContact']} (2/3)`)
    let request = navigator.mozContacts.find(options);
    if (!request) {
      drawProgress(backupData.dataTypes[2], 1,1,`Error - Couldn't access mozContacts`);
      debug.print("fetchContacts() - Couldn't access mozContacts, returning..","error");
      toast("Couldn't access mozContacts.");
      return;
    }
    debug.print("fetchContacts() - Got access to mozContacts, starting scan");
    drawProgress(backupData.dataTypes[2],3,3,`${localeData['3']['startContact']} (3/3)`)
    request.onsuccess = function () {
      let allContacts = request.result;

      if (allContacts.length > 0) {
        debug.print(`Found ${allContacts.length} contact(s), proceeding...`);
        for (let i = 0; i < allContacts.length; i++) {
          drawProgress(backupData.dataTypes[2],i,allContacts.length,`${localeData['3']['scanningContacts']} (${i}/${allContacts.length})`,true)
          let currentContact = allContacts[i];
          const newContact = new Contact(currentContact);
          contacts.push(newContact);
        }
        debug.print("fetchContacts() - Got the last contact");
        drawProgress(backupData.dataTypes[2],1,1,`${localeData['3']['found']} ${allContacts.length}/${allContacts.length} ${localeData['3']['items']}`)
        process.handleExport(contacts,backupData.dataTypes[2]);
      } else {
        debug.print("fetchContacts() - No contacts found, returning..","warning");
        drawProgress(backupData.dataTypes[2],1,1,localeData['3']['noContactsFound'])
      }
    };

    request.onerror = function () {
      debug.print(`fetchContacts() - Error accessing contacts - ${request.error.name}, returning`,"error");
      toast(`${localeData[3]["errorScanningContacts"]} - ${request.error.name}`);
      drawProgress(backupData.dataTypes[2],1,1,`Error - Can't access contacts`)
    };
  } else {
    debug.print(`fetchContacts() - Could not get API access for contacts, returning`,"error");
    drawProgress(backupData.dataTypes[2],1,1,`Error - Can't access contacts`)
  }
}

function saveMMSImages(mmsMessages) {
  for (let mmsMessage of mmsMessages) {
    const attachments = mmsMessage.attachments;
    for (let attachment of attachments) {
        const imageFilename = `KaiOS_Backup/backup_${currentDate}/MMS_images/${attachment.location}`;
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


function drawProgress(item, pos, amount, msg, extra = false){
  if (controls.col != 3){
    controls.updateControls(3);
    menu.draw();
  }
      switch (item) {
        case backupData.dataTypes[0]: {
          let progressBarSMS = document.getElementById("p1");
          let textMsgSMS = document.getElementById("p1-1");
          progressBarSMS.value = pos;
          progressBarSMS.max = amount;
          textMsgSMS.innerHTML = `<text>${msg}</text>`;
          if(draw.captureExtraLogs && extra){
            draw.addLog(item, msg); 
            process.smsLogs.push(msg);
          }
          else if(!extra){
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
            textMsgMMS.innerHTML = `<text>${msg}</text>`;
            if(draw.captureExtraLogs && extra){
              draw.addLog(item, msg); 
              process.mmsLogs.push(msg);
            }
            else if(!extra){
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
              textMsgContact.innerHTML = `<text>${msg}</text>`;
              if(draw.captureExtraLogs && extra){
                draw.addLog(item, msg); 
                process.contactsLogs.push(msg);
              }
              else if(!extra){
                  draw.addLog(item, msg); 
                  process.contactsLogs.push(msg);
              }
              break;
            }      
        }
    
}

function getMenuData(col) {
  const colAmount = 4; 
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
      controls.updateLimits(colAmount,3);
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
      controls.updateLimits(colAmount,5);
      break;
    case 3: {
      let menuEntries = [];
      process.smsLogs.length != 0 ? menuEntries.push(localeData[3]["1_1"]) : menuEntries.push(localeData[3]["1"]);
      process.mmsLogs.length != 0 ? menuEntries.push(localeData[3]["2_1"]) : menuEntries.push(localeData[3]["2"]);
      process.contactsLogs.length != 0 ? menuEntries.push(localeData[3]["3_1"]) : menuEntries.push(localeData[3]["3"]);
      navbarEntries =
      `<span id="l1" class = "notactive" >${localeData[1]["index"].substring(5)}</span> <span id="l2" class = "notactive"> ${localeData[2]["index"]} </span><span id="l3" > ${localeData[3]["index"]} </span><span id="l4" class = "notactive"> ${localeData[4]["index"]} </span>`;
      menu = `<ul>
    <li id = "1"><div class="progressbar"><span id = "p1-1"><text>${menuEntries[0]}</text></span>
    <progress id = "p1"></progress></div></li>
    <li id = "2"><div class="progressbar"><span id = "p2-1"><text>${menuEntries[1]}</text></span>
    <progress id = "p2"></progress></div></li>
    <li id = "3"><div class="progressbar"><span id = "p3-1"><text>${menuEntries[2]}</text></span>
    <progress id = "p3"></progress></div></li>
    </ul>`;
    controls.updateLimits(colAmount,3);
      break;
    }
    case 4:
      controls.updateLimits(colAmount,3);
      navbarEntries =
      `<span id="l3" class = "notactive">${localeData[3]["index"]} </span><span id="l4"> ${localeData[4]["index"]} </span>`;
      menu = `<ul>
      <li id = "1" class= "invert" style="height:80px;"><p style="font-size:20px; position:absolute; top:70px">
      KaiOS Backup</p>
      <p style="top:100px;position:absolute;">${localeData[4]["1"]} D3SXX</p>
      <img src="../assets/icons/KaiOS-Backup_56.png" style="position:absolute; right:10px; top:85px">
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

function scrollHide(obj = ""){
  switch(controls.col){
    case 2:
      if (controls.row > 4) {
        debug.print(`scrollHide() - Hide id: 1 show id: 5`)
        hideElement(1);
        showElement(5);
      } else if (controls.row == 1){
        debug.print(`scrollHide() - Hide id: 5 show id: 1`)
        showElement(1);
        hideElement(5);
      }
      break;
    case 3:
      if (obj != "m"){
        if(obj == ""){
          return;
        }
        const limit = 8; // Max amount of elements that can be shown on screen
        const entriesAmount = draw.getLogsArr().length;
      
        if(entriesAmount < limit){
          return;
        }
      
        const scrolls = Math.ceil(entriesAmount / limit);
        const currentScrollPos = Math.ceil(controls.rowMenu / limit);
        let stopLimit = currentScrollPos * limit + 1;
        if(stopLimit > entriesAmount){
          stopLimit = entriesAmount; // Prevent overflow
        }
        let startLimit = stopLimit - limit; 
      
        debug.print(`scrollHide() - Object: ${obj}`)
      
        showElements(obj, startLimit, stopLimit);
      
        if(scrolls == currentScrollPos){
          startLimit += 1; // Prevent overflow in the last scroll
        }
      
        hideElements(obj, 1, startLimit-1, stopLimit, entriesAmount);
      
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
    debug.print(`scrollHide() - hideElements() - from ${startUp} upto ${endUp} and from ${startUp} upto ${startDown}`);
    if(startUp != endUp){
    for (let i = startUp; i <= endUp; i++) {
      hideElement(obj + i);
    }
  }
  if(startDown != endDown){
    for (let i = startDown; i <= endDown; i++) {
      hideElement(obj + i);
    }
  }
  }

  function showElements(obj, start, end) {
    debug.print(`scrollHide() - showElements() - from ${start} upto ${end}`)
    for (let i = start; i <= end; i++) {
      showElement(obj + i);
    }
  }
}


function menuHover(row = undefined, pastRow = undefined, obj = undefined){
  debug.print(`menuHover() - Row ${obj}${row} - Hover, Row ${obj}${pastRow}: Unhover`)
  if(pastRow){
    const pastElement = document.getElementById(obj + pastRow);
  if(pastElement){
    pastElement.classList.remove("hovered");
  }
  }
  if(row){
    const currentElement = document.getElementById(obj + row);
    if(currentElement){
      currentElement.classList.add("hovered");
    }
  }
}

function menuNavigation(nav){
let pastRow = controls.row;
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
        switch(controls.row){
          case 1:
            draw.toggle("logs",backupData.dataTypes[0]);
            break;
          
          case 2:
            draw.toggle("logs",backupData.dataTypes[1]);
            break;
          case 3:
            draw.toggle("logs",backupData.dataTypes[2]);
            break;
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
        draw.toggle("menu")
        break;
      case 3:
        if(!process.blockControls){
          draw.toggle("menu")
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
          draw.toggle("options");
        }
        break;
      case 3:
        switch(controls.row){
          case 1:
            draw.toggle("logs",backupData.dataTypes[0]);
            break;
          
          case 2:
            draw.toggle("logs",backupData.dataTypes[1]);
            break;
          case 3:
            draw.toggle("logs",backupData.dataTypes[2]);
            break;
        }
    }
    break;
}
if (enableClear){
  let input = document.getElementById(1);
  refreshDate();
  filename = folderPath + "backup_" + currentDate + "/backup_" + currentDate; 
  let newInput = `<li id="1">${localeData[2]["1"]} <input type="text" id="i1" value="${filename}" nav-selectable="true" autofocus /></li>`;
  input.innerHTML = newInput;
  enableClear = false;
}
  scrollHide();
  menuHover(controls.row, pastRow,'')
  softkeys.draw();
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

function toast(msg = null) {
  let toastElement = document.getElementById('toast');
  if (msg != null) {
    toastElement.classList.remove('notactive');
    toastElement.classList.add('active');
    let duration = 2000;
    if(msg.length > 26){
      duration = msg.length * 100;
      msg = `<span style="animation:marqueeToastAnimation ${duration/1000+1}s linear infinite; position:absolute; top:8px; width:500px">${msg}</span>`
      
    }
    toastElement.innerHTML = `<span>${msg}</span>`;
    debug.print('toast() - Toast activated');
    setTimeout(function() {
      toastElement.classList.remove('active');
      toastElement.classList.add('notactive');
      debug.print('toast() - Toast deactivated');
    }, duration)
  }
}

document.activeElement.addEventListener("keydown", controls.handleKeydown);