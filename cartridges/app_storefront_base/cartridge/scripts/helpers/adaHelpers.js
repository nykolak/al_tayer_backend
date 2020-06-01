'use strict';
/**
 * This is to remove a duplicate value attrbute on a input field that appears in the html for objects that bind to BM objects
 * @param {string} formFeildAttrStr - attrributes on the form object
 * @returns {string} - with out the value attribute
 */
function removeDuplicateValueAttr(formFeildAttrStr) {
    var splitArray = formFeildAttrStr.split(' ');
    var returnVal = '';
    splitArray.forEach(function (key) {
        if (key.indexOf('value=') !== 0) {
            returnVal = returnVal + key + ' ';
        }
    });

    return returnVal;
}

module.exports = {
    removeDuplicateValueAttr: removeDuplicateValueAttr
};
