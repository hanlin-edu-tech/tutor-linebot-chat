export default {
  namespaced: true,
  state: {
    loginUserEmail: String
  },

  actions: {
    assignLoginUserEmailAction ({ commit }, loginUserEmail) {
      commit('assignLoginUserEmail', loginUserEmail)
    }
  },

  mutations: {
    assignLoginUserEmail (state, loginUserEmail) {
      state.loginUserEmail = loginUserEmail
    }
  }
}
