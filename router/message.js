let rxhttp = require('rx-http-request').RxHttpRequest;
const mStorage = require('..//data-server');

module.exports = function (app) {

    app.post('/confirm', function (req, res) {
        let accountId = req.body.account_id; // string id
        let confirm = req.body.confirm; // 'ok/cancel'
        let time = req.body.time; // 'min'

        let account = mStorage.findAccountById(accountId);


    });

    app.post('/reply', function (req, res) {

        var options = {
            headers: {
                'Authorization': 'Bearer ' + req.body.token,
                'Content-Type': 'application/json'
            },
    
            body: {
                // 'token': req.body.token,
                'channel': req.body.channel,
                'text': req.body.text,
                'username': req.body.username
            },
            json: true
        }
    
        rxhttp.post('https://slack.com/api/chat.postMessage', options)
            .subscribe(
                (data) => {
                    let code = data.response.statusCode;
                    if (code == 200) {
                        console.log(data.response.toJSON());
                        res.status(200).send('Ok');
                    } else {
                        res.status(500).send('Error');
                    }
                },
                (err) => {
                    res.status(500).send('Error');
                }
            );
    });
}