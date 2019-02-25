<template>
  <section id="users-list">
    <mu-list textline="two-line">
      <mu-sub-header>今天</mu-sub-header>
      <mu-list-item avatar :ripple="false" button v-for="(messageInfo, name) in usersList" :key="name">
        <mu-list-item-action style="margin-top: 3px;">
          <mu-avatar :size="50">
            <img src="../../static/img/ehanlin.png">
          </mu-avatar>
        </mu-list-item-action>
        <mu-list-item-content style="margin-left: 10px;">
          <mu-list-item-title>{{ name }}</mu-list-item-title>
          <mu-list-item-sub-title>
            {{ messageInfo['text'] }}
          </mu-list-item-sub-title>
          <mu-divider></mu-divider>
        </mu-list-item-content>
      </mu-list-item>

      <!--<mu-list-item avatar :ripple="false" button v-for="(message, id) in M" :key="id">-->
      <!--<mu-list-item-action style="margin-top: 3px;">-->
      <!--<mu-avatar :size="50">-->
      <!--<img src="../../static/img/ehanlin.png">-->
      <!--</mu-avatar>-->
      <!--</mu-list-item-action>-->
      <!--<mu-list-item-content style="margin-left: 10px;">-->
      <!--<mu-list-item-title>{{ message['name'] }}</mu-list-item-title>-->
      <!--<mu-list-item-sub-title>-->
      <!--{{ message['text'] }}-->
      <!--</mu-list-item-sub-title>-->
      <!--<mu-divider></mu-divider>-->
      <!--</mu-list-item-content>-->
      <!--</mu-list-item>-->
    </mu-list>
  </section>
</template>
<script>
  import { firebase, db, auth } from '../../modules/firebase-config'

  export default {
    name: 'UsersList',
    data: () => {
      return {
        messages: Array,
        usersList: Object
      }
    },

    watch: {
      messages () {
        // let usersList = {}
        // if (this.messages) {
        //
        // }
      }
    },

    async mounted () {
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

      this.initialUsersList(query)
      query.onSnapshot(function (querySnapshot) {

        let lastChange = querySnapshot.docChanges().last()
let messageDoc =

        console.log(lastChange)
      })

      // await this.$bindCollectionAsObject('messages', db.collection('messages')
      //   .where('timestamp', '>', timestamp)
      //   .orderBy('timestamp', 'asc')
      // )
      // let usersList = {}
      // for (let id in this.messages) {
      //   let message = this.messages[id]
      //   usersList[message.name] = {
      //     text: message.text
      //   }
      // }
      //console.log(this.messages)
    },

    methods: {
      async initialUsersList (query) {
        let querySnapshot = await query.get()
        let usersList = {}
        querySnapshot.forEach(messageDoc => {
          let message = messageDoc.data()
          usersList[message.lineUserName] = {
            text: message.text
          }
        })
        this.usersList = usersList
      },

      summaryUsersList () {

      }
    }
  }
</script>
<style lang="less" scoped>
  #users-list {
    .mu-item-sub-title {
      font-size: 14px;
    }

    margin-top: 10px;
    margin-right: 10px;
  }
</style>
