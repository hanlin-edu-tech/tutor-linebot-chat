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
          <article :class="!messageInfo.ehanlin ? 'dialog-block-user' : 'dialog-block-ehanlin'">
            {{ messageInfo.text }}
          </article>
        </mu-flex>
      </mu-flex>
    </article>
    <article id="dialog-input">
      <mu-text-field v-model="messageText" style="background-color: #f1f7fe;"
                     multi-line full-width :rows="2" :rows-max="5"
                     @keypress="submitMessages"
                     underline-color="#004ec4" action-icon="chat">
      </mu-text-field>
    </article>
  </section>
</template>

<script>
  import eventBus from '../../modules/event-bus'
  import { db, firebase } from '../../modules/firebase-config'
  import { mapState } from 'vuex'

  export default {
    name: 'ChatRoom',
    data () {
      return {
        lineUserName: '',
        lineUserAvatar: '',
        messageText: '',
        messages: {},
        fourWeeksAgo: new Date(Date.now() - (604800000 * 4))
      }
    },

    props: {
      lineUserId: ''
    },

    computed: mapState('loginUser', ['loginUserInfo']),

    watch: {
      lineUserId (selectedLineUserId) {
        let vueModel = this
        vueModel.lineUserId = selectedLineUserId
        vueModel.retrieveMessages()
      }
    },

    methods: {
      async retrieveMessages () {
        let vueModel = this
        if (vueModel.lineUserId) {
          let query = db.collection('Messages')
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
        let vueModel = this
        let query = db.collection('Messages')
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
        let vueModel = this
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
        let vueModel = this
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
        let vueModel = this
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

      async submitMessages (event) {
        let vueModel = this
        let handled = false
        event.keyboardEnter = ''
        if (event.key !== undefined) {
          event.keyboardEnter = event.key
          handled = true
        } else if (event.keyIdentifier !== undefined) {
          event.keyboardEnter = event.keyIdentifier
          handled = true
        } else if (event.keyCode !== undefined) {
          event.keyboardEnter = event.keyCode
          handled = true
        }

        if (event.keyboardEnter === 'Enter' || event.keyboardEnter === 13) {
          const OK_200 = 200
          let messageText = vueModel.messageText
          let response

          event.preventDefault()
          response = await vueModel.pushChatMessage(vueModel.lineUserId, messageText)
          if (response.status === OK_200) {
            vueModel.messageText = ''
            await vueModel.updateMessagesToRead(vueModel.lineUserId)
            await vueModel.createMessage(messageText)
          }
        }
      },

      scrollBottom () {
        let dialogTarget = document.getElementById('dialog')
        dialogTarget.scrollTop = dialogTarget.scrollHeight
      }
    }
  }
</script>

<style lang="less" scoped>
  #chat-room {
    font-size: 13px;

    #dialog {
      height: 79vh;
      overflow: scroll;
    }

    #dialog-input {
      padding: 10px;
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
  }
</style>