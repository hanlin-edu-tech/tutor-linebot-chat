import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store/store'
import MuseUI from 'muse-ui'
import VueFirestore from 'vue-firestore'
import { Layout, Content, Sider } from 'iview';
import 'muse-ui/dist/muse-ui.css'
import 'iview/dist/styles/iview.css';

// 關閉 vue instance 產生時的提示
Vue.config.productionTip = false
Vue.use(MuseUI)
Vue.use(VueFirestore)

Vue.component('Layout', Layout);
Vue.component('Content', Content);
Vue.component('Sider', Sider);


new Vue({
  router,
  store,
  render: createElement => createElement(App)
}).$mount('#app')
