const { I, data, accountPage } = inject();


Then('shopper clicks edit password', () => {
    // From "test/acceptance/features/accountPage/changePassword.feature"
    I.amOnPage('/on/demandware.store/Sites-RefArch-Site/en_US/Account-EditPassword');
});

Then('shopper changes their password', () => {
    // From "test/acceptance/features/accountPage/changePassword.feature"
    accountPage.changePassword(data.login.password, data.account.newPassword);
});