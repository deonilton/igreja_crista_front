export interface Occurrence {
  id: number;
  date: string;
  reporter_name: string;
  witnesses: string | null;
  location: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface OccurrenceFormData {
  date: string;
  reporter_name: string;
  witnesses: string;
  location: string;
  description: string;
}

export interface OccurrencesResponse {
  occurrences: Occurrence[];
  total: number;
  page: number;
  totalPages: number;
}

export interface OccurrenceResponse {
  occurrence: Occurrence;
}
