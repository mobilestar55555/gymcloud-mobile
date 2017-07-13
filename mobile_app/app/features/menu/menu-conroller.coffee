App.controller "MenuCtrl", [
  '$scope'
  '$rootScope'
  '$state'
  'storage'
  'authService'
  '$ionicSideMenuDelegate'
  '$ionicScrollDelegate'
  'menuService'
  'ewpService'
  'clientsTypeService'
  'Restangular'
  'proNavigationService'
  (
    $scope
    $rootScope
    $state
    storage
    authService
    $ionicSideMenuDelegate
    $ionicScrollDelegate
    menuService
    ewpService
    clientsTypeService
    Restangular
    proNavigationService
  ) ->

    $scope.pathHistory = []
    $scope.menuArray = []
    $scope.currentLibraryItems = []
    $scope.isClientLibraryRoot = true
    if cordova?
      $scope.isApp = true
      cordova
        .getAppVersion
        .getVersionNumber()
        .then (version) ->
          $scope.version = version
      cordova
        .getAppVersion
        .getVersionCode()
        .then (build) ->
          $scope.build = build

    fetchConversations = ->
      Restangular
        .one('conversations')
        .getList()
        .then (conversations) ->
          $scope.conversationId = conversations[0]?.id
          $scope.noClientConversations = conversations.length is 0
          fetchPro()

    fetchPro = ->
      Restangular
        .one('users', $scope.currentUser.id)
        .one('collections/pros')
        .getList()
        .then (pros) ->
          $scope.proId = $rootScope.proId = pros[0].id

    $scope.isBase = (item) ->
      item.name in ['Exercises', 'Warmup Templates', 'Workout Templates', 'Program Templates']

    $scope.prevLevel = ->
      prevKey = $scope.pathHistory[$scope.pathHistory.length-2]

      if prevKey?
        prevItem = _.find($scope.menuArray, {id: prevKey})
        $scope.prevItem = prevItem
        $scope.current_items = prevItem.items
        $scope.pathHistory = $scope.pathHistory.slice(0, $scope.pathHistory.length-1)
      else
        $scope.pathHistory = []
        $scope.current_items = $scope.menu_data

    $scope.toggleLevel = (item) ->
      if item.isFolder
        $scope.pathHistory.push item.id
        $scope.prevItem = item
        $scope.current_items = item.items
        item.isExpanded = not item.isExpanded
      $ionicScrollDelegate.resize()

    $scope.goToItem = (item) ->
      $ionicSideMenuDelegate.toggleLeft()
      proNavigationService.goToItem(item)

    $scope.logOut = ->
      authService.logout()

    assignType = (collection, type) ->
      for item in collection.items
        item.type = type
        assignType(item, type) if item.parent_id

    # Creating array with only one level of nesting to go back
    createMenuArray = (data) ->
      for folder in data
        if folder.items
          folder.isFolder = true
          for item in folder.items
            item.icon = 'side-menu-icon-' + _.first(item.type.split(' ')).toLowerCase()
          $scope.menuArray.push folder
          createMenuArray(folder.items)

    # FOR CLIENTS

    getClientLibrary = ->
      ewpService
        .getPersonalExercises($scope.currentUser.id)
        .then (exercises) ->
          $scope.clientExercises = exercises

      ewpService
        .getPersonalWarmups($scope.currentUser.id)
        .then (warmups) ->
          $scope.clientWarmups = warmups

      ewpService
        .getPersonalWorkouts($scope.currentUser.id)
        .then (workouts) ->
          $scope.clientWorkouts = workouts

      ewpService
        .getPersonalPrograms($scope.currentUser.id)
        .then (programs) ->
          $scope.clientPrograms = programs

    $scope.showLibraryContent = (type) ->
      param = {
        Exercises:
          content: $scope.clientExercises
          type: 'ExerciseItem'
          state: 'app.personalExercise'
          stateParam: 'exerciseId'
        Warmups:
          content: $scope.clientWarmups
          type: 'WarmupItem'
          state: 'app.clientPersonalWorkout'
          stateParam: 'workoutId'
        Workouts:
          content: $scope.clientWorkouts
          type: 'WorkoutItem'
          state: 'app.clientPersonalWorkout'
          stateParam: 'workoutId'
        Programs:
          content: $scope.clientPrograms
          type: 'ProgramItem'
          state: 'app.clientPersonalProgram'
          stateParam: 'programId'
      }[type]

      $scope.currentLibraryItems = param.content
      $scope.prevItem = type
      $scope.currentLibraryItemsType = param.type
      $scope.isClientLibraryRoot = false

      $scope.goToPersonalItem = (itemId) ->
        stateHash = { userId: $scope.currentUser.id }
        stateHash[param.stateParam] = itemId
        $state.go(param.state, stateHash)
        $ionicSideMenuDelegate.toggleLeft()

    $scope.goToPersonalFolder = (personalType) ->
      $ionicSideMenuDelegate.toggleLeft()
      $state.go 'app.personalItemsList',
        userId: $scope.currentUser.id
        personalType: personalType

    $scope.goToRootLevel = ->
      $scope.isClientLibraryRoot = true
      $scope.currentLibraryItems = []

    $scope.doRefresh = ->
      $scope.currentUser = storage.getCurrentUser().user_data
      $scope.userType = clientsTypeService.run($scope.currentUser)
      $scope.isTrainer = $scope.currentUser.is_pro

      if $scope.isTrainer
        menuService
          .getData()
          .then (data) ->
            $scope.pathHistory = []
            $scope.menu_data = []
            for item in data[0].items
              switch item.name
                when 'Exercises'
                  $scope.menu_data[0] = item
                  $scope.menu_data[0].icon = 'side-menu-icon-exercise'
                  $scope.menu_data[0].type = 'Exercises'
                when 'Warmup Templates'
                  $scope.menu_data[1] = item
                  $scope.menu_data[1].icon = 'side-menu-icon-warmup'
                  $scope.menu_data[1].type = 'Warmup Templates'
                when 'Workout Templates'
                  $scope.menu_data[2] = item
                  $scope.menu_data[2].icon = 'side-menu-icon-workout'
                  $scope.menu_data[2].type = 'Workout Templates'
                when 'Program Templates'
                  $scope.menu_data[3] = item
                  $scope.menu_data[3].icon = 'side-menu-icon-program'
                  $scope.menu_data[3].type = 'Program Templates'
            $scope.current_items = $scope.menu_data
            for folder in $scope.menu_data
              type = folder.name
              assignType(folder, type)
            createMenuArray($scope.menu_data)
            $rootScope.library = $scope.menuArray
      else
        getClientLibrary()
        fetchConversations()

    $rootScope.$on 'userInfoChanged', (event) ->
      $scope.currentUser = storage.getCurrentUser().user_data

    $rootScope.$on 'userLoggedIn', (event) ->
      $scope.doRefresh()

    $rootScope.$on 'hideNotificationIcon', (event) ->
      $scope.hideNotifications = true

    $rootScope.$on 'showNotificationIcon', (event) ->
      $scope.hideNotifications = false

    $rootScope.$on 'onboardingFinished', (event) ->
      $scope.doRefresh()

    $scope.doRefresh()
]