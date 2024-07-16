const fs = require('fs');

const writeFile = (fileName, data) => {
    mediaPath = './media/document/' + fileName; 
    fs.writeFile(mediaPath, JSON.stringify(data), 'base64', function (err) {
        if (err) {
            return new Error('Error writing files') 
        } else {
            return mediaPath
        }
    })
}
