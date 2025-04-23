// Sélectionner les éléments
const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const changeUsernameButton = document.getElementById('changeUsernameButton');
const changeAvatarButton = document.getElementById('changeAvatarButton');
const usernameForm = document.getElementById('usernameForm');
const avatarForm = document.getElementById('avatarForm');
const usernameInput = document.getElementById('usernameInput');
const avatarInput = document.getElementById('avatarInput');

// Ouvrir/fermer le volet roulant
settingsButton.addEventListener('click', () => {
  if (settingsPanel.style.right === '0px') {
    settingsPanel.style.right = '-300px';  // Cache le volet
  } else {
    settingsPanel.style.right = '0px';  // Affiche le volet
  }
});

// Afficher le formulaire pour changer de pseudo
changeUsernameButton.addEventListener('click', () => {
  usernameForm.classList.add('active');
  avatarForm.classList.remove('active'); // Cache l'avatar
});

// Afficher le formulaire pour changer la photo de profil
changeAvatarButton.addEventListener('click', () => {
  avatarForm.classList.add('active');
  usernameForm.classList.remove('active'); // Cache le pseudo
});

// Fonction pour mettre à jour le pseudo
function updateUsername() {
  const newUsername = usernameInput.value.trim();
  if (newUsername) {
    socket.emit('setUsername', { username: newUsername, avatar: localStorage.getItem('avatar') });
    alert('Pseudo mis à jour');
    usernameInput.value = '';  // Réinitialiser l'input
    usernameForm.classList.remove('active');
  }
}

// Fonction pour mettre à jour la photo de profil
function updateAvatar() {
  const file = avatarInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const avatar = reader.result;
      localStorage.setItem('avatar', avatar);
      socket.emit('setUsername', { username: localStorage.getItem('username'), avatar });
      alert('Photo de profil mise à jour');
      avatarInput.value = '';  // Réinitialiser l'input
      avatarForm.classList.remove('active');
    };
    reader.readAsDataURL(file);
  } else {
    alert('Veuillez sélectionner une photo');
  }
}

// Connexion au serveur Socket.io
const socket = io();

// Gérer l'envoi du message avec pseudo et avatar
socket.on('connect', () => {
  const username = localStorage.getItem('username');
  const avatar = localStorage.getItem('avatar') || 'https://bgbb.de/wp-content/uploads/2023/01/Angelina-Sequeira-Gerardo_sw-1008x1400.jpg'; // Avatar par défaut
  if (username) {
    socket.emit('setUsername', { username, avatar });
  }
});
