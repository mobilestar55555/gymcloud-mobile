App.controller "ConversationCtrl", [
  '$scope'
  '$rootScope'
  '$state'
  '$ionicScrollDelegate'
  '$timeout'
  '$ionicTabsDelegate'
  'Restangular'
  'storage'
  'sendFirstMessageService'
  'sendMessageService'
  (
    $scope
    $rootScope
    $state
    $ionicScrollDelegate
    $timeout
    $ionicTabsDelegate
    Restangular
    storage
    sendFirstMessageService
    sendMessageService
  ) ->

    if $rootScope.messageCategory
      $timeout (->
        $ionicTabsDelegate.select($rootScope.messageCategory - 1)
        $rootScope.messageCategory = undefined
      ), 0

    $scope.newMessage =
      body: undefined
      attachment: undefined
      message_category: undefined
      video_id: undefined
      video_url: undefined
      workout_event_id: undefined

    footerBar = undefined
    scroller = undefined
    messagesPage = 1

    viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll')
    $scope.currentUser = storage.getCurrentUser().user_data
    $scope.conversation = []
    if $state.current.name is 'app.proConversation' or
    $state.current.name is 'app.clientConversation'
      conversationId = $state.params.conversationId
    else
      conversationId = undefined
    $scope.isNewConversation = $state.current.name is 'app.newConversation'

    $scope.loadMoreMessages = (category) ->
      messagesPage++
      options =
        message_category: category
        per_page: 10
        page: messagesPage
      Restangular
        .one('conversations', conversationId)
        .get(options).then (conversation) ->
          $scope.conversation = $scope.conversation.concat(conversation)

    $rootScope.$on 'newConversationMessage', (event, message) ->
      if $scope.newMessage.message_category is message.message_category
        $scope.conversation.push(message)
        $scope.$apply()
        viewScroll.scrollBottom()

    $rootScope.$on 'newConversationPush', (event, data) ->
      messageCategory = data.additionalData.message_category
      if messageCategory isnt $scope.newMessage.message_category
        $ionicTabsDelegate.select(messageCategory - 1)
      else
        message =
          body: data.message
          conversation_id: data.additionalData.conversation_id
          message_category: data.additionalData.message_category
        $scope.conversation.push(message)
        $scope.$apply()
      viewScroll.scrollBottom()

    $scope.fetchMessages = (category = 1) ->
      if $rootScope.messageCategory and $rootScope.messageCategory isnt category
        return false
      $scope.newMessage.message_category = category
      return false if $scope.isNewConversation
      options =
        message_category: category
        per_page: 10
        page: 1
      Restangular
        .one('conversations', conversationId)
        .get(options).then (conversation) ->
          $scope.conversation = conversation
          $scope.isEmptyConversation = conversation.length is 0
          messagesPage = 1
          $timeout (->
            viewScroll.scrollBottom()
          ), 0

    $scope.attachFile = (file) ->
      $scope.newMessage.attachment = file

    $scope.sendFirstMessage = (messageBody) ->
      $scope.sendingIsBlocked = true
      $scope.newMessage.body = messageBody
      sendFirstMessageService
        .sendMessage($scope.newMessage, $state.params.recipientId)
        .then (message) ->
          $scope.isNewConversation = false
          conversationId = message.conversation_id
          $scope.conversation.push(message)
          clearData()
          $scope.sendingIsBlocked = false
          viewScroll.scrollBottom()

    $scope.sendMessage = (messageBody) ->
      $scope.sendingIsBlocked = true
      if $scope.newMessage.message_category is 2
        $scope.newMessage.workout_event_id = $scope.conversation[0].workout_event_id
      $scope.newMessage.body = messageBody
      sendMessageService
        .sendMessage($scope.newMessage, conversationId)
        .then (message) ->
          $scope.isEmptyConversation = false
          $scope.conversation.push(message)
          clearData()
          $scope.sendingIsBlocked = false
          viewScroll.scrollBottom()

    $scope.removeAttachment = ->
      $scope.newMessage.attachment = undefined

    clearData = ->
      $scope.newMessage.body = undefined
      $scope.newMessage.attachment = undefined

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
]