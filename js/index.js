let params = new URLSearchParams(window.location.search);
let ipToConnect = params.get('ip');

const formElement = document.getElementById('form');
const stateContainerElement = document.getElementById('state-container');
const sendButtonElement = document.getElementById('send-button');
const inputElements = document.querySelectorAll('.input');
const nameInputElement = document.getElementById('name');

const localStorage = window.localStorage;
let ws = null;

if (!ipToConnect) {
  console.error('No IP provided in URL. Use ?ip=YOUR_IP');
} else {
  try {
    ws = new WebSocket(`ws://${ipToConnect}:8081`);
    ws.onopen = () => console.log('Conectado a WebSocket!');
    ws.onclose = () => console.log('WebSocket cerrado');
    ws.onerror = (e) => {
      console.error('WebSocket error', e);
    };
  } catch (error) {
    console.error('Error creating WebSocket:', error);
  }
}

function sendData() {
  if (!ws) {
    console.log('WebSocket no existe - verifica la IP en la URL');
    printState('Error: No hay conexión WebSocket', 'error');
    return;
  }

  /*   if (ws.readyState !== WebSocket.OPEN) {
    console.log('WebSocket no está listo');
    printState('WebSocket Error : Check IP', 'error');
    return;
  } */

  const data = {
    nombre: document.getElementById('nombre').value,
    telefono: document.getElementById('telefono').value,
  };

  if (!isUnique(data)) {
    printState('El número de teléfono ya está registrado', 'error');
    return;
  }

  if (!nameValidation(data.nombre)) {
    printState('Maximo de 3 palabras por nombre', 'error');
    return;
  }

  saveDataToLocalStorage(data);
  ws.send(JSON.stringify(data));
  printState('Registro realizado correctamente', 'success');
}

function printState(state, type) {
  const className = type === 'success' ? 'success' : 'error';
  sendButtonElement.disabled = true;
  inputElements.forEach((input) => (input.disabled = true));
  stateContainerElement.innerHTML = `
    <p>${type === 'success' ? '✅' : '❌'} ${state}</p>
  `;
  stateContainerElement.classList.add(className);
  stateContainerElement.classList.add('show');

  setTimeout(() => {
    stateContainerElement.innerHTML = '';
    stateContainerElement.classList.remove('show');
    stateContainerElement.classList.remove(className);
    sendButtonElement.disabled = false;
    inputElements.forEach((input) => (input.disabled = false));
    inputElements.forEach((input) => (input.value = ''));
  }, 3000);
}

function saveDataToLocalStorage(data) {
  const savedData = getDataFromLocalStorage();
  savedData.push(data);
  localStorage.setItem('data', JSON.stringify(savedData));
}

function getDataFromLocalStorage() {
  const data = localStorage.getItem('data');
  return data ? JSON.parse(data) : [];
}

function isUnique(data) {
  const savedData = getDataFromLocalStorage();
  const unique = !savedData.some((item) => item.telefono === data.telefono);
  console.log('Is unique:', unique, 'Phone:', data.telefono);
  return unique;
}

function nameValidation(name) {
  // Count total number of spaces in the entire string
  const spaceCount = (name.match(/ /g) || []).length;
  
  // Return false if there are more than 2 spaces in total
  if (spaceCount > 2) {
    return false;
  }
  
  return true;
}

function clearLocalStorage() {
  if (confirm('¿Estás seguro de que quieres borrar todos los datos?')) {
    localStorage.clear();
    printState('LocalStorage borrado correctamente', 'success');
    console.log('LocalStorage cleared');
  }
}

// Settings dropdown functionality
const settingsButton = document.getElementById('settings-button');
const settingsDropdown = document.getElementById('settings-dropdown');
const clearStorageButton = document.getElementById('clear-storage');

// Toggle dropdown
settingsButton.addEventListener('click', (event) => {
  event.stopPropagation();
  settingsDropdown.classList.toggle('show');
});

// Clear storage action
clearStorageButton.addEventListener('click', () => {
  settingsDropdown.classList.remove('show');
  clearLocalStorage();
});

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
  if (
    !settingsButton.contains(event.target) &&
    !settingsDropdown.contains(event.target)
  ) {
    settingsDropdown.classList.remove('show');
  }
});

formElement.addEventListener('submit', (event) => {
  event.preventDefault();
  sendData();
});
