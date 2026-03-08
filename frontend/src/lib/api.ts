/* Centralized API client with timeout and error handling */

const API_BASE = "http://localhost:8000/api";
const TIMEOUT_MS = 600_000; // 10 min default
const LONG_TIMEOUT_MS = 1_800_000; // 30 min for bulk ingestion

// ── Types ──
export type DocumentInfo = {
  id: string;
  name: string;
  clauses: number;
};

export type SourceResult = {
  content: string;
  source: string;
  chunk_index: number | null;
  distance: number;
  confidence: number;
};

export type ChatResponse = {
  answer: string;
  sources: SourceResult[];
  query: string;
};

export type StatsResponse = {
  total_clauses: number;
  total_documents: number;
  documents: DocumentInfo[];
};

// ── Helpers ──
class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
  timeoutMs: number = TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        body.detail || `Request failed (${res.status})`,
        res.status
      );
    }
    return (await res.json()) as T;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new ApiError("Request timed out", 408);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export type IngestResult = {
  message: string;
  ingested: { name: string; clauses: number }[];
  skipped: string[];
  errors: { name: string; error: string }[];
};

// ── Public API ──
export const api = {
  health: () =>
    request<{ status: string; version: string }>("/health"),

  getDocuments: () =>
    request<{ documents: DocumentInfo[] }>("/documents/"),

  getStats: () =>
    request<StatsResponse>("/documents/stats"),

  getClauses: (docId: string) =>
    request<{ clauses: any[]; count: number }>(
      `/documents/${encodeURIComponent(docId)}/clauses`
    ),

  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ message: string; clauses_extracted: number }>(
      "/documents/upload",
      { method: "POST", body: formData }
    );
  },

  ingestExisting: () =>
    request<{ message: string }>("/documents/ingest-existing", { method: "POST" }),

  ingestStatus: () =>
    request<{ status: string; current_clauses?: number; current_documents?: number; message?: string; ingested?: any[]; skipped?: string[]; errors?: any[] }>("/documents/ingest-status"),

  deleteDocument: (documentId: string) =>
    request<{ deleted: number; message: string }>(`/documents/${encodeURIComponent(documentId)}`, { method: "DELETE" }),

  chat: (query: string, top_k = 3) =>
    request<ChatResponse>("/chat/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k }),
    }),
};
