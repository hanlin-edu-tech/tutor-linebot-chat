<template>
  <section id="chat-room">
    <article id="dialog" ref="dialog">
      <mu-flex v-for="(messageInfo, id) in messages" :key="id"
               :class="!messageInfo.ehanlinCustomerService ? 'dialog-flex-left' : 'dialog-flex-right'"
               :justify-content="!messageInfo.ehanlinCustomerService ? 'start' : 'end'">
        <mu-flex class="dialog-row" direction="column"
                 :align-items="!messageInfo.ehanlinCustomerService ? 'start' : 'end'">
          <mu-flex class="dialog-avatar" justify-content="start">
            <mu-avatar style="margin-right: 5px;" :size="37">
              <img :src="!messageInfo.ehanlinCustomerService ?
              lineUserAvatar : messageInfo.ehanlinCustomerService.avatar">
            </mu-avatar>
            <mu-flex direction="column" justify-content="start">
              <span class="dialog-time">{{ formatUpdateTime (messageInfo.updateTime) }}</span>
              <span class="dialog-text">
                {{ !messageInfo.ehanlinCustomerService ? lineUserName : messageInfo.ehanlinCustomerService.name }}
              </span>
            </mu-flex>
          </mu-flex>
          <a v-show="messageInfo.imageUrl" :href="messageInfo.imageUrl" target="_blank">
            <img class="chat-image" :src="messageInfo.imageUrl">
          </a>
          <a v-show="messageInfo.fileUrl" :href="messageInfo.fileUrl" target="_blank">
            <img class="chat-image"
                 src="https://s3-ap-northeast-1.amazonaws.com/ehanlin-web-resource/linebot/file/file_icon.png">
          </a>
          <article v-show="!messageInfo.imageUrl"
                   :class="!messageInfo.ehanlinCustomerService ?
                   'dialog-block-user' : 'dialog-block-ehanlin'">
            <template v-for="line in messageInfo.text.split('\n')">{{line}}<br /></template>
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
                                    v-show="isShowImageProgress">
              </mu-circular-progress>
              <img id="preview-image" class="chat-image-preview" :src="originalImageUrl">
            </mu-flex>
          </section>
          <mu-flex class="flex-demo" fill justify-content="end">
            <input id="upload-image" type="file" accept="image/*" @change="paintCanvas($event)" style="display: none;">
            <mu-icon class="image-control-icon" v-show="originalImageUrl" size="30" value="delete_forever"
                     @click="cancelImage"></mu-icon>
            <mu-icon class="image-control-icon" v-show="originalImageUrl" size="27" value="send"
                     @click="sentImage"></mu-icon>
            <mu-icon class="image-control-icon" size="27" value="add_photo_alternate"
                     @click="triggerUploadImage"></mu-icon>
          </mu-flex>
        </mu-row>
      </mu-container>
    </article>
  </section>
</template>

<script>
  import { db, firebase, storage } from '@/modules/firebase-config'
  import { mapState } from 'vuex'
  import { showModal } from '@/modules/modal'

  export default {
    name: 'ChatRoom',
    data () {
      const vueModel = this
      return {
        oneMonthAgo: vueModel.$dayjs().subtract(1, 'month').toDate(),
        messageText: '',
        messages: {},
        isPreviewImage: false,
        isShowImageProgress: false,
        originalImageUrl: ''
      }
    },

    props: {
      specificLineUser: String,
      lineUserName: String,
      lineUserAvatar: String,
    },

    computed: mapState('loginUser', ['loginUserInfo']),

    mounted () {
      const vueModel = this
      try {
        vueModel.storageRef = storage.ref('/images/')
        vueModel.messageRef = db.collection(`Chat/${vueModel.specificLineUser}/Message`)
        vueModel.retrieveMessages()
      } catch (error) {
        console.error(error)
      }
    },

    async beforeDestroy () {
      const vueModel = this
      if (vueModel.cancelListening && typeof vueModel.cancelListening === 'function') {
        vueModel.cancelListening()
      }
    },

    methods: {
      formatUpdateTime (updateTime) {
        const vueModel = this
        return vueModel.$dayjs(updateTime.toDate()).format('YYYY-MM-DD HH:mm:ss')
      },

      scrollBottom () {
        let dialogTarget = document.getElementById('dialog')
        dialogTarget.scrollTop = dialogTarget.scrollHeight
      },

      async retrieveMessages () {
        const vueModel = this
        if (vueModel.specificLineUser) {
          let messageQuerySnapshot = await vueModel.messageRef
            .where('updateTime', '>', vueModel.oneMonthAgo)
            .orderBy('updateTime', 'asc')
            .limit(500)
            .get()

          let messages = {}
          messageQuerySnapshot.forEach(messageDoc => {
            messages[messageDoc.id] = messageDoc.data()
          })
          vueModel.messages = messages
          vueModel.listeningOnMessageAdded()
        }
      },

      listeningOnMessageAdded () {
        const vueModel = this
        vueModel.cancelListening = db.collection(`Chat/${vueModel.specificLineUser}/Message`)
          .where('updateTime', '>', vueModel.oneMonthAgo)
          .orderBy('updateTime', 'asc')
          .limit(1000)
          .onSnapshot(async messageQuerySnapshot => {
            let lastMessageDoc
            let lastChange = messageQuerySnapshot.docChanges().last()
            if (!lastChange) {
              return
            }

            if (lastChange.type === 'added') {
              lastMessageDoc = lastChange.doc
              const lastMessageId = lastMessageDoc.id
              const lastMessage = lastMessageDoc.data()

              vueModel.$set(vueModel.messages, lastMessageId, lastMessage)
              vueModel.$nextTick(vueModel.scrollBottom)
              vueModel.updateMessagesToRead()
            }
          })
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
              /* 縮小比例重新繪製圖片 */
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

      async updateMessagesToRead () {
        const vueModel = this
        let unreadMessages = await vueModel.$bindCollectionAsObject('unreadMessages',
          vueModel.messageRef
            .where('read', '==', false))

        let batch = db.batch()
        let readMessagesIds = Object.keys(unreadMessages)
        if (readMessagesIds.length > 0) {
          readMessagesIds.forEach(id => {
            batch.update(vueModel.messageRef.doc(id), { read: true })
          })
        }

        await batch.commit()
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
        let updateTime = firebase.firestore.Timestamp.fromDate(new Date())
        let loginUserInfo = vueModel.loginUserInfo
        let message = {
          text: messageText,
          updateTime: updateTime,
          read: true,
          ehanlinCustomerService: {
            account: loginUserInfo.email,
            name: loginUserInfo.name,
            avatar: loginUserInfo.avatar
          }
        }

        if (originalImageUrl) {
          message.imageUrl = originalImageUrl
        }

        await vueModel.messageRef.add(message)
      },

      async sentMessage (event) {
        const vueModel = this
        if (vueModel.messageText === '') {
          return
        }
        event.preventDefault()
        await vueModel.pushChatMessage(vueModel.specificLineUser,
          { messageText: vueModel.messageText })
      },

      async sentImage () {
        const vueModel = this
        await vueModel.pushChatMessage(vueModel.specificLineUser,
          {
            originalImageUrl: vueModel.originalImageUrl,
            smallImageUrl: vueModel.smallImageUrl
          })
        vueModel.cancelImage()
      }
    }
  }
</script>

<style lang="less">
  #chat-room {
    font-size: 13px;

    #dialog {
      height: 78vh;
      overflow: scroll;
    }

    #dialog-input {
      padding: 5px;
    }

    .dialog-time {
      color: #6a6a6a;
      font-size: 11px;
      font-weight: 500;
    }

    .dialog-text {
      font-size: 11px;
      font-weight: 600;
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
      margin-top: 10px;
      margin-bottom: 5px;
      font-weight: 700;
    }

    .dialog-block-user {
      background-color: #004ec4;
      padding: 5px;
      border-radius: 3px;
      word-break: normal;
      color: white;
      font-size: 14px;
      font-weight: 600;
    }

    .dialog-block-ehanlin {
      background-color: #f1f7fe;
      padding: 5px;
      border-radius: 3px;
      word-break: normal;
      color: #004ec4;
      font-size: 14px;
      font-weight: 900;
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