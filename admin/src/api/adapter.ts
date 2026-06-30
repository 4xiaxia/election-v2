export function toCamelKey(key: string) {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function normalizeKeys<T = any>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => normalizeKeys(item)) as T;
  if (!value || typeof value !== 'object') return value;

  const out: Record<string, any> = { ...(value as Record<string, any>) };
  for (const [key, raw] of Object.entries(value as Record<string, any>)) {
    const next = normalizeKeys(raw);
    out[key] = next;
    const camel = toCamelKey(key);
    if (camel !== key && out[camel] === undefined) out[camel] = next;
  }
  return out as T;
}

export function normalizeResponse<T = any>(res: T): T {
  return normalizeKeys(res);
}

export function pickLoginPayload(res: any) {
  return res?.data ?? res ?? {};
}

export function toElectionApprovePayload(id: string, statusOrAction: string, reason = '') {
  const action = statusOrAction === 'reject' || statusOrAction === '已驳回' ? 'reject' : 'approve';
  return { id, action, reason };
}

export function toCandidateReviewPayload(id: string, data: any = {}) {
  const comment = data.comment ?? data.reviewComment ?? '';
  const raw = data.action ?? data.status;
  const action = raw === 'fail'
    || raw === '资格作废'
    || raw === '已驳回'
    || raw === '已初审驳回'
    || raw === '已终审驳回'
      ? 'fail'
      : 'pass';
  return { id, action, comment };
}

export function toMaterialReviewPayload(id: string, data: any = {}) {
  return {
    id,
    action: data.action,
    rejectReason: data.rejectReason ?? data.reason ?? '',
    reviewerId: data.reviewerId,
  };
}

export function toNotificationPayload(data: any = {}) {
  const targetPhones = data.targetPhones ?? data.phones ?? '';
  return {
    title: data.title,
    content: data.content,
    type: data.type,
    userId: data.userId,
    targetPhones: data.targetType === 'all'
      ? 'all'
      : (Array.isArray(targetPhones) ? targetPhones.join(',') : targetPhones),
    targetRole: data.targetRole,
    targetVillage: data.targetVillage,
    sendMode: data.sendMode,
    scheduledAt: data.scheduledAt,
  };
}
