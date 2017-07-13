describe('login page', function() {
  browser.get('/');

  var hasClass = function (element, cls) {
    return element.getAttribute('class').then(function (classes) {
      return classes.split(' ').indexOf(cls) !== -1;
    });
  };

  it('should automatically redirect to /login', function() {
    expect(browser.getCurrentUrl()).toMatch("http://localhost:8100/#/login");
  });


  describe('auth and dashboard page', function() {
    beforeEach(function() {
      var email = browser.findElement(protractor.By.model('user.username'));
      email.sendKeys('gymcloud@yopmail.com');
      var password = browser.findElement(protractor.By.model('user.password'));
      password.sendKeys('gymcloud');
      var submit = browser.findElement(protractor.By.id('email-login'));
      submit.click();
    });

    it('has a dashboard heading', function() {
      var heading = browser.findElement(protractor.By.tagName('h1'));
      expect(heading.getText()).toEqual('DASHBOARD');
      heading = browser.findElement(protractor.By.tagName('h2'));
      expect(heading.getText()).toEqual('TEST ACCOUNT');
    });
  });

  describe('menu area', function() {
    beforeEach(function() {
      var nav_btn = browser.findElement(protractor.By.css('.nav-btn'));
      nav_btn.click();
    });

    it('expand menu', function() {
      var menu_element = browser.element(protractor.By.css('.menu-list')).all(protractor.By.css('.item')).first();
      menu_element.all(protractor.By.css('.side-menu-item-content')).first().click();
      expect(hasClass(menu_element, 'side-menu-expanded')).toBe(true);
      menu_element.all(protractor.By.css('.side-menu-item-content')).first().click();
      expect(hasClass(menu_element, 'side-menu-expanded')).toBe(false);
      browser.findElement(protractor.By.css('.nav-btn')).click();
    });

  });

  describe('profile page', function() {
    beforeEach(function() {
      var profile_link = browser.findElement(protractor.By.id('dashboard-profile-link'));
      profile_link.click();
    });

    it('has a profile heading', function() {
      var heading = browser.findElement(protractor.By.tagName('h1'));
      expect(heading.getText()).toEqual('PROFILE');
      heading = browser.findElement(protractor.By.tagName('h2'));
      expect(heading.getText()).toEqual('TEST ACCOUNT');
    });

  });


  describe('notifications page', function() {
    beforeEach(function() {
      browser.findElement(protractor.By.linkUiSref('app.notifications')).click();
    });

    it('has a notifications heading', function() {
      var heading = browser.findElement(protractor.By.tagName('h1'));
      expect(heading.getText()).toEqual('NOTIFICATIONS');
    });

  });

});
