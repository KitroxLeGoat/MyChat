const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

let users = {}; // Objet pour stocker les utilisateurs connectés
let messageHistory = []; // Tableau pour stocker l'historique des messages

// Sert les fichiers statiques du dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Route d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Assurez-vous que 'index.html' existe dans 'public'
});

io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté');

  // Quand un utilisateur définit son pseudo
  socket.on('setUsername', (username) => {
    users[socket.id] = username;
    io.emit('userList', Object.values(users)); // Envoie la liste des utilisateurs à tous

    // Envoie l'historique des messages au nouvel utilisateur
    messageHistory
      .filter(msg => msg.to === "general") // Filtre pour les messages du canal général
      .forEach(msg => {
        socket.emit('message', msg); // Envoie chaque message du canal général
      });
  });

  // Quand un message est envoyé
  socket.on('message', ({ to, msg }) => {
    const from = users[socket.id];
    const messageData = { from, to, msg };

    // Enregistre le message dans l'historique
    messageHistory.push(messageData);

    // Limite l'historique à 100 messages
    if (messageHistory.length > 100) {
      messageHistory.shift(); // Supprime le message le plus ancien
    }

    // Diffusion du message
    if (to === "general") {
      io.emit('message', messageData);
    } else {
      const userSocket = Object.keys(users).find(key => users[key] === to);
      if (userSocket) {
        io.to(userSocket).emit('message', messageData);
      }
    }
  });

  // ✅ Gestion des images
  socket.on('image', ({ to, image }) => {
    if (to === "general") {
      io.emit('image', { from: users[socket.id], to: "general", image });
    } else {
      const userSocket = Object.keys(users).find(key => users[key] === to);
      if (userSocket) {
        io.to(userSocket).emit('image', { from: users[socket.id], to, image });
      }
    }
  });

  // Indicateur "en train d'écrire"
  socket.on('typing', (to) => {
    if (!users[socket.id]) return; // Ignore si l'utilisateur n'est pas défini
    if (to === "general") {
      socket.broadcast.emit("typing", users[socket.id]); // Envoie à tous sauf à l'expéditeur
    } else {
      const userSocket = Object.keys(users).find(key => users[key] === to);
      if (userSocket) {
        io.to(userSocket).emit("typing", users[socket.id]); // Envoie à l'utilisateur spécifique
      }
    }
  });

  // Quand un utilisateur se déconnecte
  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('userList', Object.values(users)); // Met à jour la liste des utilisateurs
  });
});

// Remplacer localhost:3000 par le port fourni par Render
const port = process.env.PORT || 3000; // Utilise le port fourni par Render, sinon utilise 3000
server.listen(port, () => {
  console.log(`Serveur en ligne sur http://localhost:${port}`);
});
