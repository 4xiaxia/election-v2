# Contracts

前后端共享契约边界。业务代码开工前在此冻结：

- UUID/ULID 与 `organization_id`
- AuthContext/ElectionContext
- permission action keys
- 稳定状态与命令
- API request/response schemas
- idempotency/version/error contracts

当前未授权写入具体业务 schema。
