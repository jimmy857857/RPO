// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    color: "rgba(255, 255, 255, 0.7)",
    selectedColor: "#FFFFFF",
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        iconPath: "/images/icons/home.png",
        selectedIconPath: "/images/icons/home-active.png"
      },
      {
        pagePath: "/pages/accounting/record",
        text: "记账",
        iconPath: "/images/icons/business.png",
        selectedIconPath: "/images/icons/business-active.png"
      },
      {
        pagePath: "/pages/games/wheel",
        text: "游戏",
        iconPath: "/images/icons/goods.png",
        selectedIconPath: "/images/icons/goods-active.png"
      },
      {
        pagePath: "/pages/profile/settings",
        text: "我的",
        iconPath: "/images/icons/usercenter.png",
        selectedIconPath: "/images/icons/usercenter-active.png"
      }
    ]
  },
  lifetimes: {
    attached() {
      this.updateSelected();
    }
  },
  pageLifetimes: {
    show() {
      this.updateSelected();
    }
  },
  methods: {
    updateSelected() {
      // 获取当前页面路径
      const pages = getCurrentPages();
      if (pages.length === 0) return;
      
      const currentPage = pages[pages.length - 1];
      const url = '/' + currentPage.route;
      
      // 找到当前页面对应的索引
      const index = this.data.list.findIndex(item => {
        return item.pagePath === url;
      });
      
      if (index !== -1 && this.data.selected !== index) {
        this.setData({
          selected: index
        });
      }
    },
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      const index = data.index;
      
      this.setData({
        selected: index
      });
      
      wx.switchTab({
        url
      });
    }
  }
});

