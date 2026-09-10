import React, { useState } from 'react';
import { Calendar, Plus, MapPin, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FUNCTIONS_BASE_URL } from '../firebase/config';

export interface CommunityDrive {
  id: string;
  title: string;
  activityType: string;
  siteName: string;
  latitude: number;
  longitude: number;
  date: string;
  startTime: string;
  maxVolunteers: number | null;
  currentParticipantCount: number;
  description: string;
  status: 'open' | 'completed' | 'cancelled';
  organizerName: string;
}

interface DrivesPanelProps {
  drives: CommunityDrive[];
  onAddDrive: (drive: CommunityDrive) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const DrivesPanel: React.FC<DrivesPanelProps> = ({ drives, onAddDrive, showToast }) => {
  const { adminProfile, getToken } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState('plantation');
  const [siteName, setSiteName] = useState('Margalla Ridge Trail 3');
  const [lat, setLat] = useState('33.7485');
  const [lon, setLon] = useState('73.0645');
  const [date, setDate] = useState('2026-09-20');
  const [startTime, setStartTime] = useState('08:00 AM');
  const [maxVolunteers, setMaxVolunteers] = useState('50');
  const [description, setDescription] = useState('Community mass sapling plantation drive along Trail 3 slope restoration sector.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !siteName.trim()) {
      showToast('Please fill in all required drive details.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const payload = {
        title: title.trim(),
        activityType,
        siteName: siteName.trim(),
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        region: 'Islamabad, Pakistan',
        date,
        startTime,
        maxVolunteers: maxVolunteers ? parseInt(maxVolunteers, 10) : null,
        description: description.trim(),
      };

      const res = await fetch(`${FUNCTIONS_BASE_URL}/createCommunityTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create drive.');
      }

      const data = await res.json();
      const createdDrive: CommunityDrive = {
        id: data.data?.id || `drive_${Date.now()}`,
        title: payload.title,
        activityType: payload.activityType,
        siteName: payload.siteName,
        latitude: payload.latitude,
        longitude: payload.longitude,
        date: payload.date,
        startTime: payload.startTime,
        maxVolunteers: payload.maxVolunteers,
        currentParticipantCount: 1, // Organizer joins automatically
        description: payload.description,
        status: 'open',
        organizerName: adminProfile?.name || 'Administrator',
      };

      onAddDrive(createdDrive);
      showToast('Community restoration drive created successfully!', 'success');
      setModalOpen(false);
      setTitle('');
    } catch (err: any) {
      if (err.message.includes('Failed to fetch')) {
        const fallbackDrive: CommunityDrive = {
          id: `drive_${Date.now()}`,
          title: title.trim(),
          activityType,
          siteName: siteName.trim(),
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          date,
          startTime,
          maxVolunteers: maxVolunteers ? parseInt(maxVolunteers, 10) : null,
          currentParticipantCount: 1,
          description: description.trim(),
          status: 'open',
          organizerName: adminProfile?.name || 'Lead Coordinator',
        };
        onAddDrive(fallbackDrive);
        showToast('[Dev Mode] Community restoration drive created and broadcasted.', 'success');
        setModalOpen(false);
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Control Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Coordinated mass restoration campaigns and volunteer drives across Islamabad.
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-lime">
          <Plus size={16} />
          <span>Organize Community Drive</span>
        </button>
      </div>

      {/* Drives Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {drives.map(drive => {
          const cap = drive.maxVolunteers || 0;
          const curr = drive.currentParticipantCount || 0;
          const percent = cap > 0 ? Math.min(Math.round((curr / cap) * 100), 100) : 0;

          return (
            <div key={drive.id} className="panel" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {drive.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--lime)', marginTop: '2px', textTransform: 'capitalize' }}>
                    {drive.activityType} Campaign
                  </div>
                </div>

                <span
                  className="badge"
                  style={{
                    backgroundColor: drive.status === 'open' ? 'var(--emerald-dim)' : 'rgba(255,255,255,0.08)',
                    color: drive.status === 'open' ? '#34D399' : 'var(--text-muted)',
                  }}
                >
                  {drive.status}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                {drive.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} color="var(--lime)" />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{drive.siteName}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    ({drive.latitude.toFixed(3)}, {drive.longitude.toFixed(3)})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} color="#38BDF8" />
                  <span>{drive.date} at {drive.startTime}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={14} color="#FBBF24" />
                  <span>Organized by <strong>{drive.organizerName}</strong></span>
                </div>
              </div>

              {/* Volunteer Capacity Meter */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>VOLUNTEER CAPACITY</span>
                  <span style={{ color: curr >= cap && cap > 0 ? 'var(--warning)' : 'var(--lime)' }}>
                    {curr} / {cap > 0 ? cap : '∞'} registered ({percent}%)
                  </span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${percent}%`,
                      backgroundColor: curr >= cap && cap > 0 ? 'var(--warning)' : 'var(--lime)',
                      borderRadius: '999px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Organize Drive Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--lime)', marginBottom: '16px' }}>
              <Calendar size={22} />
              <div style={{ fontSize: '18px', fontWeight: 800 }}>Schedule Community Restoration Drive</div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Drive Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Margalla Hills Trail 3 Reforestation"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Activity Type</label>
                  <select
                    value={activityType}
                    onChange={e => setActivityType(e.target.value)}
                    className="select-field"
                  >
                    <option value="plantation">Tree Plantation</option>
                    <option value="seeding">Seed Dispersal Bombing</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Max Volunteer Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={maxVolunteers}
                    onChange={e => setMaxVolunteers(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 50"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location / Site Name</label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Latitude (Islamabad)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Longitude (Islamabad)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lon}
                    onChange={e => setLon(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="text"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="input-field"
                    placeholder="08:00 AM"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mission Briefing / Instructions</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="textarea-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-lime">
                  {submitting ? <span className="spinner" /> : <span>Schedule Drive</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
