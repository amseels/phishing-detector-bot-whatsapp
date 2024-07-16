const { VirusTotal } = require('../services/api/virusTotal');
const { findEstimatedTime } =  require('../helpers/conversion');

const virustotal = new VirusTotal();

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

const fetchAnalysis = setInterval(async(msg, data, fileSize, startDate) => {
    console.log('testing', data);
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

