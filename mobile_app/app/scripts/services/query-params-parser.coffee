App.factory 'queryParamsParserService', [ ->

  queryString: (url) ->
    query_string = {}
    query = _.last(url.split('?'))
    vars = query.split('&')
    i = 0
    while i < vars.length
      pair = vars[i].split('=')
      # If first entry with this name
      if typeof query_string[pair[0]] == 'undefined'
        query_string[pair[0]] = decodeURIComponent(pair[1])
        # If second entry with this name
      else if typeof query_string[pair[0]] == 'string'
        arr = [
          query_string[pair[0]]
          decodeURIComponent(pair[1])
        ]
        query_string[pair[0]] = arr
        # If third or later entry with this name
      else
        query_string[pair[0]].push decodeURIComponent(pair[1])
      i++
    query_string
]