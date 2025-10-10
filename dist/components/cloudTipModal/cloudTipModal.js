// miniprogram/components/cloudTipModal/cloudTipModal.js
Component({
  properties: {
    showModal: {
      type: Boolean,
      value: false
    },
    modalTitle: {
      type: String,
      value: '提示'
    },
    modalContent: {
      type: String,
      value: ''
    }
  },

  methods: {
    onGotUserInfo(e) {
      this.triggerEvent('login', e.detail)
    },

    onCloseModal() {
      this.triggerEvent('close')
    },

    onOpenSetting() {
      wx.openSetting({
        success: (res) => {
          this.triggerEvent('setting', res)
        }
      })
    }
  }
})