<template>
  <section id="users-list">
    <mu-list textline="two-line">
      <mu-sub-header>今天</mu-sub-header>
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
  import eventBus from '../../modules/event-bus'

  export default {
    name: 'UsersList',
    data: () => {
      return {
        messages: [],
        initialUnreadMessages: {},
        usersList: {}
      }
    },
    computed: {},

    async mounted () {
      let vueModel = this
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
        let vueModel = this
        let querySnapshot = await query.get()
        let usersList = {}
        querySnapshot.forEach(messageDoc => {
          let message = messageDoc.data()
          vueModel.calculateUnreadMessages(message)
          usersList[message.lineUserId] = vueModel.composeMessageInfo(message)
        })

        vueModel.summaryInitialUnreadMessages(usersList)
        vueModel.usersList = usersList
        vueModel.onRead()
      },

      messageFire () {
        let vueModel = this
        return querySnapshot => {
          let lastMessageDoc
          let lastChange = querySnapshot.docChanges().last()
          if (!lastChange) {
            return
          }

          lastMessageDoc = lastChange.doc
          if (lastChange.type === 'added') {
            let lastMessage = lastMessageDoc.data()
            if (lastMessage.read === true) {
              return
            }

            if (vueModel.usersList[lastMessage.lineUserId]) {
              let existedSpecificMessage = vueModel.usersList[lastMessage.lineUserId]
              if (existedSpecificMessage.text !== lastMessage.text) {
                let newMessageInfo = vueModel.composeMessageInfo(lastMessage)
                let specificUnreadMessagesCount = existedSpecificMessage['unreadMessages']['count']
                vueModel.setUnreadMessages(newMessageInfo, specificUnreadMessagesCount + 1)
                vueModel.usersList[lastMessage.lineUserId] = newMessageInfo
              }
            } else {
              let unreadCount = 1
              let newMessageInfo = vueModel.composeMessageInfo(lastMessage)
              vueModel.setUnreadMessages(newMessageInfo, unreadCount)
              vueModel.$set(vueModel.usersList, lastMessage.lineUserId, newMessageInfo)
            }
          }
        }
      },

      calculateUnreadMessages (message) {
        const vueModel = this
        if (message.read === false) {
          if (vueModel.initialUnreadMessages[message.lineUserId]) {
            vueModel.initialUnreadMessages[message.lineUserId]++
          } else {
            vueModel.initialUnreadMessages[message.lineUserId] = 1
          }
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

      summaryInitialUnreadMessages (usersList) {
        const vueModel = this
        for (let lineUserId in usersList) {
          let specificMessageInfo = usersList[lineUserId]
          if (vueModel.initialUnreadMessages.hasOwnProperty(lineUserId)) {
            let unreadCount = vueModel.initialUnreadMessages[lineUserId]
            vueModel.setUnreadMessages(specificMessageInfo, unreadCount)
          } else {
            let unreadCount = 0
            vueModel.setUnreadMessages(specificMessageInfo, unreadCount)
          }
        }
        // console.log(vueModel.initialUnreadMessages)
        // console.log(vueModel.usersList)
      },

      setUnreadMessages (specificMessageInfo, unreadCount) {
        specificMessageInfo.unreadMessages = {
          count: unreadCount,
          countDesc: String(unreadCount)
        }
      },

      entryChatRoom (lineUserId) {
        let vueModel = this
        vueModel.$emit('retrieve-chat-messages', lineUserId)
      },

      onRead () {
        const vueModel = this
        eventBus.$on('read', lineUserId => {
          let unreadCount = 0
          vueModel.setUnreadMessages(vueModel.usersList[lineUserId], unreadCount)
        })
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
