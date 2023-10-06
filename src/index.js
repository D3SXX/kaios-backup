
//import { updateMenuContainer } from 'menuUpdater';

document.activeElement.addEventListener('keydown', handleKeydown);

function handleKeydown(e) {
  switch (e.key) {
    case 'ArrowUp':
      nav(1);
      break;
    case 'ArrowDown':
      nav(2);
      break;
    case 'ArrowRight':
      nav(3);
      break;
    case 'ArrowLeft':
      nav(4);
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
    debugElement.innerHTML = `nav: ${move}`;
    //updateMenuContainer(move);
}
