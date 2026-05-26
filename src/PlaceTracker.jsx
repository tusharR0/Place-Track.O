import { useState, useEffect, useMemo, useRef } from "react";

const STORAGE_KEY = "placetracker_data";
const TARGET_KEY  = "placetracker_target";

const STATUS_CONFIG = {
  Applied:   { bg: "#f1f0fe", color: "#534AB7", border: "#AFA9EC" },
  OA:        { bg: "#faeeda", color: "#854F0B", border: "#EF9F27" },
  Interview: { bg: "#e6f1fb", color: "#185FA5", border: "#85B7EB" },
  Rejected:  { bg: "#fcebeb", color: "#A32D2D", border: "#F09595" },
  Offer:     { bg: "#eaf3de", color: "#3B6D11", border: "#97C459" },
};
const STATUSES = Object.keys(STATUS_CONFIG);

const DEFAULT_DATA = [
  { id: 1, company: "Google",    role: "SWE Intern",        appliedDate: "2024-05-10", oaDate: "2024-05-15", interviewDate: "",           status: "Applied",   notes: "Applied via Careers page", resume: null },
  { id: 2, company: "Microsoft", role: "Software Engineer", appliedDate: "2024-05-08", oaDate: "2024-05-12", interviewDate: "",           status: "OA",        notes: "OA round completed",        resume: null },
  { id: 3, company: "Amazon",    role: "SDE Intern",        appliedDate: "2024-05-05", oaDate: "2024-05-09", interviewDate: "2024-05-18", status: "Interview", notes: "1st round scheduled",       resume: null },
  { id: 4, company: "Infosys",   role: "Systems Engineer",  appliedDate: "2024-05-03", oaDate: "",           interviewDate: "",           status: "Applied",   notes: "",                          resume: null },
  { id: 5, company: "TCS",       role: "Ninja",             appliedDate: "2024-05-01", oaDate: "2024-05-04", interviewDate: "",           status: "OA",        notes: "Waiting for result",        resume: null },
  { id: 6, company: "Wipro",     role: "Project Engineer",  appliedDate: "2024-04-28", oaDate: "",           interviewDate: "",           status: "Applied",   notes: "",                          resume: null },
  { id: 7, company: "Zoho",      role: "Developer",         appliedDate: "2024-04-25", oaDate: "",           interviewDate: "",           status: "Rejected",  notes: "No further update",         resume: null },
  { id: 8, company: "Dell",      role: "SDE Intern",        appliedDate: "2024-04-20", oaDate: "2024-04-22", interviewDate: "2024-04-30", status: "Offer",     notes: "Offer received 🎉",         resume: null },
  { id: 9, company: "Accenture", role: "ASE",               appliedDate: "2024-04-18", oaDate: "",           interviewDate: "",           status: "Applied",   notes: "",                          resume: null },
];

const COMPANY_COLORS = {
  Google: "#4285F4", Microsoft: "#F25022", Amazon: "#FF9900", Infosys: "#007CC3",
  TCS: "#E31837", Wipro: "#341C6F", Zoho: "#E42527", Dell: "#007DB8", Accenture: "#A100FF",
};

function ls(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function getInitials(n) { return n.slice(0, 2).toUpperCase(); }
function fmt(d) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, onChange }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Applied;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    document.addEventListener("click", h, { once: true });
    return () => document.removeEventListener("click", h);
  }, [open]);
  return (
    <div style={{ position: "relative", display: "inline-block" }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 500,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap"
      }}>
        {status} <i className="ti ti-chevron-down" style={{ fontSize: 11 }} aria-hidden="true" />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "110%", left: 0, zIndex: 300,
          background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)",
          borderRadius: 8, minWidth: 110, overflow: "hidden"
        }}>
          {STATUSES.map(s => {
            const c = STATUS_CONFIG[s];
            return (
              <div key={s} onClick={() => { onChange(s); setOpen(false); }}
                style={{ padding: "7px 14px", fontSize: 13, cursor: "pointer", color: c.color,
                  background: status === s ? c.bg : "transparent", fontWeight: status === s ? 500 : 400 }}
                onMouseEnter={e => e.currentTarget.style.background = c.bg}
                onMouseLeave={e => e.currentTarget.style.background = status === s ? c.bg : "transparent"}>
                {s}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const colors = { Applied: "#7F77DD", OA: "#EF9F27", Interview: "#378ADD", Rejected: "#E24B4A", Offer: "#639922" };
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;
  let cum = 0;
  const r = 60, cx = 80, cy = 80, sw = 22;
  const segs = data.filter(d => d.value > 0).map(d => {
    const pct = d.value / total, s0 = cum; cum += pct;
    const a1 = s0 * 2 * Math.PI - Math.PI / 2, a2 = cum * 2 * Math.PI - Math.PI / 2;
    return { ...d, path: `M ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} A ${r} ${r} 0 ${pct > .5 ? 1 : 0} 1 ${cx + r * Math.cos(a2)} ${cy + r * Math.sin(a2)}`, color: colors[d.label] };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        {segs.map((s, i) => <path key={i} d={s.path} fill="none" stroke={s.color} strokeWidth={sw} strokeLinecap="butt" />)}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={20} fontWeight={500} fill="var(--color-text-primary)">{total}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize={11} fill="var(--color-text-secondary)">total</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: colors[d.label], flexShrink: 0 }} />
            <span style={{ color: "var(--color-text-secondary)" }}>{d.label}</span>
            <span style={{ fontWeight: 500, color: "var(--color-text-primary)", marginLeft: "auto" }}>({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Resume Preview Modal ──────────────────────────────────────────────────────
function ResumePreviewModal({ resume, onClose }) {
  const isPDF = resume.mimeType === "application/pdf";
  const isImg = resume.mimeType?.startsWith("image/");
  const fmtSize = b => b < 1024 ? b + " B" : b < 1048576 ? (b/1024).toFixed(1) + " KB" : (b/1048576).toFixed(1) + " MB";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 14, border: "0.5px solid var(--color-border-secondary)", width: 720, maxWidth: "96vw", maxHeight: "88vh", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem 1.25rem", borderBottom: "0.5px solid var(--color-border-tertiary)", flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="ti ti-file-description" style={{ fontSize: 18, color: "#185FA5" }} aria-hidden="true" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resume.name}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{fmtSize(resume.size)} · {resume.mimeType}</div>
          </div>
          <a href={resume.dataUrl} download={resume.name}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#185FA5", background: "#E6F1FB", border: "0.5px solid #85B7EB", borderRadius: 8, padding: "6px 14px", textDecoration: "none", fontWeight: 500, flexShrink: 0 }}>
            <i className="ti ti-download" style={{ fontSize: 14 }} aria-hidden="true" /> Download
          </a>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 20, flexShrink: 0, padding: 4 }}>
            <i className="ti ti-x" aria-label="Close" />
          </button>
        </div>

        {/* Preview body */}
        <div style={{ flex: 1, overflow: "auto", background: "var(--color-background-secondary)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "1.25rem" }}>
          {isPDF && (
            <iframe src={resume.dataUrl} title={resume.name}
              style={{ width: "100%", height: 520, border: "none", borderRadius: 8, background: "#fff" }} />
          )}
          {isImg && (
            <img src={resume.dataUrl} alt={resume.name}
              style={{ maxWidth: "100%", borderRadius: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }} />
          )}
          {!isPDF && !isImg && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "3rem", textAlign: "center" }}>
              <i className="ti ti-file" style={{ fontSize: 52, color: "var(--color-text-tertiary)" }} aria-hidden="true" />
              <div style={{ fontWeight: 500, fontSize: 15 }}>Preview not available</div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>This file type cannot be previewed in the browser.</div>
              <a href={resume.dataUrl} download={resume.name}
                style={{ background: "#378ADD", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", cursor: "pointer", fontWeight: 500, fontSize: 13, textDecoration: "none" }}>
                Download to view
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function AppModal({ row, onClose, onSave }) {
  const blank = { company: "", role: "", appliedDate: "", oaDate: "", interviewDate: "", status: "Applied", notes: "", resume: null };
  const [form, setForm] = useState(row ? { ...row } : blank);
  const fileRef = useRef();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set("resume", { name: file.name, size: file.size, mimeType: file.type, dataUrl: ev.target.result, uploadedAt: new Date().toISOString() });
    reader.readAsDataURL(file);
  };

  const fmtSize = bytes => bytes < 1024 ? bytes + " B" : bytes < 1048576 ? (bytes / 1024).toFixed(1) + " KB" : (bytes / 1048576).toFixed(1) + " MB";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 14, border: "0.5px solid var(--color-border-secondary)", padding: "1.5rem", width: 520, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>{row ? "Edit application" : "Add application"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--color-text-secondary)" }}><i className="ti ti-x" aria-label="Close" /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[["Company", "company"], ["Role", "role"]].map(([l, k]) => (
            <div key={k}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{l}</div>
              <input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={l} style={{ width: "100%", boxSizing: "border-box" }} />
            </div>
          ))}
          {[["Applied date", "appliedDate"], ["OA date", "oaDate"], ["Interview date", "interviewDate"]].map(([l, k]) => (
            <div key={k}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{l}</div>
              <input type="date" value={form[k]} onChange={e => set(k, e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Status</div>
            <select value={form.status} onChange={e => set("status", e.target.value)} style={{ width: "100%" }}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Resume upload */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>Resume</div>
            {form.resume ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#E6F1FB", border: "0.5px solid #85B7EB", borderRadius: 8, padding: "10px 14px" }}>
                <i className="ti ti-file-description" style={{ fontSize: 20, color: "#185FA5", flexShrink: 0 }} aria-hidden="true" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.resume.name}</div>
                  <div style={{ fontSize: 11, color: "#185FA5" }}>{fmtSize(form.resume.size)}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <a href={form.resume.dataUrl} download={form.resume.name}
                    style={{ fontSize: 12, color: "#185FA5", textDecoration: "none", display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 6, border: "0.5px solid #85B7EB", background: "#fff" }}>
                    <i className="ti ti-download" style={{ fontSize: 13 }} aria-hidden="true" /> Download
                  </a>
                  <button onClick={() => set("resume", null)}
                    style={{ fontSize: 12, color: "#A32D2D", background: "#fcebeb", border: "0.5px solid #F09595", borderRadius: 6, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                    <i className="ti ti-trash" style={{ fontSize: 13 }} aria-hidden="true" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current.click()}
                style={{ border: "1.5px dashed var(--color-border-secondary)", borderRadius: 8, padding: "18px", textAlign: "center", cursor: "pointer", background: "var(--color-background-secondary)", transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#378ADD"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-secondary)"}
              >
                <i className="ti ti-cloud-upload" style={{ fontSize: 24, color: "var(--color-text-tertiary)", display: "block", marginBottom: 6 }} aria-hidden="true" />
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Click to upload resume</div>
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 3 }}>PDF, DOC, DOCX, PNG, JPG</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={handleFile} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Notes</div>
            <input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any notes…" style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => onSave(form)} style={{ background: "#378ADD", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 500 }}>
            {row ? "Save changes" : "Add application"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Applications Table ────────────────────────────────────────────────────────
function ApplicationsTable({ apps, selected, statusFilter, setStatusFilter, toggleSelect, changeStatus, deleteApp, onEdit, onAdd, onDeleteSelected, onPreviewResume }) {
  const allIds = apps.map(a => a.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.includes(id));

  return (
    <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        <span style={{ fontWeight: 500, fontSize: 15, flex: 1 }}>Applications Sheet</span>
        {selected.length > 0 && (
          <button onClick={onDeleteSelected} style={{ color: "var(--color-text-danger)", borderColor: "var(--color-border-danger)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
            <i className="ti ti-trash" aria-hidden="true" /> Delete ({selected.length})
          </button>
        )}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: 13 }}>
          <option value="All">All statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={onAdd} style={{ background: "#378ADD", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontWeight: 500, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
          <i className="ti ti-plus" aria-hidden="true" /> Add application
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              <th style={{ width: 36, padding: "8px 8px 8px 16px", textAlign: "center" }}>
                <input type="checkbox" checked={allSelected} onChange={() => {
                  if (allSelected) allIds.forEach(id => selected.includes(id) && toggleSelect(id));
                  else allIds.forEach(id => !selected.includes(id) && toggleSelect(id));
                }} />
              </th>
              <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 500, color: "var(--color-text-secondary)", width: 36 }}>#</th>
              {["Company", "Role", "Applied Date", "OA Date", "Interview Date", "Status", "Resume", "Notes"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
              <th style={{ width: 56 }} />
            </tr>
          </thead>
          <tbody>
            {apps.map((app, i) => (
              <tr key={app.id}
                style={{ borderTop: "0.5px solid var(--color-border-tertiary)", background: selected.includes(app.id) ? "var(--color-background-info)" : "transparent" }}
                onMouseEnter={e => { if (!selected.includes(app.id)) e.currentTarget.style.background = "var(--color-background-secondary)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = selected.includes(app.id) ? "var(--color-background-info)" : "transparent"; }}>
                <td style={{ padding: "10px 8px 10px 16px", textAlign: "center" }}>
                  <input type="checkbox" checked={selected.includes(app.id)} onChange={() => toggleSelect(app.id)} />
                </td>
                <td style={{ padding: "10px 6px", color: "var(--color-text-tertiary)" }}>{i + 1}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: (COMPANY_COLORS[app.company] || "#534AB7") + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: COMPANY_COLORS[app.company] || "#534AB7", flexShrink: 0 }}>
                      {getInitials(app.company)}
                    </div>
                    <span style={{ fontWeight: 500 }}>{app.company}</span>
                  </div>
                </td>
                <td style={{ padding: "10px 12px", color: "var(--color-text-secondary)" }}>{app.role}</td>
                <td style={{ padding: "10px 12px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{fmt(app.appliedDate)}</td>
                <td style={{ padding: "10px 12px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{fmt(app.oaDate)}</td>
                <td style={{ padding: "10px 12px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{fmt(app.interviewDate)}</td>
                <td style={{ padding: "10px 12px" }}>
                  <StatusBadge status={app.status} onChange={s => changeStatus(app.id, s)} />
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {app.resume ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <a href={app.resume.dataUrl} download={app.resume.name} title={"Download " + app.resume.name}
                        style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#185FA5", background: "#E6F1FB", padding: "3px 8px", borderRadius: 5, whiteSpace: "nowrap", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", textDecoration: "none", border: "0.5px solid #85B7EB" }}>
                        <i className="ti ti-file-description" style={{ fontSize: 13, flexShrink: 0 }} aria-hidden="true" />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{app.resume.name}</span>
                      </a>
                      <button onClick={() => onPreviewResume(app.resume)} title="Preview resume"
                        style={{ background: "none", border: "0.5px solid var(--color-border-secondary)", borderRadius: 5, padding: "3px 6px", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <i className="ti ti-eye" style={{ fontSize: 13 }} aria-label="Preview resume" />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "10px 12px", color: "var(--color-text-secondary)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.notes || "–"}</td>
                <td style={{ padding: "10px 10px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => onEdit(app)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", padding: 3, borderRadius: 4 }}>
                      <i className="ti ti-edit" style={{ fontSize: 15 }} aria-label="Edit" />
                    </button>
                    <button onClick={() => deleteApp(app.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", padding: 3, borderRadius: 4 }}>
                      <i className="ti ti-trash" style={{ fontSize: 15 }} aria-label="Delete" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!apps.length && (
              <tr><td colSpan={11} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary)" }}>No applications found. Click "Add application" to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "10px 18px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
        <button onClick={onAdd} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
          <i className="ti ti-plus" aria-hidden="true" /> Add application
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function PlaceTracker() {
  const [apps,    setApps]    = useState(() => ls(STORAGE_KEY, DEFAULT_DATA));
  const [trash,   setTrash]   = useState(() => ls("placetracker_trash", []));
  const [target,  setTarget]  = useState(() => ls(TARGET_KEY, 50));
  const [page,    setPage]    = useState("dashboard");
  const [search,  setSearch]  = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState([]);
  const [modalMode, setModalMode] = useState(null);
  const [editRow,   setEditRow]   = useState(null);
  const [previewResume, setPreviewResume] = useState(null);

  useEffect(() => lsSet(STORAGE_KEY, apps), [apps]);
  useEffect(() => lsSet("placetracker_trash", trash), [trash]);
  useEffect(() => lsSet(TARGET_KEY, target), [target]);

  const stats = useMemo(() => ({
    total: apps.length,
    oa: apps.filter(a => ["OA","Interview","Offer"].includes(a.status)).length,
    interviews: apps.filter(a => ["Interview","Offer"].includes(a.status)).length,
    offers: apps.filter(a => a.status === "Offer").length,
    byStatus: STATUSES.map(s => ({ label: s, value: apps.filter(a => a.status === s).length })),
  }), [apps]);

  const thisMonth = useMemo(() => {
    const now = new Date();
    return apps.filter(a => {
      if (!a.appliedDate) return false;
      const d = new Date(a.appliedDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [apps]);

  const filtered = useMemo(() => apps.filter(a => {
    const q = search.toLowerCase();
    return (!q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)) &&
      (statusFilter === "All" || a.status === statusFilter);
  }), [apps, search, statusFilter]);

  // Calendar: all OA + Interview events from today onwards
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = [];
    apps.forEach(a => {
      if (a.oaDate) {
        const d = new Date(a.oaDate); d.setHours(0,0,0,0);
        if (d >= today) events.push({ app: a, date: a.oaDate, type: "OA" });
      }
      if (a.interviewDate) {
        const d = new Date(a.interviewDate); d.setHours(0,0,0,0);
        if (d >= today) events.push({ app: a, date: a.interviewDate, type: "Interview" });
      }
    });
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [apps]);

  const progress = Math.min(100, Math.round((apps.length / target) * 100));

  const addApp    = f => { setApps(p => [{ ...f, id: Date.now() }, ...p]); setModalMode(null); };
  const saveEdit  = f => { setApps(p => p.map(a => a.id === editRow.id ? { ...f, id: a.id } : a)); setModalMode(null); setEditRow(null); };
  const deleteApp = id => {
    const app = apps.find(a => a.id === id);
    if (app) setTrash(p => [{ ...app, deletedAt: new Date().toISOString() }, ...p]);
    setApps(p => p.filter(a => a.id !== id));
  };
  const changeStatus = (id, s) => setApps(p => p.map(a => a.id === id ? { ...a, status: s } : a));
  const toggleSelect = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const deleteSelected = () => {
    const toTrash = apps.filter(a => selected.includes(a.id)).map(a => ({ ...a, deletedAt: new Date().toISOString() }));
    setTrash(p => [...toTrash, ...p]);
    setApps(p => p.filter(a => !selected.includes(a.id)));
    setSelected([]);
  };
  const restoreApp   = id => { const a = trash.find(t => t.id === id); if (a) { const { deletedAt, ...app } = a; setApps(p => [app, ...p]); } setTrash(p => p.filter(t => t.id !== id)); };
  const permanentDel = id => setTrash(p => p.filter(t => t.id !== id));
  const clearTrash   = () => setTrash([]);

  const NAV = [
    { id: "dashboard",    icon: "ti-layout-dashboard", label: "Dashboard" },
    { id: "applications", icon: "ti-file-description", label: "Applications" },
    { id: "analytics",    icon: "ti-chart-bar",        label: "Analytics" },
    { id: "calendar",     icon: "ti-calendar",         label: "Calendar", badge: upcomingEvents.length },
    { id: "trash",        icon: "ti-trash",            label: "Trash / History", badge: trash.length },
    { id: "settings",     icon: "ti-settings",         label: "Settings" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "var(--font-sans)", background: "var(--color-background-tertiary)", overflow: "hidden" }}>
      {modalMode && (
        <AppModal row={modalMode === "edit" ? editRow : null}
          onClose={() => { setModalMode(null); setEditRow(null); }}
          onSave={modalMode === "edit" ? saveEdit : addApp} />
      )}
      {previewResume && <ResumePreviewModal resume={previewResume} onClose={() => setPreviewResume(null)} />}

      {/* Sidebar */}
      <aside style={{ width: 220, background: "var(--color-background-primary)", borderRight: "0.5px solid var(--color-border-tertiary)", display: "flex", flexDirection: "column", padding: "0 0 1rem", flexShrink: 0 }}>
        <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-briefcase" style={{ fontSize: 18, color: "#185FA5" }} aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 15, lineHeight: 1.2 }}>PlaceTracker</div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Placement Tracking</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: "0.75rem", flex: 1 }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: page === item.id ? "#E6F1FB" : "transparent",
              color: page === item.id ? "#185FA5" : "var(--color-text-secondary)",
              fontWeight: page === item.id ? 500 : 400, fontSize: 14, marginBottom: 2, transition: "background 0.12s"
            }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 18 }} aria-hidden="true" />
              {item.label}
              {item.badge > 0 && (
                <span style={{ marginLeft: "auto", fontSize: 11, background: "#E24B4A", color: "#fff", borderRadius: 10, padding: "1px 7px", fontWeight: 600, minWidth: 18, textAlign: "center" }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ margin: "0 0.75rem", background: "var(--color-background-secondary)", borderRadius: 10, padding: "14px", border: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <i className="ti ti-sparkles" style={{ fontSize: 16, color: "#185FA5" }} aria-hidden="true" />
            <span style={{ fontWeight: 500, fontSize: 13 }}>Stay consistent!</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 10px", lineHeight: 1.4 }}>Your future self is counting on you.</p>
          <div style={{ background: "var(--color-border-tertiary)", borderRadius: 4, height: 4, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#378ADD", borderRadius: 4, transition: "width 0.4s" }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 6 }}>Keep going 🚀</div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 1.5rem", height: 60, display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <div style={{ flex: 1, position: "relative", maxWidth: 360 }}>
            <i className="ti ti-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", fontSize: 16 }} aria-hidden="true" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies, roles…"
              style={{ width: "100%", paddingLeft: 36, boxSizing: "border-box", fontSize: 13 }} />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative" }}>
              <i className="ti ti-bell" style={{ fontSize: 20, color: "var(--color-text-secondary)", cursor: "pointer" }} aria-hidden="true" />
              {upcomingEvents.length > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: "#E24B4A", color: "#fff", borderRadius: "50%", fontSize: 10, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{upcomingEvents.length}</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 13, color: "#185FA5" }}>T</div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Tushar</span>
              <i className="ti ti-chevron-down" style={{ fontSize: 14, color: "var(--color-text-secondary)" }} aria-hidden="true" />
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>

          {/* ── DASHBOARD ── */}
          {page === "dashboard" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                {[
                  { label: "Total Applications", value: stats.total, sub: `+${thisMonth} this month`, icon: "ti-file-description", color: "#185FA5", bg: "#E6F1FB" },
                  { label: "OA Cleared",          value: stats.oa,          sub: `${stats.total ? Math.round(stats.oa/stats.total*100) : 0}% of total`,         icon: "ti-list-check", color: "#854F0B", bg: "#faeeda" },
                  { label: "Interviews",           value: stats.interviews,  sub: `${stats.total ? Math.round(stats.interviews/stats.total*100) : 0}% of total`,  icon: "ti-users",      color: "#185FA5", bg: "#E6F1FB" },
                  { label: "Offers Received",      value: stats.offers,      sub: `${stats.total ? Math.round(stats.offers/stats.total*100) : 0}% of total`,      icon: "ti-trophy",     color: "#3B6D11", bg: "#eaf3de" },
                ].map(c => (
                  <div key={c.label} style={{ background: "var(--color-background-primary)", borderRadius: 12, border: "0.5px solid var(--color-border-tertiary)", padding: "1.1rem 1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 13, color: c.color, fontWeight: 500, marginBottom: 4 }}>{c.label}</div>
                        <div style={{ fontSize: 30, fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.1 }}>{c.value}</div>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>{c.sub}</div>
                      </div>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className={`ti ${c.icon}`} style={{ fontSize: 20, color: c.color }} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <ApplicationsTable apps={filtered} selected={selected} statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                toggleSelect={toggleSelect} changeStatus={changeStatus} deleteApp={deleteApp}
                onEdit={r => { setEditRow(r); setModalMode("edit"); }}
                onAdd={() => { setEditRow(null); setModalMode("add"); }}
                onDeleteSelected={deleteSelected}
                onPreviewResume={setPreviewResume} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: "0.5px solid var(--color-border-tertiary)", padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontWeight: 500, fontSize: 15 }}>Placement Progress</span>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{apps.length} / {target}</span>
                  </div>
                  <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, height: 10, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: "#378ADD", borderRadius: 8, transition: "width 0.4s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "#378ADD", fontWeight: 500 }}>{progress}% Completed</span>
                    <span>Target: {target} Applications</span>
                  </div>
                </div>
                <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: "0.5px solid var(--color-border-tertiary)", padding: "1.25rem" }}>
                  <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 12 }}>Application Status Overview</div>
                  <DonutChart data={stats.byStatus} />
                </div>
              </div>
            </div>
          )}

          {/* ── APPLICATIONS ── */}
          {page === "applications" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>All Applications</h1>
                <button onClick={() => { setEditRow(null); setModalMode("add"); }}
                  style={{ background: "#378ADD", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-plus" aria-hidden="true" /> Add application
                </button>
              </div>
              <ApplicationsTable apps={filtered} selected={selected} statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                toggleSelect={toggleSelect} changeStatus={changeStatus} deleteApp={deleteApp}
                onEdit={r => { setEditRow(r); setModalMode("edit"); }}
                onAdd={() => { setEditRow(null); setModalMode("add"); }}
                onDeleteSelected={deleteSelected}
                onPreviewResume={setPreviewResume} />
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {page === "analytics" && (
            <div>
              <h1 style={{ margin: "0 0 1.25rem", fontSize: 20, fontWeight: 500 }}>Analytics</h1>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
                {[
                  { label: "Success rate",   value: `${stats.total ? Math.round(stats.offers/stats.total*100) : 0}%`,      desc: "Offers / total" },
                  { label: "Interview rate", value: `${stats.total ? Math.round(stats.interviews/stats.total*100) : 0}%`,  desc: "Interviews / total" },
                  { label: "OA rate",        value: `${stats.total ? Math.round(stats.oa/stats.total*100) : 0}%`,          desc: "OA cleared / total" },
                ].map(m => (
                  <div key={m.label} style={{ background: "var(--color-background-primary)", borderRadius: 12, border: "0.5px solid var(--color-border-tertiary)", padding: "1.1rem 1.25rem" }}>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{m.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 600, margin: "4px 0 2px" }}>{m.value}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{m.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: "0.5px solid var(--color-border-tertiary)", padding: "1.25rem" }}>
                <div style={{ fontWeight: 500, marginBottom: 16 }}>Status breakdown</div>
                {stats.byStatus.map(s => {
                  const pct = stats.total ? Math.round(s.value / stats.total * 100) : 0;
                  const cfg = STATUS_CONFIG[s.label];
                  return (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <span style={{ width: 80, fontSize: 13, color: "var(--color-text-secondary)" }}>{s.label}</span>
                      <div style={{ flex: 1, background: "var(--color-background-secondary)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: cfg.color, borderRadius: 4, transition: "width 0.4s" }} />
                      </div>
                      <span style={{ width: 36, fontSize: 13, color: "var(--color-text-secondary)", textAlign: "right" }}>{s.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── CALENDAR ── */}
          {page === "calendar" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Upcoming deadlines</h1>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, padding: "5px 12px" }}>
                  From today onwards · OA &amp; Interviews
                </div>
              </div>

              {upcomingEvents.length === 0 ? (
                <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: "0.5px solid var(--color-border-tertiary)", padding: "3rem", textAlign: "center" }}>
                  <i className="ti ti-calendar-off" style={{ fontSize: 40, color: "var(--color-text-tertiary)", display: "block", marginBottom: 12 }} aria-hidden="true" />
                  <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>No upcoming events</div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>No OA or Interview dates are scheduled from today onwards.</div>
                </div>
              ) : (
                <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden" }}>
                  {upcomingEvents.map((ev, idx) => {
                    const d = new Date(ev.date);
                    const today = new Date(); today.setHours(0,0,0,0);
                    const diffMs = d - today;
                    const diffDays = Math.round(diffMs / 86400000);
                    const isToday = diffDays === 0;
                    const isTomorrow = diffDays === 1;
                    const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : `In ${diffDays} days`;
                    const isOA = ev.type === "OA";
                    const evCfg = isOA
                      ? { bg: "#faeeda", color: "#854F0B", border: "#EF9F27", icon: "ti-list-check" }
                      : { bg: "#e6f1fb", color: "#185FA5", border: "#85B7EB", icon: "ti-users" };
                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: idx < upcomingEvents.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
                        {/* Date block */}
                        <div style={{ width: 52, height: 52, borderRadius: 12, background: evCfg.bg, border: `1px solid ${evCfg.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 10, color: evCfg.color, fontWeight: 600, letterSpacing: "0.05em" }}>{d.toLocaleString("en", { month: "short" }).toUpperCase()}</span>
                          <span style={{ fontSize: 20, fontWeight: 700, color: evCfg.color, lineHeight: 1.1 }}>{d.getDate()}</span>
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontWeight: 500, fontSize: 14 }}>{ev.app.company}</span>
                            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>·</span>
                            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{ev.app.role}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, background: evCfg.bg, color: evCfg.color, border: `1px solid ${evCfg.border}`, borderRadius: 5, padding: "2px 8px", fontWeight: 500 }}>
                              <i className={`ti ${evCfg.icon}`} style={{ fontSize: 12 }} aria-hidden="true" /> {ev.type}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
                          </div>
                        </div>

                        {/* Urgency pill */}
                        <div style={{ flexShrink: 0 }}>
                          <span style={{
                            fontSize: 12, fontWeight: 500, borderRadius: 20, padding: "4px 12px",
                            background: isToday ? "#fcebeb" : isTomorrow ? "#faeeda" : "#eaf3de",
                            color: isToday ? "#A32D2D" : isTomorrow ? "#854F0B" : "#3B6D11",
                            border: `1px solid ${isToday ? "#F09595" : isTomorrow ? "#EF9F27" : "#97C459"}`
                          }}>{dayLabel}</span>
                        </div>

                        <StatusBadge status={ev.app.status} onChange={s => changeStatus(ev.app.id, s)} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tip note */}
              <div style={{ marginTop: 14, display: "flex", alignItems: "flex-start", gap: 8, background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "12px 16px" }}>
                <i className="ti ti-info-circle" style={{ fontSize: 16, color: "var(--color-text-secondary)", marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                  Only OA and Interview dates from today onwards are shown here. Set dates in "Add application" to see them appear.
                </span>
              </div>
            </div>
          )}


          {/* ── TRASH / HISTORY ── */}
          {page === "trash" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Trash / History</h1>

                {trash.length > 0 && (
                  <button
                    onClick={clearTrash}
                    style={{
                      background: "#fcebeb",
                      color: "#A32D2D",
                      border: "1px solid #F09595",
                      borderRadius: 8,
                      padding: "8px 14px",
                      cursor: "pointer",
                      fontWeight: 500
                    }}
                  >
                    Clear Trash
                  </button>
                )}
              </div>

              {trash.length === 0 ? (
                <div style={{
                  background: "var(--color-background-primary)",
                  borderRadius: 12,
                  border: "0.5px solid var(--color-border-tertiary)",
                  padding: "3rem",
                  textAlign: "center"
                }}>
                  <i className="ti ti-trash-off" style={{ fontSize: 42, color: "var(--color-text-tertiary)", marginBottom: 10 }} />
                  <div style={{ fontWeight: 500, marginBottom: 5 }}>Trash is empty</div>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
                    Deleted applications will appear here.
                  </div>
                </div>
              ) : (
                <div style={{
                  background: "var(--color-background-primary)",
                  borderRadius: 12,
                  border: "0.5px solid var(--color-border-tertiary)",
                  overflow: "hidden"
                }}>
                  {trash.map((app, idx) => (
                    <div
                      key={app.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        borderBottom: idx < trash.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>
                          {app.company} · {app.role}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                          Deleted on {new Date(app.deletedAt).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => restoreApp(app.id)}
                          style={{
                            background: "#E6F1FB",
                            color: "#185FA5",
                            border: "1px solid #85B7EB",
                            borderRadius: 8,
                            padding: "7px 14px",
                            cursor: "pointer",
                            fontWeight: 500
                          }}
                        >
                          Restore
                        </button>

                        <button
                          onClick={() => permanentDel(app.id)}
                          style={{
                            background: "#fcebeb",
                            color: "#A32D2D",
                            border: "1px solid #F09595",
                            borderRadius: 8,
                            padding: "7px 14px",
                            cursor: "pointer",
                            fontWeight: 500
                          }}
                        >
                          Delete Permanently
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* ── SETTINGS ── */}
          {page === "settings" && (
            <div>
              <h1 style={{ margin: "0 0 1.25rem", fontSize: 20, fontWeight: 500 }}>Settings</h1>
              <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: "0.5px solid var(--color-border-tertiary)", padding: "1.5rem", maxWidth: 480 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 500, marginBottom: 6 }}>Application target</div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 10 }}>Set your goal for total applications.</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input type="number" value={target} min={1} max={500}
                      onChange={e => setTarget(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: 90 }} />
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>applications</span>
                  </div>
                </div>
                <hr style={{ border: "none", borderTop: "0.5px solid var(--color-border-tertiary)", margin: "20px 0" }} />
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 6 }}>Data management</div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 10 }}>All data is saved automatically in your browser's localStorage.</div>
                  <button onClick={() => {
                    const exportData = apps.map(a => ({ ...a, resume: a.resume ? { name: a.resume.name, size: a.resume.size, mimeType: a.resume.mimeType, uploadedAt: a.resume.uploadedAt } : null }));
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "placetracker_backup.json"; a.click();
                  }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="ti ti-download" aria-hidden="true" /> Export JSON
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
