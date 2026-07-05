const { pool } = require('../config/mysql');

const electionId = Number(process.argv[2] || 1);

const MATERIALS = {
  1: ['①号会议记录（两委联席）', '', '自行记录'],
  2: ['②号会议记录（村民代表会）', '', '自行记录'],
  3: ['③号会议记录（村民会议）', '', '自行记录'],
  4: ['④号会议记录（选委会）', '', '自行记录'],
  5: ['村民代表各小组数额安排表', '5.村民代表各小组数额安排表.xlsx', '有模板'],
  6: ['选举委员会候选人提名表', '6.选举委员会候选人提名表.xls', '有模板'],
  7: ['选委会成员/主任选票', '', '自行制作'],
  8: ['选举委员会选举结果报告', '8.选举委员会选举结果报告.docx', '有模板'],
  9: ['宣传发动标语照片', '', '现场拍'],
  10: ['选民登记照片', '', '现场拍'],
  11: ['选民登记情况报告', '11.选民登记情况报告.docx', '有模板'],
  12: ['选举选民登记名册', '12.××村第××届村民委会选举参选村民花名册.xlsx', '有模板'],
  13: ['选民登记情况统计表', '13.选民登记情况统计表.xlsx', '有模板'],
  14: ['委托投票《委托书》原件', '14.委托书.jpg', '只有图'],
  15: ['⑤号会议记录', '', '自行记录'],
  16: ['村民代表候选人提名表', '16.村民代表候选人提名表.xls', '有模板'],
  17: ['村民小组长候选人提名表', '17.村民小组长候选人提名表.xls', '有模板'],
  18: ['代表/小组长/妇女代表选票', '', '自行制作'],
  19: ['村民代表、小组长选举结果报告', '19.村民代表、小组长选举结果报告.docx', '有模板'],
  20: ['村（居）民代表花名册', '20.××村第××届村民代表登记册.xls', '有模板'],
  21: ['村民代表情况统计表', '21.村民代表情况统计表.xlsx', '有模板'],
  22: ['村（居）民小组长花名册', '22.××村第××届村民小组长情况统计表.xls', '有模板'],
  23: ['村民小组长情况统计表', '23.村民小组长情况统计表.xlsx', '有模板'],
  24: ['⑥号会议记录', '', '自行记录'],
  25: ['初步候选人自荐表', '25.初步候选人自荐表.jpg', '只有图'],
  26: ['初步候选人提名表', '26.初步候选人提名表.jpg', '只有图'],
  27: ['初步候选人一览表', '27.初步候选人一览表.xlsx', '有模板'],
  28: ['初步候选人资格审查表', '28.初步候选人资格审查表.xlsx', '有模板'],
  29: ['⑦号会议记录', '', '自行记录'],
  30: ['取消初步候选人资格申请表', '30.取消初步候选人资格申请表.jpg', '只有图'],
  31: ['⑧号会议记录（预选/竞选）', '', '自行记录'],
  32: ['预选选票', '', '自行制作'],
  33: ['委员会成员正式候选人预选结果报告', '33.委员会成员候选人预选结果报告.docx', '有模板'],
  34: ['⑨号会议记录', '', '自行记录'],
  35: ['候选人资格审查表（11个部门）', '34.主任候选人资格审查表.xlsx', '仅有主任的'],
  36: ['⑩号会议记录', '', '自行记录'],
  37: ['选举选票', '', '自行制作'],
  38: ['村民委员会选举结果报告', '37.村民委员会选举结果报告.docx', '有模板'],
  39: ['⑪号会议记录', '', '自行记录'],
  40: ['村务监督委员会候选人提名表', '39.村务监督委员会候选人提名表.xls', '有模板'],
  41: ['村务监督委员会候选人公示及照片', '40.村务监督委员会候选人公示.docx', '有模板'],
  42: ['⑫号会议记录', '', '自行记录'],
  43: ['⑬号会议记录', '', '自行记录'],
  44: ['村监会选票', '', '自行制作'],
  45: ['村务监督委员会选举结果报告', '44.村务监督委员会选举结果报告.docx', '有模板'],
  46: ['村委会换届选举结果报告单', '45.城厢区2021年村委会换届选举结果报告单.doc', '有模板'],
  47: ['工作记录簿 + 上交选委会印章', '', '自行归档'],
};

const materialItems = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, index) => {
    const materialNo = from + index;
    const [name, templateFile, templateStatus] = MATERIALS[materialNo];
    return { materialNo: String(materialNo), name, templateFile, templateStatus };
  });

const timeline = [
  {
    stageKey: 'S1',
    stageName: '前期准备',
    dayRange: 'D-2-D-1',
    dateRange: '10/15-10/16',
    startDate: '2021-10-15',
    endDate: '2021-10-16',
    days: 2,
    work: '两委联席、居民代表会、推选选委会，发布1/2/3号公告。',
    noticeNos: ['1', '2', '3'],
    materialNos: ['1', '2', '3', '4', '5', '6', '7', '8'],
    materials: materialItems(1, 8),
    visible: true,
    archiveOnly: false,
    stageStatus: '已完成',
  },
  {
    stageKey: 'S2',
    stageName: '选民登记',
    dayRange: 'D1-D5',
    dateRange: '10/17-10/21',
    startDate: '2021-10-17',
    endDate: '2021-10-21',
    days: 5,
    work: '宣传发动，组织选民登记并留存现场照片。',
    noticeNos: [],
    materialNos: ['9', '10'],
    materials: materialItems(9, 10),
    visible: true,
    archiveOnly: false,
    stageStatus: '已完成',
  },
  {
    stageKey: 'S3',
    stageName: '名单公布',
    dayRange: 'D6-D10',
    dateRange: '10/22-10/26',
    startDate: '2021-10-22',
    endDate: '2021-10-26',
    days: 5,
    work: '发布4号公告，汇总选民名单、统计表和委托投票材料。',
    noticeNos: ['4'],
    materialNos: ['11', '12', '13', '14'],
    materials: materialItems(11, 14),
    visible: true,
    archiveOnly: false,
    stageStatus: '已完成',
  },
  {
    stageKey: 'S4',
    stageName: '调整解释',
    dayRange: 'D11-D13',
    dateRange: '10/27-10/29',
    startDate: '2021-10-27',
    endDate: '2021-10-29',
    days: 3,
    work: '处理选民反馈和申诉，必要时调整或解释。',
    noticeNos: [],
    materialNos: [],
    materials: [],
    visible: true,
    archiveOnly: false,
    stageStatus: '已完成',
  },
  {
    stageKey: 'S5',
    stageName: '代表&小组长',
    dayRange: 'D14-D18',
    dateRange: '10/30-11/03',
    startDate: '2021-10-30',
    endDate: '2021-11-03',
    days: 5,
    work: '代表和小组长提名、选举及结果归档；一期只归档，不进入竞选岗位主线。',
    noticeNos: ['5', '6', '6-1'],
    materialNos: ['15', '16', '17', '18', '19', '20', '21', '22', '23'],
    materials: materialItems(15, 23),
    visible: true,
    archiveOnly: true,
    stageStatus: '已完成',
  },
  {
    stageKey: 'S6',
    stageName: '提名',
    dayRange: 'D19-D21',
    dateRange: '11/04-11/06',
    startDate: '2021-11-04',
    endDate: '2021-11-06',
    days: 3,
    work: '主任、副主任、委员初步候选人提名与初审，发布7/8号公告。',
    noticeNos: ['7', '8'],
    materialNos: ['24', '25', '26', '27', '28'],
    materials: materialItems(24, 28),
    visible: true,
    archiveOnly: false,
    stageStatus: '已完成',
  },
  {
    stageKey: 'S7',
    stageName: '竞选预选',
    dayRange: 'D22-D24',
    dateRange: '11/07-11/09',
    startDate: '2021-11-07',
    endDate: '2021-11-09',
    days: 3,
    work: '预选/竞选，产生正式候选人相关材料。',
    noticeNos: [],
    materialNos: ['29', '30', '31', '32', '33', '34'],
    materials: materialItems(29, 34),
    visible: true,
    archiveOnly: false,
    stageStatus: '已完成',
  },
  {
    stageKey: 'S8',
    stageName: '资格审查',
    dayRange: 'D25-D31',
    dateRange: '11/10-11/16',
    startDate: '2021-11-10',
    endDate: '2021-11-16',
    days: 7,
    work: '区级联审和考察，发布正式候选人名单公告。',
    noticeNos: ['9'],
    materialNos: ['35'],
    materials: materialItems(35, 35),
    visible: true,
    archiveOnly: false,
    stageStatus: '已完成',
  },
  {
    stageKey: 'S9',
    stageName: '选举准备',
    dayRange: 'D32-D34',
    dateRange: '11/17-11/19',
    startDate: '2021-11-17',
    endDate: '2021-11-19',
    days: 3,
    work: '发布10-15号公告，培训工作人员，制票和布场。',
    noticeNos: ['10', '11', '12', '13', '14', '15'],
    materialNos: ['36'],
    materials: materialItems(36, 36),
    visible: true,
    archiveOnly: false,
    stageStatus: '已完成',
  },
  {
    stageKey: 'S10',
    stageName: '选举日',
    dayRange: 'D35',
    dateRange: '11/20',
    startDate: '2021-11-20',
    endDate: '2021-11-20',
    days: 1,
    work: '线下投票选举，结果回填并发布居民委员会选举结果公告；系统不做线上投票计票。',
    noticeNos: ['17'],
    materialNos: ['37', '38'],
    materials: materialItems(37, 38),
    visible: true,
    archiveOnly: false,
    stageStatus: '已完成',
  },
  {
    stageKey: 'S11',
    stageName: '居监会&移交',
    dayRange: 'D36-D45',
    dateRange: '11/21-11/30',
    startDate: '2021-11-21',
    endDate: '2021-11-30',
    days: 10,
    work: '居务监督委员会和工作移交材料归档；一期只归档，不进入主任/副主任/委员竞选主线。',
    noticeNos: ['18'],
    materialNos: ['39', '40', '41', '42', '43', '44', '45', '46', '47'],
    materials: materialItems(39, 47),
    visible: true,
    archiveOnly: true,
    stageStatus: '已完成',
  },
];

const noticeStageByNo = {
  1: ['S1', 'notice_1'],
  2: ['S1', 'notice_2'],
  3: ['S1', 'notice_3'],
  4: ['S3', 'notice_4'],
  5: ['S5', 'notice_5'],
  6: ['S5', 'notice_6'],
  '6-1': ['S5', 'notice_6_1'],
  7: ['S6', 'notice_7'],
  8: ['S6', 'notice_8'],
  9: ['S8', 'notice_9'],
  10: ['S9', 'notice_10'],
  11: ['S9', 'notice_11'],
  12: ['S9', 'notice_12'],
  13: ['S9', 'notice_13'],
  14: ['S9', 'notice_14'],
  15: ['S9', 'notice_15'],
  17: ['S10', 'notice_17'],
  18: ['S11', 'notice_18'],
};

const communityNoticeNos = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '6-1',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '17',
  '18',
];

async function main() {
  if (!Number.isInteger(electionId) || electionId <= 0) {
    throw new Error('Usage: node koaLite/scripts/seed-election-timeline.js <electionId>');
  }

  const [elections] = await pool.query('SELECT id, content FROM elections WHERE id = ?', [electionId]);
  if (elections.length === 0) {
    throw new Error(`Election ${electionId} not found`);
  }

  const previousContent = elections[0].content ? JSON.parse(elections[0].content) : {};
  const content = {
    ...previousContent,
    selectionDay: previousContent.selectionDay || '2021-11-20',
    totalDays: 45,
    timelineVersion: 'p0-2026-07-05',
    timeline,
  };

  await pool.execute('UPDATE elections SET content = ? WHERE id = ?', [
    JSON.stringify(content),
    electionId,
  ]);

  const [notices] = await pool.query(
    'SELECT id FROM notices WHERE election_id = ? ORDER BY id ASC',
    [electionId]
  );

  if (notices.length !== communityNoticeNos.length) {
    throw new Error(`Expected 18 notices, got ${notices.length}`);
  }

  for (let index = 0; index < notices.length; index += 1) {
    const noticeNo = communityNoticeNos[index];
    const [stageKey, templateKey] = noticeStageByNo[noticeNo];
    await pool.execute(
      'UPDATE notices SET notice_no = ?, stage_key = ?, template_key = ? WHERE id = ?',
      [noticeNo, stageKey, templateKey, notices[index].id]
    );
  }

  const [[stageCheck]] = await pool.query(
    `SELECT JSON_LENGTH(JSON_EXTRACT(content, '$.timeline')) AS stages
       FROM elections WHERE id = ?`,
    [electionId]
  );
  const [[noticeCheck]] = await pool.query(
    `SELECT COUNT(*) AS total,
            SUM(stage_key <> '') AS staged,
            SUM(notice_no <> '') AS numbered,
            SUM(template_key <> '') AS templated
       FROM notices WHERE election_id = ?`,
    [electionId]
  );

  console.log(
    [
      `election_id=${electionId}`,
      `stages=${stageCheck.stages}`,
      `notices=${noticeCheck.total}`,
      `staged=${noticeCheck.staged}`,
      `numbered=${noticeCheck.numbered}`,
      `templated=${noticeCheck.templated}`,
    ].join(' ')
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
