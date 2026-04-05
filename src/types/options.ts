export interface ConvertOptions {
  title?: string;
  documentId?: string;
  verify?: boolean;
  output?: string;
}

export interface ConvertResult {
  documentId: string;
  title: string;
  url: string;
  losses: LossReport[];
}

export interface LossReport {
  line: number;
  element: string;
  original: string;
  exported: string;
  recommendation: string;
}
