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
    config: { tasaImpuesto: 13, tasaComision: 3, tasaISS: 3, tasaAFP: 7.25, tasaRenta: 10 },
    months: {
      [id]: {
        label: mesLabel(id),
        insumos: [],
        subrecetas: [],
        recetas: [],
        fixedCosts: {
          // Costos operativos reales Pig Brothers
          rent: 1800,          // Alquiler
          salaries: 1500,      // Salarios
          gas: 100,            // Gas
          water: 150,          // Agua
          internet: 100,       // Internet
          gasoline: 200,       // Gasolina
          charcoal: 96,        // Carbón
          wood: 90,            // Madera
          aluminum: 28,        // Aluminio
          electricity: 300,    // Electricidad
          accountant: 250,     // Contador
          cleaning: 60,        // Equipo de limpieza
          // Personal (tasa calculada automáticamente)
          staff: [
            { role: 'Jefe de cocina',      salary: 500, dailyHours: 12 },
            { role: 'Ayudante de cocina',  salary: 450, dailyHours: 12 },
            { role: 'Ayudante de cocina',  salary: 450, dailyHours: 12 },
          ],
          // Operación
          monthlyCovers: 1,
          laborRatePerHour: 1.62, // calculado: $1,400 / 864 hrs
        },
      }
    }
  };
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
  const [page, setPage] = useState('ventas');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const saveTimer = useRef(null);
  const lastSavedAt = useRef(0);
  const initialized = useRef(false);
  const remoteUpdate = useRef(false);

  // Carga inicial desde la API
  // Sincroniza SEED con el store:
  // - Los insumos/subrecetas/recetas del SEED siempre se actualizan (nombre, costo, yield, etc.)
  // - Los que el usuario creó manualmente (IDs que no son del SEED) se conservan intactos
  const mergeSeeds = (s) => {
    const SD = window.PB_DATA;
    const seedInsumoIds  = new Set(SD.SEED_INSUMOS.map(x => x.id));
    const seedSubIds     = new Set(SD.SEED_SUBRECETAS.map(x => x.id));
    const seedRecetaIds  = new Set(SD.SEED_RECETAS.map(x => x.id));
    const months = { ...s.months };
    const defaultCosts = {
      rent: 1800, gas: 100, water: 150, internet: 100,
      gasoline: 200, charcoal: 96, wood: 90, aluminum: 28, electricity: 300,
      accountant: 250, cleaning: 60, monthlyCovers: 1, laborRatePerHour: 1.62,
      staff: [
        { role: 'Jefe de cocina',     salary: 500, dailyHours: 12 },
        { role: 'Ayudante de cocina', salary: 450, dailyHours: 12 },
        { role: 'Ayudante de cocina', salary: 450, dailyHours: 12 },
      ],
    };
    Object.keys(months).forEach(mid => {
      const m = { ...months[mid] };

      // INSUMOS: combina el SEED con los cambios del usuario.
      // Si el usuario editó un insumo del SEED (purchasePrice, category, etc.), se preservan sus cambios.
      // Solo se agregan campos nuevos del SEED que el usuario no tenga todavía.
      const savedInsumoMap = new Map((m.insumos || []).map(x => [x.id, x]));
      const mergedSeedInsumos = SD.SEED_INSUMOS.map(seedIns => {
        const saved = savedInsumoMap.get(seedIns.id);
        if (saved) {
          // Preserva todo lo que el usuario guardó; solo agrega campos del seed que falten
          return { ...seedIns, ...saved };
        }
        return seedIns;
      });
      const userInsumos = (m.insumos || []).filter(x => !seedInsumoIds.has(x.id));
      m.insumos = [...mergedSeedInsumos, ...userInsumos];

      // SUB-RECETAS: igual que insumos — preserva edits del usuario sobre el seed
      const savedSubMap = new Map((m.subrecetas || []).map(x => [x.id, x]));
      const mergedSeedSubs = SD.SEED_SUBRECETAS.map(seedSub => {
        const saved = savedSubMap.get(seedSub.id);
        return saved ? { ...seedSub, ...saved } : seedSub;
      });
      const userSubs = (m.subrecetas || []).filter(x => !seedSubIds.has(x.id));
      m.subrecetas = [...mergedSeedSubs, ...userSubs];

      // RECETAS: solo agrega las del SEED que el usuario NO haya eliminado nunca.
      const deletedIds = new Set(m.deletedRecetaIds || []);
      const existingRecetaIds = new Set((m.recetas || []).map(x => x.id));
      const seedToAdd = SD.SEED_RECETAS.filter(r => !existingRecetaIds.has(r.id) && !deletedIds.has(r.id));
      m.recetas = [...(m.recetas || []), ...seedToAdd];

      // COSTOS FIJOS: inyecta campos nuevos si no existen, preserva los que el usuario ya editó
      m.fixedCosts = { ...defaultCosts, ...(m.fixedCosts || {}) };
      months[mid] = m;
    });
    // CONFIG: inyecta defaults si no existe
    if (!s.config) s = { ...s, config: { tasaImpuesto: 13, tasaComision: 3 } };
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

  // Polling cada 5 s — detecta cambios de otros usuarios
  // Usa una ref para acceder al store actual sin crear dependencias en el efecto
  const storeRef = useRef(null);
  useEffect(() => { storeRef.current = store; }, [store]);

  useEffect(() => {
    const fetchRemote = () => {
      fetch('/api/store')
        .then(r => r.json())
        .then(data => {
          if (data && data.savedAt && data.savedAt > lastSavedAt.current) {
            lastSavedAt.current = data.savedAt;
            remoteUpdate.current = true;
            // Aplica mergeSeeds sobre los datos remotos para incorporar nuevos seeds
            const merged = mergeSeeds(data);
            setStore(merged);
            setViewMonthId(v => merged.months[v] ? v : merged.currentMonthId);
          }
        })
        .catch(() => {});
    };
    const id = setInterval(fetchRemote, 5000);
    // También sincroniza cuando el usuario vuelve a la pestaña
    window.addEventListener('focus', fetchRemote);
    return () => { clearInterval(id); window.removeEventListener('focus', fetchRemote); };
  }, []);

  // Atajo de teclado
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setShowMonthPicker(false); }
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
  const { insumos = [], subrecetas = [], recetas = [], fixedCosts = {}, gastos, empleados, ventas } = monthData;
  const config = store.config || { tasaImpuesto: 13, tasaComision: 3 };

  // Setters
  const setConfig = (v) => setStore(s => ({ ...s, config: v }));
  const setVentas = (v) => setStore(s => {
    const cur = s.months[s.currentMonthId];
    const next = typeof v === 'function' ? v(cur.ventas || []) : v;
    return { ...s, months: { ...s.months, [s.currentMonthId]: { ...cur, ventas: next } } };
  });
  const setGastos = (v) => setStore(s => {
    const cur = s.months[s.currentMonthId];
    const next = typeof v === 'function' ? v(cur.gastos || {}) : v;
    return { ...s, months: { ...s.months, [s.currentMonthId]: { ...cur, gastos: next } } };
  });
  const setEmpleados = (v) => setStore(s => {
    const cur = s.months[s.currentMonthId];
    const next = typeof v === 'function' ? v(cur.empleados || {}) : v;
    return { ...s, months: { ...s.months, [s.currentMonthId]: { ...cur, empleados: next } } };
  });

  // Guarda pago + gasto en una sola operación atómica
  const onSavePago = (pago, gastoEntry) => setStore(s => {
    const cur = s.months[s.currentMonthId];
    const emp = { ...(cur.empleados || {}), pagos: [...(cur.empleados?.pagos || []), pago] };
    const gas = { ...(cur.gastos || {}), formal: [...(cur.gastos?.formal || []), gastoEntry] };
    return { ...s, months: { ...s.months, [s.currentMonthId]: { ...cur, empleados: emp, gastos: gas } } };
  });

  const onRemovePago = (pagoId) => setStore(s => {
    const cur = s.months[s.currentMonthId];
    const emp = { ...(cur.empleados || {}), pagos: (cur.empleados?.pagos || []).filter(x => x.id !== pagoId) };
    const gastoId = '_g' + pagoId.slice(1);
    const gas = { ...(cur.gastos || {}), formal: (cur.gastos?.formal || []).filter(x => x.id !== gastoId && x.pagoEmpleadoId !== pagoId) };
    return { ...s, months: { ...s.months, [s.currentMonthId]: { ...cur, empleados: emp, gastos: gas } } };
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
            ventas: [],
            gastos: { caja: [], formal: [] },
            empleados: { lista: cur.empleados?.lista || [], pagos: [], ausencias: [] },
          }
        }
      };
    });
    setViewMonthId(newId);
  };

  const navItems = [
    { id: 'ventas', label: 'Ventas', icon: 'trending' },
    { id: 'gastos', label: 'Gastos', icon: 'wallet' },

    { id: 'empleados', label: 'Empleados', icon: 'users' },
    { id: 'configuracion', label: 'Configuración', icon: 'settings' },
  ];

  const crumbLabel = navItems.find(n => n.id === page)?.label || 'Ventas';

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
            <div className="brand-sub">Control</div>
          </div>
        </div>

        <div className="nav-section">Menú</div>
        {navItems.map(item => (
          <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}>
            <Icon name={item.icon} size={15} />
            {item.label}
          </button>
        ))}

        <div className="sidebar-foot">
          <div className="avatar">PB</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="who">Pig Brothers BBQ</div>
            <div className="role">Control operativo</div>
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
            {page === 'ventas' && <Ventas ventas={ventas} setVentas={setVentas} monthLabel={monthData.label} config={config} />}
            {page === 'gastos' && <GastosPage gastos={gastos} setGastos={setGastos} />}

            {page === 'empleados' && <EmpleadosPage store={store} setStore={setStore} config={config} />}
            {page === 'configuracion' && <Configuracion config={config} setConfig={setConfig} />}
          </div>
        </div>
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
