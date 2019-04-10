<template>
  <section id="reminder">
    <mu-icon size="25" value="notifications" :color="notificationColor"></mu-icon>
  </section>
</template>

<script>
  import { db } from '@/modules/firebase-config'
  import { mapState, mapActions } from 'vuex'
  import { auth } from '@/modules/firebase-config'
  import '@firebase/auth'

  export default {
    name: 'Reminder',
    data () {
      return {
        isNewMessage: false,
      }
    },

    computed: mapState('reminder', ['notificationColor']),

    async mounted () {
      const vueModel = this
      const initialTime = Date.now()

      await auth.signInWithEmailAndPassword(
        'ehanlin2017@gmail.com',
        'ehanlin'
      )

      db.collection('Chat')
        .onSnapshot(
          async chatQuerySnapshot => {
            const chatLastChange = chatQuerySnapshot.docChanges().last()
            const onFiredChatInfo = chatLastChange.doc.data()
            if (chatLastChange.type === 'modified') {
              /* 當前時間小於 Chat 的異動時間，表示有新進訊息 */
              const isBeforeLastUpdateTime = vueModel.$dayjs(initialTime)
                .isBefore(vueModel.$dayjs(onFiredChatInfo.updateTime.toDate()))

              if (isBeforeLastUpdateTime) {
                /* 有新進訊息時，改變鈴鐺顏色 */
                vueModel.assignNotificationColorAction('#FFBB0B')
              }
            }
          }
        )
    },

    methods: Object.assign({}, mapActions('reminder', ['assignNotificationColorAction']))
  }
</script>

<style lang="less">
  #reminder {
    position: absolute;
    top: 0;
    left: 0;
    background-color: #F8F8F8;
  }
</style>