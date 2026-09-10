import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface IncidentReport {
  id: string;
  reporterName: string;
  category: 'Illegal Tree Cutting' | 'Wildfire Hazard' | 'Pollution / Dumping' | 'App Bug' | 'Other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  locationDescription: string;
  description: string;
  status: 'pending' | 'under_review' | 'resolved';
  createdAt: string;
  resolutionNotes?: string;
  resolverName?: string;
}

interface ReportsPanelProps {
  reports: IncidentReport[];
  onReportUpdated: (updated: IncidentReport) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const ReportsPanel: React.FC<ReportsPanelProps> = ({ reports, onReportUpdated, showToast }) => {
  const { adminProfile } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('Report verified and dispatched to Islamabad Wildlife Management Board (IWMB) for field enforcement.');

  const filtered = reports.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const handleResolve = () => {
    if (!selectedReport) return;
    const updated: IncidentReport = {
      ...selectedReport,
      status: 'resolved',
      resolutionNotes,
      resolverName: adminProfile?.name || 'Administrator',
    };
    onReportUpdated(updated);
    showToast(`Report #${selectedReport.id.slice(-4)} marked as resolved.`, 'success');
    setResolveModalOpen(false);
    setSelectedReport(null);
  };

  const getSeverityBadge = (sev: IncidentReport['severity']) => {
    switch (sev) {
      case 'critical':
        return <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.25)', color: '#EF4444' }}>Critical</span>;
      case 'high':
        return <span className="badge" style={{ backgroundColor: 'var(--danger-dim)', color: '#F87171' }}>High</span>;
      case 'medium':
        return <span className="badge" style={{ backgroundColor: 'var(--warning-dim)', color: '#FBBF24' }}>Medium</span>;
      default:
        return <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>Low</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Control Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'pending', 'resolved'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`btn btn-sm ${filter === tab ? 'btn-lime' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Showing <strong>{filtered.length}</strong> incident reports
        </div>
      </div>

      {/* Reports Table */}
      <div className="panel" style={{ margin: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Severity</th>
                <th>Location / Site</th>
                <th>Description</th>
                <th>Reporter</th>
                <th>Logged</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(rep => (
                <tr key={rep.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rep.category}</td>
                  <td>{getSeverityBadge(rep.severity)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <MapPin size={12} color="var(--lime)" />
                      <span>{rep.locationDescription}</span>
                    </div>
                  </td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {rep.description}
                  </td>
                  <td style={{ fontWeight: 600 }}>{rep.reporterName}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{rep.createdAt}</td>
                  <td>
                    <span
                      className={`badge ${
                        rep.status === 'resolved' ? 'badge-verified' : 'badge-pending'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedReport(rep);
                        setResolveModalOpen(true);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      <Eye size={13} />
                      <span>{rep.status === 'resolved' ? 'Review' : 'Resolve'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Inspection & Resolve Modal */}
      {resolveModalOpen && selectedReport && (
        <div className="modal-backdrop" onClick={() => setResolveModalOpen(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={22} color="var(--warning)" />
                <div style={{ fontSize: '18px', fontWeight: 800 }}>Incident #{selectedReport.id.slice(-4)}</div>
              </div>
              {getSeverityBadge(selectedReport.severity)}
            </div>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '13px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Category: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedReport.category}</strong>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Location: </span>
                <strong style={{ color: 'var(--lime)' }}>{selectedReport.locationDescription}</strong>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Reporter: </span>
                <strong>{selectedReport.reporterName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Full Incident Description:</span>
                <p style={{ marginTop: '6px', color: 'var(--text-primary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                  "{selectedReport.description}"
                </p>
              </div>
            </div>

            {selectedReport.status === 'resolved' ? (
              <div style={{ backgroundColor: 'var(--emerald-dim)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.3)', color: '#34D399', fontSize: '13px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Resolution Documented by {selectedReport.resolverName}:</div>
                <div>{selectedReport.resolutionNotes}</div>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Action Taken &amp; Resolution Notes</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={e => setResolutionNotes(e.target.value)}
                    className="textarea-field"
                    placeholder="Document action taken or escalation details..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setResolveModalOpen(false)} className="btn btn-secondary">
                    Close
                  </button>
                  <button onClick={handleResolve} className="btn btn-lime">
                    <CheckCircle2 size={16} />
                    <span>Resolve Incident</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
