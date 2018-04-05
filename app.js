'use strict';


const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion, Image, Text, Payload } = require('dialogflow-fulfillment');
const { Carousel } = require('actions-on-google');
const conf = require('./configure');
const DataServer = require('./data-server.js');
const util = require('util');

let uuidv4 = require('uuid/v4');
let moment = require('moment');
let express = require('express');
let bodyParse = require('body-parser');
let admin = require("firebase-admin", conf.SERVER_KEY_PATH);
let serviceAccount = require(conf.SERVER_KEY_PATH);
let temp = 0;

var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://m14.cloudmqtt.com', {
    port: 11235,
    username: 'cosllpth',
    password: 'mDz0FLgPrYJB'
});

client.on('connect', function () {
    client.subscribe('/gom/sensor/temperature')
    //    client.publish('presence', 'Hello mqtt')
})

client.on('message', function (topic, message) {
    // message is Buffer
    console.log(topic + " ->" + message.toString())
    temp = message;
    // client.end()
})


process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const SLACK_SUPPORT = true;
const imageUrl = 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png';
const imageUrl2 = 'https://lh3.googleusercontent.com/Nu3a6F80WfixUqf_ec_vgXy_c0-0r4VLJRXjVFF_X_CIilEu8B9fT35qyTEj_PEsKw';
const linkUrl = 'https://assistant.google.com/';

const LIST_DISPLAY = 'list-display-ui';
const IMAGE_DISPLAY = 'image-display-ui';
const CHART_DISPLAY = 'chart-display-ui';

const TOPPING_MAP = [
    {
        topping: ["sugar"],
        event: "askw-sugar-event"
    },
    {
        topping: ["sugar", "cream"],
        event: "askw-sugar-cream-event"
    },
    {
        topping: ["milk"],
        event: "askw-milk-event"
    }
];

let mDs = new DataServer();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: conf.FIREBASE_URL
});

admin.database().ref('/').on('value', function (postSnapshot) {
    mDs.parseFromFirebase(postSnapshot);
});

let app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParse.json({ type: 'application/json' }));

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

    function googleAssistantOther(agent) {
        // Get Actions on Google library conv instance
        let conv = agent.conv();
        // Use Actions on Google library to add responses
        conv.ask('Please choose an item:')
        conv.ask(new Carousel({
            title: 'Google Assistant',
            items: {
                'WorksWithGoogleAssistantItemKey': {
                    title: 'Works With the Google Assistant',
                    description: 'If you see this logo, you know it will work with the Google Assistant.',
                    image: {
                        url: imageUrl,
                        accessibilityText: 'Works With the Google Assistant logo',
                    },
                },
                'GoogleHomeItemKey': {
                    title: 'Google Home',
                    description: 'Google Home is a powerful speaker and voice Assistant.',
                    image: {
                        url: imageUrl2,
                        accessibilityText: 'Google Home',
                    },
                },
            },
        }))
        // Add Actions on Google library responses to your agent's response
        agent.add(conv);
    }

    function welcome(agent) {
        agent.add('Marika cafe xin kính chào quý khách!');
        mDs.buildHome(agent);
    }

    function fallback(agent) {
        agent.add('Yêu cầu không thể xử lí');
        agent.add('Xin thử lại với yêu cầu khác');





    }

    function other(agent) {
        agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
        agent.add(new Card({
            title: `Title: this is a card title`,
            imageUrl: imageUrl,
            text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
            buttonText: 'This is a button',
            buttonUrl: linkUrl
        })
        );
        agent.add(new Suggestion(`Quick Reply`));
        agent.add(new Suggestion(`Suggestion`));
        agent.add(new Text('Yeah this is text'));
        agent.add(new Image(imageUrl2));
        agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' } });
    }

    function askProductAnyTopping(agent) {
        let product = agent.parameters['product'];
        let mProduct = mDs.findProduct(product);
        if (!mProduct) {
            agent.add('Hiện tại không bán ' + product);
            return;
        }

        let quantity = agent.parameters['quantity'];
        let topping = agent.parameters['topping'];

        let parameters = {
            'product': product,
        };
        if (quantity) {
            parameters.quantity = quantity;
        }
        for (let i in topping) {
            let sp = topping[i].split('-');
            if (sp.length == 2) {
                parameters[sp[0]] = sp[1];
            }
        }

        let event = findGroupEvent(mProduct.options);
        if (event) {
            agent.setFollowupEvent({
                name: event,
                parameters: parameters
            });
        } else {
            agent.add('Hiện tại không bán ' + product);
        }
    }

    function askProducForOrder(agent) {
        let product = agent.parameters['product']; // required
        let mProduct = mDs.findProduct(product);
        if (mProduct) {
            let event = findGroupEvent(mProduct.options);
            if (event) {
                agent.setFollowupEvent({
                    name: event,
                    parameters: {
                        'product': product
                    }
                });
            } else {
                agent.add('Hiện tại không bán ' + product);
            }
        } else {
            agent.add('Hiện tại không bán ' + product);
        }
    }

    function askCart(agent) {
        viewCart(agent);
    }

    function paymentRequest(agent) {
        let cart = agent.getContext('shoppingcart');
        if (!cart || !cart.parameters.items || cart.parameters.items.length == 0) {
            agent.add('Bạn chưa chọn món. Xin mời bạn chọn');
            return;
        }

        // build bill detail

        agent.setFollowupEvent({
            name: 'username-request-event',
            parameters: {}
        });
        // createBill(agent, cart.parameters.items);
    }

    function agreeContinueShopping(agent) {
        mDs.buildRichCategories(agent);
    }

    function cancelContinueShopping(agent) {
        agent.add('Tiếp theo bạn có muốn xem giỏ hàng hoặc thanh toán');
        agent.add('Hoặc bạn có thể về quay lại danh mục chính của Marika Cafe');
    }

    function clearCart(agent) {
        let cart = agent.getContext('shoppingcart');
        if (!cart || !cart.parameters.items || cart.parameters.items.length == 0) {
            agent.add('Giỏ hàng hiện tại rỗng');
            return;
        }

        agent.add('Bạn có muốn xóa giỏ hàng hiện tại?');
    }

    function agreeClearCart(agent) {
        agent.setContext({
            name: 'shoppingcart',
            lifespan: 0,
            parameters: null
        });
        agent.add('Giỏ hàng đã được xóa. Xin mời bạn chọn món');
        mDs.buildRichCategories(agent);
    }

    function cancelClearCart(agent) {
        agent.add('Mời bạn chọn món');
    }

    function editCartRequest(agent) {
        let product = agent.parameters['product'];
        if (product !== "") {
            if (removeFromCart(agent, product)) {
                agent.add('Đã xóa *' + product + '* khỏi danh sách.');
                viewCartOnly(agent);
            } else {
                agent.add('Không tìm thấy *' + product + '* trong giỏ hàng.');
            }
        } else {
            if (viewCartOnly(agent)) {
                agent.add('Bạn muốn điều chỉnh như thế nào?');
            } else {
                // agent.add('Giỏ hàng rỗng. Mời bạn chọn sản phẩm');
                // mDs.buildRichCategories(agent);
            }
        }
    }

    function usernameRequest(agent) {
        let username = agent.parameters['username'];
        createBill(agent, username);
        agent.setContext({
            name: 'shoppingcart',
            lifespan: 0,
            parameters: null
        });
    }

    function askWithSugar(agent) {
        let product = agent.parameters['product'];
        let quantity = agent.parameters['quantity'];
        let sugar = agent.parameters['sugar'];

        addToCart(agent, mDs.findProduct(product), quantity, {
            'sugar': sugar
        });
    }

    function askNoneTopping(agent) {
        let product = agent.parameters['product'];
        let quantity = agent.parameters['quantity'];
        addToCart(agent, mDs.findProduct(product), quantity, null);
    }

    function multiOrderRequest(agent) {
        let request = [];
        let notfound = [];
        const maxCount = 4;
        for (let i = 0; i < maxCount; ++i) {
            let product = agent.parameters['item0' + (i + 1)];
            let quantity = agent.parameters['quantity0' + (i + 1)];
            let topping = agent.parameters['topping0' + (i + 1)];
            let mProduct;
            if (product) {
                mProduct = mDs.findProduct(product);
                if (mProduct === undefined) {
                    notfound.push(product);
                }
            }
            if (mProduct && quantity) {
                let options = [];
                for (let i in topping) {
                    let sp = topping[i].split('-');
                    if (sp.length == 2) {
                        options[sp[0]] = sp[1];
                    }
                }

                request.push({
                    product: mProduct,
                    quantity: quantity,
                    options: options
                });
            }
        }
        if (request.length > 0 || notfound.length > 0) {
            if (request.length > 0) {
                if (request.length == 1 && notfound.length == 0) { // single case -> ask topping
                    handleSingleItemWithTopping(request[0].product, request[0].quantity, request[0].options);
                } else {
                    addMultiToCart(agent, request);
                }
            }
            if (notfound.length > 0) {
                agent.add('Hiện tại không bán ' + notfound.join(', ') + '. Xin chọn sản phẩm khác');
            }
        } else {
            agent.add('Xin vui lòng thử lại');
        }
    }

    function askMenu(agent) {
        agent.setContext({
            name: LIST_DISPLAY,
            lifespan: 1,
            parameters: {
                name: 'categories',
                items: mDs.buildCategories()
            }
        });

        if (SLACK_SUPPORT) {
            agent.add('Mời bạn tham khảo danh mục bên dưới');
            mDs.buildRichCategories(agent);
        } else {
            agent.add('Xem danh mục trên màn hình');
        }
    }

    function askHot(agent) {
        agent.setContext({
            name: LIST_DISPLAY,
            lifespan: 1,
            parameters: {
                name: 'hot items',
                items: mDs.buildHotItems()
            }
        });
        agent.add('Xem món hot trên màn hình');
    }

    function askDrink(agent) {
        agent.setContext({
            name: LIST_DISPLAY,
            lifespan: 1,
            parameters: {
                name: 'drinks',
                items: mDs.buildDrinkItems()
            }
        });

        if (SLACK_SUPPORT) {
            mDs.buildRichDrinks(agent);
        } else {
            agent.add('Xem danh mục thức uống màn hình');
        }
    }

    function askFood(agent) {
        agent.setContext({
            name: LIST_DISPLAY,
            lifespan: 1,
            parameters: {
                name: 'foods',
                items: mDs.buildFoodItems()
            }
        });
        if (SLACK_SUPPORT) {
            mDs.buildRichFoods(agent);
        } else {
            agent.add('Xem danh mục món ăn màn hình');
        }
    }

    function askGifs(agent) {
        agent.setContext({
            name: LIST_DISPLAY,
            lifespan: 1,
            parameters: {
                name: 'gifts',
                items: mDs.buildGiftItems()
            }
        });
        if (SLACK_SUPPORT) {
            mDs.buildRichGifts(agent);
        } else {
            agent.add('Xem danh mục quà tặng trên màn hình');
        }
    }

    function askPromotion(agent) {
        agent.setContext({
            name: LIST_DISPLAY,
            lifespan: 1,
            parameters: {
                name: 'promotions',
                items: mDs.buildPromotions()
            }
        });

        if (SLACK_SUPPORT) {
            agent.add('Các chương trình khuyến mãi tại Marika Cafe');
            mDs.buildRichPromotions(agent);
        } else {
            agent.add('Xem chương trình khuyến mãi trên màn hình');
        }
    }

    function askDetail(agent) {
        let product = agent.parameters['product'];
        if (product === undefined || !product) {
            product = agent.parameters['productevent'];
        }

        let mProduct = mDs.findProduct(product);
        if (mProduct) {
            mDs.buildCardItem(agent, mProduct);
            agent.add('Bạn muốn mua mấy ly?');
        } else {
            // product = product.toLowerCase();
            // if (product.includes('menu') || product.includes('thực đơn'))
            agent.add('Không tìm thấy thông tin về *' + product + '*');
            agent.add('Vui lòng chọn sản phẩm khác');
            mDs.buildRichCategories(agent);
        }
    }

    function askDetailContinuePurchase(agent) {
        let quantity = agent.parameters['quantity'];
        if (quantity) {
            let askContext = agent.getContext('ask-detail-followup');
            let product = askContext.parameters['productevent'];
            if (product === undefined || !product) {
                product = askContext.parameters['product'];
            }
            let mProduct = mDs.findProduct(product);
            if (mProduct) {
                handleSingleItemWithTopping(mProduct, parseInt(quantity), null);
            } else {
                agent.add(product + ' chưa được kinh doanh tại quán. Xin vui lòng thử lại');
            }
        } else {
            agent.add('Mời bạn chọn sản phẩm khác');
            mDs.buildRichCategories(agent);
        }
    }

    // function agreeDetailItem(agent) {
    //     let askContext = agent.getContext('ask-detail-followup');
    //     let product = askContext.parameters['product'];
    //     let mProduct = mDs.findProduct(product);
    //     if (mProduct) {
    //         handleSingleItemWithTopping(mProduct, 1, null);
    //     } else {
    //         agent.add('Vui lòng gõ \"cho tôi {số lượng} {tên sản phẩm}\" bạn muốn mua');
    //     }
    // }

    // function cancelDetailItem(agent) {
    //     mDs.buildHome(agent);
    // }

    function askAnythings(agent) {
        let product = agent.parameters['product'];
        if (product) {
            let mProduct = mDs.findProduct(product);
            if (mProduct) {
                agent.add('Bạn muốn mua hay xem chi tiết *' + product + '*?');
                // handleSingleItemWithTopping(mProduct, 0, null);
            } else {
                agent.add(product + ' chưa được kinh doanh tại quán. Xin vui lòng thử lại');
            }
            return;
        }

        agent.add("Chưa xử lí");
    }

    function askThingsDetail(agent) {
        let askThingContext = agent.getContext('ask-anythings-followup');
        if (askThingContext) {
            let product = askThingContext.parameters['product'];
            if (product) {
                agent.setFollowupEvent({
                    name: 'ask-detail-event',
                    lifespan: 2,
                    parameters: {
                        product: product
                    }
                });
            } else {
                agent.add('Xãy ra lỗi. Vui lòng thử lại');
                mDs.buildRichCategories(agent);
            }
        } else {
            agent.add('Xãy ra lỗi. Vui lòng thử lại');
            mDs.buildRichCategories(agent);
        }
    }

    function askThingsPurchase(agent) {
        let askThingContext = agent.getContext('ask-anythings-followup');
        if (askThingContext) {
            let product = askThingContext.parameters['product'];
            if (product) {
                let mProduct = mDs.findProduct(product);
                if (mProduct) {
                    handleSingleItemWithTopping(mProduct, 0, null);
                } else {
                    agent.add('Không tìm thấy sản phẩm ' + product + '. Vui lòng thử sản phẩm khác');
                    mDs.buildRichCategories(agent);
                }
            } else {
                agent.add('Xãy ra lỗi. Vui lòng thử lại');
                mDs.buildRichCategories(agent);
            }
        } else {
            agent.add('Xãy ra lỗi. Vui lòng thử lại');
            mDs.buildRichCategories(agent);
        }
    }

    // Handler IOT
    function askTemperature(agent) {
        agent.add('Nhiệt độ hiện tại là *' + temp + '*°C');
    }

    // Handler help
    function helpRequest(agent) {
        agent.add('Marika xin kính chào quí khách');
        agent.add('Chi nhánh 74/13/4 Trương Quốc Dung, Phú Nhuận');
        agent.add('Gõ \"cho {số lượng} {tên món}\" để thêm món');
        agent.add('Gõ \"giỏ hàng\" để xem giỏ hàng hiện tại');
        agent.add('Gõ \"thanh toán\" để gửi yêu cầu đến Receptioniest Marika');
        agent.add('Gõ \"\"')
    }

    // Support methods
    function createBill(agent, username) {
        let items;
        let cart = agent.getContext('shoppingcart');
        if (cart && cart.parameters.items && cart.parameters.items.length > 0) {
            items = cart.parameters.items;
        } else {
            agent.add('Giỏ hàng rỗng. Vui lòng chọn món');
            return;
        }

        let totalPrice = 0;
        var options = [];
        for (let i in items) {
            totalPrice += parseInt(items[i].price);
        }

        // create new bill in firebase database
        let uid = uuidv4();
        admin.database().ref('/buillstack/' + uid).set({
            id: uid,
            username: username,
            orderlist: items,
            created: moment.now()
        });

        let condition = "'marika-coffee' in topics";
        // let topic = 'marika-coffee'
        let message = {
            notification: {
                title: 'Hóa đơn mới',
                body: 'Tổng hóa đơn ' + totalPrice + ' đồng.',
            },
            data: {
                type: 'take-away',
                orderId: uid,
                // ,
                // body: JSON.stringify(options)
            },
            condition: condition
            // topic: topic
        }
        admin.messaging().send(message)
            .then((response) => {
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error);
            });

        agent.add('Yêu cầu của bạn đã được gửi đến Marika Cafe');
        agent.add('Cảm ơn *' + username + '* đã sử dụng dịch vụ.')
        agent.add('Xin vui lòng đợi phục vụ');
    }

    function addMultiToCart(agent, products) {
        let speakout = [];
        let cartcontext = agent.getContext('shoppingcart');
        if (!cartcontext) {
            cartcontext = {
                name: 'shoppingcart',
                lifespan: 50,
                parameters: {
                    items: []
                }
            }
        }
        let items = cartcontext.parameters.items;
        if (!items) { items = []; }

        for (let i in products) {
            let item = products[i];
            items.push({
                'name': item.product.name,
                'price': item.product.price,
                'quantity': parseInt(item.quantity),
                'options': item.options
            });
            speakout.push(util.format('x %s *%s* - %s', item.quantity, item.product.name, convTopping(item.options)));
        }

        cartcontext.parameters = { 'items': items };
        agent.setContext(cartcontext);
        agent.add('Đã thêm:');
        for (let i in speakout) {
            agent.add(new Text(util.format('• %s', speakout[i])));
            // agent.add(new Suggestion(speakout[i]));
        }
        agent.add('Bạn có muốn chọn món kế tiếp?');
        buildNextAction(agent, ["THANH TOÁN", "ĐIỀU CHỈNH", "HỦY ĐƠN HÀNG"]);
        // agent.add('Gõ \"xem giỏ hàng\" để xem sản phẩm đã chọn');
        // agent.add('Gõ \"thanh toán\" để gửi yêu cầu thanh toán');
    }

    function findGroupEvent(options) {
        let found;
        let event = 'askw-nonetopping-event';

        if (!options) {
            return event;
        }
        for (let i in TOPPING_MAP) {
            found = true;
            for (let j in TOPPING_MAP[i].topping) {
                if (!options.includes(TOPPING_MAP[i].topping[j])) {
                    found = false;
                    break;
                }
            }
            if (found) {
                event = TOPPING_MAP[i].event;
                break;
            }
        }
        return event;
    }

    function viewCartOnly(agent) {
        let cartcontext = agent.getContext('shoppingcart');
        let ret = false;
        let total = 0;
        if (cartcontext != null && cartcontext.parameters.items != null) {
            agent.add('Giỏ hàng hiện tại của bạn là:');
            for (let i in cartcontext.parameters.items) {
                let item = cartcontext.parameters.items[i];
                agent.add(new Text(util.format('• %s x *%s*', item.quantity, item.name)));
                total += parseInt(item.price * item.quantity);
            }
            ret = true;
        }
        agent.add('Tổng tộng *' + mDs.formatPrice(total) + '* đồng');
        return ret;
    }

    function removeFromCart(agent, product) {
        let mProduct = mDs.findProduct(product);
        let found = false;
        if (mProduct) {
            let cartcontext = agent.getContext('shoppingcart');
            if (cartcontext != null && cartcontext.parameters.items != null) {
                let newItems = [];
                for (let i in cartcontext.parameters.items) {
                    let item = cartcontext.parameters.items[i];
                    if (mProduct.name.includes(item.name)) {
                        found = true;
                    } else {
                        newItems.push(item);
                    }
                }
                cartcontext.parameters.items = newItems;
            }
            agent.setContext(cartcontext);
        }
        return found;
    }

    function addToCart(agent, product, quantity, options) {
        let cartcontext = agent.getContext('shoppingcart');
        if (!cartcontext) {
            cartcontext = {
                name: 'shoppingcart',
                lifespan: 50,
                parameters: {
                    items: []
                }
            }
        }

        let items = cartcontext.parameters.items;
        if (!items) { items = []; }
        quantity = parseInt(quantity);
        items.push({
            'name': product.name,
            'price': product.price,
            'quantity': quantity,
            'options': options
        });
        cartcontext.parameters = { 'items': items };
        agent.setContext(cartcontext);
        agent.add('Đã thêm:');
        agent.add(new Text(util.format('• x%s *%s* - %s', quantity, product.name, convTopping(options))));
        // agent.add(new Suggestion(util.format('x %s *%s* - %s', quantity, product.name, convTopping(options))));
        agent.add('Bạn có muốn tiếp tục mua hàng?');
        buildNextAction(agent, ["THANH TOÁN", "ĐIỀU CHỈNH", "HỦY ĐƠN HÀNG"]);
        // agent.add('Gõ \"xem giỏ hàng\" để xem sản phẩm đã chọn');
        // agent.add('Gõ \"thanh toán\" để gửi yêu cầu thanh toán');
    }

    function buildNextAction(agent, actions) {
        for (let i in actions) {
            agent.add(new Suggestion(actions[i]));
        }
    }

    function convTopping(topping) {
        let out = [];
        if (topping) {
            let added = false;
            for (let k in topping) {
                let item = '';
                if (topping[k] == 'low') item = 'ít';
                else if (topping[k] == 'high') item = 'nhiều';
                else if (topping[k] == 'none') item = 'không';
                else continue;

                if (k == 'sugar') item += ' đường';
                else if (k == 'milk') item += ' sữa';
                else item += 'thing';
                out.push(item);
                added = true;
            }
            if (!added) {
                out.push('bình thường');
            }
        } else {
            out.push('bình thường');
        }

        return out.join(', ');
    }

    function handleSingleItemWithTopping(product, quantity, topping) {
        let parameters = {
            'product': product.name,
        };
        if (quantity > 0) {
            parameters.quantity = quantity;
        }
        // for (let i in topping) {
        //     let sp = topping[i].split('-');
        //     if (sp.length == 2) {
        //         parameters[sp[0]] = sp[1];
        //     }
        // }

        if (topping) {
            for (let k in topping) {
                parameters[k] = topping[k];
            }
        }

        let event = findGroupEvent(product.options);
        if (event) {
            agent.setFollowupEvent({
                name: event,
                parameters: parameters
            });
        } else {
            agent.add('Hiện tại không bán ' + product);
        }
    }


    function viewCart(agent) {
        let cart = agent.getContext('shoppingcart');
        if (!cart || !cart.parameters.items || cart.parameters.items.length == 0) {
            agent.add('Giỏ hàng rỗng. Xin mời bạn chọn món');
            mDs.buildRichCategories(agent);
            return;
        }

        agent.add('Hiện tại bạn có:')
        let total = 0;
        for (let i in cart.parameters.items) {
            let item = cart.parameters.items[i];
            // agent.add(new Suggestion(util.format('x%s *%s* - %s', parseInt(item.quantity), item.name, convTopping(item.options))));
            agent.add(new Text(util.format('• x%s *%s* - %s', parseInt(item.quantity), item.name, convTopping(item.options))));
            total += parseInt(item.price * item.quantity);
        }

        agent.add('Tổng tộng *' + mDs.formatPrice(total) + '* đồng');
        agent.add('Bạn có muốn tiếp tục mua hàng?');
        buildNextAction(agent, ["THANH TOÁN", "ĐIỀU CHỈNH", "HỦY ĐƠN HÀNG"]);
    }

    // Run the proper handler based on the matched Dialogflow intent
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('ask-product-order', askProducForOrder);

    // handle ask order by topping
    intentMap.set('ask-product-any-topping', askProductAnyTopping);
    intentMap.set('ask-with-sugar', askWithSugar);
    intentMap.set('ask-nonetopping', askNoneTopping);
    intentMap.set('multi-order-request', multiOrderRequest);

    // handle payment
    intentMap.set('ask-cart', askCart);
    intentMap.set('payment-request', paymentRequest);

    // handler after add cart item
    intentMap.set('agree-continue-shopping', agreeContinueShopping);
    intentMap.set('cancel-continue-shopping', cancelContinueShopping);

    intentMap.set('clear-cart', clearCart);
    intentMap.set('clear-cart - yes', agreeClearCart);
    intentMap.set('clear-cart - no', cancelClearCart);

    intentMap.set('edit-cart-request', editCartRequest);

    intentMap.set('username-request', usernameRequest);

    // menu handler
    intentMap.set('ask-menu', askMenu);
    intentMap.set('ask-hot', askHot);
    intentMap.set('ask-drink', askDrink);
    intentMap.set('ask-food', askFood);
    intentMap.set('ask-gift', askGifs);
    intentMap.set('ask-promotion', askPromotion);

    intentMap.set('ask-detail', askDetail);
    intentMap.set('ask-detail-continue-purchase', askDetailContinuePurchase);
    // intentMap.set('ask-detail - yes', agreeDetailItem);
    // intentMap.set('ask-detail - no', cancelDetailItem);

    // ask anythings
    intentMap.set('ask-anythings', askAnythings);
    intentMap.set('ask-anythings-detail', askThingsDetail);
    intentMap.set('ask-anythings-purchase', askThingsPurchase);

    // ask IOT
    intentMap.set('ask-temperature', askTemperature);

    // help handler
    intentMap.set('help-request', helpRequest);

    if (agent.requestSource === agent.ACTIONS_ON_GOOGLE) {
        intentMap.set(null, googleAssistantOther);
    } else {
        intentMap.set(null, other);
    }

    agent.handleRequest(intentMap);
});