
//import menuUpdater from "./js/menuUpdater";

document.activeElement.addEventListener('keydown', handleKeydown);
var row = 0;
var rowLimit;

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
  }
}

function nav(move) {
  const currentIndex = document.activeElement.tabIndex;
  const next = currentIndex + move;
  const items = document.querySelectorAll('.items');
  const targetElement = items[next];
  if (targetElement) {
    targetElement.focus();
  }
    const debugElement = document.getElementById('debug');
    debugElement.innerHTML = `nav: ${move} row: ${row} (${rowLimit})`;
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
      newEntry = `<ul>
      <li id = 1>Save SMS</li>
      <li id = 2>Save MMS</li>
      <li id = 3>Save Logs</li>
      </ul>`;
      navbarEntry = '<label>Data Selection</label>'
      rowLimit = 3;
    } else if (nav == 3) {
      newEntry = ` <div class="input"><input type="text" id="1" nav-selectable="true" autofocus />
      <label>Filename:</label></div><br>`;
      navbarEntry = '<label>Filenames</label>'
      rowLimit = 1;
    }
    
    if (!currentContent.includes(newEntry)) {
      menuContainer.innerHTML = newEntry;
      //menuContainer.innerHTML += newEntry2;
      navbar.innerHTML = navbarEntry;
    }
  } else {
    if (row) {
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
      if (row > 1) {
        row--;
        const element = document.getElementById(row);
        if (element) {
          element.classList.add('hovered');
          console.log("Hover Up, row = " + row)
        }
      }
      else{
        row = rowLimit;
      }
    }
  }
}
