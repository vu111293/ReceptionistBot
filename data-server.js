const { Card, Suggestion, Image, Text, Payload } = require('dialogflow-fulfillment');
const util = require('util');
const moment = require('moment');
const IMAGE_URL = 'http://marika.cafe/images/';
const MARIKA_HOMEPAGE_URL = 'http://marika.cafe/';
const SLACK_SUPPORT = true;
const MAX_ITEM_VIEW = 10;
const request = require('request');
let accountService = require('./services/AccountService');
const fbService = require('./services/FirebaseService');

class DataServer {

    constructor() {
        this.allproducts = [];
        this.drinks = [];
        this.foods = [];
        this.categories = [];
        this.gifts = [];
        this.nonecafe = [];
        this.promotions = [];
        this.config = '';
        this.lang = 'no';

        var self = this;
        // console.log(Object.keys(this));
        fbService.loadData(function (postSnapshot) {
            accountService.setAccountList(postSnapshot.accountlist);
            self.config = postSnapshot.config;
            self.drinks = [];
            for (let i in postSnapshot.drinklist) {
                let item = postSnapshot.drinklist[i];
                if (item.displaycashier) {
                    self.drinks.push(item);
                }
            }

            self.foods = [];
            for (let i in postSnapshot.foodlist) {
                let item = postSnapshot.foodlist[i];
                if (item.displaycashier) {
                    self.foods.push(item);
                }
            }

            self.nonecafe = [];
            for (let i in postSnapshot.nonecafelist) {
                let item = postSnapshot.nonecafelist[i];
                if (item.displaycashier) {
                    self.nonecafe.push(item);
                }
            }

            self.categories = postSnapshot.categories;
            self.gifts = postSnapshot.giftList;
            self.promotions = postSnapshot.promotions;

            self.allproducts = [];
            for (let i in self.drinks) { self.allproducts.push(self.drinks[i]); }
            for (let i in self.foods) { self.allproducts.push(self.foods[i]); }
            for (let i in self.nonecafe) { self.allproducts.push(self.nonecafe[i]); }
            // this.allproducts = this.allproducts.concat(this.drinks);
            // this.allproducts = this.allproducts.concat(this.foods);
            // this.allproducts = this.allproducts.concat(this.nonecafe);

            console.log('done parse from firebase');
        });
    }

    setLang(lnaguage) {
        this.lang = lnaguage;
    }

    // getDrinkList() {
    //     return this.drinks;
    // }

    getConfig() {
        return this.config;
    }

    getFoodList() {
        return this.foods;
    }

    // Bill
    createBill(bill) {
        return fbService.create("bills/", bill);
    }

    pushMessage(message) {
        return fbService.push(message);
    }

    // Account settion
    createOrUpdate(user) {
        let account = accountService.findAccountByAgent(user);
        if (account == null) {
            account = accountService.createAccount(user);
        }
        return account;
    }

    updateUserName(userInfo, username) {
        let account = accountService.findAccountByAgent(userInfo);
        if (account == null) {
            account = this.createOrUpdate(userInfo);
        }
        account.name = username;
        fbService.updateAccount(account);
        return account;
    }

    updatePhone(userInfo, phone) {
        let account = accountService.findAccountByAgent(userInfo);
        if (account == null) {
            account = this.createOrUpdate(userInfo);
        }
        account.phone = phone;
        fbService.updateAccount(account);
        return account;
    }

    updateAddress(userInfo, address) {
        let account = accountService.findAccountByAgent(userInfo);
        if (account == null) {
            account = this.createOrUpdate(userInfo);
        }
        account.address = address;
        fbService.updateAccount(account);
        return account;
    }

    findKeywork(query) {
        var items = [];
        if (!query) { return items; }

        for (let key in this.allproducts) {
            let item = this.allproducts[key];
            if (item.replacename == null) {
                continue;
            }
            query = query.toLowerCase();
            let nameList = item.replacename.split(',');
            for (let index in nameList) {
                let name = nameList[index];
                if (name.includes(query) == true) {
                    let found = false;
                    items.forEach(entity => {
                        if (entity.name.toLowerCase() == name) {
                            found = true;
                        }
                    });
                    if (!found) { items.push(item); }
                    break;
                }
            }
        }
        return items;
    }

    findProduct(productname) {
        var foundItem;
        if (!productname) { return foundItem; }

        for (let key in this.allproducts) {
            let item = this.allproducts[key];
            if (item.replacename == null) {
                continue;
            }
            productname = productname.toLowerCase();
            let nameList = item.replacename.split(',');
            for (let index in nameList) {
                let name = nameList[index];
                if (productname.includes(name) == false) {
                    continue;
                }
                foundItem = item;
                break;
            }
            if (foundItem != null) {
                break;
            }
        }

        return foundItem;
    }

    buildCategories() {
        var list = [];
        for (let item in this.categories) {
            var cat = this.categories[item];
            list.push({
                'title': cat.name,
                'type': 'category',
                'image': cat.image,
                'description': cat.description
            });
        }
        return list;
    }


    getCategories() {
        return this.categories.map(item => item.name);
    }

    buildRichCategories(agent) {
        // agent.add('Danh mục sản phẩm');
        for (let i in this.categories) {
            let item = this.categories[i];
            let suggestion = new Suggestion(item.name);
            suggestion.setReply(item.name);
            agent.add(suggestion);
        }
        agent.add('Gõ tên mục cần xem sản phẩm. Ví dụ: \"thức ăn\"');

        // add menu context
        agent.setContext({
            name: 'ask-menu-context',
            lifespan: 2,
            parameters: {}
        });
    }

    getHotItems() {
        return [];
    }

    buildHotItems() {
        return [];
    }

    buildDrinkItems() {
        var list = [];
        for (let i in this.drinks) {
            let item = this.drinks[i];
            list.push({
                'title': item.name,
                'type': 'drink',
                'price': item.price,
                'promotion': item.promotion,
                'image': item.image
            });
        }
        return list;
    }


    getDrinkList(maxitem) {
        let items = [];
        let max = Math.min(maxitem, this.drinks.length);
        for (let i = 0; i < max; ++i) {
            let item = (util.format("• *%s* - (%s)",
                this.drinks[i].name,
                this.formatPrice(this.drinks[i].price)))
            items.push(item);
        }
        return items;
    }

    getMoreDrinkList(from) {
        let items = [];
        for (let i = from; i < this.drinks.length; ++i) {
            let item = util.format("• *%s* - (%s)",
                this.drinks[i].name,
                this.formatPrice(this.drinks[i].price));
            items.push(item);
        }
        return items;
    }

    getFoodList(maxitem) {
        let items = [];
        let max = Math.min(maxitem, this.foods.length);
        for (let i = 0; i < max; ++i) {
            let item = (util.format("• *%s* - (%s)",
                this.foods[i].name,
                this.formatPrice(this.foods[i].price)))
            items.push(item);
        }
        return items;
    }

    getMoreFoodList(from) {
        let items = [];
        for (let i = from; i < this.foods.length; ++i) {
            let item = util.format("• *%s* - (%s)",
                this.foods[i].name,
                this.formatPrice(this.foods[i].price));
            items.push(item);
        }
        return items;
    }

    getNoCafeList(maxitem) {
        let items = [];
        let max = Math.min(maxitem, this.nonecafe.length);
        for (let i = 0; i < max; ++i) {
            let item = (util.format("• *%s* - (%s)",
                this.nonecafe[i].name,
                this.formatPrice(this.nonecafe[i].price)))
            items.push(item);
        }
        return items;
    }

    getMoreNoCafeList(from) {
        let items = [];
        for (let i = from; i < this.nonecafe.length; ++i) {
            let item = util.format("• *%s* - (%s)",
                this.nonecafe[i].name,
                this.formatPrice(this.nonecafe[i].price));
            items.push(item);
        }
        return items;
    }



    buildRichDrinks(agent) {
        if (this.drinks !== undefined) {
            let speech = 'Xem danh mục thức uống bên dưới:';
            let max = Math.min(MAX_ITEM_VIEW, this.drinks.length);
            for (let i = 0; i < max; ++i) {
                speech += (util.format("• *%s* - (%s)",
                    this.drinks[i].name,
                    this.formatPrice(this.drinks[i].price)))
            }
            agent.add(speech);
            agent.add('Gõ yêu cầu chọn món của bạn. Ví dụ: \"2 cafe sữa\"');
            if (this.drinks.length > MAX_ITEM_VIEW) {
                this.buildNextAction(agent, ["XEM THÊM", "XEM GIỎ HÀNG"]);
            } else {
                this.buildNextAction(agent, ["XEM GIỎ HÀNG"]);
            }
        } else {
            agent.add('Hiện tại shop không bán thức uống.');
            this.buildRichCategories(agent);
        }
    }

    buildMoreRichDrinks(agent) {
        if (this.drinks !== undefined && this.drinks.length > MAX_ITEM_VIEW) {
            let speech = '';
            for (let i = MAX_ITEM_VIEW; i < this.drinks.length; ++i) {
                speech += util.format("• *%s* - (%s)",
                    this.drinks[i].name,
                    this.formatPrice(this.drinks[i].price));
            }
            agent.add(speech);
            agent.add('Mời bạn chọn thức uống hoặc ');
            this.buildNextAction(agent, ["XEM GIỎ HÀNG"]);
        } else {
            agent.add('Hiện tại shop không bán thức uống.');
            this.buildRichCategories(agent);
        }
    }


    buildRichFoods(agent) {
        if (this.foods !== undefined) {
            let speech = 'Xem danh mục thức ăn bên dưới:';
            let max = Math.min(MAX_ITEM_VIEW, this.foods.length);
            for (let i = 0; i < max; ++i) {
                speech += util.format("• *%s* - (%s)",
                    this.foods[i].name,
                    this.formatPrice(this.foods[i].price));
            }
            agent.add(speech);
            if (this.foods.length > MAX_ITEM_VIEW) {
                this.buildNextAction(agent, ["XEM THÊM", "GIỎ HÀNG"]);
            } else {
                this.buildNextAction(agent, ["GIỎ HÀNG"]);
            }
        } else {
            agent.add('Hiện tại shop không bán thức ăn.');
            this.buildRichCategories(agent);
        }
    }

    buildMoreRichFoods(agent) {
        if (this.foods !== undefined && this.foods.length > MAX_ITEM_VIEW) {

            for (let i = MAX_ITEM_VIEW; i < this.foods.length; ++i) {
                agent.add(new Text(util.format("• *%s* - (%s)",
                    this.foods[i].name,
                    this.formatPrice(this.foods[i].price))));
            }
            agent.add('Mời bạn chọn món ăn hoặc ');
            this.buildNextAction(agent, ["XEM CHI TIẾT", "XEM GIỎ HÀNG"]);
        } else {
            agent.add('Hiện tại shop không bán thức ăn.');
            this.buildRichCategories(agent);
        }
    }

    buildRichGifts(agent) {
        if (this.gifts !== undefined) {
            agent.add('Xem danh mục quà tặng bên dưới');
            for (let i in this.gifts) {
                agent.add(new Text(util.format("• *%s* - (%s)",
                    this.gifts[i].name,
                    this.formatPrice(this.gifts[i].price))));
            }
        } else {
            agent.add('Hiện tại shop không bán thức uống.');
            this.buildRichCategories(agent);
        }
    }

    buildRichNoneCafe(agent) {
        if (this.nonecafe !== undefined) {
            agent.add('Xem danh mục món bên dưới');
            let max = Math.min(MAX_ITEM_VIEW, this.nonecafe.length);
            for (let i = 0; i < max; ++i) {
                agent.add(new Text(util.format("• *%s* - (%s)",
                    this.nonecafe[i].name,
                    this.formatPrice(this.nonecafe[i].price))));
            }
            if (this.nonecafe.length > MAX_ITEM_VIEW) {
                this.buildNextAction(agent, ["XEM THÊM", "GIỎ HÀNG"]);
            } else {
                this.buildNextAction(agent, ["GIỎ HÀNG"]);
            }
        } else {
            agent.add('Hiện tại shop không sản phẩm ngoài thức uống.');
            this.buildRichCategories(agent);
        }
    }

    buildMoreRichNoneCafe(agent) {
        if (this.nonecafe !== undefined && this.nonecafe.length > MAX_ITEM_VIEW) {
            for (let i = MAX_ITEM_VIEW; i < this.nonecafe.length; ++i) {
                agent.add(new Text(util.format("• *%s* - (%s)",
                    this.nonecafe[i].name,
                    this.formatPrice(this.nonecafe[i].price))));
            }
            agent.add('Mời bạn chọn món hoặc');
            this.buildNextAction(agent, ["GIỎ HÀNG"]);
        } else {
            agent.add('Hiện tại shop không sản phẩm ngoài cafe.');
            this.buildRichCategories(agent);
        }
    }

    buildFoodItems() {
        var list = [];
        for (let i in this.foods) {
            let item = this.foods[i];
            list.push({
                'title': item.name,
                'type': 'drink',
                'price': item.price,
                'promotion': item.promotion,
                'image': item.image
            });
        }
        return list;
    }

    buildGiftItems() {
        var list = [];
        for (let i in this.gifts) {
            let item = this.gifts[i];
            list.push({
                'title': item.name,
                'type': 'drink',
                'price': item.price,
                'promotion': item.promotion,
                'image': item.image
            });
        }
        return list;
    }

    buildPromotions() {
        var list = [];
        for (let i in this.promotions) {
            list.push({
                'title': this.promotions[i],
                'type': 'tylemode',
                'value': 120
            });
        }
        return list;
    }

    buildRichPromotions(agent) {
        for (let i in this.promotions) {
            let item = this.promotions[i];
            agent.add(new Text('• *' + item + '*'));
        }
    }

    buildHome(agent) {
        if (this.lang == 'vi') {
            agent.add(new Suggestion("DS MÓN"));
            agent.add(new Suggestion("KH MÃI"));
            agent.add(new Suggestion("TRỢ GIÚP"));
            agent.add(new Suggestion("FEEDBACK"));
            agent.add(new Suggestion("TÌM KIẾM"));
        } else if (this.lang == 'jp') {
            agent.add(new Suggestion("メーユー"));
            agent.add(new Suggestion("割引"));
            agent.add(new Suggestion("助ける"));
            agent.add(new Suggestion("饋還"));
            agent.add(new Suggestion("調べる"));
        } else {
            agent.add(new Suggestion("MENU"));
            agent.add(new Suggestion("PROMOTION"));
            agent.add(new Suggestion("HELP"));
            agent.add(new Suggestion("FEEDBACK"));
            agent.add(new Suggestion("SEARCH"));
        }

        // let speech = '• Gõ *\"xem menu\"* để xem danh mục menu';
        // speech += '• Gõ *\"xem khuyến mãi\"* để xem chương trình khuyến mãi tại quán';
        // speech += '• Gõ *\"home, marika\"* để trở về danh mục chính';
        // speech += '• Gõ *\"trợ giúp, help\"* để xem hướng dẫn sử dụng';
        // speech += '• Gõ *\"feedback\"* để góp ý cho Receptioniest Marika';
        // agent.add(new Text(speech));
    }

    buildCardItem(agent, product) {
        agent.add(new Card({
            title: util.format('%s - %s', product.name, this.formatPrice(product.price)),
            imageUrl: IMAGE_URL + product.image,
            text: product.description ? product.description : 'Sản phẩm có sẵn tại Marika Cafe',
            buttonText: 'Marika Cafe website',
            buttonUrl: MARIKA_HOMEPAGE_URL
        })
        );
    }

    // Util methods
    formatPrice(price) {
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

    buildNextAction(agent, actions) {
        for (let i in actions) {
            agent.add(new Suggestion(actions[i]));
        }
    }

    authCode(code) {
        request.get('https://slack.com/api/oauth.access?client_id=26587670230.340601737508&client_secret=7e3cc79f289771b5ee8ae1cb0448be6a&code=' + code,
            function (error, reponse, body) {
                console.log('error:', error); // Print the error if one occurred
                // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                console.log('body:', body); // Print the HTML for the Google homepage.
            });
    }
}

module.exports = new DataServer();