import React, { useState } from 'react';
import {
  Check,
  X,
  MapPin,
  Camera,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FUNCTIONS_BASE_URL } from '../firebase/config';

export interface ActivitySubmission {
  id: string;
  userId: string;
  userName: string;
  activityType: 'plantation' | 'seeding';
  quantity: number;
  speciesName: string;
  siteName: string;
  latitude: number;
  longitude: number;
  geohash?: string;
  date: string;
  fieldNotes?: string;
  photoUrls: string[];
  status: 'reported' | 'verified' | 'rejected';
  pointsAwarded?: number;
}

interface VerificationPanelProps {
  submissions: ActivitySubmission[];
  onActivityUpdated: (updatedActivity: ActivitySubmission) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  submissions,
  onActivityUpdated,
  showToast,
}) => {
  const { adminProfile, getToken } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState<ActivitySubmission | null>(null);
  const [filter, setFilter] = useState<'all' | 'reported' | 'verified' | 'rejected'>('reported');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Insufficient visual photo evidence or unverified location.');
  const [processing, setProcessing] = useState(false);

  const filtered = submissions.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const calculatePoints = (act: ActivitySubmission) => {
    const photoBonus = Math.min(act.photoUrls.length, 5) * 50;
    if (act.activityType === 'plantation') {
      return act.quantity * 10 + photoBonus;
    } else {
      return act.quantity * 1 + photoBonus;
    }
  };

  const handleVerify = async (activity: ActivitySubmission) => {
    if (activity.userId === adminProfile?.uid && !adminProfile?.isAdmin) {
      showToast('Coordinators cannot self-verify their own activities.', 'error');
      return;
    }

    setProcessing(true);
    try {
      const token = await getToken();
      const response = await fetch(`${FUNCTIONS_BASE_URL}/verifyActivity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          activityId: activity.id,
          status: 'verified',
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to verify activity.');
      }

      const calculatedPts = calculatePoints(activity);
      onActivityUpdated({ ...activity, status: 'verified', pointsAwarded: calculatedPts });
      showToast(`Activity verified successfully. +${calculatedPts} points awarded!`, 'success');
      if (selectedActivity?.id === activity.id) {
        setSelectedActivity(null);
      }
    } catch (err: any) {
      // Dev / fallback simulator if function is not active in local mode
      if (err.message.includes('Failed to fetch')) {
        const calculatedPts = calculatePoints(activity);
        onActivityUpdated({ ...activity, status: 'verified', pointsAwarded: calculatedPts });
        showToast(`[Dev Mode] Activity verified. +${calculatedPts} points credited.`, 'success');
        if (selectedActivity?.id === activity.id) setSelectedActivity(null);
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedActivity) return;

    setProcessing(true);
    try {
      const token = await getToken();
      const response = await fetch(`${FUNCTIONS_BASE_URL}/verifyActivity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          activityId: selectedActivity.id,
          status: 'rejected',
          rejectionReason,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to reject activity.');
      }

      onActivityUpdated({ ...selectedActivity, status: 'rejected' });
      showToast('Activity rejected.', 'success');
      setRejectModalOpen(false);
      setSelectedActivity(null);
    } catch (err: any) {
      if (err.message.includes('Failed to fetch')) {
        onActivityUpdated({ ...selectedActivity, status: 'rejected' });
        showToast('[Dev Mode] Activity rejected.', 'success');
        setRejectModalOpen(false);
        setSelectedActivity(null);
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Filters Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['reported', 'verified', 'rejected', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`btn btn-sm ${filter === tab ? 'btn-lime' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {tab === 'reported' ? 'Pending Review' : tab}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Showing <strong>{filtered.length}</strong> activity submissions
        </div>
      </div>

      {/* Main Grid: Queue Table & Detail Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedActivity ? '1fr 400px' : '1fr', gap: '24px' }}>
        <div className="panel" style={{ margin: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Species / Tree</th>
                  <th>Location</th>
                  <th>Proof Photos</th>
                  <th>Calculated Pts</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(act => {
                  const pts = calculatePoints(act);
                  const isOwnActivity = act.userId === adminProfile?.uid && !adminProfile?.isAdmin;

                  return (
                    <tr
                      key={act.id}
                      style={{ cursor: 'pointer', backgroundColor: selectedActivity?.id === act.id ? 'rgba(200, 255, 85, 0.06)' : undefined }}
                      onClick={() => setSelectedActivity(act)}
                    >
                      <td style={{ fontWeight: 700 }}>{act.userName}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: act.activityType === 'plantation' ? 'var(--lime-dim)' : 'var(--emerald-dim)',
                            color: act.activityType === 'plantation' ? 'var(--lime)' : '#34D399',
                          }}
                        >
                          {act.activityType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{act.quantity}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{act.speciesName}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="var(--lime)" />
                          <span>{act.siteName}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                          <Camera size={14} />
                          <span>{act.photoUrls.length} photos</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--lime)' }}>+{pts}</td>
                      <td>
                        <span
                          className={`badge ${
                            act.status === 'verified'
                              ? 'badge-verified'
                              : act.status === 'rejected'
                              ? 'badge-rejected'
                              : 'badge-pending'
                          }`}
                        >
                          {act.status}
                        </span>
                      </td>
                      <td>
                        {act.status === 'reported' && (
                          <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                            <button
                              disabled={processing || isOwnActivity}
                              onClick={() => handleVerify(act)}
                              className="btn btn-lime btn-sm"
                              title={isOwnActivity ? 'Cannot self-verify own activity' : 'Approve & Award Points'}
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              disabled={processing}
                              onClick={() => {
                                setSelectedActivity(act);
                                setRejectModalOpen(true);
                              }}
                              className="btn btn-danger btn-sm"
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Inspection Drawer */}
        {selectedActivity && (
          <div className="panel" style={{ margin: 0, position: 'sticky', top: '90px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Field Proof Inspection
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Photos Carousel / Grid */}
            <div style={{ marginBottom: '20px' }}>
              <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={14} />
                <span>Submitted Evidence Photos ({selectedActivity.photoUrls.length})</span>
              </div>
              {selectedActivity.photoUrls.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {selectedActivity.photoUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Evidence ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '110px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                  }}
                >
                  No photographic proof attached
                </div>
              )}
            </div>

            {/* Metadata Card */}
            <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Volunteer:</span>
                <span style={{ fontWeight: 700 }}>{selectedActivity.userName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Activity:</span>
                <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{selectedActivity.activityType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Quantity:</span>
                <span style={{ fontWeight: 700 }}>{selectedActivity.quantity} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Species:</span>
                <span style={{ fontWeight: 700 }}>{selectedActivity.speciesName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Location:</span>
                <span style={{ fontWeight: 700 }}>{selectedActivity.siteName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>GPS Coordinates:</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--lime)', fontSize: '12px' }}>
                  {selectedActivity.latitude.toFixed(4)}, {selectedActivity.longitude.toFixed(4)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Points Ledger:</span>
                <span style={{ fontWeight: 800, color: 'var(--lime)' }}>+{calculatePoints(selectedActivity)} pts</span>
              </div>
            </div>

            {/* Field Notes */}
            {selectedActivity.fieldNotes && (
              <div style={{ marginBottom: '20px' }}>
                <div className="form-label">Volunteer Field Notes</div>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{selectedActivity.fieldNotes}"
                </div>
              </div>
            )}

            {/* Actions */}
            {selectedActivity.status === 'reported' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedActivity.userId === adminProfile?.uid && !adminProfile?.isAdmin ? (
                  <div style={{ padding: '12px', backgroundColor: 'var(--warning-dim)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={16} />
                    <span>Coordinator self-verification is blocked by security rules.</span>
                  </div>
                ) : (
                  <button
                    disabled={processing}
                    onClick={() => handleVerify(selectedActivity)}
                    className="btn btn-lime"
                    style={{ width: '100%', height: '42px' }}
                  >
                    <Check size={16} />
                    <span>Approve &amp; Credit Points (+{calculatePoints(selectedActivity)})</span>
                  </button>
                )}

                <button
                  disabled={processing}
                  onClick={() => setRejectModalOpen(true)}
                  className="btn btn-danger"
                  style={{ width: '100%', height: '42px' }}
                >
                  <X size={16} />
                  <span>Reject Submission</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && selectedActivity && (
        <div className="modal-backdrop" onClick={() => setRejectModalOpen(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', marginBottom: '16px' }}>
              <AlertCircle size={22} />
              <div style={{ fontSize: '18px', fontWeight: 800 }}>Reject Activity Submission</div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Please provide the volunteer with the specific reason for rejection. This explanation will be logged and dispatched via push notification.
            </p>

            <div className="form-group">
              <label className="form-label">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="textarea-field"
                placeholder="Explain why this activity could not be verified..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setRejectModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button disabled={processing} onClick={handleReject} className="btn btn-danger">
                {processing ? <span className="spinner" /> : <span>Confirm Rejection</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
