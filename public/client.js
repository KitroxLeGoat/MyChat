const socket = io(); // Connexion au serveur WebSocket

let currentUser = ''; // Nom d'utilisateur actuel
let currentChannel = 'public'; // Canal actif (public ou privé)
let selectedUser = ''; // Utilisateur sélectionné pour un chat privé

// Initialisation des éléments du DOM
const messageInput = document.getElementById('messageInput');
const messagesDiv = document.getElementById('messages');
const usersList = document.getElementById('usersList');
const channelTitle = document.getElementById('channelTitle');
const privateChatControls = document.getElementById('privateChatControls');
const privateChatSelect = document.getElementById('privateChatSelect');

// Lorsque l'utilisateur envoie un message
function sendMessage() {
  const messageText = messageInput.value;
  if (messageText.trim() !== '') {
    const messageData = {
      user: currentUser,
      text: messageText,
      channel: currentChannel,
      recipient: selectedUser, // Utilisateur destinataire du chat privé
    };
    socket.emit('sendMessage', messageData); // Envoie du message
    displayMessage('sent', messageText);
    messageInput.value = ''; // Réinitialise l'input
  }
}

// Affichage des messages dans la fenêtre de chat
function displayMessage(type, text) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', type);
  messageDiv.textContent = text;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // Faire défiler vers le bas
}

// Fonction pour afficher les utilisateurs connectés
function updateUsersList(users) {
  usersList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user;
    li.onclick = () => startPrivateChat(user);
    usersList.appendChild(li);
  });
}

// Fonction pour démarrer un chat privé
function startPrivateChat(user) {
  selectedUser = user;
  currentChannel = 'private';
  privateChatControls.style.display = 'block';
  privateChatSelect.style.display = 'none';
  channelTitle.textContent = `Chat privé avec ${selectedUser}`;
  messagesDiv.innerHTML = ''; // Effacer l'historique des messages
}

// Retour au chat général
function switchToGeneral() {
  currentChannel = 'public';
  selectedUser = '';
  privateChatControls.style.display = 'none';
  privateChatSelect.style.display = 'block';
  channelTitle.textContent = 'Canal Général';
  messagesDiv.innerHTML = ''; // Effacer l'historique des messages
}

// Lorsque l'utilisateur change de pseudo ou se déconnecte
function setUsername() {
  const username = prompt('Entrez votre pseudo :');
  if (username) {
    currentUser = username;
    document.getElementById('username').textContent = currentUser;
    socket.emit('setUsername', currentUser); // Envoyer au serveur
  }
}

// Se déconnecter
function logout() {
  socket.emit('logout');
  alert('Déconnecté');
}

// Réception des messages du serveur
socket.on('message', (message) => {
  displayMessage(message.type, message.text);
});

// Réception de la mise à jour des utilisateurs connectés
socket.on('updateUsers', (users) => {
  updateUsersList(users);
});

// Initialiser l'utilisateur au début
setUsername();
