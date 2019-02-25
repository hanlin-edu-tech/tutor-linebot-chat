import Vue from 'vue'
import Vuex from 'vuex'
import loginUser from './modules/login-user'

Vue.use(Vuex)
const store = new Vuex.Store({
  modules: {
    loginUser
  }
})

export default store
