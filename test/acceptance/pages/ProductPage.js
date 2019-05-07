const I = actor();

module.exports = {
    locators: {
        selectSize: '.select-size',
        addToCartButton: '.add-to-cart',
        miniCartIcon: '.minicart',
        cartHeader: '.cart-header'
    },
    selectSize(size) {
        I.waitForElement(this.locators.selectSize);
        I.selectOption(this.locators.selectSize, size);
    },
    addToCart() {
        I.waitForEnabled(this.locators.addToCartButton);
        I.click(this.locators.addToCartButton);
    },
    viewCart() {
        I.scrollPageToTop();
        I.wait(2);
        I.click(this.locators.miniCartIcon);
        I.waitForElement(this.locators.cartHeader);
    }
}