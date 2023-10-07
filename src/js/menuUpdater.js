

function updateMenuContainer(nav) {
    const menuContainer = document.getElementById('menu-container');
    const currentContent = menuContainer.innerHTML;
    const newEntry = `<div class="menu-entry">nav: ${nav}</div>`;

    if (!currentContent.includes(newEntry)) {
      menuContainer.innerHTML += newEntry;
    }
  }
  export {updateMenuContainer};
  