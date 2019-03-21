<template>
  <section id="users-list">
    <mu-list textline="two-line">
      <mu-sub-header style="font-weight: 900;">{{ today }}</mu-sub-header>
      <mu-list-item avatar :ripple="true" button
                    v-for="(messageInfo, lineUserId) in usersList" :key="lineUserId"
                    @click="entryChatRoom(messageInfo, lineUserId)">
        <mu-list-item-action style="margin-top: 2px;">
          <mu-avatar :size="52">
            <img :src="messageInfo.lineUserAvatar">
          </mu-avatar>
        </mu-list-item-action>
        <mu-list-item-content style="margin-left: 10px;">
          <mu-list-item-title style="font-weight: 500;">
            <mu-flex class="flex-wrapper" justify-content="start">
              {{ messageInfo.lineUserName }}
              <mu-icon size="22" value="edit"></mu-icon>
            </mu-flex>
          </mu-list-item-title>
          <mu-list-item-sub-title>
            {{ messageInfo.text }}
          </mu-list-item-sub-title>
          <mu-divider></mu-divider>
        </mu-list-item-content>
        <mu-badge v-if="messageInfo.unreadMessagesCount > 0"
                  :content="messageInfo.unreadMessagesCountDesc"
                  color="#9966ff" badge-class="badge-info"></mu-badge>
      </mu-list-item>
    </mu-list>
  </section>
</template>
<script>
  import { db, firebase } from '../../modules/firebase-config'
  import dayjs from 'dayjs'
  import 'dayjs/locale/zh-tw'

  export default {
    name: 'ChatUsersList',
    data: () => {
      return {
        messages: [],
        usersList: {}
      }
    },
    computed: {
      today () {
        return dayjs().locale('zh-tw').format('YYYY-MM-DD dddd')
      }
    },

    async mounted () {
      const vueModel = this
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          //console.log(user)
        } else {
          // No user is signed in.
        }
      })

      try {
        const chatDocs = await vueModel.retrieveChatDocs()
        await vueModel.initialUsersList(chatDocs)
        vueModel.listeningOnChatAdded()
      } catch (error) {
        console.error(error)
      }
    },

    methods: {
      async retrieveChatDocs () {
        const vueModel = this
        const fourWeeksAgo = new Date(Date.now() - (604800000 * 4))
        const chatRef = db.collection('Chat')
        const chatQuerySnapshot = await chatRef
          .where('createTime', '>', fourWeeksAgo)
          .get()

        vueModel.chatRef = chatRef
        return chatQuerySnapshot
          .docChanges()
          .map(chatDocChange => chatDocChange.doc)
      },

      async retrieveLastMessage (lineUserId) {
        const vueModel = this
        const messagesQuerySnapshot = await vueModel.chatRef.doc(lineUserId)
          .collection('Message')
          .orderBy('updateTime', 'desc')
          .limit(1)
          .get()

        const messageDocs = messagesQuerySnapshot
          .docChanges()
          .map(chatDocChange => chatDocChange.doc)

        return messageDocs.last().data()
      },

      async initialUsersList (chatDocs) {
        const vueModel = this
        const allUsers = {}
        const unreadUsers = {}
        for (let chatDoc of chatDocs) {
          const lineUserId = chatDoc.id
          const lineUserProfile = chatDoc.data()
          const lastMessage = await vueModel.retrieveLastMessage(lineUserId)
          const findUnreadUser = () => {
            unreadUsers[lineUserId] = {}
          }

          allUsers[lineUserId] = await vueModel.composeMessageInfo(lineUserId, lineUserProfile, lastMessage, findUnreadUser)
          vueModel.listeningOnMessageAdded(lineUserId, lineUserProfile)
        }
        /* 讓有未讀訊息之 lineUserId 保持在物件中的前方 */
        vueModel.usersList = { ...unreadUsers, ...allUsers }
      },

      listeningOnMessageAdded (lineUserId, lineUserProfile) {
        const vueModel = this
        db.collection(`Chat/${lineUserId}/Message`)
          .onSnapshot(vueModel.messageFire(lineUserId, lineUserProfile))
      },

      messageFire (lineUserId, lineUserProfile) {
        const vueModel = this
        return async messageQuerySnapshot => {
          let lastMessage
          let lastChange = messageQuerySnapshot.docChanges().last()
          if (!lastChange) {
            return
          }

          lastMessage = lastChange.doc.data()
          if (lastChange.type === 'added') {
            if (vueModel.usersList && vueModel.usersList[lineUserId]) {
              let existedSpecificMessageInfo = vueModel.usersList[lineUserId]
              let lastUpdateTime = lastMessage.updateTime.toDate()
              /* 如果現存訊息的時戳比最後一則訊息早，表示 lastMessage 為新增的訊息 */
              if (existedSpecificMessageInfo.updateTime.isBefore(dayjs(lastUpdateTime))) {
                /* 重新取代為新訊息 */
                vueModel.usersList[lineUserId] =
                  await vueModel.composeMessageInfo(lineUserId, lineUserProfile, lastMessage)

                if (vueModel.activatedLineUser && vueModel.activatedLineUser !== lineUserId) {
                  let newUserMessageInfo = {}
                  newUserMessageInfo[lineUserId] = {}
                  vueModel.usersList = { ...newUserMessageInfo, ...vueModel.usersList }
                }
              }
            }
          } else if (lastChange.type === 'modified') {
            /* 當訊息更新為已讀狀態，才會觸發 */
            let unreadMessagesCount = 0
            vueModel.usersList[lineUserId].unreadMessagesCount = unreadMessagesCount
            vueModel.usersList[lineUserId].unreadMessagesCountDesc = String(unreadMessagesCount)
          }
        }
      },

      listeningOnChatAdded () {
        const vueModel = this
        vueModel.chatRef.onSnapshot(
          async chatQuerySnapshot => {
            let lastChange = chatQuerySnapshot.docChanges().last()
            let lineUserId, lineUserProfile
            if (!lastChange) {
              return
            }

            lineUserId = lastChange.doc.id
            lineUserProfile = lastChange.doc.data()
            if (lastChange.type === 'added') {
              if (vueModel.usersList && !vueModel.usersList[lineUserId]) {
                const lastMessage = await vueModel.retrieveLastMessage(lineUserId)
                /* 新的使用者傳入訊息 */
                let newMessageInfo = await vueModel.composeMessageInfo(lineUserId, lineUserProfile, lastMessage)
                vueModel.$set(vueModel.usersList, lineUserId, newMessageInfo)
                vueModel.listeningOnMessageAdded(lineUserId, lineUserProfile)
              }
            }
          }
        )
      },

      async composeMessageInfo (lineUserId, lineProfile, message, findUnreadUser = () => {}) {
        const vueModel = this
        const unreadMessagesQuerySnapshot = await vueModel.chatRef.doc(lineUserId)
          .collection('Message')
          .where('read', '==', false)
          .get()

        const unreadMessagesCount = unreadMessagesQuerySnapshot.size
        if (unreadMessagesCount > 0) {
          findUnreadUser()
        }

        return {
          lineUserId: lineUserId,
          lineUserName: lineProfile.lineUserName,
          lineUserAvatar: lineProfile.lineUserAvatar,
          text: message.text,
          updateTime: dayjs(message.updateTime.toDate()),
          unreadMessagesCount: unreadMessagesCount,
          unreadMessagesCountDesc: String(unreadMessagesCount)
        }
      },

      entryChatRoom (messageInfo, lineUserId) {
        const vueModel = this
        vueModel.activatedLineUser = lineUserId
        vueModel.$emit('route-chat-room', messageInfo, lineUserId)
      }
    }
  }
</script>
<style lang="less">
  #users-list {
    background-color: #fdfbf2;
    height: 95vh;
    overflow: scroll;

    .mu-item-sub-title {
      font-size: 14px;
    }

    .badge-info {
      margin-left: 10px;
      font-size: 13px;
    }
  }
</style>
