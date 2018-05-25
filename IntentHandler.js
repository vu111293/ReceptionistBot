
const { Card, Suggestion, Image, Text, Payload } = require('dialogflow-fulfillment');
const DialogflowUtils = require('./utils/DialogflowUtils');
const mStorage = require('./data-server');
const MAX_ITEM = 10;

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

class IntentHandler {


    constructor() {

    }

    slackViewMenu(agent) {
        // agent.setContext({
        //     name: LIST_DISPLAY,
        //     lifespan: 1,
        //     parameters: {
        //         name: 'categories',
        //         items: mStorage.buildCategories()
        //     }
        // });

        // if (SLACK_SUPPORT) {
        let formal = agent.parameters['ask_formal'];
        if (formal) {
            agent.add('Bạn không cần dùng *\"' + formal + "\"* vậy đâu, ngại lắm =)");
        }
        buildCategoriesUI(agent);
        // } else {
        //     agent.add('Xem danh mục trên màn hình');
        // }
    }

    slackViewDrink(agent) {
        let items = mStorage.getDrinkList(MAX_ITEM);
        if (items.length > 0) {
            buidlTitle(agent, 'thức uống');
            buildListUI(agent, items);
        } else {
            agent.add('Không có sản phẩm');
        }
        buildSuggesions(agent, ['xem thêm', 'giỏ hàng', 'menu', 'thanh toán']);
    }

    slackViewMoreDrink(agent) {
        let items = mStorage.getMoreDrinkList(MAX_ITEM);
        if (items.length > 0) {
            buidlTitle(agent, 'tiếp theo')
            buildListUI(agent, items);
        }
        buildSuggesions(agent, ['giỏ hàng', 'menu', 'thanh toán']);
    }

    slackViewThing(agent) {
        let items = mStorage.findKeywork(agent.query);
        if (items.length == 0) {
            buidlTitle(agent, 'không tìm thấy ' + agent.query);
            buildSuggesions(agent, ['menu']);
        } else if (items.length == 1) {
            agent.setFollowupEvent({
                name: 'ask-detail-event',
                lifespan: 2,
                parameters: {
                    product: items[0].name
                }
            });

            // buidlTitle(agent, 'sản phẩm')
            // let product = items[0];
            // mStorage.buildCardItem(agent, product);
            // buildNumberSelection(agent);
        } else {
            let labels = items.map(item => item.name);
            buidlTitle(agent, 'có phải ý bạn là ?')
            buildSuggesions(agent, labels);
        }
    }

    slackViewDetail(agent) {
        let product = agent.parameters['product'];
        if (product === undefined || !product) {
            product = agent.parameters['productevent'];
        }

        let mProduct = mStorage.findProduct(product);
        if (mProduct) {
            mStorage.buildCardItem(agent, mProduct);
            buidlTitle(agent, 'Bạn muốn mua mấy ly?');
            buildNumberSelection(agent);
        } else {
            agent.add('Không tìm thấy thông tin về *' + product + '*');
            agent.add('Vui lòng chọn sản phẩm khác');
            // mStorage.buildRichCategories(agent);
        }
    }

    slackPaymentRequest(agent) {
        let cart = agent.getContext('shoppingcart');
        buidlTitle(agent, 'Chọn hình thức thanh toán');
        buildSuggesions(agent, ['tại quán', 'ship tận nhà']);
    }

    slackPaymentWithNoneShip(agent) {
        fillAccountRequest(agent);
    }

    slackPaymentWithShip(agent) {
        fillAccountRequest(agent);
    }

    slackUsernameRequest(agent) {
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

    slackViewProductAnyTopping(agent) {
        let product = agent.parameters['product'];
        let mProduct = mStorage.findProduct(product);
        if (!mProduct) {
            agent.add('Hiện tại không bán ' + product);
            return;
        }

        let quantity = agent.parameters['quantity'];

        if(!quantity) {
            agent.setFollowupEvent({
                name: 'ask-detail-event',
                lifespan: 2,
                parameters: {
                    product: product
                }
            });
            return;
        }


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

    slackViewProducForOrder(agent) {
        let product = agent.parameters['product']; // required
        let mProduct = mStorage.findProduct(product);
        if (mProduct) {
            if (!agent.parameters['quantity']) {
                agent.setFollowupEvent({
                    name: 'ask-detail-event',
                    lifespan: 2,
                    parameters: {
                        product: product
                    }
                });
                return;
            }


            let event = findGroupEvent(mProduct.options);
            if (event) {
                agent.setFollowupEvent({
                    name: event,
                    parameters: {
                        'product': product
                    }
                });
            } else {
                agent.add('Hiện tại không bán *' + product + '*. Vui lòng chọn sản phẩm khác');
                mStorage.buildRichCategories(agent);

            }
        } else {
            agent.add('Hiện tại không bán *' + product + '*. Vui lòng chọn sản phẩm khác');
            mStorage.buildRichCategories(agent);
        }
    }
    
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
        buidlTitle(agent, 'Thông tin đơn hàng');
        let strReply = '';
        strReply += '• Người nhận *' + account.name + '*\n';
        strReply += '• Mã người nhận *' + account.id + '*\n';
        agent.add(strReply);

        let bill = getBillData(agent);
        bill.account = account;
        pushOrder(agent, bill);
    }
}

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
    agent.add("*ĐƠN HÀNG ĐÃ GỬI.* Vui lòng đợi xác nhận từ Marika.");
}

function buildCategoriesUI(agent) {
    // agent.add('Gõ tên mục cần xem sản phẩm. Ví dụ: \"thức ăn\"');
    mStorage.getCategoriesInSuggestion()
        .forEach(item => agent.add(item));
    // add menu context
    agent.setContext({
        name: 'ask-menu-context',
        lifespan: 2,
        parameters: {}
    });
}

function buildListUI(agent, items) {
    let str = "";
    items.forEach(item => str += item + "\n");
    agent.add(str);
}

function buildSuggesions(agent, options) {
    options.forEach(item => agent.add(new Suggestion(item.toUpperCase())));
}

function buidlTitle(agent, title) {
    agent.add('---- ' + title.toUpperCase() + ' ----');
}

function buildNumberSelection(agent) {
    for (let i = 1; i <= 5; ++i) {
        agent.add(new Suggestion(i.toString()));
    }
} 

module.exports = new IntentHandler();
