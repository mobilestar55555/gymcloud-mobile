App.factory 'convertPropertiesService', ->

  round = (value, decimals) ->
    Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)

  onGet = (name, property) ->
    if !property[name] or !property.value or
      _.includes([0, 1], property.personal_property.property_units.length) or
      !property.property_unit_id
        return round(property[name], 0) || null

    saveUnit = property.personal_property.save_unit.short_name
    unit = math.unit("#{property[name]} #{saveUnit}")
    value = unit.toNumber(property.property_unit_name)
    round(value, 0)

  onGetResult = (name, item) ->
    if !item[name] or
      _.includes([0, 1], item.exercise_property.personal_property.property_units.length) or
      !item.exercise_property.property_unit_id
        return round(item[name], 0)

    saveUnit = item.exercise_property.personal_property.save_unit.short_name
    unit = math.unit("#{item[name]} #{saveUnit}")
    value = unit.toNumber(item.exercise_property.property_unit_name)
    round(value, 0)

  onSet = (name, value, property) ->
    if !value or
      _.includes([0, 1], property.personal_property.property_units.length) or
      !property.property_unit_id

        return property[name] = round(value, 2) || null

    saveUnit = property.personal_property.save_unit.short_name
    unit = math.unit("#{value} #{property.property_unit_name}")
    newValue = unit.toNumber(saveUnit)
    property.new_result = round(newValue, 2) || null

  get: (workout) ->
    for exercise in workout.exercises
      properties = exercise.exercise_properties or []
      for property in properties
        property.value = onGet('value', property)
        property.value2 = onGet('value2', property) if property.value2

      if exercise.exercise_results.length > 0
        for result in exercise.exercise_results
          for item in result.exercise_result_items
            item.value = onGetResult('value', item)

      if exercise.previous
        for result in exercise.previous.exercise_results
          for item in result.exercise_result_items
            item.value = onGetResult('value', item)

  getOneResult: (resultItem) ->
    resultItem.value = onGetResult('value', resultItem)

  set: (exercise) ->
    for property in exercise.exercise_properties
      onSet(property.personal_property.name, property.new_result, property)
