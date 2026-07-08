const crypto = require('crypto');
const { pool } = require('../config/mysql');

const DEMO = {
  electionId: 1,
  villageId: 28,
  villageName: '涧口',
  sessionNo: '第十五届',
  subAdmin: {
    phone: '15000000000',
    password: '123456',
    role: '经办',
    name: '涧口子管理',
  },
  roster: [
    { post: '主任', name: '陈建民', phone: '15000001001', intro: '现任社区主任，负责换届期间统筹协调。' },
    { post: '副主任', name: '林秀兰', phone: '15000001002', intro: '现任社区副主任，负责材料收集与群众联络。' },
    { post: '委员', name: '黄志强', phone: '15000001003', intro: '现任社区委员，负责公告张贴与现场组织。' },
  ],
};

function md5(value) {
  return crypto.createHash('md5').update(value).digest('hex');
}

async function upsertSubAdmin(conn) {
  const [rows] = await conn.execute('SELECT id FROM users WHERE phone = ?', [DEMO.subAdmin.phone]);
  if (rows.length) {
    await conn.execute(
      `UPDATE users
       SET name = ?, role = ?, password = ?, village_id = ?, is_phone_bound = 1, status = '0'
       WHERE phone = ?`,
      [DEMO.subAdmin.name, DEMO.subAdmin.role, md5(DEMO.subAdmin.password), DEMO.villageId, DEMO.subAdmin.phone]
    );
    return rows[0].id;
  }

  const [result] = await conn.execute(
    `INSERT INTO users (phone, name, role, password, village_id, is_phone_bound, status)
     VALUES (?, ?, ?, ?, ?, 1, '0')`,
    [DEMO.subAdmin.phone, DEMO.subAdmin.name, DEMO.subAdmin.role, md5(DEMO.subAdmin.password), DEMO.villageId]
  );
  return result.insertId;
}

async function upsertRoster(conn, item, createdBy) {
  const [rows] = await conn.execute(
    `SELECT id FROM roster
     WHERE village_id = ? AND session_no = ? AND post = ? AND phone = ?
     ORDER BY id DESC LIMIT 1`,
    [DEMO.villageId, DEMO.sessionNo, item.post, item.phone]
  );

  if (rows.length) {
    await conn.execute(
      `UPDATE roster
       SET name = ?, intro = ?, year_start = 2021, year_end = 2026, status = 'active', created_by = ?
       WHERE id = ?`,
      [item.name, item.intro, createdBy, rows[0].id]
    );
    return rows[0].id;
  }

  const [result] = await conn.execute(
    `INSERT INTO roster
      (village_id, session_no, year_start, year_end, post, name, phone, intro, status, created_by)
     VALUES (?, ?, 2021, 2026, ?, ?, ?, ?, 'active', ?)`,
    [DEMO.villageId, DEMO.sessionNo, item.post, item.name, item.phone, item.intro, createdBy]
  );
  return result.insertId;
}

async function syncPositionSummary(conn, item) {
  await conn.execute(
    `UPDATE positions
     SET post_status = '在岗',
         incumbent = ?,
         incumbent_phone = ?,
         incumbent_duty = ?,
         is_reelection = 1
     WHERE election_id = ? AND name = ?`,
    [item.name, item.phone, item.intro, DEMO.electionId, item.post]
  );
}

async function main() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [elections] = await conn.execute(
      'SELECT id, village_id, session_no FROM elections WHERE id = ?',
      [DEMO.electionId]
    );
    if (!elections.length) throw new Error(`election ${DEMO.electionId} not found`);
    if (Number(elections[0].village_id) !== DEMO.villageId) {
      throw new Error(`election ${DEMO.electionId} village_id is ${elections[0].village_id}, expected ${DEMO.villageId}`);
    }

    const userId = await upsertSubAdmin(conn);
    const rosterIds = [];
    for (const item of DEMO.roster) {
      rosterIds.push(await upsertRoster(conn, item, userId));
      await syncPositionSummary(conn, item);
    }

    await conn.commit();
    console.log(JSON.stringify({
      subAdmin: { ...DEMO.subAdmin, password: '******', villageId: DEMO.villageId, villageName: DEMO.villageName },
      electionId: DEMO.electionId,
      sessionNo: DEMO.sessionNo,
      rosterIds,
      rosterCount: rosterIds.length,
    }, null, 2));
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
