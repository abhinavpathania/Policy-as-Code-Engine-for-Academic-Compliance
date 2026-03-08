"use client";

import { useState, useEffect, useRef } from "react";
import { api, type DocumentInfo } from "@/lib/api";

export default function DocumentManager() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [stats, setStats] = useState({ total_clauses: 0, total_documents: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = () => {
    api.getStats()
      .then((s) => {
        setStats({ total_clauses: s.total_clauses, total_documents: s.total_documents });
        setDocuments(s.documents);
      })
      .catch(() => {});
  };

  useEffect(() => { refresh(); return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    setStatusMsg(null);

    try {
      const res = await api.uploadDocument(file);
      setStatusMsg(`✓ ${res.message} (${res.clauses_extracted} clauses)`);
      refresh();
    } catch (err: any) {
      setStatusMsg(`✗ Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleIngestExisting = async () => {
    setIsIngesting(true);
    setStatusMsg("⏳ Starting ingestion...");

    try {
      await api.ingestExisting();
      setStatusMsg("⏳ Ingestion running in background. Stats updating live...");

      pollRef.current = setInterval(async () => {
        try {
          const status = await api.ingestStatus();
          if (status.status === "running") {
            setStatusMsg(`⏳ Ingesting... ${status.current_documents} docs, ${status.current_clauses} clauses so far`);
            refresh();
          } else if (status.status === "done") {
            setStatusMsg(`✓ ${status.message}`);
            setIsIngesting(false);
            refresh();
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (status.status === "error") {
            setStatusMsg(`✗ Ingestion error`);
            setIsIngesting(false);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch { /* ignore poll errors */ }
      }, 3000);
    } catch (err: any) {
      setStatusMsg(`✗ Ingestion failed: ${err.message}`);
      setIsIngesting(false);
    }
  };

  const handleDelete = async (docName: string) => {
    setConfirmDeleteId(null);
    setDeletingId(docName);
    try {
      const res = await api.deleteDocument(docName);
      setStatusMsg(`✓ ${res.message}`);
      refresh();
    } catch (err: any) {
      setStatusMsg(`✗ Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Stats */}
      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-value">{stats.total_documents}</span>
          <span className="stat-label">Documents</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.total_clauses.toLocaleString()}</span>
          <span className="stat-label">Clauses Indexed</span>
        </div>
      </div>

      {/* Ingest Existing Data */}
      <div className="glass-panel">
        <div className="section-title"><span className="icon">📚</span> Load Existing Data</div>
        <p style={{ fontSize: ".85rem", color: "var(--text-secondary)", marginBottom: ".75rem" }}>
          Bulk-ingest all pre-cleaned regulatory documents from Data/CleanedText into ChromaDB. Runs in background.
        </p>
        <button
          className="btn btn-primary"
          onClick={handleIngestExisting}
          disabled={isIngesting}
          style={{ width: "100%" }}
        >
          {isIngesting ? "⏳ Ingesting in background..." : "🚀 Ingest Data/CleanedText Files"}
        </button>
      </div>

      {/* Upload */}
      <div className="glass-panel">
        <div className="section-title"><span className="icon">📤</span> Upload New PDF</div>
        <div className={`upload-zone ${isUploading ? "animate-pulse" : ""}`}>
          <input type="file" accept="application/pdf" onChange={handleUpload} disabled={isUploading} />
          {isUploading ? (
            <div>
              <div className="spinner" style={{ margin: "0 auto .75rem" }} />
              <div>Processing document...</div>
            </div>
          ) : (
            <div>
              <div className="icon">📄</div>
              <div style={{ fontWeight: 600 }}>Drop a PDF here or click to browse</div>
              <div style={{ fontSize: ".82rem", color: "var(--text-muted)", marginTop: ".25rem" }}>
                Electronic PDFs supported (PyPDF2)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status message */}
      {statusMsg && (
        <div className="glass-panel" style={{
          fontSize: ".85rem",
          color: statusMsg.startsWith("✓") ? "var(--success)" :
                 statusMsg.startsWith("✗") ? "var(--danger)" : "var(--text-secondary)"
        }}>
          {statusMsg}
        </div>
      )}

      {/* Document List */}
      <div className="glass-panel">
        <div className="section-title"><span className="icon">📁</span> Indexed Documents ({documents.length})</div>
        {documents.length === 0 ? (
          <div style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: ".88rem" }}>
            No documents indexed yet. Use the button above to load existing data.
          </div>
        ) : (
          <div className="doc-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
            {documents.map((doc, i) => (
              <div key={i} className="doc-item" style={{ flexWrap: "wrap" }}>
                <span className="doc-icon">📄</span>
                <span className="doc-name" style={{ flex: 1 }}>{doc.name}</span>
                <span className="doc-clauses">{doc.clauses} clauses</span>

                {/* Delete / Confirm buttons */}
                {confirmDeleteId === doc.name ? (
                  <span className="confirm-delete-group">
                    <button
                      className="btn-confirm-yes"
                      onClick={() => handleDelete(doc.name)}
                    >
                      ✓ Yes
                    </button>
                    <button
                      className="btn-confirm-no"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      ✗ No
                    </button>
                  </span>
                ) : (
                  <button
                    className="btn-delete"
                    onClick={() => setConfirmDeleteId(doc.name)}
                    disabled={deletingId === doc.name}
                    title={`Delete ${doc.name}`}
                  >
                    {deletingId === doc.name ? "⏳" : "🗑️"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
