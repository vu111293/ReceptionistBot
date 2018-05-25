let Promise = require('promise');
const fbService = require('./FirebaseService');


class AccountService {

    constructor() {
        this.accountList = [];
    }


    setAccountList(list) {
        this.accountList = list;
    }


    createAccount(userInfo) {
        let account = {}
        switch(userInfo.source) {
            case 'slack':
                account.slack_info = {
                    channel: userInfo.info.channel,
                    userid: userInfo.info.userid
                } 
                break;  
        }
        fbService.createAccount(account);
        return account;
    }

    updateAccount(account) {
        fbService.updateAccount(account);
    }

    findAccount(phone) {
        return new Promise(function(resolve, reject) {
            if (this.accountList == null) {
                reject('Account list empty');
            } else {
                let account;
                for (let i in this.accountList) {
                    if (this.accountList[i].phone == phone) {
                        account = accountList[i];
                        break;
                    }
                }
                if (account) {
                    resolve(account);
                } else {
                    reject('Not found');
                }
            }
        });
    }

    findAccountBySlackId(slackId) {
        if (this.accountList == null) {
            return null;
        } else {
            let account = null;
            for (let i in this.accountList) {
                if (this.accountList[i].slack_info && this.accountList[i].slack_info.userid == slackId) {
                    account = this.accountList[i];
                    break;
                }
            }
            return account;
        }
    }

    findAccountByAgent(userInfo) {
        if (userInfo.source == 'slack') {
            return this.findAccountBySlackId(userInfo.info.userid);
        } else {
            return null;
        }
    }
}

module.exports = new AccountService();