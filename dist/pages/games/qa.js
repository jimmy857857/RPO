// pages/games/qa.js
Page({
  data: {
    gameType: 'truth', // truth, dare, mixed
    questions: {
      truth: [
        "你最近一次说谎是什么时候？",
        "你最尴尬的经历是什么？",
        "你暗恋过谁？",
        "你做过最疯狂的事是什么？",
        "你最想改变自己什么？"
      ],
      dare: [
        "模仿一个动物叫",
        "给通讯录第一个人打电话说'我爱你'",
        "跳一段舞蹈",
        "做10个俯卧撑",
        "唱一首歌"
      ]
    },
    currentQuestion: '',
    usedQuestions: [],
    players: ['玩家1', '玩家2', '玩家3', '玩家4'],
    currentPlayer: 0,
    showQuestion: false,
    showResult: false
  },

  onLoad() {
    this.loadQuestions();
  },

  // 加载问题库
  loadQuestions() {
    // 这里可以从云数据库加载更多问题
    const db = wx.cloud.database();
    db.collection('questions').where({
      type: this.data.gameType === 'mixed' ? db.command.in(['truth', 'dare']) : this.data.gameType
    }).get().then(res => {
      if (res.data.length > 0) {
        const questions = {};
        res.data.forEach(q => {
          if (!questions[q.type]) questions[q.type] = [];
          questions[q.type].push(q.content);
        });
        this.setData({
          questions: questions
        });
      }
    }).catch(err => {
      if (err.errCode === -502005) {
        console.log('questions集合不存在，使用默认问题库');
      } else {
        console.log('使用默认问题库');
      }
    });
  },

  // 切换游戏类型
  onGameTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      gameType: type,
      usedQuestions: [],
      showQuestion: false
    });
    this.loadQuestions();
  },

  // 抽取问题
  onDrawQuestion() {
    let availableQuestions = [];
    
    if (this.data.gameType === 'mixed') {
      availableQuestions = [
        ...this.data.questions.truth,
        ...this.data.questions.dare
      ];
    } else {
      availableQuestions = this.data.questions[this.data.gameType];
    }

    // 过滤已使用的问题
    const unusedQuestions = availableQuestions.filter(q => 
      !this.data.usedQuestions.includes(q)
    );

    if (unusedQuestions.length === 0) {
      wx.showModal({
        title: '提示',
        content: '所有问题都已使用过，是否重新开始？',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              usedQuestions: []
            });
            this.onDrawQuestion();
          }
        }
      });
      return;
    }

    // 随机选择问题
    const randomIndex = Math.floor(Math.random() * unusedQuestions.length);
    const question = unusedQuestions[randomIndex];

    // 添加到已使用列表
    const usedQuestions = this.data.usedQuestions;
    usedQuestions.push(question);

    this.setData({
      currentQuestion: question,
      usedQuestions: usedQuestions,
      showQuestion: true,
      showResult: false
    });

    // 震动反馈
    wx.vibrateShort();
  },

  // 换题
  onChangeQuestion() {
    this.onDrawQuestion();
  },

  // 下一玩家
  onNextPlayer() {
    let nextPlayer = this.data.currentPlayer + 1;
    if (nextPlayer >= this.data.players.length) {
      nextPlayer = 0;
    }

    this.setData({
      currentPlayer: nextPlayer,
      showQuestion: false
    });

    wx.showToast({
      title: `${this.data.players[nextPlayer]}的回合`,
      icon: 'none'
    });
  },

  // 添加玩家
  onAddPlayer() {
    wx.showModal({
      title: '添加玩家',
      content: '请输入玩家姓名',
      editable: true,
      placeholderText: '玩家姓名',
      success: (res) => {
        if (res.confirm && res.content) {
          const players = this.data.players;
          players.push(res.content);
          this.setData({
            players: players
          });
        }
      }
    });
  },

  // 自定义问题
  onCustomQuestion() {
    wx.showModal({
      title: '添加自定义问题',
      content: '请输入问题内容',
      editable: true,
      placeholderText: '问题内容',
      success: (res) => {
        if (res.confirm && res.content) {
          this.addCustomQuestion(res.content);
        }
      }
    });
  },

  // 添加自定义问题到云数据库
  addCustomQuestion(question) {
    const db = wx.cloud.database();
    db.collection('questions').add({
      data: {
        type: 'custom',
        content: question,
        createdTime: new Date()
      }
    }).then(() => {
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });
    }).catch(err => {
      if (err.errCode === -502005) {
        wx.showModal({
          title: '数据库未初始化',
          content: '请先在云开发控制台创建questions集合',
          showCancel: false
        });
      } else {
        wx.showToast({
          title: '添加失败',
          icon: 'none'
        });
      }
    });
  },

  // 分享问题
  onShareQuestion() {
    if (!this.data.currentQuestion) return;

    wx.showActionSheet({
      itemList: ['分享给好友', '保存问题'],
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

  // 重新开始游戏
  onRestartGame() {
    this.setData({
      usedQuestions: [],
      showQuestion: false,
      currentPlayer: 0
    });
    wx.showToast({
      title: '游戏已重置',
      icon: 'success'
    });
  },

  // 页面分享
  onShareAppMessage() {
    const typeMap = {
      'truth': '真心话',
      'dare': '大冒险',
      'mixed': '真心话大冒险'
    };
    
    return {
      title: `${typeMap[this.data.gameType]} - 聚会破冰神器`,
      path: '/pages/games/qa'
    };
  }
});