'use strict';

$(document).ready(function () {
    var campaignBannerStatus = window.sessionStorage.getItem('hide_campaign_banner');
    $('.campaign-banner .close').on('click', function () {
        $('.campaign-banner').addClass('d-none');
        window.sessionStorage.setItem('hide_campaign_banner', '1');
    });

    if (!campaignBannerStatus || campaignBannerStatus < 0) {
        $('.campaign-banner').removeClass('d-none');
    }
});
