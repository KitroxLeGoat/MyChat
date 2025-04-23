const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// ✅ Utilisateurs avec pseudo + avatar
let users = {}; // { socket.id: { username: "xxx", avatar: "data:image..." } }

// Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté');

  // ✅ Réception du pseudo + avatar
  socket.on('setUsername', ({ username, avatar }) => {
    users[socket.id] = { username, avatar };
    updateUserList();
  });

  // ✅ Message texte
  socket.on('message', ({ to, msg }) => {
    const sender = users[socket.id];
    if (!sender) return;

    const payload = {
      from: sender.username,
      avatar: sender.avatar,
      to,
      msg
    };

    if (to === "general") {
      io.emit('message', payload);
    } else {
      const recipientSocket = Object.keys(users).find(id => users[id].username === to);
      if (recipientSocket) {
        io.to(recipientSocket).emit('message', payload);
      }
    }
  });

  // ✅ Image
  socket.on('image', ({ to, image }) => {
    const sender = users[socket.id];
    if (!sender) return;

    const payload = {
      from: sender.username,
      avatar: sender.avatar,
      to,
      image
    };

    if (to === "general") {
      io.emit('image', payload);
    } else {
      const recipientSocket = Object.keys(users).find(id => users[id].username === to);
      if (recipientSocket) {
        io.to(recipientSocket).emit('image', payload);
      }
    }
  });

  // ✅ "Typing"
  socket.on('typing', (to) => {
    const sender = users[socket.id];
    if (!sender) return;

    if (to === "general") {
      socket.broadcast.emit("typing", sender.username);
    } else {
      const recipientSocket = Object.keys(users).find(id => users[id].username === to);
      if (recipientSocket) {
        io.to(recipientSocket).emit("typing", sender.username);
      }
    }
  });

  // ✅ Déconnexion
  socket.on('disconnect', () => {
    delete users[socket.id];
    updateUserList();
  });

  // 🔁 Fonction pour mettre à jour la liste des utilisateurs
  function updateUserList() {
    const userList = Object.values(users).map(u => ({ username: u.username, avatar: u.avatar }));
    io.emit('userList', userList);
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Serveur en ligne sur http://localhost:${port}`);
});
