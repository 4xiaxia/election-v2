const fs = require('fs');
const path = require('path');
const response = require('../config/response');
const env = require('../config/env');
const { pool } = require('../db/db');
const { requireRole } = require('../config/requireRole');
const { villageWhere, checkVillageWrite } = require('../config/villageScope');

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS election_proposals (
      id int(11) NOT NULL AUTO_INCREMENT COMMENT '提案ID',
      village_id int(11) NOT NULL COMMENT '申请村居ID',
      village_name varchar(100) DEFAULT '' COMMENT '村居名称',
      title varchar(200) NOT NULL COMMENT '提案标题',
      report_content text COMMENT '文本报告内容',
      attachments text COMMENT '附件列表 JSON',
      status varchar(20) NOT NULL DEFAULT '待审核' COMMENT '待审核/已通过/已驳回',
      reviewed_by int(11) DEFAULT NULL COMMENT '审批人ID',
      reviewed_at datetime DEFAULT NULL COMMENT '审批时间',
      reject_reason text COMMENT '驳回理由',
      submitted_by int(11) DEFAULT NULL COMMENT '提交人ID',
      submitted_at datetime DEFAULT NULL COMMENT '提交时间',
      created_at timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      PRIMARY KEY (id),
      KEY idx_village_id (village_id),
      KEY idx_status (status),
      KEY idx_submitted_at (submitted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='选举提案审批表'
  `);
}

function parseJSON(value, fallback) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function safeSegment(value) {
  return String(value || '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 80) || '未命名';
}

function publicUrl(relPath) {
  return `http://127.0.0.1:${env.PORT}/${relPath.replace(/\\/g, '/')}`;
}

function moveAttachmentToArchive(att, proposalId, title) {
  if (!att || !att.url) return att;
  let pathname = '';
  try {
    pathname = new URL(att.url).pathname;
  } catch {
    pathname = String(att.url || '');
  }
  const filename = path.basename(decodeURIComponent(pathname));
  if (!filename) return att;

  const projectRoot = path.join(__dirname, '..');
  const source = path.join(projectRoot, 'public', 'uploads', filename);
  const archiveRelDir = path.join('public', 'uploads', 'archives', 'proposals', `${proposalId}-${safeSegment(title)}`);
  const archiveAbsDir = path.join(projectRoot, archiveRelDir);
  fs.mkdirSync(archiveAbsDir, { recursive: true });

  const dest = path.join(archiveAbsDir, filename);
  if (fs.existsSync(source) && path.resolve(source) !== path.resolve(dest)) {
    if (!fs.existsSync(dest)) fs.renameSync(source, dest);
  }

  return {
    ...att,
    name: att.name || filename,
    url: publicUrl(path.join(archiveRelDir, filename)),
    archivePath: archiveRelDir.replace(/\\/g, '/'),
  };
}

function mapRow(row) {
  return {
    id: row.id,
    villageId: row.village_id,
    villageName: row.village_name,
    title: row.title,
    reportContent: row.report_content,
    attachments: parseJSON(row.attachments, []),
    status: row.status,
    rejectReason: row.reject_reason || '',
    applicantName: row.applicant_name || row.submitted_by_name || '',
    applicantPhone: row.applicant_phone || '',
    submittedBy: row.submitted_by,
    createdAt: row.created_at,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
  };
}

module.exports = {
  get: {
    async list(ctx) {
      try {
        await ensureTable();
        const { status, keyword } = ctx.query;
        let sql = `SELECT p.*, u.name AS submitted_by_name, u.phone AS applicant_phone
                   FROM election_proposals p
                   LEFT JOIN users u ON p.submitted_by = u.id
                   WHERE 1=1`;
        const params = [];
        if (status) { sql += ' AND p.status=?'; params.push(status); }
        if (keyword) {
          sql += ' AND (p.title LIKE ? OR p.village_name LIKE ? OR p.report_content LIKE ?)';
          params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }
        const { wherePart, params: villageParams } = villageWhere(ctx);
        if (wherePart) {
          sql += wherePart.replace('village_id', 'p.village_id');
          params.push(...villageParams);
        }
        sql += ' ORDER BY p.created_at DESC';
        const [rows] = await pool.query(sql, params);
        response.pageSuccess(ctx, rows.map(mapRow), rows.length);
      } catch (e) {
        console.error(e);
        response.serverError(ctx, '查询选举提案失败');
      }
    },
  },
  post: {
    async add(ctx) {
      try {
        await ensureTable();
        const user = ctx.state.user || {};
        const b = ctx.request.body || {};
        const villageId = b.villageId || user.villageId;
        const title = String(b.title || '').trim();
        const reportContent = String(b.reportContent || '').trim();
        if (!villageId) return response.paramError(ctx, '归属地不能为空');
        if (!title || !reportContent) return response.paramError(ctx, '标题和文本报告不能为空');
        if (!(await checkVillageWrite(ctx, villageId))) return;

        const [villages] = await pool.execute('SELECT name FROM villages WHERE id=?', [villageId]);
        const villageName = villages[0]?.name || b.villageName || '';
        const attachments = parseJSON(b.attachments, []);
        const [result] = await pool.execute(
          `INSERT INTO election_proposals
            (village_id, village_name, title, report_content, attachments, status, submitted_by, submitted_at)
           VALUES (?, ?, ?, ?, ?, '待审核', ?, NOW())`,
          [villageId, villageName, title, reportContent, JSON.stringify(attachments), user.userId || null]
        );

        const archivedAttachments = attachments.map((att) => moveAttachmentToArchive(att, result.insertId, title));
        await pool.execute(
          'UPDATE election_proposals SET attachments=? WHERE id=?',
          [JSON.stringify(archivedAttachments), result.insertId]
        );
        response.success(ctx, { id: result.insertId, attachments: archivedAttachments }, '提案已提交，等待审批');
      } catch (e) {
        console.error(e);
        response.serverError(ctx, '提交选举提案失败');
      }
    },

    async review(ctx) {
      try {
        await ensureTable();
        const user = ctx.state.user || {};
        const { id, action, reason = '' } = ctx.request.body || {};
        if (!id) return response.paramError(ctx, '提案ID不能为空');
        if (action !== 'approve' && action !== 'reject') return response.paramError(ctx, 'action 必须是 approve 或 reject');
        if (action === 'reject' && !reason) return response.paramError(ctx, '驳回必须填写原因');
        await pool.execute(
          `UPDATE election_proposals
           SET status=?, reject_reason=?, reviewed_by=?, reviewed_at=NOW()
           WHERE id=?`,
          [action === 'approve' ? '已通过' : '已驳回', action === 'reject' ? reason : '', user.userId || null, id]
        );
        response.success(ctx, null, action === 'approve' ? '提案已通过' : '提案已驳回');
      } catch (e) {
        console.error(e);
        response.serverError(ctx, '审核选举提案失败');
      }
    },
  },
  config: {
    list: requireRole('超级管理', '经办'),
    add: requireRole('经办'),
    review: requireRole('超级管理'),
  },
};
