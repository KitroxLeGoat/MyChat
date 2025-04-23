const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = []; // Liste des utilisateurs connectés

// Gérer les connexions WebSocket
io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté');

  // Enregistrer le pseudo
  socket.on('setUsername', (username) => {
    socket.username = username;
    users.push(username);
    io.emit('updateUsers', users); // Mettre à jour la liste des utilisateurs
  });

  // Gérer l'envoi de messages
  socket.on('sendMessage', (message) => {
    if (message.channel === 'public') {
      io.emit('message', { type: 'received', text: message.text });
    } else if (message.channel === 'private') {
      // Envoyer uniquement au destinataire du message privé
      io.to(message.recipient).emit('message', { type: 'received', text: message.text });
    }
  });

  // Déconnexion d'un utilisateur
  socket.on('logout', () => {
    users = users.filter(user => user !== socket.username);
    io.emit('updateUsers', users);
    socket.disconnect();
  });

  // Déconnexion d'un utilisateur
  socket.on('disconnect', () => {
    if (socket.username) {
      users = users.filter(user => user !== socket.username);
      io.emit('updateUsers', users);
    }
  });
});

server.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});
