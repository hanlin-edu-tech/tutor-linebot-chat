<template>
  <section id="users-list">
    <mu-list textline="two-line">
      <mu-sub-header class="date-header-font">{{ today }}</mu-sub-header>
      <div class="search-line-user">
        <SearchLineUser v-show="!isLoading"
                        :on-searched-fn="showSearchedUser" :on-cancel-fn="returnToOriginalShowUsers"></SearchLineUser>
      </div>
      <!-- ehanlin linebot 有對話之使用者列表 -->
      <article>
        <mu-list-item
          avatar v-for="(messageInfo, lineUserId) in showUsers" :key="lineUserId">
          <mu-list-item-action>
            <mu-avatar :size="55">
              <img :src="messageInfo.lineUserAvatar">
            </mu-avatar>
          </mu-list-item-action>
          <mu-list-item-content v-show="!isShowEdit(lineUserId)">
            <mu-flex justify-content="between">
              <mu-list-item-title class="line-user-name">
                {{ messageInfo.lineUserName }}
              </mu-list-item-title>
              <span class="remove-identity"
                    v-show="!!messageInfo.identity" @click="removeIdentity(lineUserId)">
                移除識別
              </span>
            </mu-flex>
            <mu-ripple class="entry-room"
                       @click="entryChatRoom(messageInfo, lineUserId)">
              <mu-list-item-sub-title>
                <span v-show="!!messageInfo.identity" class="identity">
                  {{ messageInfo.identity }}
                </span>
              </mu-list-item-sub-title>
              <mu-list-item-sub-title>
                <span style="font-size: 12px">{{ messageInfo.text }}</span>
              </mu-list-item-sub-title>
              <mu-divider></mu-divider>
            </mu-ripple>
          </mu-list-item-content>
          <mu-flex justify-content="between" align-items="center">
            <template v-if="isShowEdit(lineUserId)">
              <mu-text-field :ref="lineUserId" class="edit-identity" type="text"
                             v-model="messageInfo.identity"
                             placeholder="請輸入唯一識別名稱"></mu-text-field>
              <mu-icon size="22" value="cancel" @click="cancelEdit(lineUserId)"></mu-icon>
              <mu-icon size="22" value="save" @click="saveIdentity(messageInfo, lineUserId)"></mu-icon>
            </template>
            <template v-else>
              <mu-icon class="icon-style" size="22" value="edit" color="#536c99"
                       @click="editIdentity(messageInfo, lineUserId)"></mu-icon>
            </template>
          </mu-flex>
          <mu-badge v-if="messageInfo.unreadMessagesCount > 0 && !isShowEdit(lineUserId)"
                    :content="messageInfo.unreadMessagesCountDesc"
                    color="#9966ff" badge-class="badge-info"></mu-badge>
        </mu-list-item>
      </article>
      <br />
      <mu-flex justify-content="center">
        <mu-circular-progress v-if="isLoading"
                              color="success" :stroke-width="7" :size="56"></mu-circular-progress>
      </mu-flex>
    </mu-list>
  </section>
</template>
<script>
  import SearchLineUser from '@/components/SearchLineUser'
  import { db, firebase } from '@/modules/firebase-config'
  import { ErrorText, IdentityText } from '@/modules/modal-text'

  export default {
    name: 'ChatUsersList',
    components: {
      SearchLineUser
    },
    data () {
      const vueModel = this
      return {
        isLoading: true,
        messages: [],
        showUsers: {},
        twoMonthAgo: vueModel.$dayjs().subtract(2, 'month').toDate(),
        chatRef: db.collection('Chat')
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
      await vueModel.initialUsersList()
      vueModel.listeningOnChatAdded()
    },

    methods: {
      async removeIdentity (lineUserId) {
        const vueModel = this
        try {
          await vueModel.chatRef.doc(lineUserId).set({
            identity: '',
            prerequisite: false
          })
          vueModel.$modal.show({
            text: IdentityText.SUCCESS
          })
        } catch (error) {
          vueModel.$modal.show({
            text: ErrorText.EXCEPTION
          })
        }
      },

      async retrieveSpecificMessageDocs (lineUserId) {
        const vueModel = this
        const messageQuerySnapshot = await vueModel.chatRef.doc(lineUserId)
          .collection('Message')
          .orderBy('updateTime', 'desc')
          .get()

        return messageQuerySnapshot.docs
      },

      async composeMessageInfo (lineUserId, lineProfile, newestMessage, messageDocs, findUnreadUser = () => {}) {
        const vueModel = this
        const unreadMessagesCount = messageDocs.filter(messageDoc => messageDoc.data().read === false).length
        if (unreadMessagesCount > 0) {
          findUnreadUser()
        }

        return {
          lineUserId: lineUserId,
          lineUserName: lineProfile.lineUserName,
          lineUserAvatar: lineProfile.lineUserAvatar,
          identity: lineProfile.identity,
          text: newestMessage.text,
          updateTime: vueModel.$dayjs(newestMessage.updateTime.toDate()),
          unreadMessagesCount: unreadMessagesCount,
          unreadMessagesCountDesc: String(unreadMessagesCount),
          isEditIdentity: false
        }
      },

      messageFired (lineUserId, lineUserProfile, onFiredSearchedUserFn) {
        const vueModel = this
        return async messageQuerySnapshot => {
          const messageDocs = messageQuerySnapshot.docs
          const messageNewestChange = messageQuerySnapshot.docChanges().first()

          if (messageNewestChange.type === 'added') {
            if (vueModel.showUsers && vueModel.showUsers[lineUserId]) {
              const onFiredNewestMessage = messageNewestChange.doc.data()
              const existedSpecificMessageInfo = vueModel.showUsers[lineUserId]
              const newestMessageUpdateTime = onFiredNewestMessage.updateTime.toDate()

              /* 如果現存訊息的時戳比 newestMessage 早，表示 newestMessage 為新增的訊息 */
              const isBeforeNewestMessageUpdateTime =
                existedSpecificMessageInfo.updateTime.isBefore(vueModel.$dayjs(newestMessageUpdateTime))
              if (isBeforeNewestMessageUpdateTime) {
                let isDiffLineUserId

                /* 重新取代為新訊息 */
                vueModel.showUsers[lineUserId] =
                  await vueModel.composeMessageInfo(lineUserId, lineUserProfile, onFiredNewestMessage, messageDocs)

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

          await onFiredSearchedUserFn(lineUserId, lineUserProfile, messageNewestChange)
        }
      },

      listeningOnMessageAdded (lineUserId, lineUserProfile,
                               onFireSearchedUserFn = () => {}) {
        const vueModel = this
        db.collection(`Chat/${lineUserId}/Message`)
          .orderBy('updateTime', 'desc')
          .onSnapshot(vueModel.messageFired(lineUserId, lineUserProfile, onFireSearchedUserFn))
      },

      async initialUsersList () {
        const vueModel = this
        const allUsers = {}
        const unreadUsers = {}
        const lineUsersInfo = []

        let prerequisiteChatQuerySnapshot, chatQuerySnapshot
        let isPrerequisite, totalRound
        const perCycleRecord = 30

        const processFn = async chatQuerySnapshot => {
          let chatDocs
          if (chatQuerySnapshot.empty) {
            return
          }

          chatDocs = chatQuerySnapshot.docs
          for (let chatDoc of chatDocs) {
            const lineUserId = chatDoc.id
            const lineUserProfile = chatDoc.data()
            const messageDocs = await vueModel.retrieveSpecificMessageDocs(lineUserId)
            const newestMessage = messageDocs.first().data()

            /* 分離有未讀訊息之使用者 */
            const findUnreadUser = () => {
              unreadUsers[lineUserId] = {}
            }

            lineUsersInfo.push({
              lineUserId,
              lineUserProfile
            })

            allUsers[lineUserId] =
              await vueModel.composeMessageInfo(lineUserId, lineUserProfile, newestMessage, messageDocs, findUnreadUser)
          }

          /* 合併訊息，並讓有未讀訊息之 lineUserId 保持在物件中的前方 */
          vueModel.showUsers = { ...unreadUsers, ...allUsers }
        }

        const chatFirstQuery = async isPrerequisite => {
          return await vueModel.chatRef
            .where('updateTime', '>=', vueModel.twoMonthAgo)
            .where('prerequisite', '==', isPrerequisite)
            .orderBy('updateTime', 'desc')
            .limit(perCycleRecord)
            .get()
        }

        const separateChat = async (chatQuerySnapshot, isPrerequisite, totalRound) => {
          let newestChatDocSnapshot = chatQuerySnapshot.docs.last()
          for (let round = 1; round <= totalRound; round++) {
            const chatQuerySnapshot = await vueModel.chatRef
              .where('updateTime', '>=', vueModel.twoMonthAgo)
              .where('prerequisite', '==', isPrerequisite)
              .orderBy('updateTime', 'desc')
              .startAfter(newestChatDocSnapshot)
              .limit(perCycleRecord)
              .get()

            newestChatDocSnapshot = chatQuerySnapshot.docs.last()
            await processFn(chatQuerySnapshot)
          }
        }

        isPrerequisite = true
        prerequisiteChatQuerySnapshot = await chatFirstQuery(isPrerequisite)
        await processFn(prerequisiteChatQuerySnapshot)

        totalRound = 3
        await separateChat(prerequisiteChatQuerySnapshot, isPrerequisite, totalRound)

        isPrerequisite = false
        totalRound = 1
        chatQuerySnapshot = await chatFirstQuery(isPrerequisite)
        if (chatQuerySnapshot.empty) {
          return
        }
        await processFn(chatQuerySnapshot)
        //await separateChat(chatQuerySnapshot, isPrerequisite, totalRound)

        vueModel.isLoading = false
        lineUsersInfo.forEach(lineUsersInfo =>
          vueModel.listeningOnMessageAdded(lineUsersInfo.lineUserId, lineUsersInfo.lineUserProfile))
      },

      resetZeroing (lineUserId) {
        const vueModel = this
        const unreadMessagesCount = 0
        vueModel.showUsers[lineUserId].unreadMessagesCount = unreadMessagesCount
        vueModel.showUsers[lineUserId].unreadMessagesCountDesc = String(unreadMessagesCount)
      },

      listeningOnChatAdded () {
        const vueModel = this
        vueModel.chatRef
          .where('updateTime', '>=', vueModel.twoMonthAgo)
          .orderBy('updateTime', 'asc')
          .onSnapshot(
            async chatQuerySnapshot => {
              let chatNewestChange = chatQuerySnapshot.docChanges().last()
              const lineUserId = chatNewestChange.doc.id
              const lineUserProfile = chatNewestChange.doc.data()

              if (chatNewestChange.type === 'added') {
                if (vueModel.showUsers && !vueModel.showUsers[lineUserId]) {
                  const messageDocs = await vueModel.retrieveSpecificMessageDocs(lineUserId)
                  const newestMessage = messageDocs.last().data()

                  /* 新的使用者傳入訊息 */
                  let newUserMessageInfo = {}
                  newUserMessageInfo[lineUserId] =
                    await vueModel.composeMessageInfo(lineUserId, lineUserProfile, newestMessage, messageDocs)
                  vueModel.showUsers = { ...newUserMessageInfo, ...vueModel.showUsers }
                  vueModel.listeningOnMessageAdded(lineUserId, lineUserProfile)
                }
              } else if (chatNewestChange.type === 'modified') {
                if (vueModel.showUsers[lineUserId]) {
                  vueModel.showUsers[lineUserId].identity = lineUserProfile.identity
                  // Vue.set(vueModel.showUsers, lineUserId,
                  //   await vueModel.composeMessageInfo(lineUserId, lineUserProfile, newestMessage, messageDocs))
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

      editIdentity (messageInfo, lineUserId) {
        const vueModel = this
        vueModel.showUsers[lineUserId].isEditIdentity = true
        // if (!messageInfo.identity) {
        //   messageInfo.identity = vueModel.retrieveIdentity(lineUserId)
        // }
      },

      async saveIdentity (messageInfo, lineUserId) {
        const vueModel = this
        const now = firebase.firestore.Timestamp.fromDate(new Date())
        let chatDocSnapshot, chatDocRef

        vueModel.$refs[lineUserId][0].$refs['input'].value = ''
        if (!messageInfo.identity || messageInfo.identity.length === 0) {
          vueModel.$modal.show({
            text: IdentityText.QUERY_EMPTY
          })
          return
        }

        chatDocRef = vueModel.chatRef
          .doc(lineUserId)
        chatDocSnapshot = chatDocRef.get()

        if (chatDocSnapshot.exists) {
          vueModel.$modal.show({
            text: IdentityText.EXISTED_WARNING
          })
          return
        }

        const identityInfo = {
          identity: messageInfo.identity,
          updateTime: now
        }

        identityInfo.prerequisite = (messageInfo.identity.indexOf('先修班') >= 0)

        await chatDocRef.set(identityInfo, { merge: true })
        vueModel.cancelEdit(lineUserId)
      },

      async showSearchedUser (lineUserId) {
        const vueModel = this
        const chatDocSnapshot = await db.collection('Chat')
          .doc(lineUserId)
          .get()
        const searchedUserProfile = chatDocSnapshot.data()
        const searchedUserMessageDocs = await vueModel.retrieveSpecificMessageDocs(lineUserId)
        const searchedUserNewestMessage = searchedUserMessageDocs.last().data()
        let searchedUserMessageInfo

        vueModel.searchedUser = {}
        searchedUserMessageInfo = await vueModel.composeMessageInfo(lineUserId, searchedUserProfile,
          searchedUserNewestMessage, searchedUserMessageDocs)
        vueModel.$set(vueModel.searchedUser, lineUserId, searchedUserMessageInfo)

        /* 如果搜尋的使用者並未在 showUsers 中，則需要重新綁定該 Message 資料變化之事件 */
        if (vueModel.showUsers && !vueModel.showUsers[lineUserId]) {
          vueModel.listeningOnMessageAdded(lineUserId, searchedUserProfile,
            async (lineUserId, searchedUserProfile, searchedUserMessageNewestChange) => {
              if (searchedUserMessageNewestChange.type === 'added') {
                const searchedUserOnFiredNewestMessage = searchedUserMessageNewestChange.doc.data()
                const existedSpecificMessageInfo = vueModel.searchedUser[lineUserId]
                const newestMessageUpdateTime = searchedUserOnFiredNewestMessage.updateTime.toDate()
                const isBeforeNewestMessageUpdateTime =
                  existedSpecificMessageInfo.updateTime.isBefore(vueModel.$dayjs(newestMessageUpdateTime))

                if (isBeforeNewestMessageUpdateTime) {
                  vueModel.searchedUser[lineUserId] =
                    await vueModel.composeMessageInfo(lineUserId, searchedUserProfile, searchedUserOnFiredNewestMessage)
                } else if (searchedUserMessageNewestChange.type === 'modified') {
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
        if (!!vueModel.originalShowUsers) {
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
      margin-left: 10px;
      width: 68%;
      cursor: pointer;
    }

    .date-header-font {
      font-size: 16px;
      font-weight: 900;
      color: #484848;
    }

    .entry-room {
      margin-left: 7px;
    }

    .line-user-name {
      margin-left: 7px;
      width: 60%;
      font-weight: 900;
      font-size: 13px;
      height: 22px;
      line-height: 22px;
      color: #494949;
    }

    .identity {
      font-weight: 600;
      font-size: 12px;
      color: #f1fbfb;
      background-color: teal;
      padding: 0 4px;
      border-radius: 10px;
    }

    .remove-identity {
      margin-top: 2px;
      font-weight: 700;
      font-size: 12px;
      color: #78000b;
      cursor: pointer;
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
      margin: 0 10px;
      width: 100%;
    }

    .search-line-user {
      margin-left: 25px;
      width: 270px;
      margin-bottom: -15px;
    }
  }
</style>
