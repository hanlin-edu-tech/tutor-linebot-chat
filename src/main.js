import Vue from 'vue'
import App from './App.vue'
import router from '@/router'
import store from '@/store/store'
import MuseUI from 'muse-ui'
import axiosConfig from '@/modules/axios-config'
import VueFirestore from 'vue-firestore'
import VueGoodTablePlugin from 'vue-good-table'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'
import { Layout, Content, Sider, Modal } from 'iview'
import { firebase } from '@/modules/firebase-config'
import { showModal } from '@/modules/modal'
import { util } from '@/modules/util'

import 'muse-ui/dist/muse-ui.css'
import 'iview/dist/styles/iview.css'
import 'vue-good-table/dist/vue-good-table.css'

util.registerArrayLast()

// 關閉 vue instance 產生時的提示
Vue.config.productionTip = false
Vue.use(MuseUI)
Vue.use(axiosConfig)
Vue.use(VueFirestore, {
  key: 'id'
})
Vue.use(VueGoodTablePlugin)
Vue.component('Layout', Layout)
Vue.component('Content', Content)
Vue.component('Sider', Sider)
Vue.prototype.$Modal = Modal

dayjs.locale('zh-tw')
Vue.prototype.$dayjs = dayjs

Vue.config.errorHandler = (err, vueModel, info) => {
  console.log(info)
  showModal(vueModel, '發生錯誤囉')
  console.log(err)
}

router.beforeEach((to, from, next) => {
  console.log(to)
  const requiresAuth = to.matched.some(route => route.meta.requiresAuth)
  const currentUser = firebase.auth().currentUser

  if (requiresAuth && !currentUser) {
    next('/googleAuth')
  } else {
    next()
  }
})

new Vue({
  router,
  store,
  render: createElement => createElement(App)
}).$mount('#app')
