import React from 'react';
import { BarChart3, Trees, Flame, Award, Globe, PieChart } from 'lucide-react';

export const AnalyticsPanel: React.FC = () => {
  const sectors = [
    { name: 'Margalla Hills National Park', planted: 3840, target: 5000, color: 'var(--lime)' },
    { name: 'Shakarparian Hills Arboretum', planted: 1420, target: 2000, color: '#34D399' },
    { name: 'Rawal Lake Watershed Catchment', planted: 890, target: 1500, color: '#38BDF8' },
    { name: 'Fatima Jinnah Park (F-9)', planted: 650, target: 1000, color: '#A78BFA' },
    { name: 'Rose & Jasmine Garden Buffer', planted: 310, target: 500, color: '#FBBF24' },
  ];

  const speciesBreakdown = [
    { name: 'Chir Pine (Pinus roxburghii)', percent: 36, count: 2560, color: 'var(--lime)' },
    { name: 'Wild Olive (Olea ferruginea)', percent: 28, count: 1990, color: '#34D399' },
    { name: 'Sheesham (Dalbergia sissoo)', percent: 18, count: 1280, color: '#38BDF8' },
    { name: 'Kachnar (Bauhinia variegata)', percent: 11, count: 780, color: '#A78BFA' },
    { name: 'Amaltas & Jacaranda', percent: 7, count: 500, color: '#F87171' },
  ];

  const topVolunteers = [
    { rank: 1, name: 'Zeeshan Ali', trees: 520, points: 7450, role: 'coordinator' },
    { rank: 2, name: 'Ayesha Khan', trees: 480, points: 6800, role: 'volunteer' },
    { rank: 3, name: 'Hamza Sheikh', trees: 340, points: 5120, role: 'volunteer' },
    { rank: 4, name: 'Bilal Ahmed', trees: 290, points: 4300, role: 'volunteer' },
    { rank: 5, name: 'Maryam Noor', trees: 215, points: 3450, role: 'volunteer' },
  ];

  return (
    <div className="animate-fade-in">
      {/* CO2 Impact Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Total Biomass Sequestered</span>
            <Flame size={20} color="var(--lime)" />
          </div>
          <div className="stat-value">160,820 <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>kg CO2</span></div>
          <div className="stat-badge" style={{ backgroundColor: 'var(--lime-dim)', color: 'var(--lime)' }}>
            Calculated via EPA Factors
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Weekly Atmospheric Offset</span>
            <Globe size={20} color="#34D399" />
          </div>
          <div className="stat-value">3,092 <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>kg / wk</span></div>
          <div className="stat-badge" style={{ backgroundColor: 'var(--emerald-dim)', color: '#34D399' }}>
            Growing Canopy Velocity
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Regional Survival Rate</span>
            <Trees size={20} color="#38BDF8" />
          </div>
          <div className="stat-value">85.4%</div>
          <div className="stat-badge" style={{ backgroundColor: 'var(--info-dim)', color: '#38BDF8' }}>
            Monitored Field Sites
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Sector Progress Breakdown */}
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <BarChart3 size={18} color="var(--lime)" />
                <span>Islamabad Sector Canopy Targets</span>
              </div>
              <div className="panel-subtitle">Distribution of verified planted saplings across regional zones</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {sectors.map(sec => {
              const pct = Math.round((sec.planted / sec.target) * 100);
              return (
                <div key={sec.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sec.name}</span>
                    <span style={{ fontWeight: 800, color: sec.color }}>
                      {sec.planted.toLocaleString()} / {sec.target.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: sec.color, borderRadius: '999px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Species Distribution */}
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <PieChart size={18} color="var(--lime)" />
                <span>Species Diversity Ratio</span>
              </div>
              <div className="panel-subtitle">Ensures balanced biodiversity in Margalla reforestation</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {speciesBreakdown.map(sp => (
              <div key={sp.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: sp.color }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{sp.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: sp.color }}>{sp.percent}%</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sp.count} planted</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Table Preview */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <Award size={18} color="var(--lime)" />
              <span>Top Volunteer Impact Ranks</span>
            </div>
            <div className="panel-subtitle">Pre-computed leaderboard rankings updated hourly in <code>leaderboard/all_time</code></div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Volunteer</th>
                <th>Role</th>
                <th>Trees Planted</th>
                <th>Points Awarded</th>
                <th>Milestone Status</th>
              </tr>
            </thead>
            <tbody>
              {topVolunteers.map(v => (
                <tr key={v.rank}>
                  <td style={{ fontWeight: 800, color: v.rank === 1 ? 'var(--lime)' : 'var(--text-secondary)' }}>
                    #{v.rank}
                  </td>
                  <td style={{ fontWeight: 700 }}>{v.name}</td>
                  <td>
                    <span className={`badge ${v.role === 'coordinator' ? 'badge-coordinator' : 'badge-volunteer'}`}>
                      {v.role}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{v.trees}</td>
                  <td style={{ fontWeight: 800, color: 'var(--lime)' }}>{v.points.toLocaleString()}</td>
                  <td>
                    {v.trees >= 500 ? (
                      <span className="badge badge-admin">🏆 500-Tree Milestone Reached</span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{500 - v.trees} trees to 500 club</span>
                    )}
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
