# 数据库集合创建指南

## 问题描述
小程序运行时出现错误："database collection not exists"，这是因为云数据库中的必要集合尚未创建。

## 需要创建的集合

### 1. budgets 集合（预算数据）
**字段结构：**
- `_id`: 自动生成
- `amount`: number - 预算金额
- `year`: number - 年份
- `month`: number - 月份
- `categories`: array - 分类预算（可选）
- `createdAt`: date - 创建时间
- `updatedAt`: date - 更新时间

### 2. records 集合（记账记录）
**字段结构：**
- `_id`: 自动生成
- `amount`: number - 金额
- `type`: string - 类型（'income'/'expense'）
- `category`: string - 分类
- `date`: date - 日期
- `note`: string - 备注
- `paymentMethod`: string - 支付方式
- `createdAt`: date - 创建时间

### 3. users 集合（用户信息）
**字段结构：**
- `_id`: 自动生成
- `openid`: string - 用户唯一标识
- `nickName`: string - 昵称
- `avatarUrl`: string - 头像
- `createdAt`: date - 创建时间

### 4. games 集合（游戏数据）
**字段结构：**
- `_id`: 自动生成
- `type`: string - 游戏类型
- `template`: object - 模板数据
- `createdAt`: date - 创建时间

## 创建步骤

### 方法一：通过云控制台创建
1. 打开微信开发者工具
2. 点击"云开发"按钮
3. 进入"数据库"标签页
4. 点击"+"按钮创建集合
5. 依次创建以上4个集合

### 方法二：通过代码自动创建（推荐）
小程序会在首次使用时自动创建必要的集合。只需确保用户有创建集合的权限。

## 权限设置
建议为每个集合设置以下安全规则：

```json
{
  "read": "auth != null",
  "write": "auth != null"
}
```

## 测试数据
创建集合后，可以添加一些测试数据：

```javascript
// budgets 测试数据
{
  "amount": 5000,
  "year": 2025,
  "month": 10,
  "createdAt": new Date()
}

// records 测试数据  
{
  "amount": 38.5,
  "type": "expense",
  "category": "餐饮",
  "date": new Date(),
  "note": "午餐",
  "paymentMethod": "微信支付"
}
```

## 注意事项
1. 集合名称必须与代码中的名称完全一致
2. 字段类型要与代码中的使用方式匹配
3. 首次创建集合后可能需要等待几分钟生效
4. 如果仍有问题，检查云环境ID是否正确配置