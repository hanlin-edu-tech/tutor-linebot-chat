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
      path: '/reminder',
      name: 'Reminder',
      component: () => import('./components/Reminder.vue')
    },
    {
      path: '/chat/space',
      name: 'ChatSpace',
      component: () => import('./components/chat/ChatSpace.vue'),
      children: [
        {
          path: ':specificLineUser',
          name: 'ChatRoom',
          component: () => import('./components/chat/ChatRoom.vue'),
          props: route => ({ ...route.params })
        }
      ]
    }
  ]
})
