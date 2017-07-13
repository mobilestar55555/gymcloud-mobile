App.controller "ResultsOverviewCtrl", [
  '$scope'
  '$rootScope'
  '$state'
  'Restangular'
  'storage'
  '$timeout'
  'notificationsService'
  'convertPropertiesService'
  'sendMessageService'
  'sendFirstMessageService'
  '$ionicScrollDelegate'
  '$ionicHistory'
  (
    $scope
    $rootScope
    $state
    Restangular
    storage
    $timeout
    notificationsService
    convertPropertiesService
    sendMessageService
    sendFirstMessageService
    $ionicScrollDelegate
    $ionicHistory
  ) ->

    initialize = ->
      $scope.isNewConversation = true
      Restangular
        .one('workout_events', eventId)
        .one('full')
        .get().then (result) ->
          result.exercises = _.sortBy(result.exercises, 'position')
          convertPropertiesService.get(result)
          $scope.event = result
          fetchComments()
          checkCommentFromNotification()

    eventId = +$state.params.eventId
    $scope.commentsState = notificationsService.getCommentState()
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
        $state.params.userId
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
        .sendMessage($scope.newMessage, $state.params.userId)
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

    checkCommentFromNotification = ->
      $scope.showComments() if $scope.commentsState.visible

    $scope.showComments = ->
      $scope.commentsState.visible = true
      $timeout (->
        $ionicScrollDelegate.resize()
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

    clearData = ->
      $scope.newMessage.body = undefined
      file = undefined
      $scope.newMessage.attachment = undefined

    $scope.goBack = ->
      if $scope.commentsState.visible
        $scope.commentsState.visible = false
      else
        $ionicHistory.goBack()

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
