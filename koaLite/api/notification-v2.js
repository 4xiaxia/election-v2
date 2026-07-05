// @@API-NOTIFICATION-V2 通知管理（私密定向·点对点·≠公告）
// 两条线：工作人员→短信(target_phones/target_role) / 村民→站内信(user_id/广播)
// 定时=运营选日期(scheduled_at·系统不算"提前多久")
const response = require('../config/response');
const { pool } = require('../db/db');
const { requireRole } = require('../config/requireRole');

module.exports = {
  get: {
    // 通知分页列表（后台管理看）
    async list(ctx) {
      try {
        const { page = 1, pageSize = 10, type, status, targetRole } = ctx.query;
        const limit = Number(pageSize);
        const offset = (Number(page) - 1) * limit;

        let sql = `SELECT id, title, type, user_id, target_phones, target_role, target_village,
                          send_mode, status,
                          DATE_FORMAT(scheduled_at,"%Y-%m-%d") as scheduled_at,
                          DATE_FORMAT(created_at,"%Y-%m-%d %H:%i") as created_at
                   FROM notifications WHERE 1=1`;
        let countSql = 'SELECT COUNT(1) as total FROM notifications WHERE 1=1';
        const params = [];
        const countParams = [];

        if (type)       { sql += ' AND type=?';        countSql += ' AND type=?';        params.push(type);       countParams.push(type); }
        if (status)     { sql += ' AND status=?';      countSql += ' AND status=?';      params.push(status);     countParams.push(status); }
        if (targetRole) { sql += ' AND target_role=?'; countSql += ' AND target_role=?'; params.push(targetRole); countParams.push(targetRole); }

        sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.query(sql, params);
        const [totalRow] = await pool.query(countSql, countParams);
        response.pageSuccess(ctx, rows, totalRow[0].total, page, pageSize);
      } catch (e) { console.error(e); response.serverError(ctx, '查询通知列表失败'); }
    },

    // 村民查我的站内信（含未读红点）
    async my(ctx) {
      try {
        const { userId, phone } = ctx.query;
        if (!userId && !phone) return response.paramError(ctx, 'userId 或 phone 必填');
        // 站内信：定向给我的(user_id) + 广播(user_id为空) + 按手机号定向的
        let sql = `SELECT n.id, n.title, n.content, n.type, DATE_FORMAT(n.created_at,"%Y-%m-%d %H:%i") as created_at,
                          (SELECT COUNT(1) FROM message_reads r WHERE r.message_id=n.id AND r.user_id=?) AS is_read
                   FROM notifications n
                   WHERE n.status='已发送' AND (n.user_id=? OR n.user_id IS NULL`;
        const params = [userId || 0, userId || 0];
        if (phone) { sql += ' OR FIND_IN_SET(?, n.target_phones)'; params.push(phone); }
        sql += ') ORDER BY n.id DESC';
        const [rows] = await pool.query(sql, params);
        response.success(ctx, rows);
      } catch (e) { console.error(e); response.serverError(ctx, '查询我的通知失败'); }
    }
  },

  post: {
    // 发通知（运营·两条线·即时或定时）
    async send(ctx) {
      try {
        const b = ctx.request.body;
        const { title, content = '', type = '', sendMode = '即时' } = b;
        if (!title) return response.paramError(ctx, '通知标题不能为空');
        // 至少有一个接收目标
        if (!b.userId && !b.targetPhones && !b.targetRole && !b.targetVillage) {
          return response.paramError(ctx, '至少指定一个接收目标(userId/targetPhones/targetRole/targetVillage)');
        }
        // 定时必须给日期
        if (sendMode === '定时' && !b.scheduledAt) {
          return response.paramError(ctx, '定时发送必须选择发送日期');
        }
        const status = sendMode === '即时' ? '已发送' : '待发送';
        const [r] = await pool.execute(
          `INSERT INTO notifications (title, content, type, user_id, target_phones, target_role, target_village, send_mode, scheduled_at, status)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [title, content, type, b.userId || null, b.targetPhones || '', b.targetRole || '',
           b.targetVillage || null, sendMode, b.scheduledAt || null, status]
        );
        response.success(ctx, { id: r.insertId }, sendMode === '即时' ? '通知已发送' : '定时通知已排程');
      } catch (e) { console.error(e); response.serverError(ctx, '发送通知失败'); }
    },

    // 标记已读（村民点开站内信·消未读红点）
    async read(ctx) {
      try {
        const { messageId, userId } = ctx.request.body;
        if (!messageId || !userId) return response.paramError(ctx, 'messageId 和 userId 必填');
        // 幂等：已读过就不重复插
        const [exist] = await pool.execute(
          'SELECT id FROM message_reads WHERE message_id=? AND user_id=?', [messageId, userId]
        );
        if (exist.length === 0) {
          await pool.execute('INSERT INTO message_reads (message_id, user_id) VALUES (?,?)', [messageId, userId]);
        }
        response.success(ctx, null, '已读');
      } catch (e) { console.error(e); response.serverError(ctx, '标记已读失败'); }
    },

    // 删除通知
    async delete(ctx) {
      try {
        const { id } = ctx.request.body;
        if (!id) return response.paramError(ctx, '通知ID不能为空');
        await pool.execute('DELETE FROM notifications WHERE id=?', [id]);
        response.success(ctx, null, '删除通知成功');
      } catch (e) { console.error(e); response.serverError(ctx, '删除通知失败'); }
    }
  },

  // @@AUTH 通知：发送/删除给超管/经办/运营；read村民标已读放开(村民端无管理token)
  config: {
    send: requireRole('超级管理', '经办', '运营'),
    delete: requireRole('超级管理', '经办', '运营'),
  }
};
