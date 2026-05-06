// Tweaks panel — paleta de tema
const TWEAK_DEFAULTS = {
  "theme": "slate",
  "showOverhead": true,
  "density": "comfortable"
};

const useTweaksPanel = () => {
  const [open, setOpen] = React.useState(false);
  const [vals, setVals] = React.useState(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({type: '__edit_mode_available'}, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const set = (patch) => {
    const next = { ...vals, ...patch };
    setVals(next);
    window.parent.postMessage({type: '__edit_mode_set_keys', edits: patch}, '*');
  };

  React.useEffect(() => {
    document.documentElement.dataset.theme = vals.theme === 'slate' ? '' : vals.theme;
  }, [vals.theme]);

  const close = () => {
    setOpen(false);
    window.parent.postMessage({type: '__edit_mode_dismissed'}, '*');
  };

  return { open, vals, set, close };
};

const TweaksPanel = ({ vals, set, onClose }) => (
  <div style={{
    position: 'fixed', bottom: 16, right: 16, width: 280,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 12, boxShadow: '0 10px 40px rgba(15,20,25,0.18)',
    zIndex: 100, padding: 16,
  }}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14}}>
      <div style={{fontSize: 13, fontWeight: 600}}>Tweaks</div>
      <button className="icon-btn" onClick={onClose}><Icon name="close" size={14} /></button>
    </div>

    <div style={{fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8}}>Tema visual</div>
    <div style={{display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16}}>
      <ThemeOption value="slate" label="Slate Pro" sub="Frío, profesional (default)" colors={['#3b4cca', '#0f1419', '#f6f7f9']} active={vals.theme === 'slate'} onClick={() => set({ theme: 'slate' })} />
      <ThemeOption value="warm" label="Warm BBQ" sub="Cálido con personalidad" colors={['#b3411f', '#1f1612', '#f5f1ec']} active={vals.theme === 'warm'} onClick={() => set({ theme: 'warm' })} />
      <ThemeOption value="mono" label="Mono Editorial" sub="Negro/blanco, serif display" colors={['#000', '#4a4a4a', '#fafafa']} active={vals.theme === 'mono'} onClick={() => set({ theme: 'mono' })} />
    </div>

    <div style={{fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8}}>Costos</div>
    <label style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '6px 0'}}>
      <span>Incluir overhead prorrateado</span>
      <input type="checkbox" checked={vals.showOverhead} onChange={e => set({ showOverhead: e.target.checked })} />
    </label>
  </div>
);

const ThemeOption = ({ label, sub, colors, active, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 10, padding: 10,
    background: active ? 'var(--accent-soft)' : 'var(--surface-2)',
    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
    borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%'
  }}>
    <div className="tweak-swatch">
      {colors.map((c, i) => <div key={i} className="sw" style={{background: c}}></div>)}
    </div>
    <div style={{flex: 1}}>
      <div style={{fontSize: 12, fontWeight: 600, color: active ? 'var(--accent-text)' : 'var(--text)'}}>{label}</div>
      <div style={{fontSize: 11, color: 'var(--text-3)'}}>{sub}</div>
    </div>
  </button>
);

window.useTweaksPanel = useTweaksPanel;
window.TweaksPanel = TweaksPanel;
