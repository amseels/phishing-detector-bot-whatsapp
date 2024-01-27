
class VirusTotal {
    uploadData = (body) => {
        require('dotenv').config();
        const sdk = require('api')('@virustotal/v3.0#40nj53llc655dro');
        
        return sdk.postFiles(body, {
            'x-apikey': process.env.API_KEY
        })
                    .then(({ data }) => data)
                    .catch(err => err);
    }

    analyze = async (body) => {
        const axios = require('axios');
        require('dotenv').config();
        const options = {
            method: 'GET',
            url: `https://www.virustotal.com/api/v3/analyses/${body}`,
            headers: {accept: 'application/json', 'x-apikey': process.env.API_KEY}
          };
          
        return axios
            .request(options)
            .then(function (response) {
                return response.data.data;
            })
            .catch(function (error) {
                return error;
            });
    }
}

module.exports = { VirusTotal }