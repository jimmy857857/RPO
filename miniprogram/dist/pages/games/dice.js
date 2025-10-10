// pages/games/dice.js
Page({
  data: {
    diceValue: 1,
    isRolling: false,
    rollHistory: [],
    gameMode: 'single', // single, multi
    players: [],
    currentPlayer: 0,
    showResult: false
  },

  onLoad() {
    this.initGame();
  },

  // 初始化游戏
  initGame() {
    this.setData({
      diceValue: 1,
      isRolling: false,
      rollHistory: [],
      players: [{ name: '玩家1', score: 0 }],
      currentPlayer: 0,
      showResult: false
    });
  },

  // 掷骰子
  onRollDice() {
    if (this.data.isRolling) return;

    this.setData({
      isRolling: true,
      showResult: false
    });

    // 模拟骰子滚动动画
    this.animateDice();
  },

  // 骰子动画
  animateDice() {
    const rollDuration = 2000; // 2秒动画
    const startTime = Date.now();
    const targetValue = Math.floor(Math.random() * 6) + 1;

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / rollDuration, 1);

      // 在动画过程中显示随机值
      if (progress < 0.8) {
        const randomValue = Math.floor(Math.random() * 6) + 1;
        this.setData({
          diceValue: randomValue
        });
        requestAnimationFrame(animate);
      } else {
        // 动画结束，显示最终结果
        this.setData({
          diceValue: targetValue,
          isRolling: false,
          showResult: true
        });
        this.onRollComplete(targetValue);
      }
    };

    requestAnimationFrame(animate);
  },

  // 掷骰子完成
  onRollComplete(value) {
    // 记录历史
    const history = this.data.rollHistory;
    history.unshift({
      value: value,
      time: new Date().toLocaleTimeString()
    });

    if (history.length > 10) {
      history.pop();
    }

    this.setData({
      rollHistory: history
    });

    // 震动反馈
    wx.vibrateShort();

    // 多人模式处理
    if (this.data.gameMode === 'multi') {
      this.handleMultiplayer(value);
    }
  },

  // 切换游戏模式
  onModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      gameMode: mode
    });
    this.initGame();
  },

  // 添加玩家
  onAddPlayer() {
    const players = this.data.players;
    if (players.length >= 4) {
      wx.showToast({
        title: '最多4个玩家',
        icon: 'none'
      });
      return;
    }

    players.push({
      name: `玩家${players.length + 1}`,
      score: 0
    });

    this.setData({
      players: players
    });
  },

  // 处理多人游戏
  handleMultiplayer(value) {
    const players = this.data.players;
    players[this.data.currentPlayer].score = value;

    let nextPlayer = this.data.currentPlayer + 1;
    if (nextPlayer >= players.length) {
      nextPlayer = 0;
    }

    this.setData({
      players: players,
      currentPlayer: nextPlayer
    });

    // 显示当前玩家
    wx.showToast({
      title: `${players[this.data.currentPlayer].name}的回合`,
      icon: 'none'
    });
  },

  // 重新开始游戏
  onRestartGame() {
    wx.showModal({
      title: '重新开始',
      content: '确定要重新开始游戏吗？',
      success: (res) => {
        if (res.confirm) {
          this.initGame();
        }
      }
    });
  },

  // 清除历史记录
  onClearHistory() {
    this.setData({
      rollHistory: []
    });
    wx.showToast({
      title: '历史记录已清除',
      icon: 'success'
    });
  },

  // 分享结果
  onShareResult() {
    const latestRoll = this.data.rollHistory[0];
    if (!latestRoll) return;

    wx.showActionSheet({
      itemList: ['分享给好友', '保存结果'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.shareToFriend();
        }
      }
    });
  },

  // 分享给好友
  shareToFriend() {
    wx.showShareMenu({
      withShareTicket: true
    });
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '骰子游戏 - 随机决定你的命运',
      path: '/pages/games/dice'
    };
  }
});