'use strict';

// HEROKU HOST
// https://coffeeshop-bot.herokuapp.com

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion, Image, Text, Payload } = require('dialogflow-fulfillment');
const { Carousel } = require('actions-on-google');
const conf = require('./configure');
const mStorage = require('./data-server');
const util = require('util');
const request = require('request');

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

var server = app.listen(app.get('port'), function () {
    console.log('App host %s', server.address().address);
    console.log('App listening on port %s', server.address().port);
    console.log('Press Ctrl+C to quit.');
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

app.get('/auth/redirect', function (request, res) {
    let code = mStorage.authCode(request.query.code);
    request.get('https://slack.com/api/oauth.access?client_id=26587670230.340601737508&client_secret=7e3cc79f289771b5ee8ae1cb0448be6a&code=' + code,
        function (error, reponse, body) {
            console.log('error:', error); // Print the error if one occurred
            // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            console.log('body:', body); // Print the HTML for the Google homepage.
            res.status(200).send('Success');
        });
});

app.post('/', function (request, response) {
    // console.log('header: ' + JSON.stringify(request.headers));
    // console.log('body: ' + JSON.stringify(response.body));

    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    function welcome(agent) {
        if (mCurrentLang == VIETNAMESE_LANG) {
            agent.add('Marika cafe xin kính chào quý khách!');
        } else if (mCurrentLang == JAPANESE_LANG) {
            agent.add('GOOGLE');
        } else {
            agent.add('Welcome to Marika Cafe');
        }
        mStorage.buildHome(agent);
    }

    // function fallback(agent) {
    //     let items = mStorage.findKeywork(agent.query);
    //     if (items != null && items.length > 0) {
    //         agent.add('Ý bạn là: ');
    //         if (items.length < 3) {
    //             for (let item in items) {
    //                 agent.add(new Suggestion(items[item]));
    //             }
    //         } else {
    //             let speech = '';
    //             for (let item in items) {
    //                 speech += "• " + items[item] + "\n";
    //             }
    //             agent.add(speech);
    //         }
    //     } else {
    //         agent.add('Xãy ra lỗi, vui lòng thử lại');
    //         agent.add('Marika Cafe bot đang chạy thử nghiệm');
    //         agent.add('Mong bạn góp ý cách gõ \"feedback\" để Bot hoàn thiện hơn');
    //     }
    // }

    // function askProductAnyTopping(agent) {
    //     let product = agent.parameters['product'];
    //     let mProduct = mStorage.findProduct(product);
    //     if (!mProduct) {
    //         agent.add('Hiện tại không bán ' + product);
    //         return;
    //     }

    //     let quantity = agent.parameters['quantity'];
    //     let topping = agent.parameters['topping'];

    //     let parameters = {
    //         'product': product,
    //     };
    //     if (quantity) {
    //         parameters.quantity = quantity;
    //     }
    //     for (let i in topping) {
    //         let sp = topping[i].split('-');
    //         if (sp.length == 2) {
    //             parameters[sp[0]] = sp[1];
    //         }
    //     }

    //     let event = findGroupEvent(mProduct.options);
    //     if (event) {
    //         agent.setFollowupEvent({
    //             name: event,
    //             parameters: parameters
    //         });
    //     } else {
    //         agent.add('Hiện tại không bán ' + product);
    //     }
    // }

    // function askProducForOrder(agent) {
    //     let product = agent.parameters['product']; // required
    //     let mProduct = mStorage.findProduct(product);
    //     if (mProduct) {
    //         let event = findGroupEvent(mProduct.options);
    //         if (event) {
    //             agent.setFollowupEvent({
    //                 name: event,
    //                 parameters: {
    //                     'product': product
    //                 }
    //             });
    //         } else {
    //             agent.add('Hiện tại không bán *' + product + '*. Vui lòng chọn sản phẩm khác');
    //             mStorage.buildRichCategories(agent);

    //         }
    //     } else {
    //         agent.add('Hiện tại không bán *' + product + '*. Vui lòng chọn sản phẩm khác');
    //         mStorage.buildRichCategories(agent);
    //     }
    // }

    function askLanguages(agent) {
        agent.add("Chọn ngôn ngữ của bạn (Select your language bellow)");
        agent.add(new Suggestion("Việt Nam"));
        agent.add(new Suggestion("English"));
        agent.add(new Suggestion("Japanese"));
    }

    function askLanguagesResponse(agent) {
        let lang = agent.parameters['lang'];
        if (lang) {
            let speech = "";
            if (lang == 'Việt Nam') {
                mCurrentLang = VIETNAMESE_LANG;
                speech = "Bạn đã chọn ngôn ngữ Tiếng Việt.";
            } else if (lang == 'English') {
                mCurrentLang = ENGLIST_LANG;
                speech = "English language was selected";
            } else if (lang == 'Japanese') {
                mCurrentLang = JAPANESE_LANG;
                speech = "日本語が選ばれました。";
            } else {
                valid = false;
                speech = "Ngôn ngữ bạn chọn không được hỗ trợ.";
            }
            mStorage.setLang(mCurrentLang);
            agent.add(speech);
        } else {
            agent.add("Ngôn ngữ bạn chọn chưa được hỗ trợ.");
        }
    }

    function askCart(agent) {
        viewCart(agent);
    }

    function paymentRequest(agent) {
        let cart = agent.getContext('shoppingcart');
        agent.add('Chọn hình thức thanh toán');
        agent.add(new Suggestion("Tại quán"));
        agent.add(new Suggestion("Ship tận nhà"));
    }

    function paymentWithNoneShip(agent) {
        console.log("none ship");
    }

    function paymentWithShip(agent) {
        console.log("ship");

        fillAccountRequest(agent);
    }

    function fillAccountRequest(agent) {
        let userInfo = DialogflowUtils.parseUserInfo(agent);
        let account = mStorage.createOrUpdate(userInfo);

        if (account.name == null) {
            agent.setFollowupEvent({
                name: 'username-request-event',
                parameters: {
                    // 'account': account
                }
            });
        } else {
            // valid user infomation
            let strReply = 'Thông tin đơn hàng\n';
            strReply += 'Người nhận ' + account.name + '\n';
            strReply += 'Mã người nhận ' + account.id;


            agent.add(strReply);

            let bill = getBillData(agent);
            bill.account = account;
            pushOrder(agent, bill);
        }
    }

    function usernameRequest(agent) {
        let username = agent.parameters['username'];
        let userInfo = DialogflowUtils.parseUserInfo(agent);
        let account = mStorage.updateUserName(userInfo, username);
        fillAccountRequest(agent);

        // createBill(agent, username);
        // agent.setContext({
        //     name: 'shoppingcart',
        //     lifespan: 0,
        //     parameters: null
        // });
    }



    function agreeContinueShopping(agent) {
        mStorage.buildRichCategories(agent);
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
        agent.add(new Suggestion("CÓ"));
        agent.add(new Suggestion("KHÔNG"));
    }

    function agreeClearCart(agent) {
        agent.setContext({
            name: 'shoppingcart',
            lifespan: 0,
            parameters: null
        });
        agent.add('Giỏ hàng đã được xóa. Xin mời bạn chọn món');
        mStorage.buildRichCategories(agent);
    }

    function cancelClearCart(agent) {
        agent.add('Mời bạn chọn món');
    }

    function editCartRequest(agent) {
        let product = agent.parameters['product'];
        if (product !== "") {
            agent.add('Bạn muốn xóa sản phẩm *' + product + '* trong giỏ hàng?');

            // if (removeFromCart(agent, product)) {
            //     agent.add('Đã xóa *' + product + '* khỏi danh sách.');
            //     viewCartOnly(agent);
            // } else {
            //     agent.add('Không tìm thấy *' + product + '* trong giỏ hàng.');
            // }
        } else {
            if (viewCartOnly(agent)) {
                agent.add('Bạn muốn xóa sản phẩm nào?');
            } else {
                // agent.add('Giỏ hàng rỗng. Mời bạn chọn sản phẩm');
                // mDs.buildRichCategories(agent);
            }
        }
    }

    function removeItemCartRequest(agent) {
        let product = agent.parameters['product'];
        let quantity = agent.parameters['quantity'];
        if (product) {
            if (!quantity) {
                quantity = -1;
            }
            if (removeFromCart(agent, product, quantity)) {
                viewCartOnly(agent);
            } else {
                agent.add('Không tìm thấy *' + product + '* trong giỏ hàng.');
            }
        } else {
            agent.add('Không tìm thấy sản phẩm *' + product + '* trong giỏ hàng');
            viewCartOnly(agent);
        }
    }

    function agreeRemoveItemCartRequest(agent) {
        let context = agent.getContext('edit-cart-request-followup');
        if (context && context.parameters.product) {
            let product = context.parameters.product;
            let quantity = context.parameters.quantity;
            if (!quantity) {
                quantity = -1;
            }
            if (removeFromCart(agent, product, quantity)) {
                viewCartOnly(agent);
            } else {
                agent.add('Không tìm thấy *' + product + '* trong giỏ hàng.');
            }
        } else {
            agent.add('Không tìm thấy sản phẩm bạn yêu cầu trong giỏ hàng');
            viewCartOnly(agent);
        }
    }

    function cancelRemoveItemCartRequest(agent) {
        agent.add('Oke');
        viewCart(agent);
    }



    function askWithSugar(agent) {
        let product = agent.parameters['product'];
        let quantity = agent.parameters['quantity'];
        let sugar = agent.parameters['sugar'];

        addToCart(agent, mStorage.findProduct(product), quantity, {
            'sugar': sugar
        });
    }

    function askNoneTopping(agent) {
        let product = agent.parameters['product'];
        let quantity = agent.parameters['quantity'];
        addToCart(agent, mStorage.findProduct(product), quantity, null);
    }

    function askNoneToppingCancel(agent) {
        agent.add("Tiếp theo bạn có thể:");
        buildNextAction(agent, ["THANH TOÁN", "XEM GIỎ HÀNG", "ĐIỀU CHỈNH ĐƠN HÀNG"]);
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
                mProduct = mStorage.findProduct(product);
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

    // function askMenu(agent) {
    //     agent.setContext({
    //         name: LIST_DISPLAY,
    //         lifespan: 1,
    //         parameters: {
    //             name: 'categories',
    //             items: mStorage.buildCategories()
    //         }
    //     });

    //     if (SLACK_SUPPORT) {
    //         let formal = agent.parameters['ask_formal'];
    //         if (formal) {
    //             agent.add('Bạn không cần dùng *\"' + formal + "\"* vậy đâu, ngại lắm =)");
    //         }

    //         // agent.add('Mời bạn tham khảo danh mục bên dưới');
    //         mStorage.buildRichCategories(agent);
    //     } else {
    //         agent.add('Xem danh mục trên màn hình');
    //     }
    // }

    function askHot(agent) {
        agent.setContext({
            name: LIST_DISPLAY,
            lifespan: 1,
            parameters: {
                name: 'hot items',
                items: mStorage.buildHotItems()
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
                items: mStorage.buildDrinkItems()
            }
        });

        if (SLACK_SUPPORT) {
            mStorage.buildRichDrinks(agent);
        } else {
            agent.add('Xem danh mục thức uống màn hình');
        }
    }

    function askDrinkMore(agent) {
        mStorage.buildMoreRichDrinks(agent);
    }

    function askFood(agent) {
        agent.setContext({
            name: LIST_DISPLAY,
            lifespan: 1,
            parameters: {
                name: 'foods',
                items: mStorage.buildFoodItems()
            }
        });
        if (SLACK_SUPPORT) {
            mStorage.buildRichFoods(agent);
        } else {
            agent.add('Xem danh mục món ăn màn hình');
        }
    }

    function askFoodMore(agent) {
        mStorage.buildMoreRichFoods(agent);
    }

    function askGifs(agent) {
        agent.setContext({
            name: LIST_DISPLAY,
            lifespan: 1,
            parameters: {
                name: 'gifts',
                items: mStorage.buildGiftItems()
            }
        });
        if (SLACK_SUPPORT) {
            mStorage.buildRichGifts(agent);
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
                items: mStorage.buildPromotions()
            }
        });

        if (SLACK_SUPPORT) {
            agent.add('Các chương trình khuyến mãi tại Marika Cafe');
            mStorage.buildRichPromotions(agent);
        } else {
            agent.add('Xem chương trình khuyến mãi trên màn hình');
        }
    }

    function askNoneCafe(agent) {
        if (SLACK_SUPPORT) {
            mStorage.buildRichNoneCafe(agent);
        } else {
            agent.add('Xem danh mục quà tặng trên màn hình');
        }
    }

    function askNoneCafeMore(agent) {
        mStorage.buildMoreRichNoneCafe(agent);
    }

    function askDetail(agent) {
        let product = agent.parameters['product'];
        if (product === undefined || !product) {
            product = agent.parameters['productevent'];
        }

        let mProduct = mStorage.findProduct(product);
        if (mProduct) {
            mStorage.buildCardItem(agent, mProduct);
            agent.add('Bạn muốn mua mấy ly?');
            for (let i = 1; i <= 5; ++i) {
                agent.add(new Suggestion(i.toString()));
            }
        } else {
            // product = product.toLowerCase();
            // if (product.includes('menu') || product.includes('thực đơn'))
            agent.add('Không tìm thấy thông tin về *' + product + '*');
            agent.add('Vui lòng chọn sản phẩm khác');
            mStorage.buildRichCategories(agent);
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
            let mProduct = mStorage.findProduct(product);
            if (mProduct) {
                handleSingleItemWithTopping(mProduct, parseInt(quantity), null);
            } else {
                agent.add(product + ' chưa được kinh doanh tại quán. Xin vui lòng thử lại');
            }
        } else {
            agent.add('Mời bạn chọn sản phẩm khác');
            mStorage.buildRichCategories(agent);
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
            let mProduct = mStorage.findProduct(product);
            if (mProduct) {
                agent.add('Bạn muốn mua hay xem *' + product + '*?');
                agent.add(new Suggestion("MUA"));
                agent.add(new Suggestion("XEM"));
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
                mStorage.buildRichCategories(agent);
            }
        } else {
            agent.add('Xãy ra lỗi. Vui lòng thử lại');
            mStorage.buildRichCategories(agent);
        }
    }

    function askThingsPurchase(agent) {
        let askThingContext = agent.getContext('ask-anythings-followup');
        if (askThingContext) {
            let product = askThingContext.parameters['product'];
            if (product) {
                let mProduct = mStorage.findProduct(product);
                if (mProduct) {
                    handleSingleItemWithTopping(mProduct, 0, null);
                } else {
                    agent.add('Không tìm thấy sản phẩm ' + product + '. Vui lòng thử sản phẩm khác');
                    mStorage.buildRichCategories(agent);
                }
            } else {
                agent.add('Xãy ra lỗi. Vui lòng thử lại');
                mStorage.buildRichCategories(agent);
            }
        } else {
            agent.add('Xãy ra lỗi. Vui lòng thử lại');
            mStorage.buildRichCategories(agent);
        }   
    }

    // Handler IOT
    function askTemperature(agent) {
        agent.add('Nhiệt độ hiện tại là *' + temp + '*°C');
    }

    function feedback(agent) {
        let feedback = agent.parameters["feedback"];
        saveFeedback(feedback);
        agent.add("Chân thành cảm ơn góp ý của bạn. Chúc bạn 1 ngày vui vẻ tại Marika Cafe");
        agent.add(new Suggestion('HOME'));
    }

    // Handler help
    function helpRequest(agent) {
        agent.add('Marika xin kính chào quí khách');
        agent.add('Chi nhánh 74/13/4 Trương Quốc Dung, Phú Nhuận');
        agent.add('Gõ \"cho {số lượng} {tên món}\" để thêm món');
        agent.add('Gõ \"giỏ hàng\" để xem giỏ hàng hiện tại');
        agent.add('Gõ \"thanh toán\" để gửi yêu cầu đến Receptioniest Marika');
        agent.add('Gõ \"feedback\" để góp ý cho Receptioniest Marika');
        agent.add('Gõ \"\"')
    }

    function clearContext(agent) {
        agent.clearOutgoingContexts();
        agent.setLanguagesContext(mCurrentLang);
        welcome(agent);
    }

    // Support methods

    function getBillData(agent) {
        let items;
        let cart = agent.getContext('shoppingcart');
        if (cart && cart.parameters.items && cart.parameters.items.length > 0) {
            items = cart.parameters.items;
        } else {
            return null;
        }

        let totalPrice = 0;
        var options = [];
        for (let i in items) {
            totalPrice += parseInt(items[i].price);
        }

        return {
            items: items,
            // total: totalPrice
        }
    }

    function pushOrder(agent, bill) {

        // create new bill in firebase database
        let dbBill = mStorage.createBill(bill);
        let condition = "'marika-coffee' in topics";
        // let topic = 'marika-coffee'

        console.log(JSON.stringify(dbBill));

        let message = {
            notification: {
                title: 'Hóa đơn mới',
                body: 'Mã hóa đơn ' + dbBill.id,
            },
            data: {
                'raw': JSON.stringify(dbBill)
            },
            condition: condition
            // topic: topic
        }
        mStorage.pushMessage(message);
        agent.add("Push done");
    }

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
        agent.add('__*** *** ');
        agent.add('_********* ');
        agent.add('___***** ');
        agent.add('_____* ');
        agent.add('Mong bạn góp ý cách gõ *\"feedback\"* để Bot hoàn thiện hơn');
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
        agent.add(new Suggestion("CÓ"));
        agent.add(new Suggestion("KHÔNG"));
        // buildNextAction(agent, ["THANH TOÁN", "ĐIỀU CHỈNH", "HỦY ĐƠN HÀNG"]);
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
        agent.add('Tổng tộng *' + mStorage.formatPrice(total) + '* đồng');
        return ret;
    }

    function removeFromCart(agent, product, quantity) {
        let mProduct = mStorage.findProduct(product);
        let found = false;
        if (mProduct) {
            let cartcontext = agent.getContext('shoppingcart');
            if (cartcontext != null && cartcontext.parameters.items != null) {
                let newItems = [];
                for (let i in cartcontext.parameters.items) {
                    let item = cartcontext.parameters.items[i];
                    if (mProduct.name.includes(item.name)) {
                        found = true;
                        if (quantity > 0 && item.quantity - quantity > 0) {
                            item.quantity -= quantity;
                            newItems.push(item);
                        }
                    } else {
                        newItems.push(item);
                    }
                }
                cartcontext.parameters.items = newItems;
            }
            agent.setContext(cartcontext);
        }

        if (found) {
            if (quantity > 0) {
                agent.add(util.format('Đã xóa %s *%s* khỏi danh sách.', quantity, product));
            } else {
                agent.add(util.format('Đã xóa *%s* khỏi danh sách.', product));
            }
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
            'id': product.id,
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
        agent.add(new Suggestion("CÓ"));
        agent.add(new Suggestion("KHÔNG"));
        // buildNextAction(agent, ["THANH TOÁN", "ĐIỀU CHỈNH", "HỦY ĐƠN HÀNG"]);
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
            mStorage.buildRichCategories(agent);
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

        agent.add('Tổng tộng *' + mStorage.formatPrice(total) + '* đồng');
        agent.add('Bạn có muốn tiếp tục mua hàng?');
        agent.add(new Suggestion("CÓ"));
        agent.add(new Suggestion("KHÔNG"));
        // buildNextAction(agent, ["THANH TOÁN", "ĐIỀU CHỈNH", "HỦY ĐƠN HÀNG"]);
    }

    function saveFeedback(feedback) {
        let key = admin.database().ref('feedbacks').push().key;
        admin.database().ref('feedbacks/' + key).set({
            created: moment.now(),
            fb: feedback
        });
    }

    function setLanguagesContext(lang) {
        agent.setContext({
            name: 'languages',
            lifespan: 0,
            parameters: {
                "response_lang": lang
            }
        });
    }

    // Run the proper handler based on the matched Dialogflow intent
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', intent.slackViewThing);
    intentMap.set('ask-product-order', intent.slackViewProducForOrder);

    // handle languages
    intentMap.set('ask-languages', askLanguages);
    intentMap.set('ask-languages-response', askLanguagesResponse);


    // handle ask order by topping
    intentMap.set('ask-product-any-topping', intent.slackViewProductAnyTopping);
    intentMap.set('ask-with-sugar', askWithSugar);
    intentMap.set('ask-nonetopping', askNoneTopping);
    intentMap.set('ask-nonetopping-cancel', askNoneToppingCancel);
    intentMap.set('multi-order-request', multiOrderRequest);

    // handle payment
    intentMap.set('ask-cart', askCart);
    intentMap.set('payment-request', intent.slackPaymentRequest);
    intentMap.set('payment-request-noneship', intent.slackPaymentWithNoneShip);
    intentMap.set('payment-request-ship', intent.slackPaymentWithShip);

    // handler after add cart item
    intentMap.set('agree-continue-shopping', agreeContinueShopping);
    intentMap.set('cancel-continue-shopping', cancelContinueShopping);

    intentMap.set('clear-cart', clearCart);
    intentMap.set('clear-cart - yes', agreeClearCart);
    intentMap.set('clear-cart - no', cancelClearCart);

    intentMap.set('edit-cart-request', editCartRequest);
    intentMap.set('remove-item-cart-request', removeItemCartRequest);
    intentMap.set('agree-remove-item-cart-request', agreeRemoveItemCartRequest);
    intentMap.set('cancel-remove-item-cart-request', cancelRemoveItemCartRequest);

    intentMap.set('username-request', usernameRequest);

    // menu handler
    intentMap.set('ask-menu', intent.slackViewMenu);
    intentMap.set('ask-hot', askHot);
    intentMap.set('ask-drink', intent.slackViewDrink);
    intentMap.set('ask-drink-more', intent.slackViewMoreDrink);
    intentMap.set('ask-food', askFood);
    intentMap.set('ask-food-more', askFoodMore);
    intentMap.set('ask-gift', askGifs);
    intentMap.set('ask-promotion', askPromotion);
    intentMap.set('ask-none-cafe', askNoneCafe);
    intentMap.set('ask-none-cafe-more', askNoneCafeMore);

    intentMap.set('ask-detail', intent.slackViewDetail);
    intentMap.set('ask-detail-continue-purchase', askDetailContinuePurchase);

    // intentMap.set('ask-detail - yes', agreeDetailItem);
    // intentMap.set('ask-detail - no', cancelDetailItem);

    // ask anythings
    intentMap.set('ask-anythings', intent.slackViewThing);
    intentMap.set('ask-anythings-detail', askThingsDetail);
    intentMap.set('ask-anythings-purchase', askThingsPurchase);

    // ask IOT
    intentMap.set('ask-temperature', askTemperature);

    // feedback
    intentMap.set('feedback', feedback);

    // help handler
    intentMap.set('help-request', helpRequest);
    intentMap.set('clear-context', clearContext);

    // if (agent.requestSource === agent.ACTIONS_ON_GOOGLE) {
    //     intentMap.set(null, googleAssistantOther);
    // } else {
    //     intentMap.set(null, other);
    // }

    if (agent.locale === 'en') {
        agent.handleRequest(intentMap);
    } else if (agent.locale === 'fr') {
        // agent.handleRequest(frIntentMap);
    }
    // agent.handleRequest(intentMap);
});