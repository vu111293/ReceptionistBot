var Localize = require('localize');
 
var myLocalize = new Localize({
    "welcome": {
        "vi": "Marika cafe xin kính chào quý khách!",
        "us": "Welcome to Marika Cafe"
    },
    'language_set': {
        'vi':'Tiếng Việt đã được chọn',
        'us': 'English language was selected',
        'ja': '日本語が選ばれました。'
    },
    'language_not_support': {
        'vi': 'Ngôn ngữ không được hỗ trợ'   
    },
    'menu': {
        'vi': 'Thực đơn',
        'us': 'Menu'
    },
    'menu_speech': {
        'vi': 'Mời bạn chọn thực đơn',
        'us': 'Please select menu'
    },
    'drink_speech': {
        'vi': 'Mời chọn thức uống',
        'us': 'Please choose a drink'
    },
    'product_speech': {
        'vi': 'Mời chọn sản phẩm',
        'us': 'Please choose a product'
    },
    'food_speech': {
        'vi': 'Mời chọn món',
        'us': 'Please choose a food'
    },
    'product': {
        'vi': 'Sản phẩm',
        'us': 'Product'
    },
    'product_added': {
        'vi': 'đã thêm',
        'us': 'added'
    },
    'product_added$[1]': {
        'vi': 'Đã thêm $[1]. Bạn muốn làm gì tiếp?',
        'us': '$[1] is added. What do you want to do next?'
    },
    'product_hint': {
        'vi': '(Gợi ý: gõ tên món bạn chọn, ví dụ: pepsi)',
        'us': '(Hint: type your selection, ex: pepsi)'
    },
    'product_empty': {
        'vi': 'Không có sản phẩm',
        'us': 'Not found'
    },
    'drink': {
        'vi': 'thức uống',
        'us': 'drink'
    },
    'food': {
        'vi': 'món ăn',
        'us': 'food'
    },
    'other_product': {
        'vi': 'sản phẩm khác',
        'us': 'other product'
    },
    'hot': {
        'vi': 'món phổ biến',
        'us': 'hot product'
    },
    'continue': {
        'vi': 'tiếp tục',
        'us': 'continue'
    },
    'view_more': {
        'vi': 'xem thêm',
        'us': 'view more'
    },
    'cart': {
        'vi': 'giỏ hàng',
        'us': 'cart'
    },
    'cart_empty': {
        'vi': 'Giỏ hàng rỗng',
        'us': 'cart is empty'
    },
    'cart_clear': {
        'vi': 'Bạn có muốn xóa giỏ hàng hiện tại?',
        'us': 'Do you want to clear items in cart?'
    },
    'cart_edit': {
        'vi': 'điều chỉnh giỏ hàng',
        'us': 'edit cart'
    },
    'add_product_sugession': {
        'vi': 'Vui lòng thêm sản phẩm vào giỏ hàng',
        'us': 'Please add product to your cart'
    },
    'payment': {
        'vi': 'thanh toán',
        'us': 'payment'
    },
    '@payment': {
        'vi': '@thanh toán',
        'us': '@payment'
    },
    'payment_method': {
        'vi': 'chọn hình thức thanh toán',
        'us': 'choose payment method'
    },
    'payment_cash': {
        'vi': 'tại quán',
        'us': 'at the counter'
    },
    'payment_ship': {
        'vi': 'giao hàng',
        'us': 'ship'
    },
    'what_payment_speech': {
        'vi': 'Bạn muốn thanh toán tại quán hay giao hàng?',
        'us': 'Want to pay at the shop or delivery?'
    },
    'not_found': {
        'vi': 'không tìm thấy sản phẩm',
        'us': 'Product not found'
    },
    'not_found$[1]': {
        'vi': 'không tìm thấy $[1]',
        'us': 'Not found $[1]'
    },
    'not_found_speech': {
        'vi': 'Không tìm thấy sản phẩm. Vui lòng chọn sản phẩm khác',
        'us': 'Not found. Please select another product'
    },
    'try_again': {
        'vi': 'Xin vui lòng thử lại',
        'us': 'Please try again'
    },
    'maybe': {
        'vi': 'có phải ý bạn là?',
        'us': 'Did you mean?'
    },
    'amount_selection': {
        'vi': 'Chọn số lượng?',
        'us': 'Choose amount'
    },
    'other': {
        'vi': 'khác' ,
        'us': 'other'
    },
    'other_selection': {
        'vi': 'Chọn món khác',
        'us': 'other product'
    },
    'how_much': {
        'vi': 'Bạn muốn mua bao nhiêu?',
        'us': 'How much do you want?'
    },
    'bill_confirm_ok$[1]': {
        'vi':  'Đơn hàng sẽ được giao đến bạn sau *$[1] phút*.\nCảm ơn bạn đã sử dụng dịch vụ.',
        'us': 'The order will be delivered to you within *$[1] minutes*.\nThank you for using the service.',
        'ja': '注文は*$[1]*分以内にお客様に届けられます。 サービスをご利用いただき、ありがとうございます。'
    },
    'bill_confirm_busy': {
        'vi': 'Hiện tại dịch vụ đang bận. Vui lòng thử lại sau',
        'us': 'Currently the service is busy. Please try again later'
    },
    'say_yes': {
        'vi': 'có',
        'us': 'yes'
    },
    'say_no': {
        'vi': 'không',
        'us': 'no'
    },
    'remove_product_confirm$[1]': {
        'vi': 'Bạn muốn xóa sản phẩm *$[1]* trong giỏ hàng?',
        'us': 'Do you want to remove *$[1]* from cart?'
    },
    'ask_remove_product': {
        'vi': 'Bạn muốn xóa sản phẩm nào?',
        'us': 'What item do you want to remove?'
    },
    'remove_product$[1]$[2]': {
        'vi': 'Đã xóa $[1] *$[2]* khỏi giỏ hàng.',
        'us': '$[1] *$[2]* are removed'
    },
    'remove_product$[1]': {
        'vi': 'Đã xóa *$[1]* khỏi danh sách.',
        'us': '*$[1]* was removed'
    },
    'cancel_order_remove_request': {
        'vi': 'Đã hủy yêu cầu xóa giỏ hàng',
        'us': 'Your payment request was canceled'
    },
    'clear_cart_success': {
        'vi': 'xóa giỏ hàng thành công',
        'us': 'Cart was clear'
    },
    'username_request': {
        'vi': 'nhập tên bạn bên dưới',
        'us': 'Please enter your name'
    },
    'phone_request': {
        'vi': 'nhập số điện thoại bên dưới',
        'us': 'Please enter your phone number'
    },
    'ship_address_request': {
        'vi': 'Nhập địa chỉ nhận hàng bên dưới',
        'us': 'Please enter your address'
    },
    'feedback': {
        'vi': 'Chân thành cảm ơn góp ý của bạn. Chúc bạn 1 ngày vui vẻ tại Marika Cafe',
        'us': 'Thanks for your feedback. Good for day in Marika Cafe'
    },
    'ship_edit': {
        'vi': 'sửa đổi thông tin nhận hàng',
        'us': 'edit ship info'
    },
    'username_edit': {
        'vi': 'sửa tên',
        'us': 'edit name'
    },
    'ship_address_edit': {
        'vi': 'thay đổi địa chỉ',
        'us': 'edit address'
    },
    'phone_edit': {
        'vi': 'thay đổi SĐT',
        'us': 'edit phone'
    },
    'receiver_order$[1]': {
        'vi': '• Người nhận: *$[1]*',
        'us': '• Receiver: *$[1]*'
    },
    'phone_order$[1]': {
        'vi': '• Điện thoại: *$[1]*',
        'us': '• Phone: *$[1]*'
    },
    'address_order$[1]': {
        'vi': '• Địa chỉ: *$[1]*',
        'us': '• Address: *$[1]*'
    },
    'none_address_order': {
        'vi': '• Nhận hàng tại quán',
        'us': '• At the counter',
    },
    'user_info': {
        'vi': 'Thông tin khách hàng',
        'us': 'User infomation'
    },
    'bill_info': {
        'vi': 'Thông tin đơn hàng',
        'us': 'Bill infomation'
    },
    'order_status': {
        'vi': 'Trạng thái đơn hàng',
        'us': 'Bill status'
    },
    'order_edit': {
        'vi': 'sửa đơn hàng',
        'us': 'edit order'
    },
    'order_cancel': {
        'vi': 'hủy đơn hàng',
        'us': 'cancel order'
    },
    'bill_sent': {
        'vi': '*ĐƠN HÀNG ĐÃ GỬI*',
        'us': '*ORDER WAS SENT*',
    },
    'wait_confirm': {
        'vi': 'Vui lòng đợi xác nhận từ Marika',
        'us': 'Please wait for confirm from Marika Cafe'
    },
    'total_price$[1]': {
        'vi': 'Tổng tộng: *$[1]*',
        'us': 'Total price: *$[1]*'
    },
    'total_speech$[1]': {
        'vi': 'Hóa đơn của bạn là $[1] đồng',
        'us': 'Your bill is $[1] dong'
    },
    'product_description': {
        'vi': 'Sản phẩm có sẵn tại Marika Cafe',
        'us': 'Product available at Marika Cafe'
    },
    'remove_item$[1]': {
        'vi': 'Xóa $[1]',
        'us': 'Remove $[1]' 
    },

    'less': {
        'vi': 'ít',
        'us': 'less'
    },

    'more': {
        'vi': 'nhiều',
        'us': 'more'
    },
    'none': {
        'vi': 'không',
        'us': 'none'
    },
    'sugar': {
        'vi': 'đường',
        'us': 'sugar'
    },
    'milk': {
        'vi': 'sữa',
        'us': 'milk'
    },
    'normal': {
        'vi': 'bình thường',
        'us': 'normal'
    }
});

module.exports = myLocalize;