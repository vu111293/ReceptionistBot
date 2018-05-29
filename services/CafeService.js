let Promise = require('promise');
let rxhttp = require('rx-http-request').RxHttpRequest;

class CafeService {

    constructor() {

    }

    callAPIPushSlackMessage(channel, message) {
        var options = {
            headers: {
                'Authorization': 'Bearer xoxp-26587670230-50175140002-371617991731-9ec4512e00e6453b7362cea636ad55c6',
                'Content-Type': 'application/json'
            },
    
            body: {
                // 'token': req.body.token,
                'channel': channel,
                'text': message,
                'username': 'Marika Cafe'
            },
            json: true
        }
    
        return new Promise(function (resolve, reject) {
            rxhttp.post('https://slack.com/api/chat.postMessage', options)
            .subscribe(
                (data) => {
                    let code = data.response.statusCode;
                    if (code == 200) {
                        resolve(data.response.toJSON());
                    } else {
                        reject('Error');
                    }
                },
                (err) => {
                    reject('Error');
                }
            );
        });
    }

}

module.exports = new CafeService();