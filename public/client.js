let socket;
let username = "";
let currentChannel = "general";
const typingTimeouts = {};

function setUsername() {
  username = document.getElementById("usernameInput").value.trim();
  if (username) {
    localStorage.setItem("username", username); // ✅ Sauvegarde

    document.getElementById("login").classList.add("hidden");
    document.getElementById("chat").classList.remove("hidden");

    socket = io();
    socket.emit("setUsername", username);

    setupSocketListeners();
  }
}

function setupSocketListeners() {
  socket.on("userList", (users) => {
    const ul = document.getElementById("usersList");
    ul.innerHTML = "";
    users.forEach(user => {
      if (user !== username) {
        const li = document.createElement("li");
        li.textContent = user;
        li.onclick = () => switchToPrivate(user);
        ul.appendChild(li);
      }
    });
  });

  socket.on("message", ({ from, to, msg }) => {
    const div = document.getElementById("messages");
    const p = document.createElement("p");
    p.textContent = `[${from}] ${msg}`;
    div.appendChild(p);
    div.scrollTop = div.scrollHeight;
  });

  socket.on("image", ({ from, to, image }) => {
    const div = document.getElementById("messages");
    const img = document.createElement("img");
    img.src = image;
    img.classList.add("chat-image");
    div.appendChild(img);
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
    socket.emit("message", { to: currentChannel, msg });
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
        image: reader.result
      });
    };
    reader.readAsDataURL(file);
  }
}

function resetUsername() {
  localStorage.removeItem("username");
  location.reload();
}

document.getElementById('imageInput').addEventListener('change', sendImage);

// ✅ Auto-login si un pseudo est déjà enregistré
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("username");
  if (saved) {
    username = saved;
    document.getElementById("login").classList.add("hidden");
    document.getElementById("chat").classList.remove("hidden");

    socket = io();
    socket.emit("setUsername", username);

    setupSocketListeners();
  }
});
