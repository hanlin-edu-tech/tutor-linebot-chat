let util = {
  arrayLast: function () {
    if (!Array.prototype.last) {
      Array.prototype.last = function () {
        return this[this.length - 1]
      }
    }
  }
}

export { util }