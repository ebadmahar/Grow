import React, { useState } from 'react';
import { Trees, Plus, Trash2, Leaf, Droplet, Sun, Wind } from 'lucide-react';

export interface SpeciesRecord {
  id: string;
  commonName: string;
  scientificName: string;
  growthRate: 'Slow' | 'Moderate' | 'Fast';
  co2AbsorptionKgPerYear: number;
  waterRequirement: 'Low' | 'Moderate' | 'High';
  idealPlantingSeason: string;
  nativeToIslamabad: boolean;
}

interface SpeciesPanelProps {
  speciesList: SpeciesRecord[];
  onAddSpecies: (species: SpeciesRecord) => void;
  onDeleteSpecies: (id: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const SpeciesPanel: React.FC<SpeciesPanelProps> = ({
  speciesList,
  onAddSpecies,
  onDeleteSpecies,
  showToast,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [commonName, setCommonName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [growthRate, setGrowthRate] = useState<'Slow' | 'Moderate' | 'Fast'>('Moderate');
  const [co2Absorption, setCo2Absorption] = useState('22.5');
  const [waterReq, setWaterReq] = useState<'Low' | 'Moderate' | 'High'>('Low');
  const [season, setSeason] = useState('Monsoon (Jul-Aug) & Spring (Feb-Mar)');
  const [native, setNative] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commonName.trim() || !scientificName.trim()) {
      showToast('Please provide both common and scientific names.', 'error');
      return;
    }

    const newSpec: SpeciesRecord = {
      id: `species_${Date.now()}`,
      commonName: commonName.trim(),
      scientificName: scientificName.trim(),
      growthRate,
      co2AbsorptionKgPerYear: parseFloat(co2Absorption) || 20,
      waterRequirement: waterReq,
      idealPlantingSeason: season,
      nativeToIslamabad: native,
    };

    onAddSpecies(newSpec);
    showToast(`Species "${newSpec.commonName}" added to the catalogue.`, 'success');
    setModalOpen(false);
    setCommonName('');
    setScientificName('');
  };

  return (
    <div className="animate-fade-in">
      {/* Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Catalogued indigenous and ecological restoration species for the Islamabad Capital Territory.
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-lime">
          <Plus size={16} />
          <span>Add Native Species</span>
        </button>
      </div>

      {/* Species Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {speciesList.map(spec => (
          <div key={spec.id} className="panel" style={{ margin: 0, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {spec.commonName}
                </h3>
                <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  {spec.scientificName}
                </div>
              </div>

              <span
                className="badge"
                style={{
                  backgroundColor: spec.nativeToIslamabad ? 'var(--lime-dim)' : 'rgba(255, 255, 255, 0.08)',
                  color: spec.nativeToIslamabad ? 'var(--lime)' : 'var(--text-secondary)',
                }}
              >
                {spec.nativeToIslamabad ? 'Native Indigenous' : 'Introduced'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '16px 0', fontSize: '12px' }}>
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wind size={12} color="var(--lime)" />
                  <span>CO2 Sequestration</span>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--lime)', fontSize: '14px' }}>
                  {spec.co2AbsorptionKgPerYear} <span style={{ fontSize: '10px' }}>kg/year</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Droplet size={12} color="#38BDF8" />
                  <span>Water Needs</span>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px' }}>
                  {spec.waterRequirement}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sun size={12} color="#FBBF24" />
                  <span>Growth Velocity</span>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px' }}>
                  {spec.growthRate}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Leaf size={12} color="#34D399" />
                  <span>Planting Season</span>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {spec.idealPlantingSeason}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <button
                onClick={() => {
                  onDeleteSpecies(spec.id);
                  showToast(`Species "${spec.commonName}" removed.`, 'success');
                }}
                className="btn btn-danger btn-sm"
                title="Remove species from active catalogue"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Species Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--lime)', marginBottom: '16px' }}>
              <Trees size={22} />
              <div style={{ fontSize: '18px', fontWeight: 800 }}>Add Indigenous Species</div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Common Name</label>
                  <input
                    type="text"
                    required
                    value={commonName}
                    onChange={e => setCommonName(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Chir Pine"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Scientific Botanical Name</label>
                  <input
                    type="text"
                    required
                    value={scientificName}
                    onChange={e => setScientificName(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Pinus roxburghii"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Growth Rate</label>
                  <select
                    value={growthRate}
                    onChange={e => setGrowthRate(e.target.value as any)}
                    className="select-field"
                  >
                    <option value="Slow">Slow</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Fast">Fast</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">CO2 kg/year</label>
                  <input
                    type="number"
                    step="0.1"
                    value={co2Absorption}
                    onChange={e => setCo2Absorption(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Water Needs</label>
                  <select
                    value={waterReq}
                    onChange={e => setWaterReq(e.target.value as any)}
                    className="select-field"
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ideal Planting Season</label>
                <input
                  type="text"
                  value={season}
                  onChange={e => setSeason(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={native}
                    onChange={e => setNative(e.target.checked)}
                    style={{ accentColor: 'var(--lime)' }}
                  />
                  <span>Native to Margalla Hills / Islamabad Capital Territory</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-lime">
                  Save Species
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
