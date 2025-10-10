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
        options: ['真心话', '大冒险', '跳过', '换题', '表演才艺', '分享趣事', '健康挑战', '自由选择'],
        colors: ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#34495E', '#E67E22']
      },
      {
        id: 'activity',
        name: '活动选择',
        options: ['看电影', '逛公园', '玩游戏', '运动健身', '读书学习', '烹饪美食', '手工制作', '户外活动'],
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
    this.loadCachedTemplates();
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
    
    // 确保模板有颜色，如果没有则自动生成
    let colors = template.colors;
    if (!colors || colors.length !== template.options.length) {
      colors = this.generateColors(template.options.length);
      // 更新模板的颜色
      const templates = [...this.data.templates];
      templates[index].colors = colors;
      this.setData({ templates });
    }
    
    this.setData({
      wheelOptions: template.options,
      wheelColors: colors
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
    
    // 记录使用日志（用于合规性检查）
    this.logGameUsage(selectedOption);
  },
  
  // 记录游戏使用日志
  logGameUsage(result) {
    const template = this.data.templates[this.data.templateIndex];
    console.log('游戏使用记录:', {
      template: template.name,
      result: result,
      timestamp: new Date().toISOString()
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
      colors: colors,
      isCustom: true,
      createTime: new Date().toISOString()
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

    // 保存到缓存
    this.saveTemplatesToCache(templates);

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  // 加载缓存的模板
  loadCachedTemplates() {
    try {
      const cachedTemplates = wx.getStorageSync('wheelTemplates');
      if (cachedTemplates && cachedTemplates.length > 0) {
        // 合并默认模板和缓存模板
        const defaultTemplates = this.data.templates.filter(t => !t.isCustom);
        const allTemplates = [...defaultTemplates, ...cachedTemplates];
        this.setData({ templates: allTemplates });
      }
    } catch (error) {
      console.error('加载缓存模板失败:', error);
    }
  },

  // 保存模板到缓存
  saveTemplatesToCache(templates) {
    try {
      // 只保存自定义模板
      const customTemplates = templates.filter(t => t.isCustom);
      wx.setStorageSync('wheelTemplates', customTemplates);
    } catch (error) {
      console.error('保存模板到缓存失败:', error);
    }
  },

  // 删除模板
  onDeleteTemplate(e) {
    const index = e.currentTarget.dataset.index;
    const template = this.data.templates[index];
    
    // 不能删除默认模板
    if (!template.isCustom) {
      wx.showToast({
        title: '默认模板不能删除',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '删除模板',
      content: `确定要删除模板"${template.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.deleteTemplate(index);
        }
      }
    });
  },

  // 执行删除模板
  deleteTemplate(index) {
    const templates = [...this.data.templates];
    templates.splice(index, 1);
    
    // 更新模板索引
    let newIndex = this.data.templateIndex;
    if (index <= this.data.templateIndex && this.data.templateIndex > 0) {
      newIndex = Math.max(0, this.data.templateIndex - 1);
    }

    this.setData({
      templates: templates,
      templateIndex: newIndex
    }, () => {
      // 重新加载当前模板
      this.loadTemplate(newIndex);
      this.drawWheel();
      
      // 更新缓存
      this.saveTemplatesToCache(templates);
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    });
  },

  // 生成颜色 - 改进版自动配色
  generateColors(count) {
    const colors = [];
    
    // 多种配色方案
    const colorSchemes = [
      // 多巴胺色系
      ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
      // 活力色系
      ['#FF4757', '#FFA502', '#2ED573', '#1E90FF', '#5352ED', '#FF6348', '#70A1FF', '#7BED9F'],
      // 柔和色系
      ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#34495E', '#E67E22'],
      // 清新色系
      ['#1ba784', '#f3a694', '#6EC6FF', '#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#073B4C']
    ];
    
    // 如果选项数量小于等于8，使用预定义配色方案
    if (count <= 8) {
      const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
      return scheme.slice(0, count);
    }
    
    // 对于超过8个选项，使用动态生成的彩虹色
    const hueStep = 360 / count;
    const saturation = 70 + Math.random() * 20; // 70-90%饱和度
    const lightness = 55 + Math.random() * 20; // 55-75%亮度
    
    for (let i = 0; i < count; i++) {
      const hue = (i * hueStep + Math.random() * 30) % 360; // 添加随机偏移
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
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
      title: `转盘游戏 - ${this.data.templates[this.data.templateIndex].name}`,
      path: '/pages/games/wheel'
    };
  },
  
  // 页面显示时添加合规提示
  onShow() {
    // 在页面显示时添加合规提示
    console.log('转盘游戏：本功能仅供娱乐，不涉及任何赌博性质');
  }
});