// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.set("view engine","ejs");

// Serve static files

app.get("/streamer",(req,res)=>{
  res.render("streamer");
})

app.get("/viewer",(req,res)=>{
  res.render("viewer");
})

app.use(express.static(__dirname + '/views'));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // WebRTC signaling
  socket.on('offer', (data) => {
    // Broadcast the offer to all connected viewers
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', (data) => {
    // Broadcast the answer to the corresponding streamer
    socket.to(data.streamerId).emit('answer', data);
  });

  socket.on('iceCandidate', (data) => {
    // Broadcast the ICE candidate to the corresponding peer
    socket.to(data.peerId).emit('iceCandidate', data.candidate);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
