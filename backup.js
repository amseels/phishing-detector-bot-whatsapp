const { VirusTotal } = require('./services/api/virusTotal');
const { findEstimatedTime } =  require('./helpers/conversion');

const { Client } = require('whatsapp-web.js');
const fs = require('fs');

require('dotenv').config();

const virustotal = new VirusTotal();

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

const getAnalysis = async (msg, id) => {
    try {
        const result =  await virustotal.analyze(id)
        
        return result
    } catch (e) {
        client.sendMessage(msg.from, 'Mohon maaf, dokumen yang kamu kirimkan gagal dianalisis..');
        console.log('Failed to analyse. Error = ', e)
        return e
    }
}

client.on('message', async msg => {
    const messageData = msg['_data'];
    console.log('Message Received =======')
    console.log('From ', messageData['notifyName'])
    console.log('Message type ', messageData['type'])
    console.log('========================')
    if (msg.hasMedia) {
        console.log('Rewriting the document...');
        let mediaPath = './media/';
        const media = await msg.downloadMedia();

        client.sendMessage(msg.from, 'Pesan yang kamu kirim sedang kami proses..');
        if (messageData['type'] === 'document') {
            mediaPath = mediaPath + 'document/' + messageData['filename']; 
            fs.writeFile(mediaPath, JSON.stringify(media.data), 'base64', function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('File successfully writen.')
                    client.sendMessage(msg.from, 'Dokumen yang kamu kirimkan sudah kami terima..');
                    const fileSize = fs.statSync(mediaPath).size;
                    console.log('File size:', fileSize);
                    if (fileSize < 32000000) {
                        virustotal.uploadData({
                            file: mediaPath
                        })
                            .then(async (result) => {
                                const { data } = result;
                                console.log('========================')
                                console.log('Response file = ', data)
    
                                if (data.id) {
                                    client.sendMessage(msg.from, `Analisis sedang dilakukan. Estimasi waktu maksimal ${findEstimatedTime(fileSize).minutes} menit dan ${findEstimatedTime(fileSize).seconds} detik`);
                                    const date = new Date();
                                    const startDate = date.getTime();
        
                                    const fetchAnalysis = setInterval(async() => {
                                        const analysis = await getAnalysis(msg, data.id)
                                        const { attributes } = analysis
        
                                        console.log('========================')
                                        console.log('Get Analysis..', attributes.status)
                                        console.log('========================')

                                        
                                        const endDate = new Date().getTime();
                                        
                                        console.log('Time spend:', endDate - startDate, startDate, endDate);
                                        console.log('File size:', fileSize);
                                        console.log('Estimated size process:', fileSize/(endDate - startDate))
                                        
                                        if (attributes.status === 'completed') {
                                            const { stats } = attributes
                                            const statKeys = Object.keys(stats)
                                            const sumStat = statKeys.filter((e) => stats[e] > 0)
        
                                            console.log('========================')
                                            console.log('Analysis Result = ', stats, analysis)
        
                
                                            if (sumStat.length > 0) {
                                                client.sendMessage(msg.from, 'Saya mendeteksi sebuah virus pada file yang kamu kirimkan :(');
                                                client.sendMessage(msg.from, 'File kamu terdeteksi dalam kategori berikut: ' + '\n' + sumStat.join('\n'));
                                            } else {
                                                client.sendMessage(msg.from, 'Saya tidak mendeteksi adanya virus berbahaya pada file yang kamu kirimkan..');
                                            }
                                            clearInterval(fetchAnalysis)
                                        } else if ((endDate - startDate) === findEstimatedTime(fileSize).total) {
                                            client.sendMessage(msg.from, 'Mohon maaf, analisis membutuhkan waktu lebih lama dari estimasi.. Mohon ditunggu..');
                                        }
                                    }, 15000)
                                } else {
                                    client.sendMessage(msg.from, 'Maaf, berkas yang harus diproses terlalu besar..');
                                }
                            })
                    } else {
                        client.sendMessage(msg.from, 'Maaf, dokumen yang kamu kirimkan terlalu besar :(');
                    }
                }
            })
        }
    }
    else {
        console.log('Message ', messageData)
        msg.reply('Maaf format pesan yang kamu kirimkan tidak saya pahami :(')
    }
});

client.initialize();