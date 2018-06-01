var admin = require("firebase-admin");
var serviceAccount = require("../orderchatbot-firebase-admin.json");
let Promise = require('promise');


class FirebaseService {


    constructor() {
        // Initialize the app with a service account, granting admin privileges
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://orderchatbot.firebaseio.com"
        });
    }

    loadData(changed) {
        var db = admin.database();
        var ref = db.ref("/");
        ref.on("value", function (snapshot) {
            changed(snapshot.val());
        });
    }

    createAccount(account) {
        let key = admin.database().ref('accountlist').push().key;
        account.id = key;
        admin.database().ref('accountlist/' + key).set(account);
    }

    updateAccount(account) {
        admin.database().ref('accountlist/' + account.id).set(account);
    }

    create(path, model) {
        let key = admin.database().ref(path).push().key;
        model.id = key;
        admin.database().ref(path + key).set(model);
        return model;
    }

    push(message) {
        return new Promise(function(resolve, reject) {
            admin.messaging().send(message)
            .then((response) => {
                console.log(response);
                resolve(JSON.stringify(response));
            })
            .catch((error) => {
                console.log(error);
                reject(JSON.stringify(error));
            });
        });
    }
}

module.exports = new FirebaseService();