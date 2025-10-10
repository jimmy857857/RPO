// pages/feedback/feedback.js
const { errorHandler, storageManager } = require('../../utils/index.js');

Page({
  data: {
    feedbackType: 'suggestion',
    content: '',
    contact: '',
    images: [],
    submitting: false
  },

  onLoad() {
    // 页面加载
  },

  // 选择反馈类型
  onTypeChange(e) {
    this.setData({
      feedbackType: e.detail.value
    });
  },

  // 输入反馈内容
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 输入联系方式
  onContactInput(e) {
    this.setData({
      contact: e.detail.value
    });
  },

  // 选择图片
  onChooseImage() {
    if (this.data.images.length >= 3) {
      errorHandler.showError('最多只能上传3张图片');
      return;
    }

    wx.chooseImage({
      count: 3 - this.data.images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = this.data.images.concat(res.tempFilePaths);
        this.setData({
          images: newImages.slice(0, 3) // 确保不超过3张
        });
      }
    });
  },

  // 删除图片
  onRemoveImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  // 预览图片
  onPreviewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      urls: this.data.images,
      current: this.data.images[index]
    });
  },

  // 提交反馈
  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.setData({ submitting: true });

    // 模拟提交到服务器
    setTimeout(() => {
      this.setData({ submitting: false });
      
      // 保存反馈记录到本地
      this.saveFeedbackRecord();
      
      wx.showModal({
        title: '提交成功',
        content: '感谢您的反馈，我们会尽快处理！',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }, 2000);
  },

  // 验证表单
  validateForm() {
    if (!this.data.content.trim()) {
      errorHandler.showError('请填写反馈内容');
      return false;
    }

    if (this.data.content.trim().length < 10) {
      errorHandler.showError('反馈内容至少10个字符');
      return false;
    }

    if (this.data.content.trim().length > 500) {
      errorHandler.showError('反馈内容不能超过500个字符');
      return false;
    }

    if (this.data.contact && this.data.contact.length > 50) {
      errorHandler.showError('联系方式不能超过50个字符');
      return false;
    }

    return true;
  },

  // 保存反馈记录
  saveFeedbackRecord() {
    const feedbackRecord = {
      type: this.data.feedbackType,
      content: this.data.content.trim(),
      contact: this.data.contact.trim(),
      images: this.data.images.length,
      submitTime: new Date().toISOString(),
      userInfo: storageManager.getUserInfo() || {}
    };

    // 获取历史反馈记录
    const history = storageManager.get('feedbackHistory') || [];
    history.unshift(feedbackRecord);
    
    // 只保留最近10条记录
    if (history.length > 10) {
      history.splice(10);
    }

    storageManager.set('feedbackHistory', history);
  },

  // 清空表单
  onClear() {
    this.setData({
      content: '',
      contact: '',
      images: []
    });
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '意见反馈 - 记账游戏助手',
      path: '/pages/feedback/feedback'
    };
  }
});