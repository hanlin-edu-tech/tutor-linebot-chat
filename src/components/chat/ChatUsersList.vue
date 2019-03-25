<template>
  <section id="users-list">
    <mu-list textline="two-line">
      <mu-sub-header class="date-header-font">{{ today }}</mu-sub-header>
      <mu-flex justify-content="center">
        <mu-circular-progress v-if="isLoading"
                              color="success" :stroke-width="7" :size="56"></mu-circular-progress>
      </mu-flex>
      <!-- ehanlin linebot 有對話之使用者列表 -->
      <mu-list-item
        avatar v-for="(messageInfo, lineUserId) in usersList" :key="lineUserId">
        <mu-list-item-action>
          <mu-avatar :size="55">
            <img :src="messageInfo.lineUserAvatar">
          </mu-avatar>
        </mu-list-item-action>
        <mu-ripple class="ripple-entry"
                   v-show="!isShowEdit(lineUserId)" @click="entryChatRoom(messageInfo, lineUserId)">
          <mu-list-item-content>
            <mu-list-item-title class="line-user-name">
              {{ messageInfo.lineUserName }}
            </mu-list-item-title>
            <mu-list-item-sub-title>
              <span :class="messageInfo.studentCard? 'student-card' : ''">
                {{ messageInfo.studentCard }}
              </span>
            </mu-list-item-sub-title>
            <mu-list-item-sub-title>
              <span style="font-size: 12px">{{ messageInfo.text }}</span>
            </mu-list-item-sub-title>
            <mu-divider></mu-divider>
          </mu-list-item-content>
        </mu-ripple>
        <mu-flex justify-content="between" align-items="center">
          <template v-if="isShowEdit(lineUserId)">
            <mu-text-field :ref="lineUserId" class="edit-student-card" type="text"
                           v-model="messageInfo.studentCard"
                           placeholder="請輸入學號"></mu-text-field>
            <mu-flex align-content="center">
              <mu-icon size="22" value="cancel" @click="cancelEdit(lineUserId)"></mu-icon>
              <mu-icon size="22" value="save" @click="saveStudentCard(messageInfo, lineUserId)"></mu-icon>
            </mu-flex>
          </template>
          <template v-else>
            <mu-icon class="icon-style" size="22" value="edit" color="saddlebrown"
                     @click="editStudentCard(lineUserId)"></mu-icon>
          </template>
        </mu-flex>
        <mu-badge v-if="messageInfo.unreadMessagesCount > 0 && !isShowEdit(lineUserId)"
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
        isLoading: true,
        messages: [],
        usersList: {},
        studentCard: '',
        chatRef: db.collection('Chat'),
        studentCardRef: db.collection('StudentCard'),
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
        const chatQuerySnapshot = await vueModel.chatRef
          .where('createTime', '>', fourWeeksAgo)
          .get()

        return chatQuerySnapshot
          .docChanges()
          .map(chatDocChange => chatDocChange.doc)
      },

      async retrieveLastMessage (lineUserId) {
        const vueModel = this
        const messageQuerySnapshot = await vueModel.chatRef.doc(lineUserId)
          .collection('Message')
          .orderBy('updateTime', 'desc')
          .limit(1)
          .get()

        const messageDocs = messageQuerySnapshot
          .docChanges()
          .map(chatDocChange => chatDocChange.doc)

        return messageDocs.last().data()
      },

      async retrieveStudentCard (usersList) {
        const vueModel = this
        const studentCardRef = db.collection('StudentCard')
        const studentCardQuerySnapshot = await studentCardRef.get()

        studentCardQuerySnapshot.forEach(studentCardDoc => {
          let lineUserId = studentCardDoc.id
          let messageInfo = usersList[lineUserId]
          let studentCardInfo = studentCardDoc.data()
          console.log(studentCardInfo)
          messageInfo.studentCard = studentCardInfo.studentCard
        })

        studentCardRef.onSnapshot(studentCardQuerySnapshot => {
          let lastChange = studentCardQuerySnapshot.docChanges().last()
          let lineUserId, studentCardInfo
          if (!lastChange) {
            return
          }

          lineUserId = lastChange.doc.id
          studentCardInfo = lastChange.doc.data()
          if (lastChange.type === 'added' || lastChange.type === 'modified') {
            if (vueModel.usersList && vueModel.usersList[lineUserId]) {
              vueModel.usersList[lineUserId].studentCard = studentCardInfo.studentCard
            }
          }
        })
      },

      async initialUsersList (chatDocs) {
        const vueModel = this
        const allUsers = {}
        const unreadUsers = {}
        let usersList = {}
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
        usersList = { ...unreadUsers, ...allUsers }
        await vueModel.retrieveStudentCard(usersList)
        vueModel.usersList = usersList
        vueModel.isLoading = false
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
          unreadMessagesCountDesc: String(unreadMessagesCount),
          isEditStudentCard: false
        }
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

      entryChatRoom (messageInfo, lineUserId) {
        const vueModel = this
        vueModel.activatedLineUser = lineUserId
        vueModel.$emit('route-chat-room', messageInfo, lineUserId)
      },

      isShowEdit (lineUserId) {
        const vueModel = this
        return vueModel.usersList[lineUserId].isEditStudentCard
      },

      cancelEdit (lineUserId) {
        const vueModel = this
        vueModel.usersList[lineUserId].isEditStudentCard = false
      },

      isShowStudentCard (messageInfo) {
        console.log(messageInfo)
        return messageInfo.studentCard ? messageInfo.studentCard : ''
      },

      editStudentCard (lineUserId) {
        const vueModel = this
        vueModel.usersList[lineUserId].isEditStudentCard = true
      },

      async saveStudentCard (messageInfo, lineUserId) {
        const vueModel = this
        const now = firebase.firestore.Timestamp.fromDate(new Date())
        const studentCardDocRef = vueModel.studentCardRef.doc(lineUserId)
        const studentCardDoc = studentCardDocRef.get()
        if (studentCardDoc.exists) {
          await studentCardDocRef.set({
            studentCard: messageInfo.studentCard,
            updateTime: now
          }, { merge: true })
        } else {
          await studentCardDocRef.set({
            studentCard: messageInfo.studentCard,
            createTime: now,
            updateTime: now
          })
        }

        // toDo error
        vueModel.cancelEdit(lineUserId)
      }
    }
  }
</script>
<style lang="less">
  #users-list {
    background-color: #fdfbf2;
    height: 95vh;
    overflow: scroll;

    .mu-ripple-wrapper {
      width: 77%;
    }

    .date-header-font {
      font-size: 16px;
      font-weight: 900;
      color: #484848;
    }

    .mu-item-sub-title {
      /*line-height: 1.4;*/
    }

    .ripple-entry {
      margin-left: 7px;
      width: 60%;
      cursor: pointer;
    }

    .line-user-name {
      width: 60%;
      font-weight: 800;
      font-size: 14px;
      height: 21px;
      line-height: 21px;
      color: #494949;
    }

    .student-card {
      font-weight: 500;
      color: #f1fbfb;
      background-color: teal;
      padding: 0 5px;
      border-radius: 10px;
    }

    .icon-style {
      margin-left: 5px;
      cursor: pointer;
    }

    .badge-info {
      margin-left: 7px;
      font-size: 13px;
    }

    .edit-student-card {
      margin-bottom: 0;
      margin-left: 3px;
      width: 72%;
    }
  }
</style>
