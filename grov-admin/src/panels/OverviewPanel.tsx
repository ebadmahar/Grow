import React from 'react';
import {
  Trees,
  Sprout,
  Users,
  ClipboardCheck,
  MapPin,
  Flame,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface OverviewProps {
  stats: {
    totalPlanted: number;
    totalSeeded: number;
    totalUsers: number;
    pendingVerifications: number;
    activeSites: number;
    co2Kg: number;
  };
  recentActivities: Array<{
    id: string;
    userName: string;
    activityType: 'plantation' | 'seeding';
    quantity: number;
    speciesName: string;
    siteName: string;
    status: string;
    date: string;
  }>;
  onNavigate: (tab: any) => void;
}

export const OverviewPanel: React.FC<OverviewProps> = ({ stats, recentActivities, onNavigate }) => {
  return (
    <div className="animate-fade-in">
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(200, 255, 85, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--lime)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <ShieldCheck size={16} />
            <span>Firebase Cloud Infrastructure Active</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginTop: '8px', letterSpacing: '-0.5px' }}>
            Islamabad Ecological Restoration Grid
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '600px' }}>
            Real-time environmental telemetry, volunteer verification pipeline, and geospatial site registry across Margalla Hills and Islamabad Capital Territory.
          </p>
        </div>

        <button
          onClick={() => onNavigate('verification')}
          className="btn btn-lime"
          style={{ padding: '12px 24px', fontSize: '14px', flexShrink: 0 }}
        >
          <span>Open Moderation Queue ({stats.pendingVerifications})</span>
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Trees Planted</span>
            <Trees size={20} color="var(--lime)" />
          </div>
          <div className="stat-value">{stats.totalPlanted.toLocaleString()}</div>
          <div className="stat-badge" style={{ backgroundColor: 'var(--lime-dim)', color: 'var(--lime)' }}>
            +12% this week
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Seeds Dispersed</span>
            <Sprout size={20} color="#34D399" />
          </div>
          <div className="stat-value">{stats.totalSeeded.toLocaleString()}</div>
          <div className="stat-badge" style={{ backgroundColor: 'var(--emerald-dim)', color: '#34D399' }}>
            Active Seeding Drives
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Registered Volunteers</span>
            <Users size={20} color="#38BDF8" />
          </div>
          <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
          <div className="stat-badge" style={{ backgroundColor: 'var(--info-dim)', color: '#38BDF8' }}>
            Islamabad Region
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Pending Verification</span>
            <ClipboardCheck size={20} color="var(--warning)" />
          </div>
          <div className="stat-value" style={{ color: stats.pendingVerifications > 0 ? 'var(--warning)' : 'inherit' }}>
            {stats.pendingVerifications}
          </div>
          <div className="stat-badge" style={{ backgroundColor: 'var(--warning-dim)', color: 'var(--warning)' }}>
            Requires Review
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Verified Sites</span>
            <MapPin size={20} color="#A78BFA" />
          </div>
          <div className="stat-value">{stats.activeSites}</div>
          <div className="stat-badge" style={{ backgroundColor: 'rgba(167, 139, 250, 0.15)', color: '#A78BFA' }}>
            Viewport Mapped
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">CO2 Sequestered</span>
            <Flame size={20} color="#F87171" />
          </div>
          <div className="stat-value">{stats.co2Kg.toLocaleString()} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>kg</span></div>
          <div className="stat-badge" style={{ backgroundColor: 'var(--danger-dim)', color: '#F87171' }}>
            Estimated Biomass
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <Trees size={18} color="var(--lime)" />
              <span>Recent Volunteer Field Logs</span>
            </div>
            <div className="panel-subtitle">Latest geotagged submissions across Islamabad sites</div>
          </div>
          <button onClick={() => onNavigate('verification')} className="btn btn-secondary btn-sm">
            View All Submissions
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Volunteer</th>
                <th>Activity Type</th>
                <th>Quantity</th>
                <th>Species / Native Type</th>
                <th>Location Site</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map(act => (
                <tr key={act.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{act.userName}</td>
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
                  <td style={{ color: 'var(--text-secondary)' }}>{act.siteName}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{act.date}</td>
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
                      {act.status === 'verified' && <CheckCircle2 size={12} />}
                      {act.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
