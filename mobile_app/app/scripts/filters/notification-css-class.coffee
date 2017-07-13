App.filter 'notificationCssClass', ->

  (item) ->
    notifications = {
      'personal_workout.create': 'event-personal-item-create'
      'personal_program.create': 'event-personal-item-create'
      'workout_event.create': 'event-workout-event-create'
      'user.invitation_accepted': 'event-user-update'
      'exercise_result.create': 'event-exercise-result-create'
      'comment.create': 'event-comment-create'
    }[item.key]