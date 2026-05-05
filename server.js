const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Jab phone se data aaye
    socket.on('phone_data', (data) => {
        console.log('Data from Phone:', data);
        // Yeh data Termux ko bhej do
        io.emit('termux_receive', data);
    });

    // Jab Termux se command aaye
    socket.on('termux_command', (cmd) => {
        console.log('Command from Termux:', cmd);
        // Yeh command phone ko bhej do
        io.emit('phone_command', cmd);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
