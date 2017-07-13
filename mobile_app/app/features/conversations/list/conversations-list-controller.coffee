App.controller "ConversationsListCtrl", [
  '$scope'
  '$state'
  '$rootScope'
  'Restangular'
  'storage'
  'clientsTypeService'
  '$ionicTabsDelegate'
  '$timeout'
  (
    $scope
    $state
    $rootScope
    Restangular
    storage
    clientsTypeService
    $ionicTabsDelegate
    $timeout
  ) ->

    $scope.initialize = ->
      $rootScope.conversationRecipient = null
      $scope.currentUser = storage.getCurrentUser().user_data
      Restangular
        .one('conversations')
        .getList()
        .then (conversations) ->
          $scope.conversations = conversations
          $scope.emptyConversations = conversations.length is 0
          excludeMyself(conversations)

    excludeMyself = (conversations) ->
      for conversation in conversations
        conversation.recipients = _.filter conversation.recipients, (item) ->
          item.user_id isnt $scope.currentUser.id

    $scope.deleteConversation = (id, index) ->
      Restangular
        .one('conversations', id)
        .remove().then ->
          $scope.conversations.splice index, 1

    $scope.goToConversation = (conversation) ->
      $rootScope.conversationRecipient = conversation.recipients[0].full_name
      $rootScope.messageCategory = conversation.last_message.message_category
      $state.go 'app.proConversation',
        conversationId: conversation.id

    $scope.initialize()
]