App.factory 'sendMessageService', [
  'Restangular'
  'Upload'
  '$state'
  'storage'
  (
    Restangular
    Upload
    $state
    storage
  ) ->

    access_token = storage.getCurrentUser().access_token

    sendTextMessage = (newMessage, conversationId, video_id = undefined, video_url = undefined) ->
      newMessage.video_id = video_id
      newMessage.video_url = video_url

      Restangular
        .one('conversations', conversationId)
        .customPOST(newMessage)
        .then (message) ->
          return message

    sendMessageWithImage = (newMessage, conversationId) ->
      Upload.upload(
        url: "#{AppConfig.backend_url}/conversations/#{conversationId}"
        data: newMessage
        method: 'POST'
        headers:
          'Authorization': "Bearer #{access_token}"
      ).then (message) ->
        return message.data

    sendMessageWithVideo = (newMessage, conversationId) ->
      Upload.upload(
        url: "#{AppConfig.backend_url}/videos"
        data:
          file: newMessage.attachment
          name: newMessage.attachment.name
        method: 'POST'
        headers:
          'Authorization': "Bearer #{access_token}"
      ).then (video) ->
        newMessage.body = newMessage.attachment.name unless newMessage.body?
        newMessage.attachment = undefined
        sendTextMessage(newMessage, conversationId, video.data.id, video.data.embed_url)

    sendMessage: (newMessage, conversationId) ->
      attachmentType = newMessage.attachment?.type?.split('/')[0]
      if attachmentType is 'image'
        sendMessageWithImage(newMessage, conversationId)
      else if attachmentType is 'video'
        sendMessageWithVideo(newMessage, conversationId)
      else
        sendTextMessage(newMessage, conversationId)
]