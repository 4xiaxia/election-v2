Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: true
    },
    background: {
      type: String,
      value: 'rgba(255, 255, 255, 0.8)'
    },
    color: {
      type: String,
      value: '#2c3e50'
    },
    fontSize: {
      type: String,
      value: '34rpx'
    },
    fontWeight: {
      type: String,
      value: 'bold'
    },
    theme: {
      type: String,
      value: 'dark' // dark(light icons) or light(dark icons)
    }
  },

  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    titleBarHeight: 0,
    menuRight: 0,
    menuTop: 0,
    menuHeight: 0
  },

  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync();
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
      
      const statusBarHeight = systemInfo.statusBarHeight;
      const titleBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height;
      const navBarHeight = statusBarHeight + titleBarHeight;

      this.setData({
        statusBarHeight,
        navBarHeight,
        titleBarHeight,
        menuRight: systemInfo.windowWidth - menuButtonInfo.right,
        menuTop: menuButtonInfo.top,
        menuHeight: menuButtonInfo.height
      });

      // 发射高度，方便父组件预留位置
      this.triggerEvent('navHeight', { height: navBarHeight });
    }
  },

  methods: {
    onBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack({
          delta: 1
        });
      } else {
        wx.reLaunch({
          url: '/pages/map/index'
        });
      }
    }
  }
})
