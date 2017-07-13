App.controller "OnboardingProgramsCtrl", [
  '$scope'
  '$state'
  'Restangular'
  'storage'
  '$q'
  (
    $scope
    $state
    Restangular
    storage
    $q
  ) ->

    initialize = ->
      Restangular
        .one('program_presets')
        .getList()
        .then (presets) ->
          $scope.programPresets = presets
          for preset in $scope.programPresets
            $scope.toggleGroup(preset)

    $scope.toggleGroup = (preset) ->
      preset.isSelected = !preset.isSelected
      for template in preset.program_templates
        template.isChecked = true if not template.isChecked?

    importPresets = ->
      for preset in $scope.programPresets
        if preset.isSelected
          template_ids = _.chain(preset.program_templates)
            .filter( (template) -> !! template.isChecked )
            .map('id')
            .value()
          Restangular
            .one('program_presets', preset.id)
            .post('import', program_template_ids: template_ids)

    $scope.finishOnboarding = ->
      $q.all(importPresets()).then ->
        $state.go 'app.onboardingSuccess'

    initialize()
]