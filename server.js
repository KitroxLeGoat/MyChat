const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

let users = {}; // { socket.id: { username, avatar } }

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('✅ Un utilisateur est connecté');

  socket.on('setUsername', ({ username, avatar }) => {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return;
    }

    const nameTaken = Object.values(users).some(u => u.username === username);
    if (nameTaken) {
      socket.emit('usernameError', 'Ce pseudo est déjà pris');
      return;
    }

    users[socket.id] = { username, avatar };
    socket.username = username;
    updateUserList();
  });

  socket.on('message', ({ to, msg, avatar }) => {
    const sender = users[socket.id];
    if (!sender) return;

    const payload = {
      from: sender.username,
      avatar: avatar || sender.avatar,
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

  socket.on('image', ({ to, image, avatar }) => {
    const sender = users[socket.id];
    if (!sender) return;

    const payload = {
      from: sender.username,
      avatar: avatar || sender.avatar,
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

  socket.on('disconnect', () => {
    console.log(`❌ ${users[socket.id]?.username || 'Un utilisateur'} déconnecté`);
    delete users[socket.id];
    updateUserList();
  });

  function updateUserList() {
    const userList = Object.values(users).map(u => ({
      username: u.username,
      avatar: u.avatar
    }));
    io.emit('userList', userList);
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Serveur en ligne sur http://localhost:${port}`);
});
