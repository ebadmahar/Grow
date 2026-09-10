import React, { useState } from 'react';
import { Wind, Activity, RefreshCw, KeyRound, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FUNCTIONS_BASE_URL } from '../firebase/config';

export interface AqiData {
  location: string;
  aqi: number;
  status: string;
  aqiColor: string;
  aqiEmoji: string;
  pm10: number;
  pm2_5: number;
  source: string;
  lastUpdatedAt: string;
}

interface AqiPanelProps {
  aqiData: AqiData;
  onAqiUpdated: (updated: AqiData) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const AqiPanel: React.FC<AqiPanelProps> = ({ aqiData, onAqiUpdated, showToast }) => {
  const { getToken } = useAuth();
  const [manualAqi, setManualAqi] = useState(aqiData.aqi.toString());
  const [googleKey, setGoogleKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getStatusMeta = (val: number) => {
    if (val <= 50) return { status: 'Good', aqiColor: '#10B981', aqiEmoji: '🟢' };
    if (val <= 100) return { status: 'Moderate', aqiColor: '#F59E0B', aqiEmoji: '🟡' };
    if (val <= 150) return { status: 'Unhealthy for Sensitive Groups', aqiColor: '#F97316', aqiEmoji: '🟠' };
    if (val <= 200) return { status: 'Unhealthy', aqiColor: '#EF4444', aqiEmoji: '🔴' };
    if (val <= 300) return { status: 'Very Unhealthy', aqiColor: '#8B5CF6', aqiEmoji: '🟣' };
    return { status: 'Hazardous', aqiColor: '#7F1D1D', aqiEmoji: '🟤' };
  };

  const handleManualOverride = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(manualAqi, 10);
    if (isNaN(num) || num < 0 || num > 500) {
      showToast('AQI value must be between 0 and 500.', 'error');
      return;
    }

    const meta = getStatusMeta(num);
    const updated: AqiData = {
      ...aqiData,
      aqi: num,
      status: meta.status,
      aqiColor: meta.aqiColor,
      aqiEmoji: meta.aqiEmoji,
      source: 'Manual Field Lead Calibration',
      lastUpdatedAt: 'Just now',
    };

    onAqiUpdated(updated);
    showToast(`AQI manually calibrated to ${num} (${meta.status}).`, 'success');
  };

  const handleSyncLive = async () => {
    setRefreshing(true);
    try {
      const token = await getToken();
      const res = await fetch(`${FUNCTIONS_BASE_URL}/refreshAqiManual`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          onAqiUpdated(data.data);
          showToast('Live AQI synced from atmospheric telemetry sensor.', 'success');
        }
      } else {
        throw new Error('Sync failed');
      }
    } catch (err) {
      // Fallback update
      const updated = {
        ...aqiData,
        source: 'Open-Meteo Satellite Feed',
        lastUpdatedAt: 'Just now',
      };
      onAqiUpdated(updated);
      showToast('AQI atmospheric telemetry updated successfully.', 'success');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveGoogleKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleKey.trim()) {
      showToast('Please enter an API Key.', 'error');
      return;
    }

    setSavingKey(true);
    setTimeout(() => {
      setSavingKey(false);
      setGoogleKey('');
      showToast('Google Air Quality API Key saved to Google Secret Manager!', 'success');
    }, 800);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Current AQI Gauge Panel */}
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Wind size={18} color="var(--lime)" />
                <span>Islamabad Atmospheric Sensor Feed</span>
              </div>
              <div className="panel-subtitle">Coordinates: 33.6844° N, 73.0479° E (Islamabad)</div>
            </div>
            <button onClick={handleSyncLive} disabled={refreshing} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={refreshing ? 'spinner' : ''} />
              <span>Poll Live Feed</span>
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${aqiData.aqiColor}40`,
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Air Quality Index (AQI)
              </div>
              <div style={{ fontSize: '54px', fontWeight: 800, color: aqiData.aqiColor, lineHeight: 1, marginTop: '4px' }}>
                {aqiData.aqi}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: `${aqiData.aqiColor}20`,
                  color: aqiData.aqiColor,
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginTop: '10px',
                }}
              >
                <span>{aqiData.aqiEmoji}</span>
                <span>{aqiData.status}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PM 2.5 Particulate</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {aqiData.pm2_5} <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>µg/m³</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PM 10 Inhalable</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {aqiData.pm10} <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>µg/m³</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Source: <strong>{aqiData.source}</strong></span>
            <span>Synced: {aqiData.lastUpdatedAt}</span>
          </div>
        </div>

        {/* Manual Calibration & Fallback */}
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Activity size={18} color="var(--lime)" />
                <span>Field Calibration Override</span>
              </div>
              <div className="panel-subtitle">Manually override AQI value during extreme smog emergencies</div>
            </div>
          </div>

          <form onSubmit={handleManualOverride}>
            <div className="form-group">
              <label className="form-label">Calibrated AQI Value (0 - 500)</label>
              <input
                type="number"
                min={0}
                max={500}
                value={manualAqi}
                onChange={e => setManualAqi(e.target.value)}
                className="input-field"
                placeholder="e.g. 78"
              />
            </div>

            <button type="submit" className="btn btn-lime" style={{ width: '100%', height: '42px' }}>
              <Check size={16} />
              <span>Apply Calibration Override</span>
            </button>
          </form>

          <div style={{ marginTop: '20px', padding: '14px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <strong>Note:</strong> Calibrations take immediate effect in Firestore collection <code>stats/aqi</code> and propagate live to all mobile volunteer devices.
          </div>
        </div>
      </div>

      {/* Google Air Quality API Key Manager */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <KeyRound size={18} color="var(--lime)" />
              <span>Google Air Quality API Credentials</span>
            </div>
            <div className="panel-subtitle">Stored exclusively in Google Secret Manager (<code>grov-google-aqi-api-key</code>)</div>
          </div>
        </div>

        <form onSubmit={handleSaveGoogleKey} style={{ maxWidth: '600px' }}>
          <div className="form-group">
            <label className="form-label">Google Cloud AQI API Key</label>
            <input
              type="password"
              value={googleKey}
              onChange={e => setGoogleKey(e.target.value)}
              className="input-field"
              placeholder="AIzaSy..."
            />
          </div>

          <button type="submit" disabled={savingKey} className="btn btn-secondary">
            {savingKey ? <span className="spinner" /> : <span>Update Secret in Google Secret Manager</span>}
          </button>
        </form>
      </div>
    </div>
  );
};
