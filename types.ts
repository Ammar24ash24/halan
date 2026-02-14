
export interface HistoryEntry {
  id: string;
  timestamp: number;
  screenshot: string;
  question: string;
  answer: string;
  selectedOption?: string; // The specific choice (e.g., "A" or "الخيار الأول")
  language: 'ar' | 'en';
}

export interface AnalysisResult {
  question: string;
  answer: string;
  selectedOption?: string;
}
