export default {
  namespaced: true,
  state: {
    notificationColor: '#BFC9CA'
  },

  actions: {
    assignNotificationColorAction ({ commit }, notificationColor) {
      commit('assignNotificationColor', notificationColor)
    }
  },

  mutations: {
    assignNotificationColor (state, notificationColor) {
      state.notificationColor = notificationColor
    }
  }
}