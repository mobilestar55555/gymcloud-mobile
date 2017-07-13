App.factory 'notificationsService', [
  '$rootScope'
  'Restangular'
  '$state'
  'storage'
  (
    $rootScope
    Restangular
    $state
    storage
  ) ->

    newEventNotification = {}
    userId = null
    comment =
      visible: false
      commentExerciseId: ''

    goToAssignedItem = (notification) ->
      param = {
        PersonalWorkout:
          state: 'app.clientPersonalWorkout'
          stateParam: 'workoutId'
        PersonalProgram:
          state: 'app.clientPersonalProgram'
          stateParam: 'programId'
      }[notification.trackable_type]

      # This notifications only for clients, so userId is currentUserId
      stateHash = { userId: userId }
      stateHash[param.stateParam] = notification.trackable_id
      $state.go(param.state, stateHash)

    goToResults = (notification) ->
      $state.go 'app.personalWorkoutEventResults',
        userId: notification.parent.user_id
        workoutId: notification.parent.personal_workout_id
        eventId: notification.parent.workout_event_id

    setNewEventDate: (notification) ->
      newEventNotification.day = moment(notification.parent.begins_at).date()
      newEventNotification.week = moment(notification.parent.begins_at).week()

    getNewEventDate: ->
      newEventNotification

    getCommentState: ->
      comment

    setCommentState: ->
      comment.visible = true

    getNotifications: (count) ->
      userId = storage.getCurrentUser().user_data.id
      Restangular
        .one('users', userId)
        .all('collections/notifications')
        .getList(per_page: count).then (notifications) ->
          response =
            notifications: []
            isEmpty: false

          response.notifications = notifications
          response.isEmpty = notifications.length is 0
          response

    goToNotification: (notification) ->
      if notification.key is 'exercise_result.create'
        comment.visible = false
        goToResults(notification)

      if notification.key is 'comment.create'
        comment.visible = true
        goToResults(notification)

      if notification.key is 'workout_event.create'
        Restangular
          .one('users', notification.recipient_id)
          .get().then (user) ->
            $rootScope.dateToShow = moment(notification.parent.begins_at)
            if user.is_pro
              $state.go 'app.clientCalendar',
                userId: notification.owner_id
            else
              $state.go 'app.ownCalendar',
                userId: notification.recipient_id

      if notification.key is 'user.invitation_accepted'
        $state.go 'app.userProfile',
          userId: notification.owner_id

      if (notification.key is 'personal_workout.create' or
          notification.key is 'personal_program.create')
        goToAssignedItem(notification)
]