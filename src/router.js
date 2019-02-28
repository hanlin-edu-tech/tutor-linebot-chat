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
      path: '/chat',
      name: 'Chat',
      component: () => import('./components/Chat.vue')
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
