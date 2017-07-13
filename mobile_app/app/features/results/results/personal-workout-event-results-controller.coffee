App.controller "PersonalWorkoutEventResultsCtrl", [
  '$scope'
  '$state'
  '$timeout'
  'storage'
  'Restangular'
  '$q'
  '$ionicScrollDelegate'
  'notificationsService'
  '$ionicHistory'
  '$rootScope'
  '$filter'
  '$ionicPopup'
  'errorsService'
  'convertPropertiesService'
  'sendMessageService'
  'sendFirstMessageService'
  (
    $scope
    $state
    $timeout
    storage
    Restangular
    $q
    $ionicScrollDelegate
    notificationsService
    $ionicHistory
    $rootScope
    $filter
    $ionicPopup
    errorsService
    convertPropertiesService
    sendMessageService
    sendFirstMessageService
  ) ->

    initialize = ->
      $q.when(storage.getUserName()).then (name) ->
        $scope.userName = name

      Restangular
        .one('workout_events', eventId)
        .one('full')
        .get().then (result) ->
          result.exercises = _.sortBy(result.exercises, 'position')
          convertPropertiesService.get(result)
          $scope.workout = result
          fetchComments()
          groupExercises()
          $scope.currentExercisesGroup = groupedExercises[0]
          $scope.toggleExercise($scope.currentExercisesGroup[0], 0)
          checkCommentFromNotification()
          $scope.showFinish = groupedExercises.length is 1

    $scope.userId = $state.params.userId
    $scope.personalWorkoutId = $state.params.workoutId
    eventId = +$state.params.eventId
    groupedExercises = []
    $scope.disablePrev = true
    $scope.visibleResultsForm = []
    $scope.commentsState = notificationsService.getCommentState()
    isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1
    currentUser = storage.getCurrentUser().user_data
    viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll')
    footerBar = undefined
    scroller = undefined
    $scope.conversation = []
    $scope.newMessage =
      body: undefined
      attachment: undefined
      message_category: 2
      video_id: undefined
      video_url: undefined
      workout_event_id: eventId

    fetchComments = ->
      recipient_id = if currentUser.is_pro
        $scope.userId
      else
        $rootScope.proId
      params =
        recipient_id: recipient_id
        # Currently fetching whole conversation to check if it's empty
        # because it can have no comments (category 2), but have general (cat 1)
        # message_category: 2

      Restangular
        .one('conversations/by_clients')
        .get(params).then (conversation) ->
          $scope.isNewConversation = conversation.length is 0
          unless $scope.isNewConversation
            $scope.conversationId = conversation[0].conversation_id
          filterComments(conversation)
          $timeout (->
            viewScroll.scrollBottom()
          ), 0

    $rootScope.$on 'newConversationMessage', (event, message) ->
      if message.message_category is 2
        $scope.conversation.push(message)
        $scope.$apply()
        viewScroll.scrollBottom()

    $scope.sendFirstMessage = (messageBody) ->
      $scope.sendingIsBlocked = true
      $scope.newMessage.body = messageBody
      sendFirstMessageService
        .sendMessage($scope.newMessage, $scope.userId)
        .then (message) ->
          $scope.isNewConversation = false
          $scope.isEmptyConversation = false
          $scope.conversationId = message.conversation_id
          $scope.conversation.push(message)
          clearData()
          $scope.sendingIsBlocked = false
          viewScroll.scrollBottom()

    $scope.sendMessage = (messageBody) ->
      $scope.sendingIsBlocked = true
      $scope.newMessage.body = messageBody
      sendMessageService
        .sendMessage($scope.newMessage, $scope.conversationId)
        .then (message) ->
          $scope.isEmptyConversation = false
          $scope.conversation.push(message)
          clearData()
          $scope.sendingIsBlocked = false
          viewScroll.scrollBottom()

    filterComments = (conversation) ->
      for message in conversation
        if message.message_category is 2 and message.workout_event_id is eventId
          $scope.conversation.push(message)
      $scope.isEmptyConversation = $scope.conversation.length is 0

    goToProfile = ->
      if currentUser.is_pro and currentUser.id is $scope.userId
        $state.go 'app.myTraining'
      else if currentUser.is_pro and currentUser.id isnt $scope.userId
        $state.go 'app.userProfile',
          userId: $scope.userId
      else
        $state.go 'app.clientDashboard'

    $scope.toggleExercise = (exercise, index) ->
      $ionicScrollDelegate.scrollTop()
      if $scope.isExerciseShown(exercise)
        $scope.shownExercise = null
      else
        $scope.shownExercise = exercise
      $ionicScrollDelegate.resize()

    $scope.isExerciseShown = (exercise) ->
      $scope.shownExercise == exercise

    $scope.leaveResults = ->
      if $scope.workout.is_completed
        $ionicHistory.goBack()
      else
        confirmPopup = $ionicPopup.confirm(
          title: 'You are aborting this workout'
          template: 'Aborting this workout will delete your session data. Are you sure you want to abort this workout?'
        )

        confirmPopup.then (res) ->
          if res
            Restangular
              .one('workout_events', eventId)
              .remove().then (->
                goToProfile()
              ), (error) ->
                alert error

    $scope.overviewWorkout = ->
      $rootScope.$broadcast('hideNotificationIcon')
      $state.go 'app.resultsWorkoutOverview',
        userId: $scope.userId
        workoutId: $scope.personalWorkoutId

    $scope.showResultsForm = (index) ->
      $scope.visibleResultsForm[index] = true
      $ionicScrollDelegate.resize()

    groupExercises = ->
      groupArrayIndex = 0
      for exercise, index in $scope.workout.exercises
        exercise.newResult = []
        exercise.isPersonalBest = false
        if index is 0
          groupedExercises[groupArrayIndex] = []
          groupedExercises[groupArrayIndex].push exercise
          continue
        else
          if (exercise.order_name and
              exercise.order_name.charAt(0) is $scope.workout.exercises[index - 1].order_name.charAt(0))
            # push to the same group array if current exercise order character is the same as in previous exercise
            groupedExercises[groupArrayIndex].push exercise
          else
            groupArrayIndex++
            groupedExercises[groupArrayIndex] = []
            groupedExercises[groupArrayIndex].push exercise

    $scope.toggleNewPersonalBest = (exercise) ->
      exercise.isPersonalBest = !exercise.isPersonalBest

    $scope.hideNewResultCard = (exercise, index) ->
      $scope.visibleResultsForm[index] = false
      exercise.newResult = []
      exercise.isPersonalBest = false

    $scope.saveResult = (exercise, index) ->
      if exercise.newResult.length is 0
        errorsService.errorAlert(
          'Fields are blank'
          'Enter results before saving data.'
        )
        return
      newResult =
        workout_event_id: eventId
        workout_exercise_id: exercise.workout_exercise_id
        is_personal_best: exercise.isPersonalBest
      results = exercise.exercise_results
      exercise.exercise_properties = $filter('orderBy')(exercise.exercise_properties, "position")
      for key, value of exercise.newResult
        exercise.exercise_properties[key].new_result =  value
      convertPropertiesService.set(exercise)
      $scope.visibleResultsForm[index] = false

      Restangular
        .all('exercise_results')
        .post(newResult)
        .then (result) ->
          results.push result
          for property in exercise.exercise_properties
            if property.new_result isnt ""
              resultItem =
                exercise_property_id: property.id
                value: property.new_result
              Restangular
                .one('exercise_results', result.id)
                .post('items', resultItem)
                .then (item) ->
                  convertPropertiesService.getOneResult(item)
                  results[results.length-1].exercise_result_items.push item
                  exercise.newResult = []

    $scope.updateResult = (property) ->
      Restangular
        .one('exercise_results', property.exercise_result_id)
        .one('items', property.id)
        .patch(value: property.value)

    $scope.scrollToInput = (event) ->
      if isAndroid
        $timeout (->
          $ionicScrollDelegate.scrollBottom()
        ), 700
      else
        return false

    $scope.togglePersonalBest = (result) ->
      result.is_personal_best = !result.is_personal_best
      Restangular
        .one('exercise_results', result.id)
        .patch(is_personal_best: result.is_personal_best)

    $scope.deleteResult = (exercise, result, index) ->
      Restangular
        .one('exercise_results', result.id)
        .remove().then (result) ->
          exercise.exercise_results.splice index, 1

    nextExercise = (currentExercisesGroup) ->
      $scope.hideComments()
      index = groupedExercises.indexOf currentExercisesGroup
      $scope.newResult = []

      if index >= 0 and index < groupedExercises.length - 1
        $scope.currentExercisesGroup = groupedExercises[index + 1]
        if $scope.shownExercise isnt $scope.currentExercisesGroup[0] and $scope.currentExercisesGroup.length is 1
          $scope.toggleExercise($scope.currentExercisesGroup[0], 0)
        $scope.disablePrev = false
        $ionicScrollDelegate.scrollTop()
        $scope.showFinish = index is groupedExercises.length - 2

    $scope.saveAndGoNextExercise = (currentExercisesGroup) ->
      for exercise in currentExercisesGroup
        $scope.saveResult(exercise) if exercise.newResult.length > 0

      nextExercise(currentExercisesGroup)

    $scope.prevExercise = (currentExercisesGroup) ->
      index = groupedExercises.indexOf currentExercisesGroup

      if index > 0 and index <= groupedExercises.length - 1
        $scope.hideComments()
        $scope.currentExercisesGroup = groupedExercises[index - 1]
        if $scope.shownExercise isnt $scope.currentExercisesGroup[0] and $scope.currentExercisesGroup.length is 1
          $scope.toggleExercise($scope.currentExercisesGroup[0], 0)
        $ionicScrollDelegate.scrollTop()
        $scope.showFinish = false
        $scope.disablePrev = index is 1

    checkCommentFromNotification = ->
      $scope.showComments() if $scope.commentsState.visible

    $scope.showComments = ->
      $scope.commentsState.visible = true
      $timeout (->
        viewScroll.scrollBottom()
      ), 0

    $scope.navAction = ->
      if $scope.commentsState.visible
        $scope.hideComments()
      else
        goToProfile()

    $scope.hideComments = ->
      $scope.commentsState.visible = false
      $ionicScrollDelegate.scrollTop()

    goToCompletedScreen = ->
      $state.go 'app.eventCompleted',
        userId: $scope.userId
        workoutId: $scope.personalWorkoutId
        eventId: eventId

    clearData = ->
      $scope.newMessage.body = undefined
      file = undefined
      $scope.newMessage.attachment = undefined

    $scope.finish = ->
      if $scope.workout.is_completed
        goToCompletedScreen()
      else
        Restangular
          .one('workout_events', eventId)
          .patch(is_completed: true)
          .then ->
            goToCompletedScreen()

    # For input resizing

    $scope.$on '$ionicView.enter', ->
      $timeout (->
        footerBar = document.body.querySelector('.bar-footer')
        scroller = document.body.querySelector('.scroll-content')
      ), 0

    $scope.$on 'taResize', (e, ta) ->
      return if !ta
      taHeight = ta[0].offsetHeight
      return if !footerBar
      newFooterHeight = taHeight + 10
      newFooterHeight = if newFooterHeight > 44 then newFooterHeight else 44
      footerBar.style.height = "#{newFooterHeight}px"
      scroller.style.bottom = "#{newFooterHeight}px"

    $scope.removeLastCommentPadding = ->
      $scope.commentsPadding = false
      $timeout (->
        $ionicScrollDelegate.scrollBottom()
      ), 100

    $scope.addLastCommentPadding = ->
      $scope.commentsPadding = true
      $timeout (->
        $ionicScrollDelegate.scrollBottom()
      ), 100

    $scope.removeResultsBottomMargin = ->
      $scope.resultsMargin = false

    $scope.addResultsBottomMargin = ->
      $scope.resultsMargin = true

    initialize()
]
