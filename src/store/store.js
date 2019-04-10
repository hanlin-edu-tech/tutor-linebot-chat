import Vue from 'vue'
import Vuex from 'vuex'
import loginUser from './modules/login-user'
import reminder from './modules/reminder'

Vue.use(Vuex)
const store = new Vuex.Store({
  modules: {
    loginUser,
    reminder
  }
})

export default store
