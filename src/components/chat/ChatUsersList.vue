<template>
  <section id="users-list">
    <mu-list textline="two-line">
      <mu-sub-header style="font-weight: 900;">{{ today }}</mu-sub-header>
      <mu-list-item avatar :ripple="false" button
                    v-for="(messageInfo, lineUserId) in usersList" :key="lineUserId"
                    @click="entryChatRoom(lineUserId)">
        <mu-list-item-action style="margin-top: 2px;">
          <mu-avatar :size="52">
            <img :src="messageInfo.lineUserAvatar">
          </mu-avatar>
        </mu-list-item-action>
        <mu-list-item-content style="margin-left: 10px;">
          <mu-list-item-title style="font-weight: 500;">{{ messageInfo.lineUserName }}</mu-list-item-title>
          <mu-list-item-sub-title>
            {{ messageInfo.text }}
          </mu-list-item-sub-title>
          <mu-divider></mu-divider>
        </mu-list-item-content>
        <mu-badge v-if="messageInfo.unreadMessages.count > 0"
                  :content="messageInfo.unreadMessages.countDesc"
                  color="#9966ff" badge-class="badge-info"></mu-badge>
      </mu-list-item>
    </mu-list>
  </section>
</template>
<script>
  import { firebase, db } from '../../modules/firebase-config'
  import dayjs from 'dayjs'
  import 'dayjs/locale/zh-tw'
  import eventBus from '../../modules/event-bus'

  export default {
    name: 'UsersList',
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
        let fourWeeksAgoMs = (604800000 * 4)
        let timestamp = new Date(Date.now() - fourWeeksAgoMs)
        let query = db.collection('Messages')
          .where('updateTime', '>', timestamp)
          .orderBy('updateTime', 'asc')

        await vueModel.initialUsersList(query)
        await query.onSnapshot(vueModel.messageFire())
      } catch (error) {
        console.error(error)
      }
    },

    methods: {
      async initialUsersList (query) {
        const vueModel = this
        let querySnapshot = await query.get()
        let usersList = {}
        let initialUnreadMessages = {}
        querySnapshot.forEach(messageDoc => {
          let message = messageDoc.data()
          vueModel.calculateUnreadMessages(initialUnreadMessages, message)
          usersList[message.lineUserId] = vueModel.composeMessageInfo(message)
        })

        vueModel.summaryInitialUnreadMessages(initialUnreadMessages, usersList)
        vueModel.usersList = usersList
      },

      messageFire () {
        const vueModel = this
        return querySnapshot => {
          let lastMessageDoc
          let lastChange = querySnapshot.docChanges().last()
          if (!lastChange) {
            return
          }

          lastMessageDoc = lastChange.doc
          if (lastChange.type === 'added') {
            let lastMessage = lastMessageDoc.data()
            if (vueModel.usersList[lastMessage.lineUserId]) {
              let existedSpecificMessage = vueModel.usersList[lastMessage.lineUserId]
              /* 現存訊息和最後一則訊息不同，表示為新增的訊息 */
              if (existedSpecificMessage.text !== lastMessage.text) {
                existedSpecificMessage.text = lastMessage.text
                vueModel.usersList[lastMessage.lineUserId] = existedSpecificMessage

                /* 如果訊息未讀 */
                if (lastMessage.read === false) {
                  let existedSpecificUnreadCount = existedSpecificMessage['unreadMessages']['count']
                  vueModel.setUnreadMessages(existedSpecificMessage, existedSpecificUnreadCount + 1)
                }
              }
            } else {
              /* 新的使用者傳入訊息 */
              let unreadCount = 1
              let newMessageInfo = vueModel.composeMessageInfo(lastMessage)
              vueModel.setUnreadMessages(newMessageInfo, unreadCount)
              vueModel.$set(vueModel.usersList, lastMessage.lineUserId, newMessageInfo)
            }
          } else if (lastChange.type === 'modified') { /* 只有更新已讀狀態，才會觸發 */
            let lastMessage = lastMessageDoc.data()
            /* 訊息更新為已讀 */
            let unreadCount = 0
            vueModel.setUnreadMessages(vueModel.usersList[lastMessage.lineUserId], unreadCount)
          }
        }
      },

      calculateUnreadMessages (initialUnreadMessages, message) {
        if (!initialUnreadMessages[message.lineUserId]) {
          initialUnreadMessages[message.lineUserId] = 0
        }

        if (message.read === false) {
          initialUnreadMessages[message.lineUserId]++
        }
      },

      composeMessageInfo (message) {
        return {
          lineUserId: message.lineUserId,
          lineUserName: message.lineUserName,
          lineUserAvatar: message.lineUserAvatar,
          text: message.text
        }
      },

      summaryInitialUnreadMessages (initialUnreadMessages, usersList) {
        const vueModel = this
        for (let lineUserId in usersList) {
          let specificMessageInfo = usersList[lineUserId]
          if (initialUnreadMessages.hasOwnProperty(lineUserId)) {
            let unreadCount = initialUnreadMessages[lineUserId]
            vueModel.setUnreadMessages(specificMessageInfo, unreadCount)
          } else {
            let unreadCount = 0
            vueModel.setUnreadMessages(specificMessageInfo, unreadCount)
          }
        }
      },

      setUnreadMessages (specificMessageInfo, unreadCount) {
        specificMessageInfo.unreadMessages = {
          count: unreadCount,
          countDesc: String(unreadCount)
        }
      },

      entryChatRoom (lineUserId) {
        const vueModel = this
        vueModel.$emit('retrieve-chat-messages', lineUserId)
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
