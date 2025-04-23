const socket = io();

let currentChannel = 'general';
let username = null;
let avatar = null;

const setUsername = () => {
  username = document.getElementById('usernameInput').value;
  avatar = document.getElementById('avatarInput').files[0];
  
  if (username) {
    socket.emit('join', { username, avatar });
    document.getElementById('login').classList.add('hidden');
    document.getElementById('chat').classList.remove('hidden');
    document.getElementById('channelTitle').textContent = `Canal ${currentChannel.charAt(0).toUpperCase() + currentChannel.slice(1)}`;
  }
};

const resetUsername = () => {
  username = null;
  avatar = null;
  document.getElementById('usernameInput').value = '';
  document.getElementById('avatarInput').value = '';
  document.getElementById('login').classList.remove('hidden');
  document.getElementById('chat').classList.add('hidden');
};

const sendMessage = () => {
  const message = document.getElementById('messageInput').value;
  if (message) {
    socket.emit('message', { message, channel: currentChannel });
    document.getElementById('messageInput').value = '';
  }
};

socket.on('message', (data) => {
  const messageElement = document.createElement('div');
  messageElement.textContent = `${data.username}: ${data.message}`;
  document.getElementById('messages').appendChild(messageElement);
});

socket.on('typing', (username) => {
  const typingIndicator = document.getElementById('typingIndicator');
  typingIndicator.textContent = `${username} est en train de taper...`;
  setTimeout(() => typingIndicator.textContent = '', 2000);
});

socket.on('users', (users) => {
  const usersList = document.getElementById('usersList');
  usersList.innerHTML = '';
  users.forEach(user => {
    const userItem = document.createElement('li');
    userItem.textContent = user.username;
    usersList.appendChild(userItem);
  });
});

const switchToGeneral = () => {
  currentChannel = 'general';
  document.getElementById('channelTitle').textContent = 'Canal Général';
  document.getElementById('privateChatControls').style.display = 'none';
};
