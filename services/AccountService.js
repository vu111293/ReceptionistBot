let Promise = require('promise');
const fbService = require('./FirebaseService');


class AccountService {

    constructor() {
        this.accountList = [];
    }


    setAccountList(list) {
        this.accountList = list;
    }


    createAccount(user) {
        let account = {}
        switch (user.source) {
            case 'SLACK':
                account.slack_info = {
                    channel: user.info.channel,
                    userid: user.info.userid
                }
                break;

            case 'CHATBOT':
                account.chatbot = {
                    sessionid: user.info.sessionid
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
        return new Promise(function (resolve, reject) {
            if (this.accountList == null) {
                reject('Account list empty');
            } else {
                let account;
                for (let i in this.accountList) {
                    if (this.accountList[i].phone == phone) {
                        account = this.accountList[i];
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

    findAccountById(id) {
        let account;
        for (let i in this.accountList) {
            if (this.accountList[i].id == id) {
                account = this.accountList[i];
                break;
            }
        }
        return account;
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

    findAccountByChatbotSessionId(sessionId) {
        if (this.accountList == null) {
            return null;
        } else {
            let account = null;
            for (let i in this.accountList) {
                if (this.accountList[i].chatbot && this.accountList[i].chatbot.sessionid == sessionId) {
                    account = this.accountList[i];
                    break;
                }
            }
            return account;
        }
    }

    findAccountByAgent(user) {
        if (user.source == 'SLACK') {
            return this.findAccountBySlackId(user.info.userid);
        } else if (user.source == 'CHATBOT') {
            return this.findAccountByChatbotSessionId(user.info.sessionid);
        } else {
            return null;
        }
    }
}

module.exports = new AccountService();