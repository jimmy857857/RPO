// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { type, data } = event

  try {
    switch (type) {
      case 'getOpenId':
        return {
          openid: wxContext.OPENID,
          appid: wxContext.APPID,
          unionid: wxContext.UNIONID,
        }

      case 'createCollection':
        // 创建记账相关集合
        await db.createCollection('records')
        await db.createCollection('budgets')
        await db.createCollection('questions')
        return { success: true }

      case 'exportRecords':
        // 导出记账数据为Excel
        return await exportRecords(event)

      case 'backupData':
        // 数据备份功能
        return await backupData(wxContext.OPENID)

      case 'restoreData':
        // 数据恢复功能
        return await restoreData(wxContext.OPENID)

      case 'getStatistics':
        // 获取统计数据
        return await getStatistics(wxContext.OPENID, event)

      default:
        return { error: '未知操作类型' }
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return { error: error.message }
  }
}

// 导出记账数据
async function exportRecords(event) {
  const { timeRange } = event
  const now = new Date()
  let startDate, endDate

  // 根据时间范围设置查询条件
  switch (timeRange) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      break
    case 'week':
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      startDate = new Date(now.setDate(diff))
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
      break
    case 'month':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      break
  }

  // 获取记录数据
  const records = await db.collection('records')
    .where({
      date: db.command.gte(startDate).and(db.command.lte(endDate))
    })
    .orderBy('date', 'desc')
    .get()

  // 生成CSV格式数据
  const csvData = generateCSV(records.data)
  
  // 上传到云存储
  const uploadResult = await cloud.uploadFile({
    cloudPath: `exports/records_${Date.now()}.csv`,
    fileContent: Buffer.from(csvData, 'utf8')
  })

  return {
    success: true,
    fileUrl: uploadResult.fileID
  }
}

// 生成CSV数据
function generateCSV(records) {
  const headers = ['日期', '类型', '分类', '金额', '备注']
  const rows = records.map(record => [
    record.date.toLocaleDateString(),
    record.type === 'income' ? '收入' : '支出',
    record.category,
    record.amount,
    record.note || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

// 数据备份
async function backupData(openid) {
  // 备份用户数据
  const [records, budgets] = await Promise.all([
    db.collection('records').where({ _openid: openid }).get(),
    db.collection('budgets').where({ _openid: openid }).get()
  ])

  const backupData = {
    records: records.data,
    budgets: budgets.data,
    backupTime: new Date(),
    openid: openid
  }

  // 保存备份到云存储
  const uploadResult = await cloud.uploadFile({
    cloudPath: `backups/${openid}_${Date.now()}.json`,
    fileContent: Buffer.from(JSON.stringify(backupData), 'utf8')
  })

  return {
    success: true,
    backupUrl: uploadResult.fileID,
    backupTime: backupData.backupTime
  }
}

// 数据恢复
async function restoreData(openid) {
  // 这里可以实现从指定备份文件恢复数据
  // 实际应用中需要更复杂的恢复逻辑
  return { success: true, message: '数据恢复功能开发中' }
}

// 获取统计数据
async function getStatistics(openid, event) {
  const { timeRange } = event
  const now = new Date()
  let startDate, endDate

  // 时间范围处理（同上）
  // ...

  const records = await db.collection('records')
    .where({
      _openid: openid,
      date: db.command.gte(startDate).and(db.command.lte(endDate))
    })
    .get()

  const statistics = calculateStatistics(records.data)
  return { success: true, data: statistics }
}

// 计算统计数据
function calculateStatistics(records) {
  const totalIncome = records.filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0)
  
  const totalExpense = records.filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0)

  const categoryExpense = {}
  records.filter(r => r.type === 'expense').forEach(record => {
    if (!categoryExpense[record.category]) {
      categoryExpense[record.category] = 0
    }
    categoryExpense[record.category] += record.amount
  })

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categoryExpense
  }
}