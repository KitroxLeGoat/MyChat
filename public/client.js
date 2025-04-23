let socket;
let username = "";
let avatar = "";
let currentChannel = "general";
const typingTimeouts = {};

function setUsername() {
  const input = document.getElementById("usernameInput");
  const fileInput = document.getElementById("avatarInput");

  username = input.value.trim();

  if (username) {
    // Lire le fichier d'avatar s'il existe
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        avatar = reader.result;
        saveUserData();
        connectSocket();
      };
      reader.readAsDataURL(file);
    } else {
      // Avatar déjà en mémoire ou vide
      avatar = localStorage.getItem("avatar") || "";
      saveUserData();
      connectSocket();
    }
  }
}

function saveUserData() {
  localStorage.setItem("username", username);
  localStorage.setItem("avatar", avatar);
}

function connectSocket() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("chat").classList.remove("hidden");

  socket = io();
  socket.emit("setUsername", { username, avatar });
  setupSocketListeners();
}

function setupSocketListeners() {
  socket.on("userList", (users) => {
    const ul = document.getElementById("usersList");
    ul.innerHTML = "";
    users.forEach(user => {
      if (user.username !== username) {
        const li = document.createElement("li");
        li.innerHTML = `<img src="${user.avatar}" alt="" style="width:24px; height:24px; border-radius:50%; vertical-align:middle; margin-right:6px;">${user.username}`;
        li.onclick = () => switchToPrivate(user.username);
        ul.appendChild(li);
      }
    });
  });

  socket.on("message", ({ from, to, msg, avatar }) => {
    const div = document.getElementById("messages");
    const p = document.createElement("p");
    p.innerHTML = `<img src="${avatar}" style="width:24px; height:24px; border-radius:50%; vertical-align:middle; margin-right:6px;"><strong>[${from}]</strong> ${msg}`;
    div.appendChild(p);
    div.scrollTop = div.scrollHeight;
  });

  socket.on("image", ({ from, to, image, avatar }) => {
    const div = document.getElementById("messages");
    const imgWrap = document.createElement("div");
    imgWrap.innerHTML = `<p><img src="${avatar}" style="width:24px; height:24px; border-radius:50%; vertical-align:middle; margin-right:6px;"><strong>[${from}]</strong></p><img src="${image}" class="chat-image">`;
    div.appendChild(imgWrap);
    div.scrollTop = div.scrollHeight;
  });

  socket.on('typing', (user) => {
    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.textContent = `${user} est en train d'écrire...`;
    clearTimeout(typingTimeouts[user]);
    typingTimeouts[user] = setTimeout(() => {
      typingIndicator.textContent = '';
    }, 3000);
  });
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const msg = input.value;
  if (msg.trim()) {
    socket.emit("message", { to: currentChannel, msg, avatar });
    input.value = "";
    socket.emit("typing", currentChannel);
  }
}

function switchToPrivate(user) {
  currentChannel = user;
  document.getElementById("channelTitle").textContent = `Chat privé avec ${user}`;
  document.getElementById("messages").innerHTML = "";
  document.getElementById("privateChatControls").style.display = 'block';
}

function switchToGeneral() {
  currentChannel = "general";
  document.getElementById("channelTitle").textContent = "Canal Général";
  document.getElementById("messages").innerHTML = "";
  document.getElementById("privateChatControls").style.display = 'none';
}

function sendImage() {
  const input = document.getElementById("imageInput");
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = function () {
      socket.emit('image', {
        to: currentChannel,
        image: reader.result,
        avatar
      });
    };
    reader.readAsDataURL(file);
  }
}

function resetUsername() {
  localStorage.removeItem("username");
  localStorage.removeItem("avatar");
  location.reload();
}

document.getElementById('imageInput').addEventListener('change', sendImage);

// ✅ Auto-login si pseudo + avatar déjà enregistrés
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("username");
  const savedAvatar = localStorage.getItem("avatar");

  if (saved) {
    username = saved;
    avatar = savedAvatar || "";

    connectSocket();
  }
});
