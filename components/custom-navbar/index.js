// components/custom-navbar/index.js
Component({
  properties: {
    title: {
      type: String,
      value: '记账游戏助手'
    },
    showBack: {
      type: Boolean,
      value: false
    }
  },
  data: {
    statusBarHeight: 0,
    navBarHeight: 0
  },
  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync();
      const statusBarHeight = systemInfo.statusBarHeight || 0;
      const navBarHeight = 44; // 导航栏高度
      
      this.setData({
        statusBarHeight,
        navBarHeight: statusBarHeight + navBarHeight
      });
    }
  },
  methods: {
    goBack() {
      wx.navigateBack();
    }
  }
});

