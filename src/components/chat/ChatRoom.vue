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
          <a v-if="messageInfo.imageUrl" :href="messageInfo.imageUrl" target="_blank">
            <img class="chat-image" v-if="messageInfo.imageUrl" :src="messageInfo.imageUrl">
          </a>
          <article v-if="!messageInfo.imageUrl"
                   :class="!messageInfo.ehanlin ? 'dialog-block-user' : 'dialog-block-ehanlin'">
            <template v-for="line in messageInfo.text.split('\n')">{{line}}<br></template>
          </article>
        </mu-flex>
      </mu-flex>
    </article>
    <article id="dialog-input">
      <mu-container>
        <mu-row gutter style="background-color: #f1f7fe;">
          <mu-col span="11" style="min-height: 80px;" v-show="isPreviewImage">
            <mu-circular-progress style="margin-top: 20px;" :size="36"
                                  v-show="isShowImageProgress"></mu-circular-progress>
            <img class="chat-image-preview" :src="previewImageUrl">
          </mu-col>
          <mu-col span="11" v-show="!isPreviewImage">
            <mu-text-field v-model="messageText"
                           multi-line full-width :rows="3" :rows-max="5"
                           @keypress.enter.exact="submitMessage"
                           underline-color="#004ec4">
            </mu-text-field>
          </mu-col>
          <mu-col span="1">
            <input id="upload-image" type="file" accept="image/*" @change="uploadImage($event)" style="display: none;">
            <mu-icon size="35" value="image" class="trigger-upload-image" @click="triggerUploadImage"></mu-icon>
          </mu-col>
        </mu-row>
      </mu-container>
    </article>
  </section>
</template>

<script>
  import eventBus from '../../modules/event-bus'
  import { firebase, db, storage } from '../../modules/firebase-config'
  import { mapState } from 'vuex'

  export default {
    name: 'ChatRoom',
    data () {
      return {
        lineUserName: '',
        lineUserAvatar: '',
        messageText: '',
        messages: {},
        fourWeeksAgo: new Date(Date.now() - (604800000 * 4)),
        storageRef: Object,
        isPreviewImage: false,
        isShowImageProgress: false,
        previewImageUrl: ''
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

      async pushChatMessage (lineUserId, messageText) {
        const vueModel = this
        return await vueModel
          .axios({
            method: 'post',
            url: 'https://www.ehanlin.com.tw/linebot/admin/pushChatMessage',
            data: {
              lineUserId: lineUserId,
              messageText: messageText
            }
          })
      },

      async createMessage (messageText) {
        const vueModel = this
        let updateTime = await firebase.firestore.FieldValue.serverTimestamp()
        let loginUserInfo = vueModel.loginUserInfo
        await db.collection('Messages').add({
          lineUserId: vueModel.lineUserId,
          lineUserName: vueModel.lineUserName,
          lineUserAvatar: vueModel.lineUserAvatar,
          text: messageText,
          updateTime: updateTime,
          read: true,
          ehanlin: loginUserInfo.email,
          ehanlinName: loginUserInfo.name,
          ehanlinAvatar: loginUserInfo.avatar
        })
        //vueModel.retrieve()
        //eventBus.$emit('retrieveChatMessage', lineUserId)
      },

      async submitMessage (event) {
        const vueModel = this
        const OK_200 = 200
        let lineUserId = vueModel.lineUserId
        let messageText = vueModel.messageText
        let response

        if (messageText === '') {
          return
        }

        event.preventDefault()
        response = await vueModel.pushChatMessage(lineUserId, messageText)
        if (response.status === OK_200) {
          vueModel.messageText = ''
          await vueModel.updateMessagesToRead(lineUserId)
          await vueModel.createMessage(messageText)
        }
      },

      scrollBottom () {
        let dialogTarget = document.getElementById('dialog')
        dialogTarget.scrollTop = dialogTarget.scrollHeight
      },

      triggerUploadImage () {
        document.getElementById('upload-image').click()
      },

      uploadImage (event) {
        const vueModel = this
        let file = event.target.files[0]
        let fileName = `${Math.floor(Date.now() / 1000)}_${file.name}`
        let metadata = {
          // cacheControl: 'public,max-age=300',
          contentType: file.type
        }
        let uploadTask
        vueModel.isPreviewImage = true
        vueModel.isShowImageProgress = true
        uploadTask = vueModel.storageRef.child(fileName).put(file, metadata)
        uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
          snapshot => {

          },
          error => {

          },
          async () => {
            let downloadURL = await uploadTask.snapshot.ref.getDownloadURL()
            vueModel.previewImageUrl = downloadURL
            vueModel.isShowImageProgress = false
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
      width: 130px;
      object-fit: contain;
    }

    .mu-input {
      margin-bottom: -6px;
    }

    .trigger-upload-image {
      margin-top: 20px;
      margin-left: -5px;
      cursor: pointer;
    }
  }
</style>