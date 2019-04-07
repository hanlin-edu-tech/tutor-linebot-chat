import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store/store'
import MuseUI from 'muse-ui'
import VueFirestore from 'vue-firestore'
import { Layout, Content, Sider, Modal } from 'iview'
import axiosConfig from './modules/axios-config'
import { util } from './modules/util'
import VueGoodTablePlugin from 'vue-good-table'
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

new Vue({
  router,
  store,
  render: createElement => createElement(App)
}).$mount('#app')
