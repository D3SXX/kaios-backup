
//import menuUpdater from "./js/menuUpdater";
//import fetchSMSMessages from './js/getSms';

document.activeElement.addEventListener('keydown', handleKeydown);
var key;
var row = 0;
var col = 1;
var rowLimit;
var currentDate;
var filename;
var holdIndex = ["SMS","MMS","Logs"];
var holdValues = [false,false,false];

function refreshDate(){
  const date = new Date();
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  currentDate = `${day}-${month}-${year}`;
}
function showDebug(){
  const debugElement = document.getElementById('debug');
  debugElement.innerHTML = `nav: ${key} row: ${row} (${rowLimit}) col: ${col}`;
}

function isElementInFocus(element) {
  return element === document.activeElement;
}

function focusInput(id) {
  const inputElement = document.getElementById("i" + id);
  const isInFocus = isElementInFocus(inputElement);
  if (!isInFocus){
  if (inputElement) {
    inputElement.focus();
    inputElement.value = "";
    console.log('id: i' +  row + ' - focused');
  }
}
else{
  const inputValue = inputElement.value;
  filename = inputValue;
  inputElement.blur();
  console.log('id: i' +  row + ' - unfocused');
}
console.log('filename is set to: ' + filename);
}

function check(id) {
  const checkbox = document.getElementById("b" + id);
  if (checkbox.checked) {
    checkbox.checked = false;
    holdValues[id-1] = false;
    console.log('id: b' +  row + ' - unchecked');
  }
  else{
    checkbox.checked = true;
    holdValues[id-1] = true;
    console.log('id: b' +  row + ' - checked');
  }
  console.log('Values: ' +  holdValues);
}


function handleKeydown(e) {
  switch (e.key) {
    case 'ArrowUp':
      nav(1);
      console.log("ArrowUp triggered")
      break;
    case 'ArrowDown':
      nav(2);
      console.log("ArrowDown triggered")
      break;
    case 'ArrowRight':
      nav(3);
      console.log("ArrowRight triggered")
      break;
    case 'ArrowLeft':
      nav(4);
      console.log("ArrowLeft triggered")
      break;
    case 'Enter':
      nav(5);
      console.log("Enter triggered");
      break;
    case 'SoftRight':
      nav(6);
    console.log("SoftRight triggered");
    break;
  }
}

function nav(move) {
  key = move;
  const currentIndex = document.activeElement.tabIndex;
  const next = currentIndex + move;
  const items = document.querySelectorAll('.items');
  const targetElement = items[next];
  if (targetElement) {
    targetElement.focus();
  }
    
    updateMenuContainer(move);
}

function updateMenuContainer(nav) {
  const menuContainer = document.getElementById('menu-container');
  const navbar = document.getElementById('nav-bar');
  const currentContent = menuContainer.innerHTML;
  const navbarContent = menuContainer.innerHTML;
  let navbarEntry = '';
  let newEntry = '';
  let newEntry2 = '';
  
  if (nav == 3 || nav == 4) {
    row = 0;
    if (nav == 4) {
      col = 1;
      newEntry = `<ul>
      <li id="1">Save SMS <input type="checkbox" id="b1" name="SMS" ${holdValues[0] ? 'checked' : ''}></li>
      <li id="2">Save MMS <input type="checkbox" id="b2" name="MMS" ${holdValues[1] ? 'checked' : ''}></li>
      <li id="3">Save Logs <input type="checkbox" id="b3" name="LOGS" ${holdValues[2] ? 'checked' : ''}></li>
      </ul>`;
      navbarEntry = '<label>Data Selection</label>'
      rowLimit = 3;
    } else if (nav == 3) {
      col = 2;
      refreshDate();
      if (!filename){
        filename = "backup_" + currentDate;
      }
      
      newEntry = ` <ul>
      <li id = 1>Filename: <input type="text" id="i1" value=${filename} nav-selectable="true" autofocus /></li>
      </ul>`;
      navbarEntry = '<label>Filenames</label>'
      rowLimit = 1;
    }
    
    if (!currentContent.includes(newEntry)) {
      menuContainer.innerHTML = newEntry;
      //menuContainer.innerHTML += newEntry2;
      navbar.innerHTML = navbarEntry;
    }
  } else if (nav == 1 || nav == 2) {
    if (row && row <= rowLimit) {
      const pastElement = document.getElementById(row);
      pastElement.classList.remove('hovered');
    }
    if (nav == 2) {
      if (row < rowLimit) {
        row++;
        const element = document.getElementById(row);
        if (element) {
          element.classList.add('hovered');
          console.log("Hover Down, row = " + row)
        }
      }
      else{
        row = 0;
      }
    } else {
      if (row >= 1) {
        row--;
        const element = document.getElementById(row);
        if (element) {
          element.classList.add('hovered');
          console.log("Hover Up, row = " + row)
        }
      }
      else{
        row = rowLimit+1;
      }
    }
  }
  else{
    if (col == 1){
      check(row);
    }
    else{
      focusInput(row);
    }


  
  
}
showDebug();
}


nav(4);