App.filter 'removeExtension', ->
  (name) ->
    re = /\.(webm|mkv|flv|vob|mp4|m4v|avi|mpeg|mpg|3gp|mov)$/i
    name?.replace(re, '')