// App — composición principal con sidebar, router, búsqueda y costos fijos
const { useState, useRef, useEffect } = React;
const D = window.PB_DATA;

// ─── Drawer: Costos Fijos ────────────────────────────────────────────────────
const FixedCostsDrawer = ({ costs, onSave, onClose }) => {
  const [v, setV] = useState({ ...costs });
  const upd = (k, val) => setV(p => ({ ...p, [k]: parseFloat(val) || 0 }));
  const fl = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 13, fontFamily: 'var(--font-mono)' };
  const lbl = (t) => <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>{t}</label>;
  const field = (label, key, sfx) => (
    <div>
      {lbl(label)}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="number" step="1" min="0" value={v[key]} onChange={e => upd(key, e.target.value)} style={fl} />
        <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{sfx}</span>
      </div>
    </div>
  );
  const total = (v.rent || 0) + (v.utilities || 0) + (v.insurance || 0) + (v.software || 0);
  const perCover = total / Math.max(v.monthlyCovers || 1, 1);
  return (
    <Drawer open title="Costos fijos mensuales" subtitle="Se prorratean por cubierta para calcular el costo por plato"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { onSave(v); onClose(); }}>Guardar cambios</button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="hint">
          Total fijos: <b>${Math.round(total).toLocaleString()}/mes</b> · Por cubierta: <b>${perCover.toFixed(2)}</b>
        </div>
        {field('Renta mensual', 'rent', 'USD/mes')}
        {field('Servicios (luz, gas, agua)', 'utilities', 'USD/mes')}
        {field('Seguros', 'insurance', 'USD/mes')}
        {field('Software y suscripciones', 'software', 'USD/mes')}
        <div className="divider" />
        {field('Tarifa de mano de obra', 'laborRatePerHour', 'USD/hora')}
        {field('Cubiertas mensuales estimadas', 'monthlyCovers', 'platos/mes')}
      </div>
    </Drawer>
  );
};

// ─── Búsqueda global ─────────────────────────────────────────────────────────
const SearchDropdown = ({ query, recetas, insumos, onOpenReceta, onNavigate }) => {
  if (query.length < 2) return null;
  const rr = recetas.filter(r => r.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const ii = insumos.filter(i => i.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const total = rr.length + ii.length;
  const itemSt = {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    padding: '8px 12px', border: 0, background: 'transparent',
    textAlign: 'left', cursor: 'pointer', fontSize: 13,
  };
  return (
    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 20, overflow: 'hidden' }}>
      {total === 0 ? (
        <div style={{ padding: '14px 12px', fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>Sin resultados para «{query}»</div>
      ) : (
        <>
          {rr.length > 0 && <div style={{ padding: '8px 12px 4px', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>Recetas</div>}
          {rr.map(r => (
            <button key={r.id} onMouseDown={() => onOpenReceta(r.id)} style={itemSt}>
              <Icon name="chef" size={14} />
              <span style={{ fontWeight: 500, flex: 1 }}>{r.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.category}</span>
            </button>
          ))}
          {ii.length > 0 && (
            <div style={{ padding: '8px 12px 4px', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, borderTop: rr.length > 0 ? '1px solid var(--border)' : 0 }}>Insumos</div>
          )}
          {ii.map(i => (
            <button key={i.id} onMouseDown={() => onNavigate('insumos')} style={itemSt}>
              <Icon name="package" size={14} />
              <span style={{ fontWeight: 500, flex: 1 }}>{i.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{i.category}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
};

// ─── Panel de notificaciones ─────────────────────────────────────────────────
const NotifPanel = ({ open, onClose, insumos, recetas, subrecetas, fixedCosts }) => {
  if (!open) return null;
  const C = window.PB_CALC;
  const alerts = [];
  recetas.forEach(r => {
    const m = C.recetaMetrics(r, insumos, subrecetas, fixedCosts);
    if (m.foodCostPct > r.targetFoodCost + 5) {
      alerts.push({ kind: 'bad', icon: 'warn', title: r.name, body: `Food cost ${m.foodCostPct.toFixed(1)}% (obj. ${r.targetFoodCost}%)` });
    }
  });
  D.SEED_PRICE_HISTORY.slice(0, 6).forEach(h => {
    if (Math.abs(h.change) > 5) {
      const ins = insumos.find(i => i.id === h.insumoId);
      if (ins) alerts.push({
        kind: h.change > 0 ? 'warn' : 'good',
        icon: h.change > 0 ? 'arrow-up' : 'arrow-down',
        title: ins.name,
        body: `${h.change > 0 ? '+' : ''}${h.change.toFixed(1)}% el ${h.date}`,
      });
    }
  });
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 29 }} onClick={onClose} />
      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 320, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 30, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Notificaciones</span>
          <Tag kind={alerts.length > 0 ? 'warn' : 'good'}>{alerts.length} alertas</Tag>
        </div>
        {alerts.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>Sin alertas activas ✓</div>
        ) : (
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ padding: '10px 14px', borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 0, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, display: 'grid', placeItems: 'center', marginTop: 2, background: a.kind === 'bad' ? 'var(--bad-soft)' : a.kind === 'good' ? 'var(--good-soft)' : 'var(--warn-soft)', color: a.kind === 'bad' ? 'var(--bad)' : a.kind === 'good' ? 'var(--good)' : 'var(--warn)' }}>
                  <Icon name={a.icon} size={12} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{a.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// ─── App ─────────────────────────────────────────────────────────────────────
const App = () => {
  const [page, setPage] = useState('dashboard');
  const [insumos, setInsumos] = useState(D.SEED_INSUMOS);
  const [subrecetas, setSubrecetas] = useState(D.SEED_SUBRECETAS);
  const [recetas, setRecetas] = useState(D.SEED_RECETAS);
  const [fixedCosts, setFixedCosts] = useState(D.SEED_FIXED_COSTS);
  const [openRecetaId, setOpenRecetaId] = useState(null);
  const [showFixedCosts, setShowFixedCosts] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const searchRef = useRef(null);
  const tweaks = window.useTweaksPanel();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'ventas', label: 'Ventas', icon: 'trending' },
    { id: 'insumos', label: 'Insumos', icon: 'package', badge: insumos.length },
    { id: 'recetas', label: 'Recetas', icon: 'chef', badge: recetas.length + subrecetas.length },
    { id: 'rentabilidad', label: 'Rentabilidad', icon: 'pie' },
    { id: 'reportes', label: 'Reportes', icon: 'chart' },
    { id: 'historico', label: 'Histórico de precios', icon: 'history' },
  ];

  const crumbLabel = navItems.find(n => n.id === page)?.label || 'Dashboard';
  const goToReceta = (id) => { setOpenRecetaId(id); setPage('recetas'); };

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQ('');
        setShowNotifs(false);
        setShowFixedCosts(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const C = window.PB_CALC;
  const alertCount = recetas.filter(r => {
    const m = C.recetaMetrics(r, insumos, subrecetas, fixedCosts);
    return m.foodCostPct > r.targetFoodCost + 5;
  }).length;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PB</div>
          <div>
            <div className="brand-name">Pig Brothers</div>
            <div className="brand-sub">Costeo</div>
          </div>
        </div>

        <div className="nav-section">Operación</div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => { setPage(item.id); setOpenRecetaId(null); }}
          >
            <Icon name={item.icon} size={15} />
            {item.label}
            {item.badge != null && <span className="badge">{item.badge}</span>}
          </button>
        ))}

        <div className="nav-section">Configuración</div>
        <button className="nav-item" onClick={() => setShowFixedCosts(true)}>
          <Icon name="settings" size={15} /> Costos fijos
        </button>
        <button className="nav-item" onClick={() => { setPage('insumos'); setOpenRecetaId(null); }}>
          <Icon name="package" size={15} /> Proveedores
        </button>

        <div className="sidebar-foot">
          <div className="avatar">JC</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="who">Jorge Castillo</div>
            <div className="role">Dueño · Pig Brothers</div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="crumbs">
            <span>Pig Brothers</span>
            <span className="sep">/</span>
            <span className="here">{crumbLabel}</span>
          </div>
          <div className="topbar-spacer" />

          <div style={{ position: 'relative' }}>
            <div className="search">
              <Icon name="search" size={14} />
              <input
                ref={searchRef}
                value={searchQ}
                onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 160)}
                placeholder="Buscar insumo, receta..."
              />
              <kbd>⌘K</kbd>
            </div>
            {searchOpen && (
              <SearchDropdown
                query={searchQ}
                recetas={recetas}
                insumos={insumos}
                onOpenReceta={(id) => { goToReceta(id); setSearchQ(''); setSearchOpen(false); }}
                onNavigate={(p) => { setPage(p); setSearchQ(''); setSearchOpen(false); }}
              />
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => setShowNotifs(v => !v)} style={{ position: 'relative' }}>
              <Icon name="bell" size={15} />
              {alertCount > 0 && (
                <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: 'var(--bad)', border: '2px solid var(--surface)' }} />
              )}
            </button>
            <NotifPanel
              open={showNotifs}
              onClose={() => setShowNotifs(false)}
              insumos={insumos}
              recetas={recetas}
              subrecetas={subrecetas}
              fixedCosts={fixedCosts}
            />
          </div>

          <span className="pill"><span className="dot" /> USD · Abr 2026</span>
        </header>

        <div className="content">
          {page === 'dashboard' && <Dashboard insumos={insumos} subrecetas={subrecetas} recetas={recetas} fixedCosts={fixedCosts} onNavigate={setPage} onOpenReceta={goToReceta} />}
          {page === 'ventas' && <Ventas recetas={recetas} setRecetas={setRecetas} insumos={insumos} subrecetas={subrecetas} fixedCosts={fixedCosts} />}
          {page === 'insumos' && <Insumos insumos={insumos} setInsumos={setInsumos} />}
          {page === 'recetas' && <Recetas insumos={insumos} subrecetas={subrecetas} setSubrecetas={setSubrecetas} recetas={recetas} setRecetas={setRecetas} fixedCosts={fixedCosts} openId={openRecetaId} />}
          {page === 'rentabilidad' && <Rentabilidad insumos={insumos} subrecetas={subrecetas} recetas={recetas} fixedCosts={fixedCosts} onOpenReceta={goToReceta} />}
          {page === 'reportes' && <Reportes insumos={insumos} subrecetas={subrecetas} recetas={recetas} fixedCosts={fixedCosts} />}
          {page === 'historico' && <Historico insumos={insumos} recetas={recetas} subrecetas={subrecetas} />}
        </div>
      </main>

      {showFixedCosts && (
        <FixedCostsDrawer costs={fixedCosts} onSave={setFixedCosts} onClose={() => setShowFixedCosts(false)} />
      )}
      {tweaks.open && <TweaksPanel vals={tweaks.vals} set={tweaks.set} onClose={tweaks.close} />}
      <AIAssistant insumos={insumos} subrecetas={subrecetas} recetas={recetas} fixedCosts={fixedCosts} />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
