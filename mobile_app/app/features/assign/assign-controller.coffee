App.controller "AssignCtrl", [
  '$scope'
  '$state'
  'Restangular'
  'storage'
  'errorsService'
  (
    $scope
    $state
    Restangular
    storage
    errorsService
  ) ->

    $scope.userId = storage.getCurrentUser().user_data.id
    itemId = $state.params.itemId
    itemType = $state.params.itemType
    templateId = null
    clientsAssignees = []
    groupsAssignees = []
    personalItemType = {
      workout_templates: 'personal_workouts',
      program_templates: 'personal_programs'
    }[itemType]
    templateType = {
      workout_templates: 'WorkoutTemplate',
      program_templates: 'ProgramTemplate'
    }[itemType]
    templateIdType = {
      workout_templates: 'workout_template_id',
      program_templates: 'program_template_id'
    }[itemType]

    getClients = ->
      Restangular
        .one('users', $scope.userId)
        .one('collections/clients')
        .getList().then (clients) ->
          $scope.clients = clients
          compareClientsAssignees($scope.clients, clientsAssignees)

    getGroups = ->
      Restangular
        .one('users', $scope.userId)
        .one('collections/client_groups')
        .getList().then (groups) ->
          $scope.groups = groups
          compareGroupsAssignees($scope.groups, groupsAssignees)

    getAssignees = ->
      if itemType is 'program_templates'
        Restangular
          .one(itemType)
          .one(itemId)
          .get(nested: false).then (template) ->
            templateId = template.id
            fetchProgramAssignments(templateId)
      else
        Restangular
          .one(itemType)
          .one(itemId)
          .get().then (template) ->
            templateId = template.id
            clientsAssignees = template.assignees
            getClients()
            groupsAssignees = template.group_assignments
            getGroups()

    fetchProgramAssignments = (templateId) ->
      Restangular
        .one('program_templates', templateId)
        .one('program_assignments')
        .get().then (assignments) ->
          clientsAssignees = assignments.assignees
          groupsAssignees = assignments.group_assignments
          getClients()
          getGroups()

    compareClientsAssignees = (items, assignees) ->
      for item in items
        item.is_assigned = false if assignees.length is 0

        for assignee in assignees
          if item.user_profile.user_id is assignee.person_id
            item.is_assigned = true
            item.assignee_id = assignee.id
            break
          else
            item.is_assigned = false

    compareGroupsAssignees = (items, assignees) ->
      for item in items
        item.is_assigned = false if assignees.length is 0

        for assignee in assignees
          if item.id is assignee.id
            item.is_assigned = assignee.is_assigned
            break
          else
            item.is_assigned = false

    $scope.changeClientAssignState = ($event, toAssign, item) ->
      $event.preventDefault()
      # $event.target.checked changes after click even with preventDefault(), so using !
      item.is_assigned = !$event.target.checked
      if toAssign
        data =
          person_id: item.user_profile.user_id
        data[templateIdType] = templateId
        Restangular
          .all(personalItemType)
          .post(data)
          .then (assignee) ->
            item.assignee_id = assignee.id
            $event.target.checked = !item.is_assigned
      else
        Restangular
          .one(personalItemType, item.assignee_id)
          .remove().then ->
            $event.target.checked = !item.is_assigned

    $scope.changeGroupAssignState = ($event, toAssign, item) ->
      $event.preventDefault()
      if item.clients_count is 0
        errorsService.errorAlert(
          'Group is empty'
          'Please, add clients to group before assigning program or workout'
        )
        return false
      # $event.target.checked changes after click even with preventDefault(), so using !
      item.is_assigned = !$event.target.checked
      data =
        template_id: itemId
        template_type: templateType
      if toAssign
        Restangular
          .one('client_groups', item.id)
          .all('assignments')
          .post(data)
          .then (assignee) ->
            $event.target.checked = !item.is_assigned
            getAssignees()
      else
        Restangular
          .one('client_groups', item.id)
          .one('assignments')
          .remove(data).then ->
            $event.target.checked = !item.is_assigned
            getAssignees()

    getAssignees()
]