// ── Inspection History Store (in-memory MVP) ──

export interface InspectionRecord {
  id: string;
  timestamp: string;
  photoCount: number;
  totalViolations: number;
  avgRiskScore: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  summary: string;
}

const records: InspectionRecord[] = [];

export function saveInspection(record: InspectionRecord) {
  records.unshift(record);
  if (records.length > 100) records.pop();
}

export function getHistory(): InspectionRecord[] {
  return records;
}
