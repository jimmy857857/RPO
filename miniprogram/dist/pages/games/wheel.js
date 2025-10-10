// pages/games/wheel.js
Page({
  data: {
    templateIndex: 0,
    templates: [
      {
        id: 'default',
        name: '美食选择',
        options: ['火锅', '烧烤', '日料', '西餐', '中餐', '快餐', '小吃', '甜品'],
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
      },
      {
        id: 'truth',
        name: '真心话大冒险',
        options: ['真心话', '大冒险', '跳过', '换题', '喝酒', '表演', '惩罚', '自由选择'],
        colors: ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#34495E', '#E67E22']
      },
      {
        id: 'punishment',
        name: '惩罚转盘',
        options: ['做俯卧撑', '唱歌', '跳舞', '讲笑话', '模仿', '表白', '请客', '免罚'],
        colors: ['#FF4757', '#FFA502', '#2ED573', '#1E90FF', '#5352ED', '#FF6348', '#70A1FF', '#7BED9F']
      }
    ],
    wheelOptions: [],
    wheelColors: [],
    isSpinning: false,
    rotation: 0,
    selectedOption: null,
    showResult: false,
    resultText: '',
    showCustom: false,
    customTemplate: {
      name: '',
      options: []
    },

  },

  onLoad() {
    this.loadTemplate(0);
    this.drawWheel();
  },

  onReady() {
    this.ctx = wx.createCanvasContext('wheelCanvas');
    this.drawWheel();
  },

  // 绘制转盘
  drawWheel() {
    if (!this.ctx) return;
    
    const { wheelOptions, wheelColors, rotation } = this.data;
    if (wheelOptions.length === 0) return;

    const ctx = this.ctx;
    const width = 300;
    const height = 300;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 140;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制转盘
    const anglePerOption = (2 * Math.PI) / wheelOptions.length;
    
    for (let i = 0; i < wheelOptions.length; i++) {
      const startAngle = i * anglePerOption + rotation * Math.PI / 180;
      const endAngle = (i + 1) * anglePerOption + rotation * Math.PI / 180;
      
      // 绘制扇形
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = wheelColors[i] || '#CCCCCC';
      ctx.fill();
      
      // 绘制文字
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerOption / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(wheelOptions[i], radius - 10, 4);
      ctx.restore();
    }

    // 绘制中心点
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#CCCCCC';
    ctx.stroke();

    ctx.draw();
  },

  // 加载模板
  loadTemplate(index) {
    const template = this.data.templates[index];
    this.setData({
      wheelOptions: template.options,
      wheelColors: template.colors
    });
  },

  // 选择模板
  onTemplateSelect(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      templateIndex: index,
      showResult: false,
      selectedOption: null,
      rotation: 0
    }, () => {
      this.loadTemplate(index);
      this.drawWheel();
    });
  },

  // 开始旋转
  onSpinWheel() {
    if (this.data.isSpinning) return;

    this.setData({
      isSpinning: true,
      showResult: false
    });

    // 随机选择结果
    const randomIndex = Math.floor(Math.random() * this.data.wheelOptions.length);
    const selectedOption = this.data.wheelOptions[randomIndex];
    
    // 计算旋转角度（确保停在选项中间）
    const anglePerOption = 360 / this.data.wheelOptions.length;
    const targetRotation = 360 * 5 + (randomIndex * anglePerOption + anglePerOption / 2);
    
    // 动画效果
    this.animateWheel(targetRotation, selectedOption);
  },

  // 转盘动画
  animateWheel(targetRotation, selectedOption) {
    const duration = 4000; // 4秒动画
    const startTime = Date.now();
    const startRotation = this.data.rotation % 360;
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 缓动函数（先快后慢）
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + (targetRotation - startRotation) * easeOut;
      
      this.setData({
        rotation: currentRotation
      }, () => {
        this.drawWheel(); // 每次更新都重绘转盘
      });
      
      if (progress < 1) {
        setTimeout(animate, 16); // 约60fps
      } else {
        this.onSpinComplete(selectedOption);
      }
    };
    
    animate();
  },

  // 旋转完成
  onSpinComplete(selectedOption) {
    this.setData({
      isSpinning: false,
      selectedOption: selectedOption,
      showResult: true,
      resultText: selectedOption
    });

    // 显示结果提示
    wx.vibrateShort();
    wx.showToast({
      title: `结果：${selectedOption}`,
      icon: 'none',
      duration: 2000
    });
  },



  // 重置转盘
  onResetWheel() {
    this.setData({
      isSpinning: false,
      rotation: 0,
      selectedOption: null,
      showResult: false,
      resultText: ''
    }, () => {
      this.drawWheel();
    });
  },

  // 显示历史记录
  onShowHistory() {
    wx.showModal({
      title: '历史记录',
      content: '历史记录功能开发中',
      showCancel: false
    });
  },

  // 显示自定义模板
  onCustomTemplate() {
    this.setData({
      showCustom: true
    });
  },

  // 添加选项
  onAddOption() {
    const options = [...this.data.customTemplate.options, ''];
    this.setData({
      'customTemplate.options': options
    });
  },

  // 删除选项
  onRemoveOption(e) {
    const index = e.currentTarget.dataset.index;
    const options = [...this.data.customTemplate.options];
    options.splice(index, 1);
    this.setData({
      'customTemplate.options': options
    });
  },

  // 选项内容改变
  onOptionChange(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const options = [...this.data.customTemplate.options];
    options[index] = value;
    this.setData({
      'customTemplate.options': options
    });
  },

  // 模板名称改变
  onTemplateNameChange(e) {
    this.setData({
      'customTemplate.name': e.detail.value
    });
  },

  // 保存模板
  onSaveTemplate() {
    const { name, options } = this.data.customTemplate;
    
    if (!name.trim()) {
      wx.showToast({
        title: '请输入模板名称',
        icon: 'none'
      });
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      wx.showToast({
        title: '至少需要2个有效选项',
        icon: 'none'
      });
      return;
    }

    // 生成颜色
    const colors = this.generateColors(validOptions.length);
    
    // 创建新模板
    const newTemplate = {
      id: 'custom_' + Date.now(),
      name: name,
      options: validOptions,
      colors: colors
    };

    // 添加到模板列表
    const templates = [...this.data.templates, newTemplate];
    this.setData({
      templates: templates,
      templateIndex: templates.length - 1,
      showCustom: false,
      wheelOptions: validOptions,
      wheelColors: colors
    });

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  // 生成颜色
  generateColors(count) {
    const colors = [];
    const hueStep = 360 / count;
    
    for (let i = 0; i < count; i++) {
      const hue = i * hueStep;
      colors.push(`hsl(${hue}, 70%, 65%)`);
    }
    
    return colors;
  },

  // 分享结果
  onShareResult() {
    if (!this.data.selectedOption) return;

    wx.showActionSheet({
      itemList: ['分享给好友', '保存到相册'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.shareToFriend();
        } else if (res.tapIndex === 1) {
          this.saveToAlbum();
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

  // 保存到相册
  saveToAlbum() {
    // 这里可以实现截图功能
    wx.showToast({
      title: '截图功能开发中',
      icon: 'none'
    });
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: `转盘游戏 - ${this.data.templates[this.data.currentTemplate].name}`,
      path: '/pages/games/wheel'
    };
  }
});