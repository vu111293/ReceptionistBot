let rxhttp = require('rx-http-request').RxHttpRequest;
const mAccoutService = require('../services/AccountService');
const mCafeService = require('../services/CafeService');
const mStorage = require('../data-server');
const local = require('../localization');

module.exports = function (app) {

    app.post('/confirm', function (req, res) {
        let accountId = req.body.account_id; // string id
        let source = req.body.source;
        let confirm = req.body.confirm; // 'ok/cancel'
        let time = req.body.time; // 'min'
        let language = req.body.lang;

        if (accountId == null) {
            res.status(500).send({ msg: 'accountId param is required' });
            return;
        }

        if (source == null) {
            res.status(500).send({ msg: 'source param is required' });
            return;
        }

        if (confirm == null) {
            res.status(500).send({ msg: 'confirm param is required' });
            return;
        }

        if (confirm == 'ok' && time == null) {
            res.status(500).send({ msg: 'time param is required' });
            return;
        }

        if (language == null) {
            language = 'vi';
        } 
        local.setLocale(language);

        console.log(local.translate('bill_confirm_ok$[1]', + Number(parseInt(time) / 60).toFixed(0)));
        let account = mAccoutService.findAccountById(accountId);
        if (account) {
            
            let message = (confirm == 'ok')
                ? local.translate('bill_confirm_ok' + Number(parseInt(time) / 60).toFixed(0))
                : local.translate('bill_confirm_busy');

            if (source == 'SLACK' && account.slack_info.channel) {
                console.log("Channel " + account.slack_info.channel);
                console.log('Sending message to SLACK @@');
                mCafeService.callAPIPushSlackMessage(
                    account.slack_info.channel, message)
                    .then((rs) => res.status(200).send(rs))
                    .catch((err) => res.status(500).send({body: {error: 'Can\'t push to customer'}}));
            } else if (source == 'CHATBOT') {
                if (account.chatbot.token) {
                    let fbMessage = {
                        notification: {
                            title: 'Marika Cafe',
                            body: message
                        },
                        data: {
                            text: message
                        },
                        token: account.chatbot.token
                    }
                    console.log(fbMessage);
                    console.log('Sending message to CHATBOT @@');
                    mStorage.pushMessageToDevice(fbMessage)
                        .then((rs) => res.status(200).send({body: {}}))
                        .catch((err) => res.status(500).send({body: {error: 'Can\'t push to customer'}}));
                } else {
                    res.status(500).send({body: {error: 'Token was requred before'}});
                }
            } else {
                res.status(500).send({body: {error:'Platform not support'}});
            }
        } else {
            res.status(500).send({body: {error: 'Account not found'}});
        }
    });

    app.post('/pushtoken', function (req, res) {
        let chatbot_id = req.body.chatbot_id;
        let token = req.body.token;

        if (token == null || token == '') {
            res.status(500).send({ msg: 'Token is required' });
        }

        let account = mAccoutService.findAccountByChatbotSessionId(chatbot_id);
        if (account) {
            account.chatbot.token = token;
            mAccoutService.updateAccount(account);
            res.status(200).send({ msg: 'Token is updated' });
        } else {
            res.status(500).send({ msg: 'Account not found' });
        }
    });
}


