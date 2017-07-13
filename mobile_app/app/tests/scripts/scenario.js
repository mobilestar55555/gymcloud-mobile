describe('Unit: SignInCtrl', function() {
  beforeEach(module('gymcloud'));

  function toObject(arr) {
    var rv = {};
    for (var i = 0; i < arr.length; ++i)
      if (arr[i] !== undefined) rv[i] = arr[i];
    return rv;
  }

  function sanitizeRestangularAll(items) {
    var all = _.map(items, function (item) {
      return sanitizeRestangularOne(item);
    });
    return sanitizeRestangularOne(all);
  }

  function sanitizeRestangularOne(item) {
    return _.omit(item, "route", "parentResource", "getList", "get", "post", "put", "remove", "head", "trace", "options", "patch",
      "$get", "$save", "$query", "$remove", "$delete", "$put", "$post", "$head", "$trace", "$options", "$patch",
      "$then", "$resolved", "restangularCollection", "customOperation", "customGET", "customPOST",
      "customPUT", "customDELETE", "customGETLIST", "$getList", "$resolved", "restangularCollection", "one", "all", "doGET", "doPOST",
      "doPUT", "doDELETE", "doGETLIST", "addRestangularMethod", "getRestangularUrl", "withHttpConfig", "getRequestedUrl", "clone",
      "reqParams", "plain", "several", "oneUrl", "allUrl", "fromServer", "save", "singleOne", "getParentList");
  }

  var ctrl, scope, templateResponse, token, profile_respond, notifications_respond;
  beforeEach(inject(function($injector) {
    $state = $injector.get('$state')
    authService = $injector.get('authService')
    Restangular = $injector.get('Restangular')
    $httpBackend = $injector.get('$httpBackend')
    $httpBackend.when('GET', /^templates\/.*\.html/).respond(templateResponse);
    $httpBackend.when('POST', 'http://api.s.gymcloud.com/oauth/token').respond('{"access_token": "here_is_token"}');
    profile_respond = '{"full_name":"Test Account","email":"gymcloud@yopmail.com","location":"location","phone":"+818-72-7759760","account_type":"Personal Trainer","id":16}'
    notifications_respond = '[{"from":"Test Account","unread":false,"message":"has sent a new message","created_at":"2014-11-28T14:58:29Z"}]'
    $httpBackend.when('GET', 'http://api.s.gymcloud.com/api/mobile/me?access_token=here_is_token').respond(profile_respond)
    $httpBackend.when('GET', 'http://api.s.gymcloud.com/api/mobile/notifications?access_token=here_is_token').respond(notifications_respond)
    $rootScope = $injector.get('$rootScope')
    $scope = $rootScope.$new()
    $controller = $injector.get('$controller')
    ctrl = $controller('SignInCtrl', {
      $scope: $scope
    });
  }));

  // it('should create $scope.user when empty object', function() {
  //     expect($scope.user).toEqual({})
  // });
  //
  // it('should get login access_token', function() {
  //     $scope.user.username = 'gymcloud@yopmail.com';
  //     $scope.user.password = 'gymcloud';
  //     var token = null;
  //     authService.login($scope.user).then(function (response) {
  //         token = response.access_token;
  //     });
  //     $httpBackend.flush();
  //     expect(token).toEqual('here_is_token')
  // });

})
