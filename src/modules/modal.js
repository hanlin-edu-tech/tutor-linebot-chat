export function showModal (vueModel, warningText) {
  vueModel.$Modal.warning({
    title: '',
    content: `<h2 style='color: #652707;'>${warningText}</h2>`,
    width: '350px',
    okText: '喔～好吧！'
  })
}