import React from 'react';
import { RefreshCw, MapPin, Activity } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onRefresh, refreshing }) => {
  return (
    <header className="top-header">
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          {title}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          {subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Region & Telemetry Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
          }}
        >
          <MapPin size={13} color="var(--lime)" />
          <span>Islamabad (asia-south1)</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
          <Activity size={13} color="var(--emerald)" />
          <span style={{ color: 'var(--emerald)' }}>Live Cloud</span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="btn btn-secondary btn-sm"
            title="Refresh Live Firestore Data"
          >
            <RefreshCw size={13} className={refreshing ? 'spinner' : ''} />
            <span>Sync</span>
          </button>
        )}
      </div>
    </header>
  );
};
