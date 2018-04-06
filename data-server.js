const { Card, Suggestion, Image, Text, Payload } = require('dialogflow-fulfillment');
const util = require('util');
const moment = require('moment');
const IMAGE_URL = 'http://marika.cafe/images/';
const MARIKA_HOMEPAGE_URL = 'http://marika.cafe/';
const SLACK_SUPPORT = true;
const MAX_ITEM_VIEW = 10;

class DataServer {

    constructor() {
        this.allproducts = [];
        this.drinks = [];
        this.foods = [];
        this.categories = [];
        this.gifts = [];
        this.nonecafe = [];
        this.promotions = [];
    }


    getDrinkList() {
        return this.drinks;
    }

    getFoodList() {
        return this.foods;
    }

    parseFromFirebase(postSnapshot) {
        this.drinks = [];
        for (let i in postSnapshot.val().drinklist) {
            let item = postSnapshot.val().drinklist[i];
            if (item.displaycashier) {
                this.drinks.push(item);
            }
        }

        this.foods = [];
        for (let i in postSnapshot.val().foodlist) {
            let item = postSnapshot.val().foodlist[i];
            if (item.displaycashier) {
                this.foods.push(item);
            }
        }

        this.nonecafe = [];
        for (let i in postSnapshot.val().nonecafelist) {
            let item = postSnapshot.val().nonecafelist[i];
            if (item.displaycashier) {
                this.nonecafe.push(item);
            }
        }

        this.categories = postSnapshot.val().categories;
        this.gifts = postSnapshot.val().giftList;
        this.promotions = postSnapshot.val().promotions;

        this.allproducts = [];
        for (let i in this.drinks) { this.allproducts.push(this.drinks[i]); }
        for (let i in this.foods) { this.allproducts.push(this.foods[i]); }
        for (let i in this.nonecafe) { this.allproducts.push(this.nonecafe[i]); }
        // this.allproducts = this.allproducts.concat(this.drinks);
        // this.allproducts = this.allproducts.concat(this.foods);
        // this.allproducts = this.allproducts.concat(this.nonecafe);

        console.log('done parse from firebase');
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

    buildRichCategories(agent) {
        agent.add('Danh mục sản phẩm');
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

    buildRichDrinks(agent) {
        if (this.drinks !== undefined) {
            agent.add('Xem danh mục thức uống bên dưới');
            let max = Math.min(MAX_ITEM_VIEW, this.drinks.length);
            for (let i = 0; i < max; ++i) {
                agent.add(new Text(util.format("• *%s* - (%s)",
                    this.drinks[i].name,
                    this.formatPrice(this.drinks[i].price))));
            }
            agent.add('Mời bạn chọn thức uống hoặc');
            if (this.drinks.length > MAX_ITEM_VIEW) {
                this.buildNextAction(agent, ["XEM THÊM", "XEM CHI TIẾT", "XEM GIỎ HÀNG"]);
            } else {
                this.buildNextAction(agent, ["XEM CHI TIẾT", "XEM GIỎ HÀNG"]);
            }
        } else {
            agent.add('Hiện tại shop không bán thức uống.');
            this.buildRichCategories(agent);
        }
    }

    buildMoreRichDrinks(agent) {
        if (this.drinks !== undefined && this.drinks.length > MAX_ITEM_VIEW) {
            for (let i = MAX_ITEM_VIEW; i < this.drinks.length; ++i) {
                agent.add(new Text(util.format("• *%s* - (%s)",
                    this.drinks[i].name,
                    this.formatPrice(this.drinks[i].price))));
            }
            agent.add('Mời bạn chọn thức uống hoặc ');
            this.buildNextAction(agent, ["XEM CHI TIẾT", "XEM GIỎ HÀNG"]);
        } else {
            agent.add('Hiện tại shop không bán thức uống.');
            this.buildRichCategories(agent);
        }
    }


    buildRichFoods(agent) {
        if (this.foods !== undefined) {
            agent.add('Xem danh mục thức ăn bên dưới');
            let max = Math.min(MAX_ITEM_VIEW, this.foods.length);
            for (let i = 0; i < max; ++i) {
                agent.add(new Text(util.format("• *%s* - (%s)",
                    this.foods[i].name,
                    this.formatPrice(this.foods[i].price))));
            }
            if (this.foods.length > MAX_ITEM_VIEW) {
                this.buildNextAction(agent, ["XEM THÊM", "XEM CHI TIẾT", "XEM GIỎ HÀNG"]);
            } else {
                this.buildNextAction(agent, ["XEM CHI TIẾT", "XEM GIỎ HÀNG"]);
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
                this.buildNextAction(agent, ["XEM THÊM", "XEM CHI TIẾT", "XEM GIỎ HÀNG"]);
            } else {
                this.buildNextAction(agent, ["XEM CHI TIẾT", "XEM GIỎ HÀNG"]);
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
            this.buildNextAction(agent, ["XEM CHI TIẾT", "XEM GIỎ HÀNG"]);
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
        agent.add(new Text('• Gõ *\"xem menu\"* để xem danh mục menu'));
        // agent.add(new Text('• Gõ *\"xem phòng\"* để xem danh sách phòng trống'));
        agent.add(new Text('• Gõ *\"xem khuyến mãi\"* để xem chương trình khuyến mãi tại quán'));
        agent.add(new Text('• Gõ *\"home, marika\"* để trở về danh mục chính'));
        agent.add(new Text('• Gõ *\"trợ giúp, help\"* để xem hướng dẫn sử dụng'));
        agent.add(new Text('• Gõ *\"feedback\"* để góp ý cho Receptioniest Marika'));
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
}

module.exports = DataServer;