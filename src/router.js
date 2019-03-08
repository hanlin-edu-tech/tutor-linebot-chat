import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)
export default new Router({
  routes: [
    {
      path: '/googleAuth',
      name: 'GoogleAuth',
      component: () => import('./components/GoogleAuth.vue')
    },
    {
      path: '/chat/chatRoom',
      name: 'ChatRoom',
      component: () => import('./components/chat/ChatRoom.vue')
    },
    {
      path: '/chat/usersList',
      name: 'UsersList',
      component: () => import('./components/chat/ChatUsersList.vue')
    },
    {
      path: '/chat/space',
      name: 'Space',
      component: () => import('./components/chat/ChatSpace.vue')
    }
  ]
})
