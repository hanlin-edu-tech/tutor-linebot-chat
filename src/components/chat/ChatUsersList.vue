<template>
  <section id="users-list">
    <mu-list textline="two-line">
      <mu-sub-header class="date-header-font">{{ today }}</mu-sub-header>
      <div class="search-line-user">
        <SearchLineUser :on-searched-fn="showSearchedUser" :on-cancel-fn="returnToOriginalShowUsers"></SearchLineUser>
      </div>
      <mu-flex justify-content="center">
        <mu-circular-progress v-if="isLoading"
                              color="success" :stroke-width="7" :size="56"></mu-circular-progress>
      </mu-flex>
      <!-- ehanlin linebot 有對話之使用者列表 -->
      <article>
        <mu-list-item
          avatar v-for="(messageInfo, lineUserId) in showUsers" :key="lineUserId">
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
              <span v-show="retrieveIdentity(lineUserId)" class="identity">
                {{ retrieveIdentity(lineUserId) }}
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
              <mu-text-field :ref="lineUserId" class="edit-identity" type="text"
                             v-model="messageInfo.identity"
                             placeholder="請輸入唯一識別名稱"></mu-text-field>

              <mu-flex align-content="center">
                <mu-icon size="22" value="cancel" @click="cancelEdit(lineUserId)"></mu-icon>
                <mu-icon size="22" value="save" @click="saveIdentity(messageInfo, lineUserId)"></mu-icon>
              </mu-flex>
            </template>
            <template v-else>
              <mu-icon class="icon-style" size="22" value="edit" color="saddlebrown"
                       @click="editIdentity(lineUserId)"></mu-icon>
            </template>
          </mu-flex>
          <mu-badge v-if="messageInfo.unreadMessagesCount > 0 && !isShowEdit(lineUserId)"
                    :content="messageInfo.unreadMessagesCountDesc"
                    color="#9966ff" badge-class="badge-info"></mu-badge>
        </mu-list-item>
      </article>
    </mu-list>
  </section>
</template>
<script>
  import SearchLineUser from '@/components/SearchLineUser'
  import { db, firebase } from '@/modules/firebase-config'
  import { showModal } from '@/modules/modal'

  export default {
    name: 'ChatUsersList',
    components: {
      SearchLineUser
    },
    data () {
      return {
        isLoading: true,
        identity: '',
        messages: [],
        showUsers: {},
        chatRef: db.collection('Chat'),
        identityCardRef: db.collection('Identity'),
      }
    },

    computed: {
      today () {
        const vueModel = this
        return vueModel.$dayjs().format('YYYY-MM-DD dddd')
      }
    },

    async mounted () {
      const vueModel = this
      try {
        const chatDocs = await vueModel.retrieveChatDocs()
        if (chatDocs.length > 0) {
          await vueModel.initialUsersList(chatDocs)
          vueModel.listeningOnChatAdded()
        }
      } catch (error) {
        console.error(error)
      }
    },

    methods: {
      retrieveIdentity (lineUserId) {
        const vueModel = this
        return vueModel.identityMapping.get(lineUserId)
      },

      async retrieveChatDocs () {
        const vueModel = this
        const oneMonthAgo = vueModel.$dayjs().subtract(1, 'month').toDate()
        const chatQuerySnapshot = await vueModel.chatRef
          .where('updateTime', '>=', oneMonthAgo)
          .orderBy('updateTime', 'desc')
          .limit(300)
          .get()

        if (chatQuerySnapshot.empty) {
          return []
        }

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

      async mappingLineUserIdentity () {
        const vueModel = this
        const identityRef = db.collection('Identity')
        const identityQuerySnapshot = await identityRef.get()
        const identityMapping = new Map()
        vueModel.identityMapping = identityMapping

        if (identityQuerySnapshot.empty) {
          return
        }

        identityQuerySnapshot.forEach(identityDoc => {
          let lineUserId = identityDoc.id
          let identityInfo = identityDoc.data()
          identityMapping.set(lineUserId, identityInfo.identity)
        })
        vueModel.identityMapping = identityMapping

        identityRef.onSnapshot(identityQuerySnapshot => {
          const identityMapping = vueModel.identityMapping
          const lastChange = identityQuerySnapshot.docChanges().last()

          let lineUserId, identityInfo
          if (!lastChange) {
            return
          }

          lineUserId = lastChange.doc.id
          identityInfo = lastChange.doc.data()
          if (lastChange.type === 'added' || lastChange.type === 'modified') {
            identityMapping.set(lineUserId, identityInfo.identity)
            vueModel.identityMapping = identityMapping
          }
        })
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
          updateTime: vueModel.$dayjs(message.updateTime.toDate()),
          unreadMessagesCount: unreadMessagesCount,
          unreadMessagesCountDesc: String(unreadMessagesCount),
          isEditIdentity: false
        }
      },

      async initialUsersList (chatDocs) {
        const vueModel = this
        const allUsers = {}
        const unreadUsers = {}
        let showUsers = {}
        for (let chatDoc of chatDocs) {
          const lineUserId = chatDoc.id
          const lineUserProfile = chatDoc.data()
          const lastMessage = await vueModel.retrieveLastMessage(lineUserId)

          /* 分離有未讀訊息之使用者 */
          const findUnreadUser = () => {
            unreadUsers[lineUserId] = {}
          }

          allUsers[lineUserId] = await vueModel.composeMessageInfo(lineUserId, lineUserProfile, lastMessage, findUnreadUser)
          vueModel.listeningOnMessageAdded(lineUserId, lineUserProfile)
        }
        /* 合併訊息，並讓有未讀訊息之 lineUserId 保持在物件中的前方 */
        showUsers = { ...unreadUsers, ...allUsers }
        await vueModel.mappingLineUserIdentity()
        vueModel.showUsers = showUsers
        vueModel.isLoading = false
      },

      resetZeroing (lineUserId) {
        const vueModel = this
        const unreadMessagesCount = 0
        vueModel.showUsers[lineUserId].unreadMessagesCount = unreadMessagesCount
        vueModel.showUsers[lineUserId].unreadMessagesCountDesc = String(unreadMessagesCount)
      },

      messageFire (lineUserId, lineUserProfile, onFiredSearchedUserFn) {
        const vueModel = this
        return async messageQuerySnapshot => {
          let messageLastChange = messageQuerySnapshot.docChanges().last()
          if (!messageLastChange) {
            return
          }

          if (messageLastChange.type === 'added') {
            if (vueModel.showUsers && vueModel.showUsers[lineUserId]) {
              let onFiredLastMessage = messageLastChange.doc.data()
              let existedSpecificMessageInfo = vueModel.showUsers[lineUserId]
              let lastUpdateTime = onFiredLastMessage.updateTime.toDate()

              /* 如果現存訊息的時戳比 lastMessage 早，表示 lastMessage 為新增的訊息 */
              const isBeforeLastUpdateTime =
                existedSpecificMessageInfo.updateTime.isBefore(vueModel.$dayjs(lastUpdateTime))
              if (isBeforeLastUpdateTime) {
                let isDiffLineUserId
                /* 重新取代為新訊息 */
                vueModel.showUsers[lineUserId] =
                  await vueModel.composeMessageInfo(lineUserId, lineUserProfile, onFiredLastMessage)

                /*
                 * 當前尚未進入 line user 專屬對話室 (activatedLineUser 為空)
                 * 或新進訊息之 line user 並非當前對話室之對象，
                 * 則將此新訊息之 line user，排列至使用者列表上方
                 */
                isDiffLineUserId = (vueModel.activatedLineUser && vueModel.activatedLineUser !== lineUserId)
                if (!vueModel.activatedLineUser || isDiffLineUserId) {
                  let newUserMessageInfo = {}
                  newUserMessageInfo[lineUserId] = {}
                  vueModel.showUsers = { ...newUserMessageInfo, ...vueModel.showUsers }
                } else if (vueModel.activatedLineUser === lineUserId) {
                  vueModel.resetZeroing(lineUserId)
                }
              }
            }
          }

          await onFiredSearchedUserFn(lineUserId, lineUserProfile, messageLastChange)
        }
      },

      listeningOnMessageAdded (lineUserId, lineUserProfile,
                               onFireSearchedUserFn = () => {}) {
        const vueModel = this
        db.collection(`Chat/${lineUserId}/Message`)
          .onSnapshot(vueModel.messageFire(lineUserId, lineUserProfile, onFireSearchedUserFn))
      },

      listeningOnChatAdded () {
        const vueModel = this
        vueModel.chatRef.onSnapshot(
          async chatQuerySnapshot => {
            let chatLastChange = chatQuerySnapshot.docChanges().last()
            if (!chatLastChange) {
              return
            }

            if (chatLastChange.type === 'added') {
              const lineUserId = chatLastChange.doc.id
              const lineUserProfile = chatLastChange.doc.data()
              if (vueModel.showUsers && !vueModel.showUsers[lineUserId]) {
                const lastMessage = await vueModel.retrieveLastMessage(lineUserId)

                /* 新的使用者傳入訊息 */
                let newUserMessageInfo = {}
                newUserMessageInfo[lineUserId] = await vueModel.composeMessageInfo(lineUserId, lineUserProfile, lastMessage)
                vueModel.showUsers = { ...newUserMessageInfo, ...vueModel.showUsers }

                vueModel.listeningOnMessageAdded(lineUserId, lineUserProfile)
              }
            }
          }
        )
      },

      entryChatRoom (messageInfo, lineUserId) {
        const vueModel = this
        vueModel.activatedLineUser = lineUserId
        vueModel.$emit('route-chat-room', messageInfo, lineUserId, vueModel.resetZeroing)
      },

      isShowEdit (lineUserId) {
        const vueModel = this
        return vueModel.showUsers[lineUserId].isEditIdentity
      },

      cancelEdit (lineUserId) {
        const vueModel = this
        vueModel.showUsers[lineUserId].isEditIdentity = false
      },

      editIdentity (lineUserId) {
        const vueModel = this
        vueModel.showUsers[lineUserId].isEditIdentity = true
      },

      async saveIdentity (messageInfo, lineUserId) {
        const vueModel = this
        const now = firebase.firestore.Timestamp.fromDate(new Date())
        let identityQuerySnapshot, identityDocRef, identityDoc

        if (!messageInfo.identity || messageInfo.identity.length === 0) {
          showModal(vueModel, '使用者識別不能為空值')
          return
        }

        identityQuerySnapshot = await vueModel.identityCardRef
          .where('identity', '==', messageInfo.identity)
          .get()

        if (!identityQuerySnapshot.empty) {
          showModal(vueModel, '唯一識別已存在於其他使用者')
          return
        }

        identityDocRef = vueModel.identityCardRef.doc(lineUserId)
        identityDoc = identityDocRef.get()
        if (identityDoc.exists) {
          await identityDocRef.set({
            identity: messageInfo.identity,
            updateTime: now
          }, { merge: true })
        } else {
          await identityDocRef.set({
            identity: messageInfo.identity,
            createTime: now,
            updateTime: now
          })
        }

        vueModel.cancelEdit(lineUserId)
      },

      async showSearchedUser (lineUserId) {
        const vueModel = this
        const chatDocSnapshot = await db.collection('Chat')
          .doc(lineUserId)
          .get()
        const searchedUserProfile = chatDocSnapshot.data()
        const searchedUserLastMessage = await vueModel.retrieveLastMessage(lineUserId)
        let searchedUserMessageInfo

        vueModel.searchedUser = {}
        searchedUserMessageInfo = await vueModel.composeMessageInfo(lineUserId, searchedUserProfile, searchedUserLastMessage)
        vueModel.$set(vueModel.searchedUser, lineUserId, searchedUserMessageInfo)

        /* 如果搜尋的使用者並未在 showUsers 中，則需要重新綁定該 Message 資料變化之事件 */
        if (vueModel.showUsers && !vueModel.showUsers[lineUserId]) {
          vueModel.listeningOnMessageAdded(lineUserId, searchedUserProfile,
            async (lineUserId, searchedUserProfile, searchedUserMessageLastChange) => {
              if (searchedUserMessageLastChange.type === 'added') {
                const searchedUserOnFiredLastMessage = searchedUserMessageLastChange.doc.data()
                let existedSpecificMessageInfo = vueModel.searchedUser[lineUserId]
                let lastUpdateTime = searchedUserOnFiredLastMessage.updateTime.toDate()

                if (existedSpecificMessageInfo.updateTime.isBefore(vueModel.$dayjs(lastUpdateTime))) {
                  vueModel.searchedUser[lineUserId] =
                    await vueModel.composeMessageInfo(lineUserId, searchedUserProfile, searchedUserOnFiredLastMessage)
                } else if (searchedUserMessageLastChange.type === 'modified') {
                  let unreadMessagesCount = 0
                  vueModel.searchedUser[lineUserId].unreadMessagesCount = unreadMessagesCount
                  vueModel.searchedUser[lineUserId].unreadMessagesCountDesc = String(unreadMessagesCount)
                }
              }
            }
          )
        }

        /* 第一次搜尋使用者時，將原初的使用者列表放入 vueModel.originalShowUsers */
        if (!vueModel.originalShowUsers) {
          vueModel.originalShowUsers = vueModel.showUsers
        }
        vueModel.showUsers = vueModel.searchedUser
      },

      returnToOriginalShowUsers () {
        const vueModel = this
        if (vueModel.originalShowUsers) {
          vueModel.showUsers = vueModel.originalShowUsers
        }
      }
    },
  }
</script>
<style lang="less">
  #users-list {
    background-color: #fdfbf2;
    margin-left: -12px;
    height: 95vh;
    overflow: scroll;

    .mu-ripple-wrapper {
      width: 80%;
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

    .identity {
      font-weight: 500;
      color: #f1fbfb;
      background-color: teal;
      padding: 0 5px;
      border-radius: 10px;
    }

    .icon-style {
      margin-left: 3px;
      cursor: pointer;
    }

    .badge-info {
      margin-left: 5px;
      font-size: 13px;
    }

    .edit-identity {
      margin-bottom: 0;
      margin-left: 5px;
      width: 72%;
    }

    .search-line-user {
      margin-left: 25px;
      width: 270px;
      margin-bottom: -15px;
    }
  }
</style>
