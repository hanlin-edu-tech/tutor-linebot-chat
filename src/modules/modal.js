const showModal = (vueModel, warningText) => {
  vueModel.$Modal.warning({
    title: '',
    content: `<h2 style='color: #652707; margin-left: -30px'>${warningText}</h2>`,
    width: '350px',
    okText: '了解'
  })
}

export default showModal