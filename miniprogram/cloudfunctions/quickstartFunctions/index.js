// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  switch (event.type) {
    case 'getOpenId':
      return {
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      }
    
    case 'addRecord':
      try {
        const db = cloud.database()
        const result = await db.collection('records').add({
          data: {
            ...event.data,
            _openid: wxContext.OPENID,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
        return { success: true, id: result._id }
      } catch (error) {
        return { success: false, error: error.message }
      }
    
    case 'getRecords':
      try {
        const db = cloud.database()
        const { page = 1, pageSize = 20, startDate, endDate } = event
        
        let query = db.collection('records').where({
          _openid: wxContext.OPENID
        })
        
        if (startDate && endDate) {
          query = query.where({
            date: db.command.gte(startDate).and(db.command.lte(endDate))
          })
        }
        
        const result = await query
          .orderBy('date', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get()
        
        return { success: true, data: result.data }
      } catch (error) {
        return { success: false, error: error.message }
      }
    
    case 'getStatistics':
      try {
        const db = cloud.database()
        const { startDate, endDate } = event
        
        // 获取收入统计
        const incomeResult = await db.collection('records')
          .where({
            _openid: wxContext.OPENID,
            type: 'income',
            date: db.command.gte(startDate).and(db.command.lte(endDate))
          })
          .aggregate()
          .group({
            _id: '$category',
            total: $.sum('$amount')
          })
          .end()
        
        // 获取支出统计
        const expenseResult = await db.collection('records')
          .where({
            _openid: wxContext.OPENID,
            type: 'expense',
            date: db.command.gte(startDate).and(db.command.lte(endDate))
          })
          .aggregate()
          .group({
            _id: '$category',
            total: $.sum('$amount')
          })
          .end()
        
        return {
          success: true,
          data: {
            income: incomeResult.list,
            expense: expenseResult.list
          }
        }
      } catch (error) {
        return { success: false, error: error.message }
      }
    
    default:
      return { success: false, error: '未知的操作类型' }
  }
}