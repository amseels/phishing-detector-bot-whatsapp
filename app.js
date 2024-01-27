const { Client } = require('whatsapp-web.js');

const { writeFile } = require('./helpers/fileOperation');
const { fetchAnalysis } = require('./helpers/handler');

require('dotenv').config();



const qrcode = require('qrcode-terminal');

const client = new Client({
    puppeteer: {
		args: ['--no-sandbox'],
	}
});

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async msg => {
    const messageData = msg['_data'];
    console.log('Message Received =======')
    console.log('From ', messageData['notifyName'])
    console.log('Message type ', messageData['type'])
    console.log('========================')
    if (msg.hasMedia) {
        console.log('Rewriting the document...');
        const media = await msg.downloadMedia();

        client.sendMessage(msg.from, 'Pesan yang kamu kirim sedang kami proses..');
        if (messageData['type'] === 'document') {
            const downloadedFile = await writeFile(messageData['filename'], media.data)
                .then((res) => res)
                .catch((err) => console.log(err));
            client.sendMessage(msg.from, 'Dokumen yang kamu kirimkan sudah kami terima..');
            const fileSize = fs.statSync(downloadedFile).size;

            console.log('File size:', fileSize)
            if (fileSize < 32000000) {
                const date = new Date();
                const startDate = date.getTime();
                fetchAnalysis(msg, media.data, fileSize, startDate);
            }
        }
    }
    else {
        console.log('Message ', messageData)
        msg.reply('Maaf format pesan yang kamu kirimkan tidak saya pahami :(')
    }
});

client.initialize();