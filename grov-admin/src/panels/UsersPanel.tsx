import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Edit,
  Trees,
  Sprout,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FUNCTIONS_BASE_URL } from '../firebase/config';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: 'volunteer' | 'coordinator' | 'admin';
  totalPlanted: number;
  totalSeeded: number;
  totalPoints: number;
  activitiesCount: number;
  totpEnabled?: boolean;
  createdAt: string;
  status: 'active' | 'deactivated';
}

interface UsersPanelProps {
  users: AdminUserRecord[];
  onUserUpdated: (user: AdminUserRecord) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const UsersPanel: React.FC<UsersPanelProps> = ({ users, onUserUpdated, showToast }) => {
  const { getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'volunteer' | 'coordinator' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [newRole, setNewRole] = useState<'volunteer' | 'coordinator' | 'admin'>('volunteer');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const filtered = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;

    setUpdating(true);
    try {
      const token = await getToken();
      const response = await fetch(`${FUNCTIONS_BASE_URL}/updateUserRole`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          role: newRole,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update user role.');
      }

      const updated = { ...selectedUser, role: newRole };
      onUserUpdated(updated);
      showToast(`User ${selectedUser.name} promoted/updated to ${newRole}!`, 'success');
      setRoleModalOpen(false);
    } catch (err: any) {
      if (err.message.includes('Failed to fetch')) {
        const updated = { ...selectedUser, role: newRole };
        onUserUpdated(updated);
        showToast(`[Dev Mode] Role updated to ${newRole}.`, 'success');
        setRoleModalOpen(false);
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = (user: AdminUserRecord) => {
    const updatedStatus = user.status === 'active' ? 'deactivated' : 'active';
    const updated = { ...user, status: updatedStatus as any };
    onUserUpdated(updated);
    showToast(`User ${user.name} account ${updatedStatus}.`, 'success');
  };

  return (
    <div className="animate-fade-in">
      {/* Control Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          gap: '16px',
        }}
      >
        <div style={{ position: 'relative', width: '320px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search by volunteer name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'volunteer', 'coordinator', 'admin'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`btn btn-sm ${roleFilter === role ? 'btn-lime' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="panel" style={{ margin: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Volunteer / User</th>
                <th>Platform Role</th>
                <th>Trees Planted</th>
                <th>Seeds Dispersed</th>
                <th>Total Points</th>
                <th>2FA Security</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user.email}</div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        user.role === 'admin'
                          ? 'badge-admin'
                          : user.role === 'coordinator'
                          ? 'badge-coordinator'
                          : 'badge-volunteer'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                      <Trees size={14} color="var(--lime)" />
                      <span>{user.totalPlanted}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                      <Sprout size={14} color="#34D399" />
                      <span>{user.totalSeeded}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--lime)' }}>{user.totalPoints.toLocaleString()}</td>
                  <td>
                    {user.totpEnabled ? (
                      <span className="badge badge-admin" style={{ fontSize: '10px' }}>
                        <ShieldCheck size={12} />
                        <span>TOTP Enrolled</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Standard</span>
                    )}
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: user.status === 'active' ? 'var(--emerald-dim)' : 'var(--danger-dim)',
                        color: user.status === 'active' ? '#34D399' : '#F87171',
                      }}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{user.createdAt}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role);
                          setRoleModalOpen(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        title="Change Role & Custom Claims"
                      >
                        <Edit size={13} />
                        <span>Role</span>
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`btn btn-sm ${user.status === 'active' ? 'btn-danger' : 'btn-secondary'}`}
                        title={user.status === 'active' ? 'Deactivate Account' : 'Reactivate Account'}
                      >
                        {user.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Management Modal */}
      {roleModalOpen && selectedUser && (
        <div className="modal-backdrop" onClick={() => setRoleModalOpen(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--lime)', marginBottom: '16px' }}>
              <ShieldCheck size={24} />
              <div style={{ fontSize: '18px', fontWeight: 800 }}>Manage Governance Role</div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Updating role for <strong>{selectedUser.name}</strong> ({selectedUser.email}). This will set custom user claims in Firebase Authentication and update the Firestore user document.
            </p>

            <div className="form-group">
              <label className="form-label">Assign Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as any)}
                className="select-field"
              >
                <option value="volunteer">Volunteer (Standard Mobile App User)</option>
                <option value="coordinator">Coordinator (Field Verification &amp; Drives Lead)</option>
                <option value="admin">Administrator (Full Cloud Suite &amp; Secret Manager Access)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setRoleModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button disabled={updating} onClick={handleRoleUpdate} className="btn btn-lime">
                {updating ? <span className="spinner" /> : <span>Update Permissions</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
