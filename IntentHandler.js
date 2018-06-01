const util = require('util');
const { Card, Suggestion, Image, Text, Payload } = require('dialogflow-fulfillment');
const DialogflowUtils = require('./utils/DialogflowUtils');
const mStorage = require('./data-server');

const MAX_ITEM = 10;
const IMAGE_URL = 'http://marika.cafe/images/';
const MARIKA_HOMEPAGE_URL = 'http://marika.cafe/';

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


const FCM_REQUIRE_CMD = 'fcm_require_token'; // require client send FCM token
const PHONE_NUMBER_INPUT = 'phone_number_input';
const ADDRESS_INPUT = 'address_input';
const STRING_INPUT = 'string_input';


class IntentHandler {

    constructor() {

    }

    slackWelcome(agent) {
        // if (mCurrentLang == VIETNAMESE_LANG) {
        //     agent.add('Marika cafe xin kính chào quý khách!');
        // } else if (mCurrentLang == JAPANESE_LANG) {
        //     agent.add('GOOGLE');
        // } else {
        //     agent.add('Welcome to Marika Cafe');
        // }

        // buidlTitle(agent, 'Marika cafe xin kính chào quý khách!');
        // builMenuList(agent);

        addContextMenu(agent)
        response(
            agent,
            'Marika cafe xin kính chào quý khách!',
            null,
            mStorage.getCategories(),
            'Mời bạn chọn menu');
    }

    slackAskLanguages(agent) {
        // buidlTitle(agent, "Chọn ngôn ngữ của bạn (Select your language bellow)");
        // buildSuggesions(agent, ['việt nam', 'english', 'japanese']);

        response(agent, 'Chọn ngôn ngữ của bạn (Select your language bellow)', null,
            ['việt nam', 'english', 'japanese']);
    }

    slackAskLanguagesResponse(agent) {
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
            // agent.add(speech);
            response(agent, speech);
        } else {
            // agent.add("Ngôn ngữ bạn chọn chưa được hỗ trợ.");
            response(agent, 'Ngôn ngữ bạn chọn chưa được hỗ trợ');
        }
    }

    slackViewMenu(agent) {
        // let formal = agent.parameters['ask_formal'];
        // if (formal) {
        //     agent.add('Bạn không cần dùng *\"' + formal + "\"* vậy đâu, ngại lắm =)");
        // }
        // builMenuList(agent);

        addContextMenu(agent);
        response(agent, 'Menu', null, mStorage.getCategories(), 'Mời bạn chọn menu');
    }

    slackViewDrink(agent) {
        let items = mStorage.getDrinkList(MAX_ITEM);
        if (items.length > 0) {
            items.push('(Gợi ý: gõ tên món bạn chọn, ví dụ: pepsi)');
        } else {
            items.push('Không có sản phẩm');
        }

        response(agent, 'thức uống', items, ['xem thêm', 'giỏ hàng', 'menu'], 'Mời chọn món');
    }

    slackViewMoreDrink(agent) {
        let items = mStorage.getMoreDrinkList(MAX_ITEM);
        if (items.length > 0) {
            items.push('(Gợi ý: gõ tên món bạn chọn, ví dụ: pepsi)');
        } else {
            items.push('Không có sản phẩm');
        }

        response(agent, 'tiếp theo', items, ['giỏ hàng', 'menu']);
    }

    slackViewFood(agent) {
        let items = mStorage.getFoodList(MAX_ITEM);
        if (items.length > 0) {
            items.push('(Gợi ý: gõ tên món bạn chọn, ví dụ: kikat)');
        } else {
            items.push('Không có sản phẩm');
        }

        response(agent, 'món ăn', items, ['xem thêm', 'giỏ hàng', 'menu'], 'Mời chọn món');
    }

    slackViewMoreFood(agent) {
        let items = mStorage.getMoreFoodList(MAX_ITEM);
        if (items.length > 0) {
            items.push('(Gợi ý: gõ tên món bạn chọn, ví dụ: kitkat)');
        } else {
            items.push('Không có sản phẩm');
        }

        response(agent, 'tiếp theo', items, ['giỏ hàng', 'menu']);
    }

    slackViewNoCafe(agent) {
        let items = mStorage.getNoCafeList(MAX_ITEM);
        if (items.length > 0) {
            items.push('(Gợi ý: gõ tên món bạn chọn, ví dụ: khăn giấy)');
        } else {
            items.push('Không có sản phẩm');
        }

        response(agent, 'sản phẩm', items, ['xem thêm', 'giỏ hàng', 'menu'], 'Mời chọn món');
    }

    slackViewMoreNoCafe(agent) {
        let items = mStorage.getMoreNoCafeList(MAX_ITEM);
        if (items.length > 0) {
            items.push('(Gợi ý: gõ tên món bạn chọn, ví dụ: khăn giấy)');
        } else {
            items.push('Không có sản phẩm');
        }

        response(agent, 'tiếp theo', items, ['giỏ hàng', 'menu']);
    }

    slackViewHot(agent) {
        let items = mStorage.getHotItems(MAX_ITEM);
        if (items.length > 0) {
            items.push('(Gợi ý: gõ tên món bạn chọn, ví dụ: pepsi)');
        } else {
            items.push('Không có sản phẩm');
        }

        response(agent, 'món phổ biến', items, ['xem thêm', 'giỏ hàng', 'menu'], 'Mời chọn món');
    }

    slackViewThing(agent) {
        let items = mStorage.findKeywork(agent.query);
        if (items.length == 0) {
            response(agent, 'không tìm thấy ' + agent.query, null, ['menu']);
            // buidlTitle(agent, 'không tìm thấy ' + agent.query);
            // buildSuggesions(agent, ['menu']);
        } else if (items.length == 1) {
            agent.setFollowupEvent({
                name: 'ask-detail-event',
                lifespan: 2,
                parameters: {
                    product: items[0].name
                }
            });
        } else {
            let labels = items.map(item => item.name);
            response(agent, 'có phải ý bạn là ?', null, labels);
        }
    }

    slackViewDetail(agent) {
        let product = agent.parameters['product'];
        if (product === undefined || !product) {
            product = agent.parameters['productevent'];
        }

        let items = mStorage.findKeywork(product);
        if (items.length > 1) {
            let labels = items.map(item => item.name);
            response(agent, 'có phải ý bạn là ?', null, labels);
            return;
        }

        let mProduct = mStorage.findProduct(product);
        if (mProduct) {
            let card = buildCardItem(agent, mProduct);
            // buidlTitle(agent, 'Chọn số lượng ?');
            // buildNumberSelection(agent);
            response(agent, 'Chọn số lượng ?', card, ['1', '2', '3', 'khác', 'chọn món khác']);
        } else {
            // agent.add('Không tìm thấy thông tin về *' + product + '*');
            // agent.add('Vui lòng chọn sản phẩm khác');
            response(agent, 'Không tìm thấy thông tin về *' + product + '*', 'Vui lòng chọn sản phẩm khác', []);
            // mStorage.buildRichCategories(agent);
        }
    }

    slackViewDetailContinuePurchase(agent) {
        let quantity = agent.parameters['quantity'];
        if (quantity) {
            let askContext = agent.getContext('ask-detail-followup');
            let product = askContext.parameters['productevent'];
            if (product === undefined || !product) {
                product = askContext.parameters['product'];
            }
            let mProduct = mStorage.findProduct(product);
            if (mProduct) {
                handleSingleItemWithTopping(agent, mProduct, parseInt(quantity), null);
            } else {
                response(agent, product + ' chưa được kinh doanh tại quán', 'Xin vui lòng thử lại', [],
                    product + ' chưa được kinh doanh tại quán. Xin vui lòng thử lại');
                // agent.add(product + ' chưa được kinh doanh tại quán. Xin vui lòng thử lại');
            }
        } else {
            // agent.add('Mời bạn chọn sản phẩm khác');
            response(agent, 'Mời bạn chọn sản phẩm khác')
            // mStorage.buildRichCategories(agent);
        }
    }

    slackPaymentRequest(agent) {
        if (isCartEmpty(agent)) {
            response(agent, 'Giỏ hàng rỗng', 'Vui lòng thêm sản phẩm vào giỏ hàng', ['menu']);
            return;
        }

        let cart = agent.getContext('shoppingcart');
        response(agent, 'Chọn hình thức thanh toán', null, ['tại quán', 'ship tận nhà']);
        // buidlTitle(agent, 'Chọn hình thức thanh toán');
        // buildSuggesions(agent, ['tại quán', 'ship tận nhà']);
    }

    slackPaymentWithNoneShip(agent) {
        if (isCartEmpty(agent)) {
            response(agent, 'Giỏ hàng rỗng', 'Vui lòng thêm sản phẩm vào giỏ hàng', ['menu']);
            return;
        }

        setBillShipMethod(agent, false);
        fillAccountRequest(agent);
    }

    slackPaymentWithShip(agent) {
        if (isCartEmpty(agent)) {
            response(agent, 'Giỏ hàng rỗng', 'Vui lòng thêm sản phẩm vào giỏ hàng', ['menu']);
            return;
        }

        setBillShipMethod(agent, true);
        fillAccountRequest(agent, true);
    }

    slackPaymentContinue(agent) {
        if (isCartEmpty(agent)) {
            response(agent, 'Giỏ hàng rỗng', 'Vui lòng thêm sản phẩm vào giỏ hàng', ['menu']);
            return;
        }

        let account = getAccount(agent);
        let bill = getBillData(agent);
        bill.account = account;
        pushOrder(agent, bill);
    }

    slackPaymentShipEdit(agent) {
        buildShipEditSuggestion(agent);
    }

    slackViewProductAnyTopping(agent) {
        let product = agent.parameters['product'];

        let items = mStorage.findKeywork(product);
        if (items.length > 1) {
            let labels = items.map(item => item.name);
            response(agent, 'có phải ý bạn là ?', null, labels);
            return;
        }

        let mProduct = mStorage.findProduct(product);
        if (!mProduct) {
            response(agent, 'Hiện tại không bán ' + product, null, ['menu', 'thanh toán']);
            // agent.add('Hiện tại không bán ' + product);
            return;
        }

        let quantity = agent.parameters['quantity'];
        if (!quantity) {
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
            response(agent, 'Hiện tại không bán ' + product, null, ['menu', 'thanh toán']);
        }
    }

    slackAskWithSugar(agent) {
        let product = agent.parameters['product'];
        let quantity = agent.parameters['quantity'];
        let sugar = agent.parameters['sugar'];

        addToCart(agent, mStorage.findProduct(product), quantity, {
            'sugar': sugar
        });
    }

    slackAskNoneTopping(agent) {
        let product = agent.parameters['product'];
        let quantity = agent.parameters['quantity'];
        addToCart(agent, mStorage.findProduct(product), quantity, null);
        // buildSuggesions(agent, ['menu', 'giỏ hàng'], true);
    }

    slackMultiOrder(agent) {
        let request = [];
        let notfound = [];
        const maxCount = 4;
        for (let i = 0; i < maxCount; ++i) {
            let product = agent.parameters['item0' + (i + 1)];
            let quantity = agent.parameters['quantity0' + (i + 1)];
            let qty = agent.parameters['qty0' + (i + 1)];
            let topping = agent.parameters['topping0' + (i + 1)];
            let mProduct;
            if (product) {
                mProduct = mStorage.findProduct(product);
                if (mProduct === undefined) {
                    notfound.push(product);
                }
            }

            if (qty) { quantity = qty; }
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
                    handleSingleItemWithTopping(agent, request[0].product, request[0].quantity, request[0].options);
                } else {
                    addMultiToCart(agent, request);
                }
            }
            if (notfound.length > 0) {
                response(agent, 'Hiện tại không bán ' + notfound.join(', '), 'Xin chọn sản phẩm khác', [],
                    'Hiện tại không bán ' + notfound.join(', ') + '. Xin chọn sản phẩm khác');
            }
        } else {
            response(agent, 'Xin vui lòng thử lại');
        }
    }

    slackViewProducForOrder(agent) {
        let product = agent.parameters['product']; // required

        let items = mStorage.findKeywork(product);
        if (items.length > 1) {
            let labels = items.map(item => item.name);
            response(agent, 'có phải ý bạn là ?', null, labels);
            return;
        }

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
                response(agent, 'Hiện tại không bán ' + product, 'Xin chọn sản phẩm khác', [],
                    'Hiện tại không bán ' + product + '. Xin chọn sản phẩm khác');
            }
        } else {
            response(agent, 'Hiện tại không bán ' + product, 'Xin chọn sản phẩm khác', [],
                'Hiện tại không bán ' + product + '. Xin chọn sản phẩm khác');
        }
    }

    slackViewCart(agent) {
        displayCart(agent);
    }

    slackClearCart(agent) {
        if (isCartEmpty(agent)) {
            response(agent, 'giỏ hàng rỗng', null, ['menu']);
        } else {
            response(agent, 'Bạn có muốn xóa giỏ hàng hiện tại?', null, ['có', 'không']);
        }
    }

    slackEditCart(agent) {
        if (isCartEmpty(agent)) {
            response(agent, 'giỏ hàng rỗng', null, ['menu']);
        } else {
            // agent.setFollowupEvent({
            //     name: 'remove-item-cart-event',
            //     lifespan: 1,
            //     parameters: {
            //         // 'product': product
            //     }
            // });

            let product = agent.parameters['product'];
            if (product !== "") {
                response(agent, 'Bạn muốn xóa sản phẩm *' + product + '* trong giỏ hàng?', null, ['có', 'không']);
            } else {
                response(agent, 'Bạn muốn xóa sản phẩm nào?', null, getItemsSugession(agent));
            }
        }
    }

    slackRemoveCartItem(agent) {
        let product = agent.parameters['product'];
        let quantity = agent.parameters['quantity'];
        let title = '';
        if (product) {
            if (!quantity) {
                quantity = -1;
            }
            if (removeItemInCart(agent, product, quantity)) {
                if (quantity > 0) {
                    title = util.format('Đã xóa %s *%s* khỏi danh sách.', quantity, product);
                } else {
                    title = util.format('Đã xóa *%s* khỏi danh sách.', product);
                }
            } else {
                title = 'Không tìm thấy *' + product + '* trong giỏ hàng.';
            }
        } else {
            title = 'Không tìm thấy sản phẩm *' + product + '* trong giỏ hàng';
        }

        // displayCart(agent);
        response(agent, title, getItemsInCart(agent), ['thanh toán', 'điều chỉnh giỏ hàng', 'menu']);
    }

    slackAgreeRemoveCartItem(agent) {
        let context = agent.getContext('edit-cart-request-followup');
        if (context && context.parameters.product) {
            slackRemoveCartItem(agent);
        } else {
            response(agent, 'Không tìm thấy sản phẩm bạn yêu cầu trong giỏ hàng', null, ['giỏ hàng', 'men']);
        }
    }

    slackCancelRemoveCartItem(agent) {
        response(agent, null, null, ['menu']);
    }

    slackAgreeClearCart(agent) {
        clearCart(agent);
        response(agent, 'xóa giỏ hàng thành công', null, ['menu']);
    }

    slackCancelClearCart(agent) {
        response(agent, null, null, ['menu']);
    }

    // Payment session
    slackUserNameRequest(agent) {
        let editMode = agent.getContext('ship-edit') != null;
        let username = agent.parameters['username'];

        if (isEmpty(username)) {
            response(agent, 'Nhập tên bạn bên dưới', null, [], '', [STRING_INPUT]);
            return;
        }

        let ship = agent.parameters['ship'];
        if (ship == null) {
            console.log('@not handler ship is nil');
        }

        let userInfo = DialogflowUtils.parseUserInfo(agent);
        let account = mStorage.updateUserName(userInfo, username);

        if (editMode) {
            addContextShipEdit(agent);
            buildShipInfo(agent);
        } else {
            fillAccountRequest(agent, ship);
        }
    }

    slackPhoneRequest(agent) {
        let editMode = agent.getContext('ship-edit') != null;
        let phone = agent.parameters['phone'];

        if (isEmpty(phone)) {
            response(agent, 'Nhập số điện thoại', null, [], '', [PHONE_NUMBER_INPUT]);
            return;
        }

        let ship = agent.parameters['ship'];
        if (ship == null) {
            console.log('@not handler ship is nil');
        }
        let userInfo = DialogflowUtils.parseUserInfo(agent);
        let account = mStorage.updatePhone(userInfo, phone);
        if (editMode) {
            addContextShipEdit(agent);
            buildShipInfo(agent);
        } else {
            fillAccountRequest(agent, ship);
        }
    }

    slackAddressRequest(agent) {
        let editMode = agent.getContext('ship-edit') != null;
        let address = agent.parameters['address'];

        if (isEmpty(address)) {
            response(agent, 'Nhập địa chỉ nhận hàng bên dưới', null, [], '', [ADDRESS_INPUT]);
            return;
        }

        let ship = agent.parameters['ship'];
        if (ship == null) {
            console.log('@not handler ship is nil');
        }

        let userInfo = DialogflowUtils.parseUserInfo(agent);
        let account = mStorage.updateAddress(userInfo, address);
        if (editMode) {
            addContextShipEdit(agent);
            buildShipInfo(agent);
        } else {
            fillAccountRequest(agent, ship);
        }
    }

    slackFeedback(agent) {
        let feedback = agent.parameters["feedback"];
        saveFeedback(feedback);
        response(agent, 'Chân thành cảm ơn góp ý của bạn', 'Chúc bạn 1 ngày vui vẻ tại Marika Cafe', ['home', 'menu'],
            'Chân thành cảm ơn góp ý của bạn. Chúc bạn 1 ngày vui vẻ tại Marika Cafe');
    }

    slackHelpRequest(agent) {
        let helpItems = [];
        helpItems.push('Marika xin kính chào quí khách');
        helpItems.push('Chi nhánh 74/13/4 Trương Quốc Dung, Phú Nhuận');
        helpItems.push('Gõ \"cho {số lượng} {tên món}\" để thêm món');
        helpItems.push('Gõ \"giỏ hàng\" để xem giỏ hàng hiện tại');
        helpItems.push('Gõ \"thanh toán\" để gửi yêu cầu đến Receptioniest Marika');
        helpItems.push('Gõ \"feedback\" để góp ý cho Receptioniest Marika');
        response(agent, 'trợ giúp', helpItems, ['menu', 'thanh toán']);
    }

    slackClearContext(agent) {
        agent.clearOutgoingContexts();
        response(agent, 'Session is reset', null, ['home']);
    }

}

function buildShipEditSuggestion(agent) {
    addContextShipEdit(agent);
    response(agent, null, null, ['sửa tên', 'thay đổi địa chỉ', 'thay đổi SĐT']);
}

function addContextShipEdit(agent) {
    agent.setContext({
        name: 'ship-edit',
        lifespan: 1,
        parameters: null
    });
}

function getShipInfo(agent, ship = true) {
    let infoItems = [];
    let account = getAccount(agent);
    if (account) {
        infoItems.push('• Người nhận: *' + account.name.toUpperCase() + '*');
        infoItems.push('• Điện thoại: *' + account.phone + '*');
        infoItems.push(ship ? '• Địa chỉ: *' + account.address.toUpperCase() + '*' : '• Nhận hàng tại quán');
    }
    return infoItems;
}

function buildShipInfo(agent, ship = true) {
    let account = getAccount(agent);
    let infoItems = [];
    response(agent, 'thông tin khách hàng', getShipInfo(agent, ship), ['sửa tên', 'thay đổi địa chỉ', 'thay đổi SĐT']);
}

function saveFeedback(feedback) {
    let key = admin.database().ref('feedbacks').push().key;
    admin.database().ref('feedbacks/' + key).set({
        created: moment.now(),
        fb: feedback
    });
}

function handleSingleItemWithTopping(agent, product, quantity, topping) {
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
        response(agent, 'Hiện tại không bán ' + product, null, ['menu', 'thanh toán']);
    }
}

function removeItemInCart(agent, product, quantity) {
    let mProduct = mStorage.findProduct(product);
    let found = false;
    if (mProduct) {
        let cartcontext = agent.getContext('shoppingcart');
        if (cartcontext != null && cartcontext.parameters.items != null) {
            let newItems = [];
            for (let i in cartcontext.parameters.items) {
                let item = cartcontext.parameters.items[i];
                if (incLowerCase(mProduct.name, item.name)) {
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
        'id': product.product_id,
        'name': product.name,
        'price': product.price,
        'quantity': quantity,
        'options': options
    });
    cartcontext.parameters = { 'items': items };
    agent.setContext(cartcontext);

    response(agent, 'đã thêm',
        util.format('• x%s *%s* - %s', quantity, product.name, convTopping(options)),
        ['menu', 'giỏ hàng', 'thanh toán']);
    // let txtResponse = ''
    // buidlTitle(agent, 'đã thêm');
    // txtResponse += util.format('• x%s *%s* - %s', quantity, product.name, convTopping(options));
    // agent.add(txtResponse);
    // agent.add('Bạn có muốn tiếp tục mua hàng?');
    // agent.add(new Suggestion("CÓ"));
    // agent.add(new Suggestion("KHÔNG"));
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
    response(agent, 'Đã thêm:', speakout, ['menu', 'giỏ hàng', 'thanh toán']);
}

function clearCart(agent) {
    agent.setContext({
        name: 'shoppingcart',
        lifespan: 0,
        parameters: null
    });
}

function isCartEmpty(agent) {
    let isEmpty = false;
    let cart = agent.getContext('shoppingcart');
    if (!cart || !cart.parameters.items || cart.parameters.items.length == 0) {
        isEmpty = true;
    }
    return isEmpty;
}

function getNumOfItemsInCart(agent) {
    let count = 0;
    let cart = agent.getContext('shoppingcart');
    if (cart && cart.parameters.items) {
        count = cart.parameters.items.length;
    }
    return count;
}

function getItemsSugession(agent) {
    let count = 0;
    let sugessionItems = [];
    let cart = agent.getContext('shoppingcart');
    if (cart && cart.parameters.items) {
        cart.parameters.items.forEach(item => sugessionItems.push(('Xóa ' + item.name).toUpperCase()));
    }
    return sugessionItems;
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

function fillAccountRequest(agent, ship = false) {
    let userInfo = DialogflowUtils.parseUserInfo(agent);
    let account = mStorage.createOrUpdate(userInfo);

    if (isEmpty(account.name)) {
        agent.setFollowupEvent({
            name: 'username-request-event',
            parameters: {
                'ship': ship
                // 'account': account
            }
        });
    } else if (isEmpty(account.phone)) {
        agent.setFollowupEvent({
            name: 'phone-request-event',
            parameters: {
                'ship': ship
                // 'account': account
            }
        });
    } else if (ship && isEmpty(account.address)) {
        agent.setFollowupEvent({
            name: 'address-request-event',
            parameters: {
                'ship': ship
                // 'account': account
            }
        });
    } else {
        // valid user infomation
        //TODO: need show cart
        response(agent, 'thông tin đơn hàng', getShipInfo(agent, ship),
            ['tiếp tục', 'sửa đơn hàng', 'sửa thông tin nhận hàng'], '',
            [FCM_REQUIRE_CMD]);
    }
}

function isEmpty(text) {
    return text == null || text == '';
}

function getAccount(agent) {
    let userInfo = DialogflowUtils.parseUserInfo(agent);
    return mStorage.createOrUpdate(userInfo);
}

function getSource(agent) {
    return isEmpty(agent.requestSource) ? 'CHATBOT' : agent.requestSource;
}

function setBillShipMethod(agent, ship) {
    let cartcontext = agent.getContext('shoppingcart');
    if (cartcontext) {
        cartcontext.parameters.ship = ship;
    }
    agent.setContext(cartcontext);
}

function getBillData(agent) {
    let items;
    let cart = agent.getContext('shoppingcart');
    let shipMethod;
    if (cart && cart.parameters.items && cart.parameters.items.length > 0) {
        items = cart.parameters.items;
        shipMethod = cart.parameters.ship;
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
        ship: shipMethod,
        source: getSource(agent)
        // total: totalPrice
    }
}

function pushOrder(agent, bill) {

    // create new bill in firebase database
    let dbBill = mStorage.createBill(bill);
    // let condition = "'marika-coffee' in topics";
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
        // condition: condition
        // topic: topic
    }
    mStorage.pushMessageToTopic('marika-coffee', message)
        .then((rs) => {
            console.log(rs);
        })
        .catch((err) => {
            response(agent, 'xảy ra lỗi !! bó tay');
        });

    let responseItems = [];
    responseItems.push('*ĐƠN HÀNG ĐÃ GỬI*');
    responseItems.push('Vui lòng đợi xác nhận từ Marika');
    
    clearCart(agent);
    response(agent, 'trạng thái đơn hàng', responseItems);
}

function addContextMenu(agent) {
    agent.setContext({
        name: 'ask-menu-context',
        lifespan: 2,
        parameters: {}
    });
}

function getItemsInCart(agent) {
    let responseItems = [];
    if (isCartEmpty(agent) == false) {
        let cart = agent.getContext('shoppingcart');
        for (let i in cart.parameters.items) {
            let item = cart.parameters.items[i];
            responseItems.push(util.format('• x%s *%s* - %s', parseInt(item.quantity), item.name, convTopping(item.options)));
        }
    }
    return responseItems;
}

function displayCart(agent) {
    let cart = agent.getContext('shoppingcart');
    if (!cart || !cart.parameters.items || cart.parameters.items.length == 0) {
        response(agent, 'giỏ hàng rỗng', null, ['menu']);
        return;
    }

    // buidlTitle(agent, 'giỏ hàng');
    let total = 0;
    let responseItems = [];
    for (let i in cart.parameters.items) {
        let item = cart.parameters.items[i];
        responseItems.push(util.format('• x%s *%s* - %s', parseInt(item.quantity), item.name, convTopping(item.options)));
        total += parseInt(item.price * item.quantity);
    }
    responseItems.push('______________________');
    responseItems.push('Tổng tộng: *' + mStorage.formatPrice(total) + '*');
    response(agent, 'giỏ hàng', responseItems, ['thanh toán', 'điều chỉnh', 'hủy đơn hàng']);
    // agent.add(txtResponse);
    // agent.add('Bạn có muốn tiếp tục mua hàng?');
    // agent.add(new Suggestion("CÓ"));
    // agent.add(new Suggestion("KHÔNG"));
    // buildNextAction(agent, ["THANH TOÁN", "ĐIỀU CHỈNH", "HỦY ĐƠN HÀNG"]);
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

function buildCardItem(agent, product) {
    return new Card({
        title: util.format('%s - %s', product.name, formatPrice(product.price)),
        imageUrl: IMAGE_URL + product.image,
        text: product.description ? product.description : 'Sản phẩm có sẵn tại Marika Cafe',
        buttonText: 'Marika Cafe website',
        buttonUrl: MARIKA_HOMEPAGE_URL
    });
}

// Util methods
function formatPrice(price) {
    price = price.toString();
    let buf = [];
    let offset = 3 - price.length % 3;
    for (let i = 0; i < price.length; ++i) {
        if (i > 0 && (i + offset) % 3 == 0) {
            buf.push('.');
        }
        buf.push(price[i]);
    }
    buf.push("đ");
    return buf.join('');
}

function isString(value) { return typeof value === 'string'; }

function incLowerCase(v1, v2) {
    return v1.toLowerCase().includes(v2.toLowerCase());
}

function response(agent, title, content, options, speech, cmd) {
    console.log("@Agent :" + agent.requestSource);
    if (agent.requestSource === null) {
        let rawJson = {
            title: title,
            // content: (content && content instanceof Card) ? {
            //     card: content
            // } : content,
            options: options,
            speech: speech,
            commands: cmd,
        };

        if (content) {
            if (isString(content)) {
                rawJson.content = {
                    items: [content]
                };
            } else if (Array.isArray(content)) {
                rawJson.content = {
                    items: content
                };
            } else if (content instanceof Card) {
                rawJson.content = {
                    card: content
                };
            } else {
                rawJson.content = {
                    raw: JSON.stringify(content)
                };
            }
        }
        agent.add(JSON.stringify(rawJson));
    } else {

        if (content && content instanceof Card) {
            agent.add(content);
            content = null;
        }

        if (title) {
            agent.add('．\n\n\n ※ ' + title.toUpperCase() + ' ※');
        }

        if (content) {
            if (Array.isArray(content)) {
                let str = "";
                content.forEach(item => str += item + "\n");
                agent.add(str);
            } else if (content instanceof Card) {
                agent.add(content);
            } else {
                agent.add(content);
            }
        }

        if (options && Array.isArray(options)) {
            options.forEach(item => {

                let isAdd = true;
                let lowercase = item.toLowerCase();
                if (lowercase == 'thanh toán' || lowercase == 'payment') {
                    if (getNumOfItemsInCart(agent) == 0) {
                        isAdd = false;
                    }
                }

                if (isAdd) {
                    agent.add(new Suggestion(item.toUpperCase()));
                }
            });
        }
    }
}

module.exports = new IntentHandler();
