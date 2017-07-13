App.filter 'notificationType', ->

  (item) ->
    notifications = {
      'personal_workout.create': 'has assigned new workout'
      'personal_program.create': 'has assigned new program'
      'workout_event.create': 'has scheduled new event'
      'user.invitation_accepted': 'has accepted invitation'
      'exercise_result.create': 'has entered new results'
      'comment.create': 'has added a comment'
    }[item.key]