App.factory 'sendFirstMessageService', [
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

    sendTextMessage = (newMessage, recipientId, video_id = undefined, video_url = undefined) ->
      newMessage.video_id = video_id
      newMessage.video_url = video_url
      newMessage['recipient_id'] = recipientId

      Restangular
        .one('conversations')
        .customPOST(newMessage)
        .then (message) ->
          return message

    sendMessageWithImage = (newMessage, recipientId) ->
      newMessage['recipient_id'] = recipientId
      Upload.upload(
        url: "#{AppConfig.backend_url}/conversations"
        data: newMessage
        method: 'POST'
        headers:
          'Authorization': "Bearer #{access_token}"
      ).then (message) ->
        return message.data

    sendMessageWithVideo = (newMessage, recipientId) ->
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
        sendTextMessage(newMessage, recipientId, video.data.id, video.data.embed_url)

    sendMessage: (newMessage, recipientId) ->
      attachmentType = newMessage.attachment?.type?.split('/')[0]
      if attachmentType is 'image'
        sendMessageWithImage(newMessage, recipientId)
      else if attachmentType is 'video'
        sendMessageWithVideo(newMessage, recipientId)
      else
        sendTextMessage(newMessage, recipientId)
]