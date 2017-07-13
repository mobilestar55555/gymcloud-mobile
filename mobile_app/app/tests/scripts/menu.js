describe('Unit: MenuCtl', function() {
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

  var ctrl, scope, templateResponse, token, menu_respond;
  beforeEach(inject(function($injector) {
    $state = $injector.get('$state')
    authService = $injector.get('authService')
    menuService = $injector.get('menuService')
    Restangular = $injector.get('Restangular')
    $httpBackend = $injector.get('$httpBackend')
    $httpBackend.when('GET', /^templates\/.*\.html/).respond(templateResponse);
    menu_respond = '[{"key":1290,"title":"Exercises","itemType":"ExerciseFolder","isFolder":true,"items":[{"key":1294,"title":"Bodyweight","itemType":"ExerciseFolder","isFolder":true,"items":[{"key":1198,"title":"Flex Arm Hang","itemType":"ExerciseItem","isFolder":false,"isRoot":false},{"key":1197,"title":"Side Plank","itemType":"ExerciseItem","isFolder":false,"isRoot":false},{"key":1196,"title":"Pushup","itemType":"ExerciseItem","isFolder":false,"isRoot":false}],"isRoot":false},{"key":1444,"title":"Test ABC","itemType":"ExerciseFolder","isFolder":true,"items":[{"key":1247,"title":"z","itemType":"ExerciseItem","isFolder":false,"isRoot":false},{"key":1246,"title":"Unilateral Overhead Press","itemType":"ExerciseItem","isFolder":false,"isRoot":false}],"isRoot":false},{"key":1248,"title":"test ajaq","itemType":"ExerciseItem","isFolder":false,"isRoot":false}],"isRoot":true},{"key":1292,"title":"Workouts","itemType":"WorkoutFolder","isFolder":true,"items":[{"key":678,"title":"Beginner Strength","itemType":"WorkoutItem","isFolder":false,"isRoot":false},{"key":716,"title":"yo1w","itemType":"WorkoutItem","isFolder":false,"isRoot":false}],"isRoot":true},{"key":1291,"title":"Programs","itemType":"ProgramFolder","isFolder":true,"items":[{"key":207,"title":"x","itemType":"ProgramItem","isFolder":false,"isRoot":false}],"isRoot":true}]'
    $httpBackend.when('GET', 'http://alpha.s.gymcloud.com/api/mobile/library/').respond(menu_respond)
    $rootScope = $injector.get('$rootScope')
    $scope = $rootScope.$new()
    $controller = $injector.get('$controller')
    ctrl = $controller('MenuCtrl', {
      $scope: $scope
    });
  }));

  // DISABLING NOW, BECAUSE MENU IS REWRITTEN A LOT

  // it('should create $scope.menu_data array', function() {
  //   $scope.doRefresh()
  //   $httpBackend.flush();
  //   expect(sanitizeRestangularAll($scope.menu_data)).toEqual(toObject(JSON.parse(menu_respond)));
  // });

  // it('should return true', function() {
  //   expect($scope.isBase({title: 'Workouts'})).toEqual(true);
  //   expect($scope.isBase({title: 'Exercises'})).toEqual(true);
  //   expect($scope.isBase({title: 'Programs'})).toEqual(true);
  // });

  // it('should return true and false', function() {
  //   $scope.doRefresh()
  //   $httpBackend.flush();
  //   $scope.toggleLevel($scope.menu_data[0])
  //   expect($scope.menu_data[0].isExpanded).toEqual(true);
  //   $scope.toggleLevel($scope.menu_data[0])
  //   expect($scope.menu_data[0].isExpanded).toEqual(false);
  // });
})
