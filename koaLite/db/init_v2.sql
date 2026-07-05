-- ============================================================
-- election_v2 初始化 SQL · 招聘表单模型（2026-06-28 夏夏与阿圆翻新）
-- 心智模型：一场选举=一场招聘活动；岗位=职位；材料=简历；候选人=录用名单
-- 真相源：election-system/docs/选举系统-认知定稿-招聘比喻版.md + 表-字段-引用压实表.md
-- 边界：系统只做"收材料+展示通知"，不碰投票（线下办，结果运营回填）
-- ============================================================

-- ① 用户表（村民/候选人本人/管理员，role 区分。手机号压实命根子）
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `phone` varchar(11) NOT NULL UNIQUE COMMENT '手机号·压实锚',
  `wx_openid` varchar(100) DEFAULT '' COMMENT '微信openid/wxid',
  `password` varchar(255) DEFAULT '' COMMENT '密码（管理员用·村民免密走手机号）',
  `role` varchar(20) NOT NULL DEFAULT 'guest' COMMENT 'guest游客/villager村民/超级管理/经办/审核/运营',
  `village_id` int(11) DEFAULT NULL COMMENT '村居ID（管理员限定村居用）',
  `name` varchar(100) DEFAULT '' COMMENT '姓名',
  `is_phone_bound` tinyint(1) DEFAULT 0 COMMENT '是否填过手机号=1（游客转正标志）',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_village_id` (`village_id`),
  KEY `idx_wx_openid` (`wx_openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ② 村居表（属性·归属标签）
CREATE TABLE IF NOT EXISTS `villages` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '村居ID',
  `name` varchar(100) NOT NULL COMMENT '村居名称',
  `type` varchar(20) DEFAULT '村委会' COMMENT '村委会/居委会',
  `code` varchar(50) DEFAULT '' COMMENT '村居代码',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='村居表';

-- ③ 选举活动表（轴心=招聘活动。时间节点链=唯一真相）
CREATE TABLE IF NOT EXISTS `elections` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '选举活动ID',
  `village_id` int(11) NOT NULL COMMENT '所属村居',
  `name` varchar(100) NOT NULL COMMENT '选举名称',
  `election_type` varchar(30) DEFAULT '村委会选举' COMMENT '选举类型（村委会选举/居委会选举·要审批）',
  `election_method` varchar(30) DEFAULT '' COMMENT '选举方式（村民直接/居民直接/居民代表/户代表·联动type）',
  `content` text COMMENT '活动细则·富文本（≠公告）',
  -- 时间节点链（招聘启停时间·驱动状态·唯一真相）
  `enroll_start_at` datetime DEFAULT NULL COMMENT '报名开始',
  `enroll_end_at` datetime DEFAULT NULL COMMENT '报名截止',
  `review_start_at` datetime DEFAULT NULL COMMENT '审核开始',
  `review_end_at` datetime DEFAULT NULL COMMENT '审核截止',
  `publicity_start_at` datetime DEFAULT NULL COMMENT '公示开始',
  `publicity_end_at` datetime DEFAULT NULL COMMENT '公示截止',
  `election_end_date` datetime DEFAULT NULL COMMENT '选举日·归档',
  `scheduled_publish_at` datetime DEFAULT NULL COMMENT '定时发布',
  -- 状态机（由时间节点+今天算·不手填）
  `status` varchar(20) NOT NULL DEFAULT 'draft' COMMENT 'draft/pending_review/pending/in_progress/under_review/ready/completed/cancelled',
  -- 活动审批（审核人批·全局前置锁）
  `approval_status` varchar(20) DEFAULT '待审批' COMMENT '待审批/已通过/已驳回',
  `approver_id` int(11) DEFAULT NULL COMMENT '审批人',
  `approved_at` datetime DEFAULT NULL COMMENT '审批时间',
  `approval_reason` varchar(500) DEFAULT '' COMMENT '驳回原因',
  `related_notice_ids` text COMMENT '关联公告ID（勾选·JSON数组）',
  `created_by` int(11) DEFAULT NULL COMMENT '创建人',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_village_id` (`village_id`),
  KEY `idx_election_type` (`election_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='选举活动表';

-- ④ 岗位表（挂活动·一对多=招聘职位。状态不存，读活动时间算）
CREATE TABLE IF NOT EXISTS `positions` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '岗位ID',
  `election_id` int(11) NOT NULL COMMENT '属于哪场选举',
  `name` varchar(50) NOT NULL COMMENT '主任/副主任/委员',
  `quota` int(4) DEFAULT 1 COMMENT '应选名额',
  `duty` text COMMENT '职责简介',
  `material_requirements` text COMMENT '材料要求（JSON·金山表单·=报名表单）',
  `sort_weight` int(4) DEFAULT 99 COMMENT '展示排序',
  `enabled` tinyint(1) DEFAULT 1 COMMENT '是否启用',
  `elected_candidates` text COMMENT '当选人（结果回填·JSON）',
  -- 岗位时间（默认空=跟活动走；填了=特招覆盖）
  `enroll_start_at` datetime DEFAULT NULL COMMENT '岗位特殊报名开始（空=继承活动）',
  `enroll_end_at` datetime DEFAULT NULL COMMENT '岗位特殊报名截止（空=继承活动）',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_election_id` (`election_id`),
  FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='岗位表';

-- ⑤ 材料表（村民交的=应聘者简历·候选人的"爹"·血缘翻转源头）
CREATE TABLE IF NOT EXISTS `materials` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '材料ID',
  `election_id` int(11) NOT NULL COMMENT '哪场选举',
  `position_id` int(11) NOT NULL COMMENT '报哪个岗位',
  `applicant_phone` varchar(11) NOT NULL COMMENT '上报人手机号·压实锚',
  `applicant_user_id` int(11) DEFAULT NULL COMMENT '上报人用户ID（可空·模式A才有）',
  `applicant_name` varchar(100) DEFAULT '' COMMENT '上报人姓名',
  `items` text COMMENT '交了啥（JSON·对应岗位材料要求）',
  `status` varchar(20) NOT NULL DEFAULT '待审核' COMMENT '待审核/通过/驳回',
  `reject_reason` varchar(500) DEFAULT '' COMMENT '驳回原因（必填·推送上报人）',
  `candidate_id` int(11) DEFAULT NULL COMMENT '审核通过后回填（血缘翻转闭环）',
  `reviewer_id` int(11) DEFAULT NULL COMMENT '审核人',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审核时间',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_election_position` (`election_id`, `position_id`),
  KEY `idx_applicant_phone` (`applicant_phone`),
  FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`),
  FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='材料表';

-- ⑥ 候选人表（独立表·两来源·手机号并轨=录用名单）
CREATE TABLE IF NOT EXISTS `candidates` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '候选人ID',
  `election_id` int(11) NOT NULL COMMENT '哪场选举',
  `position_id` int(11) NOT NULL COMMENT '参选岗位',
  `phone` varchar(11) NOT NULL COMMENT '手机号·压实锚·两来源都有',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID（可空）',
  `material_id` int(11) DEFAULT NULL COMMENT '从哪份材料生的（自荐有/导入空）',
  `name` varchar(100) NOT NULL COMMENT '姓名',
  `politics` varchar(50) DEFAULT '' COMMENT '政治面貌',
  `intro` text COMMENT '简介',
  `avatar` varchar(255) DEFAULT '' COMMENT '头像',
  `source` varchar(20) NOT NULL DEFAULT 'material' COMMENT 'material自荐/import后台导入',
  `recommend_type` varchar(30) DEFAULT '' COMMENT '推荐方式=小程序展示形式（村民自荐/村委会推荐/联名推荐/联名委托）',
  `review_comment` varchar(500) DEFAULT '' COMMENT '资格审查意见（落选给理由）',
  `status` varchar(20) NOT NULL DEFAULT '未审核' COMMENT '未审核/报名中/已公示/资格作废',
  `elected` varchar(10) DEFAULT '' COMMENT '当选/落选（运营回填）',
  `votes` int(11) DEFAULT NULL COMMENT '票数（运营回填）',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_election_position` (`election_id`, `position_id`),
  KEY `idx_phone` (`phone`),
  FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`),
  FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='候选人表';

-- ⑦ 公告表（公开门面·全村可见）
CREATE TABLE IF NOT EXISTS `notices` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '公告ID',
  `election_id` int(11) DEFAULT NULL COMMENT '关联活动（可空）',
  `title` varchar(200) NOT NULL COMMENT '标题',
  `content` text COMMENT '内容·富文本',
  `type` varchar(30) DEFAULT '村务通知' COMMENT '村民组通知/议事会通知/村监会通知/村务通知',
  `start_time` datetime DEFAULT NULL COMMENT '上架时间',
  `end_time` datetime DEFAULT NULL COMMENT '下架时间',
  `status` varchar(20) DEFAULT '草稿' COMMENT '草稿/待发布/已发布/已下架',
  `is_top` tinyint(1) DEFAULT 0 COMMENT '置顶',
  `created_by` int(11) DEFAULT NULL COMMENT '创建人',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_election_id` (`election_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表';

-- ⑧ 通知表（私密定向·点对点=HR闹钟+结果通知）
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `title` varchar(200) NOT NULL COMMENT '标题',
  `content` text COMMENT '内容',
  `type` varchar(30) DEFAULT '' COMMENT '通知类型',
  `user_id` int(11) DEFAULT NULL COMMENT '定向接收人（空=广播）',
  `target_phones` text COMMENT '批量手机号（逗号分隔·运营自己填）',
  `target_role` varchar(30) DEFAULT '' COMMENT '按角色群发',
  `target_village` int(11) DEFAULT NULL COMMENT '按村居群发',
  `send_mode` varchar(20) DEFAULT '即时' COMMENT '即时/定时',
  `scheduled_at` datetime DEFAULT NULL COMMENT '定时发送日期（运营选·系统不算）',
  `status` varchar(20) DEFAULT '待发送' COMMENT '待发送/已发送',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- ⑨ 站内消息已读表（谁×哪条×读没读·未读红点·只认villager）
CREATE TABLE IF NOT EXISTS `message_reads` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `message_id` int(11) NOT NULL COMMENT '通知ID',
  `user_id` int(11) NOT NULL COMMENT '读的人',
  `read_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '已读时间',
  PRIMARY KEY (`id`),
  KEY `idx_message_user` (`message_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站内消息已读表';

-- ⑨-1 选民登记关系表（用户/线下名册人员 × 某届选举）
-- 说明：users 只管账号，不能表达“这个人登记参加哪一届”；本表是唯一必要新增关系表。
CREATE TABLE IF NOT EXISTS `election_voters` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '选民登记ID',
  `election_id` int(11) NOT NULL COMMENT '哪场选举',
  `village_id` int(11) DEFAULT NULL COMMENT '所属村居',
  `user_id` int(11) DEFAULT NULL COMMENT '线上用户ID（可空）',
  `phone` varchar(20) DEFAULT '' COMMENT '手机号（可空，线下名册可能没有）',
  `name` varchar(100) NOT NULL COMMENT '姓名',
  `gender` varchar(10) DEFAULT '' COMMENT '性别',
  `birth_date` varchar(30) DEFAULT '' COMMENT '出生年月',
  `id_card` varchar(50) DEFAULT '' COMMENT '身份证号码',
  `household_address` varchar(255) DEFAULT '' COMMENT '户口所在地',
  `group_name` varchar(100) DEFAULT '' COMMENT '所在村/居民小组',
  `register_source` varchar(30) DEFAULT 'manual' COMMENT 'mini线上登记/import名册导入/manual人工录入',
  `status` varchar(20) DEFAULT '有效' COMMENT '有效/待确认/无效',
  `remark` varchar(500) DEFAULT '' COMMENT '备注',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_election_id` (`election_id`),
  KEY `idx_village_id` (`village_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='选民登记关系表';

-- ⑩ 日志表（三合一·kind区分·规范书硬要求）
CREATE TABLE IF NOT EXISTS `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `kind` varchar(20) NOT NULL COMMENT 'operation操作/review审核/login登录',
  `actor_id` int(11) DEFAULT NULL COMMENT '操作人ID',
  `actor_name` varchar(100) DEFAULT '' COMMENT '操作人',
  `module` varchar(50) DEFAULT '' COMMENT '模块',
  `action` varchar(100) DEFAULT '' COMMENT '做了什么',
  `detail` text COMMENT '详情（审核含驳回原因/登录含IP）',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kind` (`kind`),
  KEY `idx_actor_id` (`actor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='日志表';

-- ============================================================
-- 种子数据（招聘表单模型·四角色齐全·密码=MD5('123456')）
-- ============================================================
ALTER TABLE `users` ADD COLUMN `wx_openid` varchar(100) DEFAULT '' COMMENT '微信openid/wxid' AFTER `phone`;
ALTER TABLE `users` ADD KEY `idx_wx_openid` (`wx_openid`);

-- ============================================================
-- 一期字段扩展（2026-07-05 字段矩阵诊断：旧表优先，只补承接字段）
-- ============================================================
ALTER TABLE `elections` ADD COLUMN `session_no` varchar(20) DEFAULT '第十五届' COMMENT '届次';
ALTER TABLE `elections` ADD COLUMN `committee_size` int(4) DEFAULT NULL COMMENT '班子总人数';
ALTER TABLE `elections` ADD COLUMN `deputy_count` int(4) DEFAULT NULL COMMENT '副主任名额';

ALTER TABLE `candidates` ADD COLUMN `gender` varchar(10) DEFAULT '' COMMENT '性别';

ALTER TABLE `notices` ADD COLUMN `notice_no` varchar(20) DEFAULT '' COMMENT '公告编号/号次';
ALTER TABLE `notices` ADD COLUMN `stage_key` varchar(50) DEFAULT '' COMMENT '所属时间线阶段';
ALTER TABLE `notices` ADD COLUMN `template_key` varchar(50) DEFAULT '' COMMENT '公告模板键';

ALTER TABLE `materials` ADD COLUMN `scope` varchar(20) DEFAULT 'candidate' COMMENT 'candidate候选人材料/archive阶段归档材料';
ALTER TABLE `materials` ADD COLUMN `stage_key` varchar(50) DEFAULT '' COMMENT '所属时间线阶段';
ALTER TABLE `materials` ADD COLUMN `material_no` varchar(20) DEFAULT '' COMMENT '材料编号';
ALTER TABLE `materials` ADD COLUMN `file_url` varchar(500) DEFAULT '' COMMENT '上传文件地址';
ALTER TABLE `materials` MODIFY COLUMN `position_id` int(11) DEFAULT NULL COMMENT '报哪个岗位；阶段归档材料可空';
ALTER TABLE `materials` MODIFY COLUMN `applicant_phone` varchar(20) DEFAULT '' COMMENT '上报人手机号；阶段归档材料可空';

INSERT IGNORE INTO `villages` (`id`, `name`, `type`, `code`) VALUES
(1, '凤凰社区', '居委会', 'FH001'),
(2, '幸福村', '村委会', 'XF002');

INSERT IGNORE INTO `users` (`id`, `phone`, `password`, `role`, `village_id`, `name`, `is_phone_bound`) VALUES
(1, '13800000001', 'e10adc3949ba59abbe56e057f20f883e', '超级管理', NULL, '张主任', 1),
(2, '13800000002', 'e10adc3949ba59abbe56e057f20f883e', '经办', 1, '李经办', 1),
(3, '13800000003', 'e10adc3949ba59abbe56e057f20f883e', '审核', 1, '王审核', 1),
(4, '13800000004', 'e10adc3949ba59abbe56e057f20f883e', '运营', NULL, '赵运营', 1),
(5, '13800001111', '', 'villager', NULL, '张明远', 1);

INSERT IGNORE INTO `elections` (`id`, `village_id`, `name`, `election_type`, `election_method`, `status`, `approval_status`) VALUES
(1, 1, '凤凰社区2025年居委会换届选举', '居委会选举', '居民代表选举', 'in_progress', '已通过');

INSERT IGNORE INTO `positions` (`id`, `election_id`, `name`, `quota`, `duty`, `sort_weight`) VALUES
(1, 1, '主任', 1, '主持社区全面工作', 1),
(2, 1, '副主任', 1, '协助主任工作', 2),
(3, 1, '委员', 3, '分管具体事务', 3);
