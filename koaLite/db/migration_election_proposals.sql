-- @@选举提案审批表（村级向超管申请办选举）
-- 流程：村级填报告+上传材料 → 提交审批 → 超管审核通过/驳回

CREATE TABLE IF NOT EXISTS `election_proposals` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '提案ID',
  `village_id` int(11) NOT NULL COMMENT '申请村居ID',
  `village_name` varchar(100) DEFAULT '' COMMENT '村居名称（冗余，方便列表展示）',
  `title` varchar(200) NOT NULL COMMENT '提案标题（如：XX村2024年村委会换届选举申请）',
  
  -- 文本报告（富文本）
  `report_content` text COMMENT '文本报告内容（村委会提交的方案：会议安排、公告计划、选举日等）',
  
  -- 附件材料（JSON数组）
  `attachments` text COMMENT '准备材料附件列表 JSON数组：[{name, url, category}]',
  -- category 示例：会议记录/数额安排表/候选人提名表/选举结果报告
  
  -- 审批流
  `status` varchar(20) NOT NULL DEFAULT '待审核' COMMENT '状态：待审核/已通过/已驳回',
  `reviewed_by` int(11) DEFAULT NULL COMMENT '审批人ID（超管）',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审批时间',
  `reject_reason` text COMMENT '驳回理由',
  
  -- 提交人
  `submitted_by` int(11) DEFAULT NULL COMMENT '提交人ID（村级经办员）',
  `submitted_at` datetime DEFAULT NULL COMMENT '提交时间',
  
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_village_id` (`village_id`),
  KEY `idx_status` (`status`),
  KEY `idx_submitted_at` (`submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='选举提案审批表';

-- 初始化示例数据（可选）
-- INSERT INTO election_proposals (village_id, village_name, title, report_content, status, submitted_by, submitted_at)
-- VALUES (1, '华亭镇XX村', 'XX村2024年村委会换届选举申请', 
--   '1. 召开第一场村民代表会议，传达上级换届精神...\n2. 召开第二场村民会议，推选选委会...\n3. 确定选举日、选民登记日...', 
--   '待审核', 1, NOW());
