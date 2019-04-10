import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)
export default new Router({
  routes: [
    {
      path: '*',
      redirect: '/googleAuth'
    },
    {
      path: '/googleAuth',
      name: 'GoogleAuth',
      component: () => import('@/views/GoogleAuth.vue')
    },
    {
      path: '/reminder',
      name: 'Reminder',
      component: () => import('@/views/Reminder.vue')
    },
    {
      path: '/chat/space',
      name: 'ChatSpace',
      component: () => import('@/views/ChatSpace.vue'),
      children: [
        {
          path: ':specificLineUser',
          name: 'ChatRoom',
          component: () => import('@/components/chat/ChatRoom.vue'),
          props: route => ({ ...route.params })
        }
      ],
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/ehanlinAdmin',
      name: 'Admin',
      component: () => import('@/views/Admin.vue')
    }
  ]
})
