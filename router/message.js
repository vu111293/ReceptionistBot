let rxhttp = require('rx-http-request').RxHttpRequest;
const mAccoutService = require('../services/AccountService');
const mCafeService = require('../services/CafeService');

module.exports = function (app) {

    app.post('/confirm', function (req, res) {
        let accountId = req.body.account_id; // string id
        let confirm = req.body.confirm; // 'ok/cancel'
        let time = req.body.time; // 'min'

        let account = mAccoutService.findAccountById(accountId);
        if (account) {
            let message = (confirm == 'ok')
                ? 'Đơn hàng sẽ được giao đến bạn sau *' + Number(parseInt(time) / 60).toFixed(0) + ' phút*.\n Cảm ơn bạn đã sử dụng dịch vụ.'
                : 'Hiện tại dịch vụ đang bận. Vui lòng thử lại sau';
            mCafeService.callAPIPushSlackMessage(
                account.slack_info.channel, message)
                .then((rs) => res.status(200).send(rs))
                .catch((err) => res.status(500).send('Can\'t push to customer'));
        } else {
            res.status(500).send('Account not found')
        }
    });
}


