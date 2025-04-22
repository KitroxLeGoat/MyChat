let socket;
let username = "";
let currentChannel = "general";
const typingTimeouts = {};

function setUsername() {
  username = document.getElementById("usernameInput").value.trim();
  if (username) {
    document.getElementById("login").classList.add("hidden");
    document.getElementById("chat").classList.remove("hidden");

    socket = io();

    // Envoie du pseudo au serveur
    socket.emit("setUsername", username);

    // Mise à jour de la liste des utilisateurs
    socket.on("userList", (users) => {
      const ul = document.getElementById("usersList");
      ul.innerHTML = "";
      users.forEach(user => {
        if (user !== username) {
          const li = document.createElement("li");
          li.textContent = user;
          li.onclick = () => switchToPrivate(user); // Pour passer à un chat privé
          ul.appendChild(li);
        }
      });
    });

    // Affichage des messages
    socket.on("message", ({ from, to, msg }) => {
      const div = document.getElementById("messages");
      const p = document.createElement("p");
      p.textContent = `[${from}] ${msg}`;
      div.appendChild(p);
      div.scrollTop = div.scrollHeight;
    });

    // Affichage des images
    socket.on("image", ({ from, to, image }) => {
      const div = document.getElementById("messages");
      const img = document.createElement("img");
      img.src = image;
      img.classList.add("chat-image");
      div.appendChild(img);
      div.scrollTop = div.scrollHeight;
    });

    // Indicateur de frappe
    socket.on('typing', (username) => {
      const typingIndicator = document.getElementById('typingIndicator');
      typingIndicator.textContent = `${username} est en train d'écrire...`;
      clearTimeout(typingTimeouts[username]);
      typingTimeouts[username] = setTimeout(() => {
        typingIndicator.textContent = '';
      }, 3000);
    });
  }
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const msg = input.value;
  if (msg.trim()) {
    socket.emit("message", { to: currentChannel, msg });
    input.value = "";
    socket.emit("typing", currentChannel); // Informe le serveur que l'utilisateur a fini de taper
  }
}

function switchToPrivate(user) {
  currentChannel = user;
  document.getElementById("channelTitle").textContent = `Chat privé avec ${user}`;
  document.getElementById("messages").innerHTML = "";
  document.getElementById("privateChatControls").style.display = 'block'; // Affiche le bouton de retour
}

function switchToGeneral() {
  currentChannel = "general";  // Reviens au canal général
  document.getElementById("channelTitle").textContent = "Canal Général";  // Change le titre
  document.getElementById("messages").innerHTML = "";  // Efface les messages affichés
  document.getElementById("privateChatControls").style.display = 'none'; // Cache le bouton de retour
}

function sendImage() {
  const input = document.getElementById("imageInput");
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = function() {
      socket.emit('image', {
        to: currentChannel,
        image: reader.result
      });
    };
    reader.readAsDataURL(file);
  }
}

document.getElementById('imageInput').addEventListener('change', sendImage);
