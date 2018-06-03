'use strict';

// HEROKU HOST
// https://cofffee-shop.herokuapp.com/

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion, Image, Text, Payload } = require('dialogflow-fulfillment');
const { Carousel } = require('actions-on-google');
const conf = require('./configure');
const mStorage = require('./data-server');
const util = require('util');
const request = require('request');

// let localization = require('./localization');
let uuidv4 = require('uuid/v4');
let moment = require('moment');
let express = require('express');
let bodyParse = require('body-parser');
// let admin = require("firebase-admin");
// let serviceAccount = require("./orderchatbot-firebase-admin.json");
let temp = 0;

var mqtt = require('mqtt');
let rxhttp = require('rx-http-request').RxHttpRequest;
let DialogflowUtils = require('./utils/DialogflowUtils');
const intent = require('./IntentHandler');
// var client = mqtt.connect('mqtt://m14.cloudmqtt.com', {
//     port: 11235,
//     username: 'cosllpth',
//     password: 'mDz0FLgPrYJB'
// });

// client.on('connect', function () {
//     client.subscribe('/gom/sensor/temperature')
//     //    client.publish('presence', 'Hello mqtt')
// })

// client.on('message', function (topic, message) {
//     // message is Buffer
//     console.log(topic + " ->" + message.toString())
//     temp = message;
//     client.end();
// })


process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const SLACK_SUPPORT = true;
const imageUrl = 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png';
const imageUrl2 = 'https://lh3.googleusercontent.com/Nu3a6F80WfixUqf_ec_vgXy_c0-0r4VLJRXjVFF_X_CIilEu8B9fT35qyTEj_PEsKw';
const linkUrl = 'https://assistant.google.com/';

const NONE_LANG = "no";
const VIETNAMESE_LANG = "vi";
const ENGLIST_LANG = "en";
const JAPANESE_LANG = "jp";

const LIST_DISPLAY = 'list-display-ui';
const IMAGE_DISPLAY = 'image-display-ui';
const CHART_DISPLAY = 'chart-display-ui';


// const TOPPING_MAP = [
//     {
//         topping: ["sugar"],
//         event: "askw-sugar-event"
//     },
//     {
//         topping: ["sugar", "cream"],
//         event: "askw-sugar-cream-event"
//     },
//     {
//         topping: ["milk"],
//         event: "askw-milk-event"
//     }
// ];

let mCurrentLang = NONE_LANG;

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://orderchatbot.firebaseio.com"
// });

// // As an admin, the app has access to read and write all data, regardless of Security Rules
// var db = admin.database();
// var ref = db.ref("/");
// ref.on("value", function(snapshot) {
//   console.log(snapshot.val());
// });

// let mStorage = new DataServer();
let app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParse.json({ type: 'application/json' }));

require('./router/auth')(app);
require('./router/message')(app);
var server = app.listen(app.get('port'), function () {
    console.log('App host %s', server.address().address);
    console.log('App listening on port %s', server.address().port);
    console.log('Press Ctrl+C to quit.');
});

app.post('/', function (request, response) {
    // console.log('header: ' + JSON.stringify(request.headers));
    // console.log('body: ' + JSON.stringify(response.body));

    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    // function askThingsDetail(agent) {
    //     let askThingContext = agent.getContext('ask-anythings-followup');
    //     if (askThingContext) {
    //         let product = askThingContext.parameters['product'];
    //         if (product) {
    //             agent.setFollowupEvent({
    //                 name: 'ask-detail-event',
    //                 lifespan: 2,
    //                 parameters: {
    //                     product: product
    //                 }
    //             });
    //         } else {
    //             agent.add('Xãy ra lỗi. Vui lòng thử lại');
    //             mStorage.buildRichCategories(agent);
    //         }
    //     } else {
    //         agent.add('Xãy ra lỗi. Vui lòng thử lại');
    //         mStorage.buildRichCategories(agent);
    //     }
    // }

    // function askThingsPurchase(agent) {
    //     let askThingContext = agent.getContext('ask-anythings-followup');
    //     if (askThingContext) {
    //         let product = askThingContext.parameters['product'];
    //         if (product) {
    //             let mProduct = mStorage.findProduct(product);
    //             if (mProduct) {
    //                 handleSingleItemWithTopping(mProduct, 0, null);
    //             } else {
    //                 agent.add('Không tìm thấy sản phẩm ' + product + '. Vui lòng thử sản phẩm khác');
    //                 mStorage.buildRichCategories(agent);
    //             }
    //         } else {
    //             agent.add('Xãy ra lỗi. Vui lòng thử lại');
    //             mStorage.buildRichCategories(agent);
    //         }
    //     } else {
    //         agent.add('Xãy ra lỗi. Vui lòng thử lại');
    //         mStorage.buildRichCategories(agent);
    //     }   
    // }

   
    // Support methods

    // function getBillData(agent) {
    //     let items;
    //     let cart = agent.getContext('shoppingcart');
    //     if (cart && cart.parameters.items && cart.parameters.items.length > 0) {
    //         items = cart.parameters.items;
    //     } else {
    //         return null;
    //     }

    //     let totalPrice = 0;
    //     var options = [];
    //     for (let i in items) {
    //         totalPrice += parseInt(items[i].price);
    //     }

    //     return {
    //         items: items,
    //         // total: totalPrice
    //     }
    // }

    // function pushOrder(agent, bill) {

    //     // create new bill in firebase database
    //     let dbBill = mStorage.createBill(bill);
    //     let condition = "'marika-coffee' in topics";
    //     // let topic = 'marika-coffee'

    //     console.log(JSON.stringify(dbBill));

    //     let message = {
    //         notification: {
    //             title: 'Hóa đơn mới',
    //             body: 'Mã hóa đơn ' + dbBill.id,
    //         },
    //         data: {
    //             'raw': JSON.stringify(dbBill)
    //         },
    //         condition: condition
    //         // topic: topic
    //     }
    //     mStorage.pushMessage(message);
    //     agent.add("Push done");
    // }

    // function createBill(agent, username) {
    //     let items;
    //     let cart = agent.getContext('shoppingcart');
    //     if (cart && cart.parameters.items && cart.parameters.items.length > 0) {
    //         items = cart.parameters.items;
    //     } else {
    //         agent.add('Giỏ hàng rỗng. Vui lòng chọn món');
    //         return;
    //     }

    //     let totalPrice = 0;
    //     var options = [];
    //     for (let i in items) {
    //         totalPrice += parseInt(items[i].price);
    //     }

    //     // create new bill in firebase database
    //     let uid = uuidv4();
    //     admin.database().ref('/buillstack/' + uid).set({
    //         id: uid,
    //         username: username,
    //         orderlist: items,
    //         created: moment.now()
    //     });

    //     let condition = "'marika-coffee' in topics";
    //     // let topic = 'marika-coffee'
    //     let message = {
    //         notification: {
    //             title: 'Hóa đơn mới',
    //             body: 'Tổng hóa đơn ' + totalPrice + ' đồng.',
    //         },
    //         data: {
    //             type: 'take-away',
    //             orderId: uid,
    //             // ,
    //             // body: JSON.stringify(options)
    //         },
    //         condition: condition
    //         // topic: topic
    //     }
    //     admin.messaging().send(message)
    //         .then((response) => {
    //             console.log('Successfully sent message:', response);
    //         })
    //         .catch((error) => {
    //             console.log('Error sending message:', error);
    //         });

    //     agent.add('Yêu cầu của bạn đã được gửi đến Marika Cafe');
    //     agent.add('Cảm ơn *' + username + '* đã sử dụng dịch vụ.')
    //     agent.add('Xin vui lòng đợi phục vụ');
    //     agent.add('__*** *** ');
    //     agent.add('_********* ');
    //     agent.add('___***** ');
    //     agent.add('_____* ');
    //     agent.add('Mong bạn góp ý cách gõ *\"feedback\"* để Bot hoàn thiện hơn');
    // }


    // function setLanguagesContext(lang) {
    //     agent.setContext({
    //         name: 'languages',
    //         lifespan: 0,
    //         parameters: {
    //             "response_lang": lang
    //         }
    //     });
    // }

    // Run the proper handler based on the matched Dialogflow intent
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', intent.slackWelcome);
    intentMap.set('Default Fallback Intent', intent.slackViewThing);
    intentMap.set('ask-product-order', intent.slackViewProducForOrder);

    // handle languages
    intentMap.set('ask-languages', intent.slackAskLanguages);
    intentMap.set('ask-languages-response', intent.slackAskLanguagesResponse);


    // handle ask order by topping
    intentMap.set('ask-product-any-topping', intent.slackViewProductAnyTopping);
    intentMap.set('ask-with-sugar', intent.slackAskWithSugar);
    intentMap.set('ask-nonetopping', intent.slackAskNoneTopping);
    // intentMap.set('ask-nonetopping-cancel', askNoneToppingCancel);
    intentMap.set('multi-order-request', intent.slackMultiOrder);

    // handle payment
    intentMap.set('ask-cart', intent.slackViewCart);
    intentMap.set('payment-request', intent.slackPaymentRequest);
    intentMap.set('payment-request-noneship', intent.slackPaymentWithNoneShip);
    intentMap.set('payment-request-ship', intent.slackPaymentWithShip);
    intentMap.set('payment-confirm-continue', intent.slackPaymentContinue);
    intentMap.set('payment-edit-ship', intent.slackPaymentShipEdit)

    // // handler after add cart item
    // intentMap.set('agree-continue-shopping', agreeContinueShopping);
    // intentMap.set('cancel-continue-shopping', cancelContinueShopping);

    intentMap.set('clear-cart', intent.slackClearCart);
    intentMap.set('clear-cart - yes', intent.slackAgreeClearCart);
    intentMap.set('clear-cart - no', intent.slackCancelClearCart);

    intentMap.set('edit-cart-request', intent.slackEditCart);
    intentMap.set('list-items-in-cart', intent.slackListItemsInCart);
    intentMap.set('edit-cart-request-remove', intent.slackRemoveCartItem);
    intentMap.set('agree-remove-item-cart-request', intent.slackAgreeRemoveCartItem);
    intentMap.set('cancel-remove-item-cart-request', intent.slackCancelRemoveCartItem);

    intentMap.set('username-request', intent.slackUserNameRequest);
    intentMap.set('phone-request', intent.slackPhoneRequest);
    intentMap.set('address-request', intent.slackAddressRequest);

    // menu handler
    intentMap.set('ask-menu', intent.slackViewMenu);
    intentMap.set('ask-hot', intent.slackViewHot);
    intentMap.set('ask-drink', intent.slackViewDrink);
    intentMap.set('ask-drink-more', intent.slackViewMoreDrink);
    intentMap.set('ask-food', intent.slackViewFood);
    intentMap.set('ask-food-more', intent.slackViewMoreFood);
    // intentMap.set('ask-gift', askGifs);
    // intentMap.set('ask-promotion', askPromotion);
    intentMap.set('ask-none-cafe', intent.slackViewNoCafe);
    intentMap.set('ask-none-cafe-more', intent.slackViewMoreNoCafe);

    intentMap.set('ask-detail', intent.slackViewDetail);
    intentMap.set('ask-detail-continue-purchase', intent.slackViewDetailContinuePurchase);
    intentMap.set('quantity-request', intent.slackQuantityRequest);

    // intentMap.set('ask-detail - yes', agreeDetailItem);
    // intentMap.set('ask-detail - no', cancelDetailItem);

    // ask anythings
    intentMap.set('ask-anythings', intent.slackViewThing);
    // intentMap.set('ask-anythings-detail', askThingsDetail);
    // intentMap.set('ask-anythings-purchase', askThingsPurchase);

    // ask IOT
    // intentMap.set('ask-temperature', askTemperature);

    // feedback
    intentMap.set('feedback', intent.slackFeedback);

    // help handler
    intentMap.set('help-request', intent.slackHelpRequest);
    intentMap.set('clear-context', intent.slackClearContext);

    // if (agent.requestSource === agent.ACTIONS_ON_GOOGLE) {
    //     intentMap.set(null, googleAssistantOther);
    // } else {
    //     intentMap.set(null, other);
    // }

    agent.handleRequest(intentMap);
    // if (agent.locale === 'en') {
    //     agent.handleRequest(intentMap);
    // } else if (agent.locale === 'fr') {
    //     // agent.handleRequest(frIntentMap);
    // }
    // agent.handleRequest(intentMap);
});

// localization.setLocale('es');
// console.log(localization.translate('testing'));