'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get('MiniCart', server.middleware.include, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');

    var currentBasket = BasketMgr.getCurrentBasket();
    var quantityTotal;

    if (currentBasket) {
        quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
    } else {
        quantityTotal = 0;
    }

    res.render('/components/header/minicart', { quantityTotal: quantityTotal });
    next();
});

server.post('AddProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var HookMgr = require('dw/system/HookMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
    var productId = req.form.pid;
    var childProducts = Object.hasOwnProperty.call(req.form, 'childProducts')
        ? JSON.parse(req.form.childProducts)
        : [];
    var options = req.form.options ? JSON.parse(req.form.options) : [];
    var quantity;
    var result;
    var pidsObj;

    if (currentBasket) {
        Transaction.wrap(function () {
            if (!req.form.pidsObj) {
                quantity = parseInt(req.form.quantity, 10);// TODO, might need to handle add to cart if it's a set
                result = cartHelper.addProductToCart(
                    currentBasket,
                    productId,
                    quantity,
                    childProducts,
                    options
                );
            } else {
                // product set
                pidsObj = JSON.parse(req.form.pidsObj);
                result = {
                    error: false,
                    message: Resource.msg('text.alert.addedtobasket', 'product', null)
                };

                pidsObj.forEach(function (PIDObj) {
                    quantity = parseInt(PIDObj.qty, 10);
                    var pidOptions = PIDObj.options ? JSON.parse(PIDObj.options) : {};
                    var PIDObjResult = cartHelper.addProductToCart(
                        currentBasket,
                        PIDObj.pid,
                        quantity,
                        childProducts,
                        pidOptions
                    );
                    if (PIDObjResult.error) {
                        result.error = PIDObjResult.error;
                        result.message = PIDObjResult.message;
                    }
                });
            }
            if (!result.error) {
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
            }
        });
    }

    var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
    var cartModel = new CartModel(currentBasket);

    var urlObject = {
        url: URLUtils.url('Cart-ChooseBonusProducts').toString(),
        configureProductstUrl: URLUtils.url('Product-ShowBonusProducts').toString(),
        addToCartUrl: URLUtils.url('Cart-AddBonusProducts').toString()
    };

    var newBonusDiscountLineItem =
        cartHelper.getNewBonusDiscountLineItem(
            currentBasket,
            previousBonusDiscountLineItems,
            urlObject,
            result.uuid
    );
    if (newBonusDiscountLineItem) {
    //     OriginalPLI.custom.bonusProductLineItemUUID = 'bonus';
        var allLineItems = currentBasket.allProductLineItems.toArray();
//        var opli;
        allLineItems.forEach(function (pli) {
            if (pli.UUID === result.uuid) {
                Transaction.wrap(function () {
                    pli.custom.bonusProductLineItemUUID = 'bonus'; // eslint-disable-line no-param-reassign
                });
            }
        });
    }

    res.json({
        quantityTotal: quantityTotal,
        message: result.message,
        cart: cartModel,
        newBonusDiscountLineItem: newBonusDiscountLineItem || {},
        error: result.error,
        pliUUID: result.uuid
    });

    next();
});

server.get(
    'Show',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var HookMgr = require('dw/system/HookMgr');
        var Transaction = require('dw/system/Transaction');
        var CartModel = require('*/cartridge/models/cart');
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var reportingUrls = require('*/cartridge/scripts/reportingUrls');

        var currentBasket = BasketMgr.getCurrentBasket();
        var reportingURLs;

        if (currentBasket) {
            Transaction.wrap(function () {
                if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
                    currentBasket.updateCurrency();
                }
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);

                HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
            });
        }

        if (currentBasket && currentBasket.allLineItems.length) {
            reportingURLs = reportingUrls.getBasketOpenReportingURLs(currentBasket);
        }

        res.setViewData({ reportingURLs: reportingURLs });

        var basketModel = new CartModel(currentBasket);

        res.render('cart/cart', basketModel);
        next();
    }
);

server.get('Get', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var HookMgr = require('dw/system/HookMgr');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket) {
        Transaction.wrap(function () {
            cartHelper.ensureAllShipmentsHaveMethods(currentBasket);

            HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
        });
    }

    var basketModel = new CartModel(currentBasket);

    res.json(basketModel);
    next();
});

server.get('RemoveProductLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var HookMgr = require('dw/system/HookMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var isProductLineItemFound = false;
    var bonusProductsUUIDs = [];

    Transaction.wrap(function () {
        if (req.querystring.pid && req.querystring.uuid) {
            var productLineItems = currentBasket.getAllProductLineItems(req.querystring.pid);
            var bonusProductLineItems = currentBasket.bonusLineItems;
            var mainProdItem;
            for (var i = 0; i < productLineItems.length; i++) {
                var item = productLineItems[i];
                if ((item.UUID === req.querystring.uuid)) {
                    if (bonusProductLineItems && bonusProductLineItems.length > 0) {
                        for (var j = 0; j < bonusProductLineItems.length; j++) {
                            var bonusItem = bonusProductLineItems[j];
                            mainProdItem = bonusItem.getQualifyingProductLineItemForBonusProduct();
                            if (mainProdItem !== null
                                && (mainProdItem.productID === item.productID)) {
                                bonusProductsUUIDs.push(bonusItem.UUID);
                            }
                        }
                    }
                    currentBasket.removeProductLineItem(item);
                    isProductLineItemFound = true;
                    break;
                }
            }
        }
        HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
    });

    if (isProductLineItemFound) {
        var basketModel = new CartModel(currentBasket);
        var basketModelPlus = {
            basket: basketModel,
            toBeDeletedUUIDs: bonusProductsUUIDs
        };
        res.json(basketModelPlus);
    } else {
        res.setStatusCode(500);
        res.json({ errorMessage: Resource.msg('error.cannot.remove.product', 'cart', null) });
    }

    return next();
});

server.get('UpdateQuantity', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var HookMgr = require('dw/system/HookMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var collections = require('*/cartridge/scripts/util/collections');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var productId = req.querystring.pid;
    var updateQuantity = parseInt(req.querystring.quantity, 10);
    var uuid = req.querystring.uuid;
    var productLineItems = currentBasket.productLineItems;
//    var previousBonusDiscountLineItems = [];
    var matchingLineItem = collections.find(productLineItems, function (item) {
        return item.productID === productId && item.UUID === uuid;
    });
    var availableToSell = 0;

    var totalQtyRequested = 0;
    var qtyAlreadyInCart = 0;
    var minOrderQuantity = 0;
    var canBeUpdated = false;
    var bundleItems;
    var bonusDiscountLineItemCount = currentBasket.bonusDiscountLineItems.length;

    if (matchingLineItem) {
        if (matchingLineItem.product.bundle) {
            bundleItems = matchingLineItem.bundledProductLineItems;
            canBeUpdated = collections.every(bundleItems, function (item) {
                var quantityToUpdate = updateQuantity *
                    matchingLineItem.product.getBundledProductQuantity(item.product).value;
                qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                    item.productID,
                    productLineItems,
                    item.UUID
                );
                totalQtyRequested = quantityToUpdate + qtyAlreadyInCart;
                availableToSell = item.product.availabilityModel.inventoryRecord.ATS.value;
                minOrderQuantity = item.product.minOrderQuantity.value;
                return (totalQtyRequested <= availableToSell) &&
                    (quantityToUpdate >= minOrderQuantity);
            });
        } else {
            availableToSell = matchingLineItem.product.availabilityModel.inventoryRecord.ATS.value;
            qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                productId,
                productLineItems,
                matchingLineItem.UUID
            );
            totalQtyRequested = updateQuantity + qtyAlreadyInCart;
            minOrderQuantity = matchingLineItem.product.minOrderQuantity.value;
            canBeUpdated = (totalQtyRequested <= availableToSell) &&
                (updateQuantity >= minOrderQuantity);
        }
    }

    if (canBeUpdated) {
        Transaction.wrap(function () {
            matchingLineItem.setQuantityValue(updateQuantity);
            var previousBounsDiscountLineItems = [];
            currentBasket.bonusDiscountLineItems.toArray().forEach(function (prevItem) {
                previousBounsDiscountLineItems.push(prevItem.UUID);
            });

            HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
            if (currentBasket.bonusDiscountLineItems.length > bonusDiscountLineItemCount) {
                var prevItems = JSON.stringify(previousBounsDiscountLineItems);
                var bonusDiscountLineItems = currentBasket.bonusDiscountLineItems.toArray();
//                var newbonusDiscountLineItems = [];
                bonusDiscountLineItems.forEach(function (item) {
                    var test = prevItems.indexOf(item.UUID); // TODO
                    if (test < 0) {
                        item.custom.bonusProductLineItemUUID = matchingLineItem.UUID; // eslint-disable-line no-param-reassign
                        matchingLineItem.custom.bonusProductLineItemUUID = 'bonus';
                    }
                });
            }
        });
    }

    if (matchingLineItem && canBeUpdated) {
        // check to see if the the number of bonus line items was updated and add the cusom attribute to it.
        var basketModel = new CartModel(currentBasket);
        res.json(basketModel);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg('error.cannot.update.product.quantity', 'cart', null)
        });
    }

    return next();
});


server.post('SelectShippingMethod', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var HookMgr = require('dw/system/HookMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var shippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var error = false;

    var shipUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    var methodID = req.querystring.methodID || req.form.methodID;
    var shipment;
    if (shipUUID) {
        shipment = shippingHelper.getShipmentByUUID(currentBasket, shipUUID);
    } else {
        shipment = currentBasket.defaultShipment;
    }

    Transaction.wrap(function () {
        shippingHelper.selectShippingMethod(shipment, methodID);

        if (currentBasket && !shipment.shippingMethod) {
            error = true;
            return;
        }

        HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
    });

    if (!error) {
        var basketModel = new CartModel(currentBasket);

        res.json(basketModel);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg('error.cannot.select.shipping.method', 'cart', null)
        });
    }
    return next();
});

server.get('MiniCartShow', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var HookMgr = require('dw/system/HookMgr');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var reportingUrls = require('*/cartridge/scripts/reportingUrls');

    var currentBasket = BasketMgr.getCurrentBasket();
    var reportingURLs;

    if (currentBasket) {
        Transaction.wrap(function () {
            if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
                currentBasket.updateCurrency();
            }
            cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
            HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
        });
    }

    if (currentBasket && currentBasket.allLineItems.length) {
        reportingURLs = reportingUrls.getBasketOpenReportingURLs(currentBasket);
    }

    res.setViewData({ reportingURLs: reportingURLs });


    var basketModel = new CartModel(currentBasket);

    res.render('checkout/cart/miniCart', basketModel);
    next();
});

server.get(
    'AddCoupon',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var HookMgr = require('dw/system/HookMgr');
        var Resource = require('dw/web/Resource');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');
        var CartModel = require('*/cartridge/models/cart');

        var data = res.getViewData();
        if (data && data.csrfError) {
            res.json();
            return next();
        }

        var currentBasket = BasketMgr.getCurrentBasket();

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({
                error: true,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });

            return next();
        }

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({ errorMessage: Resource.msg('error.add.coupon', 'cart', null) });
            return next();
        }

        var error = false;
        var errorMessage;

        try {
            Transaction.wrap(function () {
                return currentBasket.createCouponLineItem(req.querystring.couponCode, true);
            });
        } catch (e) {
            error = true;
            var errorCodes = {
                COUPON_CODE_ALREADY_IN_BASKET: 'error.coupon.already.in.cart',
                COUPON_ALREADY_IN_BASKET: 'error.coupon.cannot.be.combined',
                COUPON_CODE_ALREADY_REDEEMED: 'error.coupon.already.redeemed',
                COUPON_CODE_UNKNOWN: 'error.unable.to.add.coupon',
                COUPON_DISABLED: 'error.unable.to.add.coupon',
                REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
                TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
                NO_ACTIVE_PROMOTION: 'error.unable.to.add.coupon',
                default: 'error.unable.to.add.coupon'
            };

            var errorMessageKey = errorCodes[e.errorCode] || errorCodes.default;
            errorMessage = Resource.msg(errorMessageKey, 'cart', null);
        }

        if (error) {
            res.json({
                error: error,
                errorMessage: errorMessage
            });
            return next();
        }

        Transaction.wrap(function () {
            HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
        });

        var basketModel = new CartModel(currentBasket);

        res.json(basketModel);
        return next();
    }
);


server.get('RemoveCouponLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var HookMgr = require('dw/system/HookMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var collections = require('*/cartridge/scripts/util/collections');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var couponLineItem;

    if (currentBasket && req.querystring.uuid) {
        couponLineItem = collections.find(currentBasket.couponLineItems, function (item) {
            return item.UUID === req.querystring.uuid;
        });

        if (couponLineItem) {
            Transaction.wrap(function () {
                currentBasket.removeCouponLineItem(couponLineItem);
                HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
            });

            var basketModel = new CartModel(currentBasket);

            res.json(basketModel);
            return next();
        }
    }

    res.setStatusCode(500);
    res.json({ errorMessage: Resource.msg('error.cannot.remove.coupon', 'cart', null) });
    return next();
});

server.get('ChooseBonusProducts', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var pids = req.querystring.pids.split(',');
    var potentialProducts = [];

    for (var i = 0; i < pids.length; i++) {
        var params = {
            pid: pids[i],
            pview: 'tile'
        };
        var product = ProductFactory.get(params);
        potentialProducts.push(product);
    }

    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var template = 'product/components/choiceofbonusproducts/chooseBonusProduct.isml';

    res.render(template, {
        potentialProducts: potentialProducts,
        addToCartUrl: addToCartUrl
    });

    next();
});

server.post('AddBonusProducts', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var Transaction = require('dw/system/Transaction');
    var collections = require('*/cartridge/scripts/util/collections');
    var Resource = require('dw/web/Resource');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var data = JSON.parse(req.querystring.pids);
    var pliUUID = req.querystring.pliuuid;
    var newBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
    var qtyAllowed = data.totalQty;
    var totalQty = 0;

    for (var i = 0; i < data.bonusProducts.length; i++) {
        totalQty += data.bonusProducts[i].qty;
    }
    if (totalQty > qtyAllowed) {
        res.json({
            errorMessage: Resource.msgf(
                'error.alert.choiceofbonus.max.quantity',
                'product',
                null,
                qtyAllowed,
                totalQty),
            error: true,
            success: false
        });
    } else {
        var bonusDiscountLineItem = collections.find(newBonusDiscountLineItems, function (item) {
            return item.UUID === req.querystring.uuid;
        });

        if (currentBasket) {
            Transaction.wrap(function () {
                var plistoDelete = bonusDiscountLineItem.getBonusProductLineItems();

                for (var n = 0; n < plistoDelete.length; n++) {
                    var pliToDelete = plistoDelete[n];
                    if (pliToDelete.product) {
                        currentBasket.removeProductLineItem(pliToDelete);
                    }
                }

                var pli;
                var plis = [];
                for (var l = 0; l < data.bonusProducts.length; l++) {
                    var product = ProductMgr.getProduct(data.bonusProducts[l].pid);
                    var selectedOptions = data.bonusProducts[l].options;
                    var optionModel =
                        productHelper.getCurrentOptionModel(
                            product.optionModel,
                            selectedOptions);
                    pli =
                        currentBasket.createBonusProductLineItem(
                        bonusDiscountLineItem,
                        product,
                        optionModel,
                        null);
                    pli.setQuantityValue(data.bonusProducts[l].qty);
                    pli.custom.bonusProductLineItemUUID = pliUUID;
                    plis.push(pli.UUID);
                }

                var currentBasketPlis = currentBasket.getAllProductLineItems();
                var pliIterator = currentBasketPlis.iterator();
                pli = undefined;
                var OriginalPLI;
                while (pliIterator.hasNext()) {
                    pli = pliIterator.next();
                    if (pli.UUID === pliUUID) {
                        OriginalPLI = pli;
                        OriginalPLI.custom.bonusProductLineItemUUID = '';
                    }
                }
                OriginalPLI.custom.bonusProductLineItemUUID = 'bonus';
            });
        }

        res.json({
            totalQty: currentBasket.productQuantityTotal,
            msgSuccess: Resource.msg('text.alert.choiceofbonus.addedtobasket', 'product', null),
            success: true,
            error: false
        });
    }
    next();
});

server.get('EditBonusProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var collections = require('*/cartridge/scripts/util/collections');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var duuid = req.querystring.duuid;
    var bonusDiscountLineItem = collections.find(currentBasket.getBonusDiscountLineItems(), function (item) {
        return item.UUID === duuid;
    });
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var selectedBonusProducts = [];
    bonusDiscountLineItem.bonusProductLineItems.toArray().forEach(function (bonusProductLineItem) {
        selectedBonusProducts.push({
            pid: bonusProductLineItem.productID,
            name: bonusProductLineItem.productName,
            submittedQty: bonusProductLineItem.quantityValue
        });
    });

    var pids = '';
    var count = 0;
    bonusDiscountLineItem.bonusProducts.toArray().forEach(function (bonusProduct) {
        if (count) {
            pids += ',';
        }
        pids += bonusProduct.ID;
        count++;
    });

    var queryString1 = '?DUUID=' + bonusDiscountLineItem.UUID + '&pids=' + pids + '&maxpids=' + bonusDiscountLineItem.maxBonusItems + '';

    res.json({
        selectedBonusProducts: selectedBonusProducts,
        addToCartUrl: URLUtils.url('Cart-AddBonusProducts').toString(),
        showProductsUrl: URLUtils.url('Product-ShowBonusProducts').toString(),
        maxBonusItems: bonusDiscountLineItem.maxBonusItems,
        pageSize: cartHelper.getPageSize(),
        pliUUID: bonusDiscountLineItem.custom.bonusProductLineItemUUID,
        uuid: bonusDiscountLineItem.UUID,
        bonusChoiceRuleBased: bonusDiscountLineItem.bonusChoiceRuleBased,
        selectprods: [],
        labels: {
            selectprods: Resource.msg('modal.header.selectproducts', 'product', null),
            selectattrs: Resource.msg('label.choiceofbonus.selectattrs', 'product', null),
            close: Resource.msg('link.choiceofbonus.close', 'product', null)
        },
        queryString1: queryString1,
        queryString2: '?DUUID=' + bonusDiscountLineItem.UUID + '&pagesize=' + cartHelper.getPageSize() + '&pagestart=0&maxpids=' + bonusDiscountLineItem.maxBonusItems + ''

    });
    next();
});

module.exports = server.exports();
