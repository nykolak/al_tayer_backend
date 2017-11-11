'use strict';

function getPrice(product, bonusDiscountLineItems, lineItem){
	var value = 0;
	bonusDiscountLineItems.forEach(function(bonusDiscountLineItem){
		if(bonusDiscountLineItem.custom.bonusProductLineItemUUID === lineItem.custom.bonusProductLineItemUUID){
			value = bonusDiscountLineItem.getBonusProductPrice(product).toFormattedString();
		}
	});
	return value;
}

module.exports = function (object, lineItem, product, bonusDiscountLineItems) {
    Object.defineProperty(object, 'bonusUnitPrice', {
        enumerable: true,
        value: getPrice(product, bonusDiscountLineItems, lineItem)
    });
};
