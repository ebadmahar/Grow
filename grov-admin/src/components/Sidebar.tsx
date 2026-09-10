import React from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Wind,
  ShieldCheck,
  Mail,
  Trees,
  Calendar,
  Send,
  AlertTriangle,
  BarChart3,
  LogOut,
  Leaf,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type AdminTab =
  | 'overview'
  | 'verification'
  | 'users'
  | 'aqi'
  | '2fa'
  | 'smtp'
  | 'species'
  | 'drives'
  | 'goals'
  | 'reports'
  | 'analytics';

interface SidebarProps {
  currentTab: AdminTab;
  setCurrentTab: (tab: AdminTab) => void;
  pendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, pendingCount }) => {
  const { adminProfile, logout } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'verification', label: 'Moderation Queue', icon: ClipboardCheck, badge: pendingCount },
    { id: 'users', label: 'User Governance', icon: Users },
    { id: 'aqi', label: 'AQI & Telemetry', icon: Wind },
    { id: '2fa', label: 'Admin 2FA Security', icon: ShieldCheck },
    { id: 'smtp', label: 'Dual-SMTP Mailer', icon: Mail },
    { id: 'species', label: 'Species Catalogue', icon: Trees },
    { id: 'drives', label: 'Community Drives', icon: Calendar },
    { id: 'goals', label: 'Goals & Broadcast', icon: Send },
    { id: 'reports', label: 'Threat Reports', icon: AlertTriangle },
    { id: 'analytics', label: 'Impact Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--lime)',
              color: '#0A0F0D',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
            }}
          >
            <Leaf size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
              Grōv Admin
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lime)', textTransform: 'uppercase' }}>
              Cloud Suite v2.0
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id as AdminTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isActive ? 'var(--lime-dim)' : 'transparent',
                color: isActive ? 'var(--lime)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--warning)',
                    color: '#0A0F0D',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin Profile & Logout */}
      <div
        style={{
          padding: '18px 20px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(11, 17, 14, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {adminProfile?.name || 'Administrator'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--lime)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--lime)' }} />
            <span>2FA Authenticated</span>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--danger)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            display: 'grid',
            placeItems: 'center',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
