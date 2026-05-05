const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS aur purane versions ke liye configuration
const io = new Server(server, {
    cors: { origin: "*" },
    allowEIO3: true 
});

app.get('/', (req, res) => {
    res.send('Server is running. Check Render Logs for data.');
});

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    socket.on('phone_data', (data) => {
        console.log('Data from Phone:', data);
        io.emit('termux_receive', data);
    });

    socket.on('termux_command', (cmd) => {
        console.log('Command from Termux:', cmd);
        io.emit('phone_command', cmd);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        
