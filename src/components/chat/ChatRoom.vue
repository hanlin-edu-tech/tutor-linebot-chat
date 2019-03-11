<template>
  <section id="chat-room">
    <article id="dialog" ref="dialog">
      <mu-flex v-for="(messageInfo, id) in messages" :key="id"
               :class="!messageInfo.ehanlin ? 'dialog-flex-left' : 'dialog-flex-right'"
               :justify-content="!messageInfo.ehanlin ? 'start' : 'end'">
        <mu-flex class="dialog-row" direction="column"
                 :align-items="!messageInfo.ehanlin ? 'start' : 'end'">
          <div class="dialog-avatar">
            <mu-avatar :size="37">
              <img :src="!messageInfo.ehanlin ? messageInfo.lineUserAvatar : messageInfo.ehanlinAvatar">
            </mu-avatar>
            {{ !messageInfo.ehanlin ? messageInfo.lineUserName : messageInfo.ehanlinName}}
          </div>
          <a v-show="messageInfo.imageUrl" :href="messageInfo.imageUrl" target="_blank">
            <img class="chat-image" :src="messageInfo.imageUrl">
          </a>
          <article v-show="!messageInfo.imageUrl"
                   :class="!messageInfo.ehanlin ? 'dialog-block-user' : 'dialog-block-ehanlin'">
            <template v-for="line in messageInfo.text.split('\n')">{{line}}<br></template>
          </article>
        </mu-flex>
      </mu-flex>
    </article>
    <article id="dialog-input">
      <mu-container>
        <mu-row style="background-color: #f1f7fe;">
          <section style="width: 75%;" v-show="!isPreviewImage">
            <mu-flex fill justify-content="start">
              <mu-text-field v-model="messageText"
                             multi-line full-width :rows="3" :rows-max="5"
                             @keypress.enter.exact="sentMessage"
                             underline-color="#004ec4">
              </mu-text-field>
            </mu-flex>
          </section>
          <section style="width: 75%; min-height: 80px;" v-show="isPreviewImage">
            <mu-flex fill justify-content="start">
              <mu-circular-progress style="margin-top: 20px;" :size="36"
                                    v-show="isShowImageProgress"></mu-circular-progress>
              <img id="preview-image" class="chat-image-preview" :src="originalImageUrl">
            </mu-flex>
          </section>
          <mu-flex class="flex-demo" fill justify-content="end">
            <input id="upload-image" type="file" accept="image/*" @change="paintCanvas($event)" style="display: none;">
            <mu-icon class="image-control-icon" v-show="originalImageUrl" size="30" value="delete_forever"
                     @click="cancelImage"></mu-icon>
            <mu-icon class="image-control-icon" v-show="originalImageUrl" size="27" value="send"
                     @click="sentImage"></mu-icon>
            <mu-icon class="image-control-icon" size="27" value="image" @click="triggerUploadImage"></mu-icon>
          </mu-flex>
        </mu-row>
      </mu-container>
    </article>
  </section>
</template>

<script>
  import eventBus from '../../modules/event-bus'
  import { firebase, db, storage } from '../../modules/firebase-config'
  import { mapState } from 'vuex'
  import { showModal } from '../../modules/modal'

  export default {
    name: 'ChatRoom',
    data () {
      return {
        textColSpan: 11,
        imageColSpan: 9,
        lineUserName: '',
        lineUserAvatar: '',
        messageText: '',
        messages: {},
        fourWeeksAgo: new Date(Date.now() - (604800000 * 4)),
        storageRef: Object,
        isPreviewImage: false,
        isShowImageProgress: false,
        originalImageUrl: '',
        smallImageUrl: ''
      }
    },

    props: {
      lineUserId: ''
    },

    computed: mapState('loginUser', ['loginUserInfo']),

    watch: {
      lineUserId (selectedLineUserId) {
        const vueModel = this
        vueModel.lineUserId = selectedLineUserId
        vueModel.retrieveMessages()
      }
    },

    created () {
      const vueModel = this
      vueModel.storageRef = storage.ref('/images/')
    },

    methods: {
      scrollBottom () {
        let dialogTarget = document.getElementById('dialog')
        dialogTarget.scrollTop = dialogTarget.scrollHeight
      },

      receivedNewMessage () {
        const vueModel = this
        return querySnapshot => {
          let lastMessageDoc
          let lastChange = querySnapshot.docChanges().last()
          if (!lastChange) {
            return
          }

          lastMessageDoc = lastChange.doc
          if (lastChange.type === 'added') {
            vueModel.$set(vueModel.messages, lastMessageDoc.id, lastMessageDoc.data())
            vueModel.$nextTick(vueModel.scrollBottom)
          }
        }
      },

      triggerUploadImage () {
        document.getElementById('upload-image').click()
      },

      paintCanvas (event) {
        const vueModel = this
        const originalImageFile = event.target.files[0]
        const fileName = `${Math.floor(Date.now() / 1000)}_${originalImageFile.name}`
        let reader

        vueModel.isPreviewImage = true
        vueModel.isShowImageProgress = true
        vueModel.uploadImage(fileName, originalImageFile, uploadTask => {
          return async () => {
            vueModel.originalImageUrl = await uploadTask.snapshot.ref.getDownloadURL()
            vueModel.isShowImageProgress = false
          }
        })

        reader = new FileReader()
        reader.readAsDataURL(originalImageFile)
        reader.onload = event => {
          const img = new Image()
          img.src = event.target.result
          img.onload = () => {
            let canvasWidth, canvasHeight, canvasElement, context
            if (img.width <= 240 && img.height <= 240) {
              canvasWidth = img.width
              canvasHeight = img.height
            } else {
              canvasWidth = (img.width > img.height) ? 240 : img.width / (img.height / 240)
              canvasHeight = (img.height > img.width) ? 240 : img.height / (img.width / 240)
            }
            canvasElement = document.createElement('canvas')
            canvasElement.width = canvasWidth
            canvasElement.height = canvasHeight

            context = canvasElement.getContext('2d')
            context.drawImage(img, 0, 0, canvasWidth, canvasHeight)
            context.canvas.toBlob(blob => {
              const smallFileName = `small_${Math.floor(Date.now() / 1000)}_${originalImageFile.name}`
              const smallFile = new File([blob], smallFileName, {
                type: originalImageFile.type,
                lastModified: Date.now()
              })
              vueModel.uploadImage(smallFileName, smallFile, uploadTask => {
                return async () => {
                  vueModel.smallImageUrl = await uploadTask.snapshot.ref.getDownloadURL()
                }
              })
            }, originalImageFile.type, 1)
          }
        }
        reader.onerror = console.error
      },

      uploadImage (fileName, imageFile, completeFn) {
        const vueModel = this
        const metadata = {
          contentType: imageFile.type
        }
        const uploadTask = vueModel.storageRef.child(fileName).put(imageFile, metadata)
        uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
          snapshot => {},
          error => {},
          completeFn(uploadTask))
      },

      cancelImage () {
        const vueModel = this
        vueModel.originalImageUrl = ''
        vueModel.isPreviewImage = false
      },

      async retrieveMessages () {
        const vueModel = this
        if (vueModel.lineUserId) {
          const query = db.collection('Messages')
            .where('lineUserId', '==', vueModel.lineUserId)
            .where('updateTime', '>', vueModel.fourWeeksAgo)
            .orderBy('updateTime', 'asc')
            .limit(1000)

          let querySnapshot = await query.get()
          let messages = {}
          querySnapshot.forEach(messageDoc => {
            messages[messageDoc.id] = messageDoc.data()
          })
          vueModel.messages = messages
          if (Object.keys(vueModel.messages).length > 0) {
            let singleMessage = Object.values(vueModel.messages)[0]
            vueModel.lineUserName = singleMessage.lineUserName
            vueModel.lineUserAvatar = singleMessage.lineUserAvatar
            vueModel.scrollBottom()
          }
          query.onSnapshot(vueModel.receivedNewMessage())
        }
      },

      async updateMessagesToRead (lineUserId) {
        const vueModel = this
        const query = db.collection('Messages')
          .where('lineUserId', '==', lineUserId)
          .where('read', '==', false)

        let unreadMessages = await vueModel.$bindCollectionAsObject('unreadMessages', query)
        let batch = db.batch()
        let readMessagesIds = Object.keys(unreadMessages)
        if (readMessagesIds.length > 0) {
          readMessagesIds.forEach(id => {
            batch.update(db.collection('Messages').doc(id), { read: true })
          })
        }

        await batch.commit()
        eventBus.$emit('read', lineUserId)
      },

      async pushChatMessage (lineUserId, {
        messageText = '使用者傳送一張圖片',
        originalImageUrl = '',
        smallImageUrl = ''
      } = {}) {
        const vueModel = this
        const OK_200 = 200
        let response = await vueModel
          .axios({
            method: 'post',
            url: 'https://www.ehanlin.com.tw/linebot/admin/pushChatMessage',
            data: {
              lineUserId: lineUserId,
              messageText: messageText,
              originalContentUrl: originalImageUrl,
              previewImageUrl: smallImageUrl
            }
          })

        if (response.status === OK_200) {
          vueModel.messageText = ''
          await vueModel.updateMessagesToRead(lineUserId)
          await vueModel.createMessage({
            messageText: messageText,
            originalImageUrl: originalImageUrl
          })
        } else {
          showModal(vueModel, '傳送訊息失敗，請稍後再嘗試！')
        }
      },

      async createMessage (
        {
          messageText = '使用者傳送一張圖片',
          originalImageUrl = '',
        } = {}) {
        const vueModel = this
        let updateTime = await firebase.firestore.FieldValue.serverTimestamp()
        let loginUserInfo = vueModel.loginUserInfo
        let message = {
          lineUserId: vueModel.lineUserId,
          lineUserName: vueModel.lineUserName,
          lineUserAvatar: vueModel.lineUserAvatar,
          text: messageText,
          updateTime: updateTime,
          read: true,
          ehanlin: loginUserInfo.email,
          ehanlinName: loginUserInfo.name,
          ehanlinAvatar: loginUserInfo.avatar
        }

        if (originalImageUrl) {
          message.imageUrl = originalImageUrl
        }

        await db.collection('Messages').add(message)
      },

      async sentMessage (event) {
        const vueModel = this
        if (vueModel.messageText === '') {
          return
        }
        event.preventDefault()
        await vueModel.pushChatMessage(vueModel.lineUserId,
          { messageText: vueModel.messageText })
      },

      async sentImage () {
        const vueModel = this
        await vueModel.pushChatMessage(vueModel.lineUserId,
          {
            originalImageUrl: vueModel.originalImageUrl,
            smallImageUrl: vueModel.smallImageUrl
          })
      }
    }
  }
</script>

<style lang="less">
  #chat-room {
    font-size: 13px;

    #dialog {
      height: 75vh;
      overflow: scroll;
    }

    #dialog-input {
      padding: 5px;
    }

    .dialog-flex-left {
      margin-left: 20px;
      margin-top: 5px;
      margin-bottom: 5px;
    }

    .dialog-flex-right {
      margin-right: 10px;
      margin-top: 5px;
      margin-bottom: 5px;
    }

    .dialog-row {
      width: 55%;
    }

    .dialog-avatar {
      display: inline-block;
      margin-bottom: 3px;
      font-weight: 900;
    }

    .dialog {
      background-color: #004ec4;
      padding: 5px;
      border-radius: 3px;
      word-break: normal;
      color: white;
      font-weight: 500;
    }

    .dialog-block-user {
      background-color: #004ec4;
      padding: 5px;
      border-radius: 3px;
      word-break: normal;
      color: white;
      font-weight: 500;
    }

    .dialog-block-ehanlin {
      background-color: #f1f7fe;
      padding: 5px;
      border-radius: 3px;
      word-break: normal;
      color: #004ec4;
      font-weight: 500;
    }

    .chat-image {
      width: 250px;
      object-fit: contain;
    }

    .chat-image-preview {
      width: 110px;
      object-fit: contain;
    }

    .mu-input {
      margin-bottom: -6px;
    }

    .image-control-icon {
      position: relative;
      top: 26px;
      left: -5px;
      cursor: pointer;
    }
  }
</style>