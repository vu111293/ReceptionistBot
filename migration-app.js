'use strict';


const conf = require('./configure');
const http = require('http');

let admin = require("firebase-admin", conf.SERVER_KEY_PATH);
let serviceAccount = require(conf.SERVER_KEY_PATH);


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: conf.FIREBASE_URL
});

// admin.database().ref('/').on('value', function (postSnapshot) {
//     mDs.parseFromFirebase(postSnapshot);
// });


console.log('****START MIGRATION****');
var options = {
    host: 'marika.cafe',
    port: 80,
    path: '/api/webapi/product/list',
    method: 'GET'
};

http.request(options, function (res) {
    // console.log('STATUS: ' + res.statusCode);
    // console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', function (chunk) {
        rawData += chunk;
    });
    res.on('end', () => {
        try {
            const result = JSON.parse(rawData);
            migrate(result.productDtos);
            // for (let i in result.productDtos) {
            //     let product = result.productDtos[i];
            //     console.log(JSON.stringify(product));
            // }

        } catch (e) {
            console.log(e);
        }
    });
}).end();


const DRINK_CATEGORY_ID = "59ae24131d1fa23fb84718f7";
const FOOD_CATEGORY_ID = "59ae24441d1fa23fb84718f9";
const NONE_CATEGORY_ID = "59ae24231d1fa23fb84718f8";

// Support methods
function migrate(products) {
    let catDrinkId = DRINK_CATEGORY_ID;
    let raw = "";
    for (let i in products) {
        let product = products[i];
        // console.log('\"' + product.name.toLowerCase() + '\",\"' + product.name.toLowerCase() + "\"");
        if (product.category_id == catDrinkId) {
            addToFirebase(product);
            console.log("added " + product.name);
        }
    }
    console.log(raw);
}

function addToFirebase(item) {
    admin.database().ref('drinklist/' + item.product_id).set({
        id: item.product_id,
        name: item.name,
        image: item.thumb,
        price: item.price,
        product_id: item._id,
        // options: none,
        // promotions: none,
        isrecommended: item.isRecommended,
        displaycashier: item.display_cashier,
        description: item.description,
        replacename: item.name.toLowerCase()
    });
}