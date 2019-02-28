<template>
  <section id="users-list">
    <mu-list textline="two-line">
      <mu-sub-header>今天</mu-sub-header>
      <mu-list-item avatar :ripple="false" button
                    v-for="(messageInfo, lineUserId) in usersList" :key="lineUserId">
        <mu-list-item-action style="margin-top: 2px;">
          <mu-avatar :size="52">
            <img src="../../static/img/ehanlin.png">
          </mu-avatar>
        </mu-list-item-action>
        <mu-list-item-content style="margin-left: 10px;">
          <mu-list-item-title>{{ messageInfo.lineUserName }}</mu-list-item-title>
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

  export default {
    name: 'UsersList',
    data: () => {
      return {
        messages: [],
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

      // Binding Docs
      let fourWeeksAgoMs = (604800000 * 4)
      let timestamp = new Date(Date.now() - fourWeeksAgoMs)
      let query = db.collection('Messages')
        .where('updateTime', '>', timestamp)
        .orderBy('updateTime', 'asc')

      await vueModel.initialUsersList(query)
      query.onSnapshot(vueModel.messageFire())
    },

    methods: {
      async initialUsersList (query) {
        let vueModel = this
        let querySnapshot = await query.get()
        let usersList = {}
        querySnapshot.forEach(messageDoc => {
          let message = messageDoc.data()
          let unreadCount = 0
          usersList[message.lineUserId] = {
            lineUserName: message.lineUserName,
            text: message.text
          }
          vueModel.setUnreadMessages(usersList[message.lineUserId], unreadCount)
        })
        vueModel.usersList = usersList
      },

      messageFire () {
        let vueModel = this
        return querySnapshot => {
          let lastChange = querySnapshot.docChanges().last()
          if (!lastChange) {
            return
          }
          let messageDoc = lastChange.doc

          if (lastChange.type === 'added') {
            let lastMessage = messageDoc.data()
            if (vueModel.usersList[lastMessage.lineUserId]) {
              let existedSpecificMessage = vueModel.usersList[lastMessage.lineUserId]
              if (existedSpecificMessage.text !== lastMessage.text) {
                let newMessageInfo = {
                  lineUserName: lastMessage.lineUserName,
                  text: lastMessage.text
                }
                let specificUnreadMessagesCount = existedSpecificMessage['unreadMessages']['count']
                vueModel.setUnreadMessages(newMessageInfo, specificUnreadMessagesCount + 1)
                vueModel.usersList[lastMessage.lineUserId] = newMessageInfo
              }
            } else {
              let unreadCount = 1
              let newMessageInfo = {
                lineUserName: lastMessage.lineUserName,
                text: lastMessage.text
              }
              vueModel.setUnreadMessages(newMessageInfo, unreadCount)
              vueModel.$set(this.usersList, lastMessage.lineUserId, newMessageInfo)
            }
          } else if (lastChange.type === 'updated') {
            vueModel.$refs.lineUserId.innerText = 0
          }
        }
      },

      setUnreadMessages (specificMessageInfo, unreadCount) {
        specificMessageInfo.unreadMessages = {
          count: unreadCount,
          countDesc: String(unreadCount)
        }
      }
    }
  }
</script>
<style lang="less">
  #users-list {
    .mu-item-sub-title {
      font-size: 14px;
    }

    .badge-info {
      margin-left: 10px;
      font-size: 13px;
    }
  }
</style>
