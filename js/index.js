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

  if (ws.readyState !== WebSocket.OPEN) {
    console.log('WebSocket no está listo');
    printState('WebSocket Error : Check IP', 'error');
    return;
  }

  const data = {
    nombre: nameInputElement.value,
    telefono: document.getElementById('telefono').value,
  };

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

formElement.addEventListener('submit', (event) => {
  event.preventDefault();
  sendData();
});
