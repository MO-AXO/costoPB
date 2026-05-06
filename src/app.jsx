// App — Postgres backend + navegación por meses + sidebar
const { useState, useRef, useEffect } = React;
const D = window.PB_DATA;

// ─── Helpers de mes ───────────────────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const mesLabel = (id) => { const [y,m] = id.split('-').map(Number); return `${MESES[m-1]} ${y}`; };
const siguienteMes = (id) => {
  const [y,m] = id.split('-').map(Number);
  return m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,'0')}`;
};

const seedStore = () => {
  const now = new Date();
  const id = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return {
    currentMonthId: id,
    months: {
      [id]: {
        label: mesLabel(id),
        insumos: [],
        subrecetas: [],
        recetas: [],
        fixedCosts: { rent: 0, utilities: 0, insurance: 0, software: 0, monthlyCovers: 1, laborRatePerHour: 0, taxRate: 0 },
      }
    }
  };
};

// ─── Drawer: Costos Fijos ─────────────────────────────────────────────────────
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
  const total = (v.rent||0) + (v.utilities||0) + (v.insurance||0) + (v.software||0);
  const perCover = total / Math.max(v.monthlyCovers||1, 1);
  return (
    <Drawer open title="Costos fijos mensuales" subtitle="Se prorratean por cubierta para calcular el costo por plato"
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={() => { onSave(v); onClose(); }}>Guardar cambios</button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="hint">Total fijos: <b>${Math.round(total).toLocaleString()}/mes</b> · Por cubierta: <b>${perCover.toFixed(2)}</b></div>
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

// ─── Búsqueda global ──────────────────────────────────────────────────────────
const SearchDropdown = ({ query, recetas, insumos, onOpenReceta, onNavigate }) => {
  if (query.length < 2) return null;
  const rr = recetas.filter(r => r.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const ii = insumos.filter(i => i.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const total = rr.length + ii.length;
  const itemSt = { display:'flex', alignItems:'center', gap:10, width:'100%', padding:'8px 12px', border:0, background:'transparent', textAlign:'left', cursor:'pointer', fontSize:13 };
  return (
    <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, boxShadow:'var(--shadow-md)', zIndex:20, overflow:'hidden' }}>
      {total === 0 ? (
        <div style={{ padding:'14px 12px', fontSize:13, color:'var(--text-3)', textAlign:'center' }}>Sin resultados para «{query}»</div>
      ) : (
        <>
          {rr.length > 0 && <div style={{ padding:'8px 12px 4px', fontSize:10, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--text-3)', fontWeight:600 }}>Recetas</div>}
          {rr.map(r => (
            <button key={r.id} onMouseDown={() => onOpenReceta(r.id)} style={itemSt}>
              <Icon name="chef" size={14} /><span style={{ fontWeight:500, flex:1 }}>{r.name}</span><span style={{ fontSize:11, color:'var(--text-3)' }}>{r.category}</span>
            </button>
          ))}
          {ii.length > 0 && <div style={{ padding:'8px 12px 4px', fontSize:10, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--text-3)', fontWeight:600, borderTop: rr.length > 0 ? '1px solid var(--border)' : 0 }}>Insumos</div>}
          {ii.map(i => (
            <button key={i.id} onMouseDown={() => onNavigate('insumos')} style={itemSt}>
              <Icon name="package" size={14} /><span style={{ fontWeight:500, flex:1 }}>{i.name}</span><span style={{ fontSize:11, color:'var(--text-3)' }}>{i.category}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
};

// ─── Panel de notificaciones ──────────────────────────────────────────────────
const NotifPanel = ({ open, onClose, insumos, recetas, subrecetas, fixedCosts }) => {
  if (!open) return null;
  const C = window.PB_CALC;
  const alerts = [];
  recetas.forEach(r => {
    const m = C.recetaMetrics(r, insumos, subrecetas, fixedCosts);
    if (m.foodCostPct > r.targetFoodCost + 5)
      alerts.push({ kind:'bad', icon:'warn', title:r.name, body:`Food cost ${m.foodCostPct.toFixed(1)}% (obj. ${r.targetFoodCost}%)` });
  });
  D.SEED_PRICE_HISTORY.slice(0, 6).forEach(h => {
    if (Math.abs(h.change) > 5) {
      const ins = insumos.find(i => i.id === h.insumoId);
      if (ins) alerts.push({ kind: h.change>0?'warn':'good', icon: h.change>0?'arrow-up':'arrow-down', title: ins.name, body: `${h.change>0?'+':''}${h.change.toFixed(1)}% el ${h.date}` });
    }
  });
  return (
    <>
      <div style={{ position:'fixed', inset:0, zIndex:29 }} onClick={onClose} />
      <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, width:320, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, boxShadow:'var(--shadow-md)', zIndex:30, overflow:'hidden' }}>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Notificaciones</span>
          <Tag kind={alerts.length > 0 ? 'warn' : 'good'}>{alerts.length} alertas</Tag>
        </div>
        {alerts.length === 0 ? (
          <div style={{ padding:16, fontSize:13, color:'var(--text-3)', textAlign:'center' }}>Sin alertas activas ✓</div>
        ) : (
          <div style={{ maxHeight:340, overflowY:'auto' }}>
            {alerts.map((a,i) => (
              <div key={i} style={{ padding:'10px 14px', borderBottom: i<alerts.length-1?'1px solid var(--border)':0, display:'flex', gap:10, alignItems:'flex-start' }}>
                <div style={{ width:26, height:26, borderRadius:6, flexShrink:0, display:'grid', placeItems:'center', marginTop:2, background: a.kind==='bad'?'var(--bad-soft)':a.kind==='good'?'var(--good-soft)':'var(--warn-soft)', color: a.kind==='bad'?'var(--bad)':a.kind==='good'?'var(--good)':'var(--warn)' }}>
                  <Icon name={a.icon} size={12} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{a.title}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{a.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// ─── Selector de mes ──────────────────────────────────────────────────────────
const MonthPicker = ({ store, viewMonthId, onView, onCreateNew, onClose }) => {
  const ids = Object.keys(store.months).sort().reverse();
  const nxtId = siguienteMes(store.currentMonthId);
  const canCreate = !store.months[nxtId];
  return (
    <>
      <div style={{ position:'fixed', inset:0, zIndex:29 }} onClick={onClose} />
      <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, width:240, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, boxShadow:'var(--shadow-md)', zIndex:30, overflow:'hidden' }}>
        {canCreate && (
          <button onClick={() => { onCreateNew(nxtId); onClose(); }}
            style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 14px', border:0, borderBottom:'1px solid var(--border)', background:'var(--accent-soft)', color:'var(--accent-text)', fontSize:13, fontWeight:500, cursor:'pointer' }}>
            <Icon name="plus" size={13} /> Nuevo mes: {mesLabel(nxtId)}
          </button>
        )}
        {ids.map(id => (
          <button key={id} onClick={() => { onView(id); onClose(); }}
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'9px 14px', border:0, borderBottom:'1px solid var(--border)', fontSize:13, background: id===viewMonthId?'var(--surface-sunk)':'transparent', color:'var(--text)', cursor:'pointer' }}>
            <span style={{ fontWeight: id===store.currentMonthId ? 600 : 400 }}>{store.months[id].label}</span>
            <Tag kind={id===store.currentMonthId ? 'good' : ''}>{id===store.currentMonthId ? 'Activo' : 'Cerrado'}</Tag>
          </button>
        ))}
      </div>
    </>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => {
  const [store, setStore] = useState(null);
  const [viewMonthId, setViewMonthId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('ok'); // 'ok' | 'saving' | 'error'
  const [page, setPage] = useState('dashboard');
  const [openRecetaId, setOpenRecetaId] = useState(null);
  const [showFixedCosts, setShowFixedCosts] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const searchRef = useRef(null);
  const saveTimer = useRef(null);
  const lastSavedAt = useRef(0);
  const initialized = useRef(false);
  const remoteUpdate = useRef(false);
  const tweaks = window.useTweaksPanel();

  // Carga inicial desde la API
  // Inyecta insumos y subrecetas del SEED que no existan en el mes
  const mergeSeeds = (s) => {
    const SD = window.PB_DATA;
    const months = { ...s.months };
    Object.keys(months).forEach(mid => {
      const m = { ...months[mid] };
      // Merge insumos
      const insumoIds = new Set((m.insumos || []).map(x => x.id));
      const newInsumos = SD.SEED_INSUMOS.filter(x => !insumoIds.has(x.id));
      if (newInsumos.length) m.insumos = [...(m.insumos || []), ...newInsumos];
      // Merge subrecetas
      const subIds = new Set((m.subrecetas || []).map(x => x.id));
      const newSubs = SD.SEED_SUBRECETAS.filter(x => !subIds.has(x.id));
      if (newSubs.length) m.subrecetas = [...(m.subrecetas || []), ...newSubs];
      // Merge recetas
      const recetaIds = new Set((m.recetas || []).map(x => x.id));
      const newRecetas = SD.SEED_RECETAS.filter(x => !recetaIds.has(x.id));
      if (newRecetas.length) m.recetas = [...(m.recetas || []), ...newRecetas];
      months[mid] = m;
    });
    return { ...s, months };
  };

  useEffect(() => {
    fetch('/api/store')
      .then(r => r.json())
      .then(data => {
        const s = mergeSeeds((data && data.months) ? data : seedStore());
        lastSavedAt.current = s.savedAt || 0;
        remoteUpdate.current = true;
        setStore(s);
        setViewMonthId(s.currentMonthId);
      })
      .catch(() => {
        const s = mergeSeeds(seedStore());
        remoteUpdate.current = true;
        setStore(s);
        setViewMonthId(s.currentMonthId);
      })
      .finally(() => { setLoading(false); initialized.current = true; });
  }, []);

  // Guarda con debounce de 800ms — omite actualizaciones remotas
  useEffect(() => {
    if (!store || !initialized.current) return;
    if (remoteUpdate.current) { remoteUpdate.current = false; return; }
    setSyncStatus('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload = { ...store, savedAt: Date.now() };
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(r => r.json())
        .then(() => { lastSavedAt.current = payload.savedAt; setSyncStatus('ok'); })
        .catch(() => setSyncStatus('error'));
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [store]);

  // Polling cada 15 s — detecta cambios de otros usuarios
  useEffect(() => {
    const id = setInterval(() => {
      fetch('/api/store')
        .then(r => r.json())
        .then(data => {
          if (data && data.savedAt && data.savedAt > lastSavedAt.current) {
            lastSavedAt.current = data.savedAt;
            remoteUpdate.current = true;
            setStore(data);
            setViewMonthId(v => data.months[v] ? v : data.currentMonthId);
          }
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // Atajo de teclado — debe estar antes del early return
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus(); setSearchOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); setSearchQ(''); setShowNotifs(false); setShowFixedCosts(false); setShowMonthPicker(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (loading || !store) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:12, color:'var(--text-2)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation:'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <span style={{ fontSize:13 }}>Cargando datos…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isCurrentMonth = viewMonthId === store.currentMonthId;
  const monthData = store.months[viewMonthId] || store.months[store.currentMonthId];
  const { insumos, subrecetas, recetas, fixedCosts } = monthData;

  // Setters: siempre escriben al mes activo (currentMonthId)
  const setInsumos = (v) => setStore(s => {
    const cur = s.months[s.currentMonthId];
    return { ...s, months: { ...s.months, [s.currentMonthId]: { ...cur, insumos: typeof v==='function' ? v(cur.insumos) : v } } };
  });
  const setSubrecetas = (v) => setStore(s => {
    const cur = s.months[s.currentMonthId];
    return { ...s, months: { ...s.months, [s.currentMonthId]: { ...cur, subrecetas: typeof v==='function' ? v(cur.subrecetas) : v } } };
  });
  const setRecetas = (v) => setStore(s => {
    const cur = s.months[s.currentMonthId];
    return { ...s, months: { ...s.months, [s.currentMonthId]: { ...cur, recetas: typeof v==='function' ? v(cur.recetas) : v } } };
  });
  const setFixedCosts = (v) => setStore(s => {
    const cur = s.months[s.currentMonthId];
    return { ...s, months: { ...s.months, [s.currentMonthId]: { ...cur, fixedCosts: v } } };
  });

  const crearNuevoMes = (newId) => {
    setStore(s => {
      const cur = s.months[s.currentMonthId];
      return {
        ...s,
        currentMonthId: newId,
        months: {
          ...s.months,
          [newId]: {
            label: mesLabel(newId),
            insumos: cur.insumos,
            subrecetas: cur.subrecetas,
            recetas: cur.recetas.map(r => ({ ...r, monthlySales: 0 })),
            fixedCosts: cur.fixedCosts,
          }
        }
      };
    });
    setViewMonthId(newId);
  };

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

  const C = window.PB_CALC;
  const alertCount = recetas.filter(r => {
    const m = C.recetaMetrics(r, insumos, subrecetas, fixedCosts);
    return m.foodCostPct > r.targetFoodCost + 5;
  }).length;

  const syncDot = syncStatus === 'saving'
    ? { color: 'var(--warn)', label: 'Guardando…' }
    : syncStatus === 'error'
    ? { color: 'var(--bad)', label: 'Error al guardar' }
    : { color: 'var(--good)', label: 'Guardado' };

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
          <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => { setPage(item.id); setOpenRecetaId(null); }}>
            <Icon name={item.icon} size={15} />
            {item.label}
            {item.badge != null && <span className="badge">{item.badge}</span>}
          </button>
        ))}

        <div className="nav-section">Configuración</div>
        <button className="nav-item" onClick={() => isCurrentMonth && setShowFixedCosts(true)}>
          <Icon name="settings" size={15} /> Costos fijos
        </button>
        <button className="nav-item" onClick={() => { setPage('insumos'); setOpenRecetaId(null); }}>
          <Icon name="package" size={15} /> Proveedores
        </button>

        <div className="sidebar-foot">
          <div className="avatar">JC</div>
          <div style={{ flex:1, minWidth:0 }}>
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

          <div style={{ position:'relative' }}>
            <div className="search">
              <Icon name="search" size={14} />
              <input ref={searchRef} value={searchQ}
                onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 160)}
                placeholder="Buscar insumo, receta..." />
              <kbd>⌘K</kbd>
            </div>
            {searchOpen && (
              <SearchDropdown query={searchQ} recetas={recetas} insumos={insumos}
                onOpenReceta={(id) => { goToReceta(id); setSearchQ(''); setSearchOpen(false); }}
                onNavigate={(p) => { setPage(p); setSearchQ(''); setSearchOpen(false); }} />
            )}
          </div>

          <div style={{ position:'relative' }}>
            <button className="icon-btn" onClick={() => setShowNotifs(v => !v)} style={{ position:'relative' }}>
              <Icon name="bell" size={15} />
              {alertCount > 0 && <span style={{ position:'absolute', top:5, right:5, width:7, height:7, borderRadius:'50%', background:'var(--bad)', border:'2px solid var(--surface)' }} />}
            </button>
            <NotifPanel open={showNotifs} onClose={() => setShowNotifs(false)}
              insumos={insumos} recetas={recetas} subrecetas={subrecetas} fixedCosts={fixedCosts} />
          </div>

          <span title={syncDot.label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-3)', userSelect:'none' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background: syncDot.color, display:'inline-block' }} />
            {syncDot.label}
          </span>

          <div style={{ position:'relative' }}>
            <button className="pill" onClick={() => setShowMonthPicker(v => !v)}
              style={{ cursor:'pointer', gap:6, border: isCurrentMonth ? '1px solid var(--border)' : '1px solid var(--warn)' }}>
              <span className="dot" style={{ background: isCurrentMonth ? 'var(--good)' : 'var(--warn)' }} />
              {monthData.label}
              <Icon name="chevron" size={11} style={{ transform:'rotate(90deg)', opacity:0.6 }} />
            </button>
            {showMonthPicker && (
              <MonthPicker store={store} viewMonthId={viewMonthId}
                onView={setViewMonthId}
                onCreateNew={crearNuevoMes}
                onClose={() => setShowMonthPicker(false)} />
            )}
          </div>
        </header>

        <div className="content">
          {!isCurrentMonth && (
            <div style={{ background:'var(--warn-soft)', border:'1px solid var(--warn)', borderRadius:8, padding:'10px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10, fontSize:13, color:'var(--warn)' }}>
              <Icon name="info" size={14} />
              <span><strong>{monthData.label}</strong> — solo lectura</span>
              <button onClick={() => setViewMonthId(store.currentMonthId)}
                style={{ marginLeft:'auto', background:'var(--warn)', color:'#fff', border:0, borderRadius:5, padding:'4px 12px', fontSize:12, cursor:'pointer', fontWeight:500 }}>
                Ir al mes actual →
              </button>
            </div>
          )}
          <div className={isCurrentMonth ? '' : 'pb-readonly'}>
            {page === 'dashboard' && <Dashboard insumos={insumos} subrecetas={subrecetas} recetas={recetas} fixedCosts={fixedCosts} onNavigate={setPage} onOpenReceta={goToReceta} monthLabel={monthData.label} />}
            {page === 'ventas' && <Ventas recetas={recetas} setRecetas={setRecetas} insumos={insumos} subrecetas={subrecetas} fixedCosts={fixedCosts} monthLabel={monthData.label} />}
            {page === 'insumos' && <Insumos insumos={insumos} setInsumos={setInsumos} />}
            {page === 'recetas' && <Recetas insumos={insumos} subrecetas={subrecetas} setSubrecetas={setSubrecetas} recetas={recetas} setRecetas={setRecetas} fixedCosts={fixedCosts} openId={openRecetaId} />}
            {page === 'rentabilidad' && <Rentabilidad insumos={insumos} subrecetas={subrecetas} recetas={recetas} fixedCosts={fixedCosts} onOpenReceta={goToReceta} />}
            {page === 'reportes' && <Reportes insumos={insumos} subrecetas={subrecetas} recetas={recetas} fixedCosts={fixedCosts} monthLabel={monthData.label} />}
            {page === 'historico' && <Historico insumos={insumos} recetas={recetas} subrecetas={subrecetas} />}
          </div>
        </div>
      </main>

      {showFixedCosts && isCurrentMonth && (
        <FixedCostsDrawer costs={fixedCosts} onSave={setFixedCosts} onClose={() => setShowFixedCosts(false)} />
      )}
      {tweaks.open && <TweaksPanel vals={tweaks.vals} set={tweaks.set} onClose={tweaks.close} />}
      <AIAssistant insumos={insumos} subrecetas={subrecetas} recetas={recetas} fixedCosts={fixedCosts} />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
