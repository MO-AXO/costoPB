// Gastos — Registro manual y sincronización con Google Sheets
const GastosPage = ({ gastos, setGastos, sheetGastos = [], sheetStatus, sheetUpdatedAt, onSyncSheet }) => {
  const { useState, useRef } = React;

  const CATEGORIAS = [
    'Gas', 'Carnes', 'Bebidas y licores', 'Empaques y desechables', 'Vegetales',
    'Agua', 'Luz', 'Internet', 'Limpieza y desinfección', 'Servicios contables y legales',
    'Marketing', 'Mantenimiento de vehículos', 'Combustible', 'Materia Prima producción',
    'Mobiliario y equipo de cocina', 'Planilla', 'ISSS', 'AFP',
    'Programa de fidelidad de clientes', 'POS', 'Equipamiento de personal',
    'Alquiler', 'Condimentos', 'Panes', 'Papas Fritas', 'Materia Prima ahumar',
    'Pago Mano de Obra EXTRA', 'Merchandising', 'Materiales de Construcción', 'Nómina', 'Otro',
  ];
  const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque'];
  const CATEGORIA_SHEET = {
    'Carnes y proteínas': 'Carnes',
    'Alquiler y servicios': 'Alquiler',
    'Abarrotes e insumos': 'Materia Prima producción',
    'Pan y papas': 'Panes',
    'Desechables y empaque': 'Empaques y desechables',
    'Combustible y vehículo': 'Combustible',
    'Verduras y frutas': 'Vegetales',
    'Bebidas': 'Bebidas y licores',
    'Administración y oficina': 'Servicios contables y legales',
    'Gas': 'Gas',
    'Otros': 'Otro',
    'Limpieza': 'Limpieza y desinfección',
    'Mantenimiento y equipo': 'Mobiliario y equipo de cocina',
  };
  const sheetItems = sheetGastos.map((item, index) => ({
    id: `sheet-${item['Código de generación'] || item['Número de control'] || index}`,
    fecha: item.Fecha,
    descripcion: item.Descripción || item.Proveedor || 'Gasto importado',
    categoria: CATEGORIA_SHEET[item.Categoría] || 'Otro',
    categoriaOriginal: item.Categoría || '',
    monto: Number(item['Total ($)']) || 0,
    metodoPago: 'Transferencia',
    comprobante: item['Número de control'] || '',
    nota: item['Razón social'] || '',
    proveedor: item.Proveedor || '',
    tipoDocumento: item['Tipo de documento'] || '',
    subtotal: Number(item['Subtotal sin IVA ($)']) || 0,
    iva: Number(item['IVA ($)']) || 0,
    otrosCargos: Number(item['Otros cargos ($)']) || 0,
    codigoGeneracion: item['Código de generación'] || '',
    origen: 'Google Sheets',
  }));

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroOrigen, setFiltroOrigen] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const [form, setForm] = useState({});
  const inputRef = useRef(null);

  const items = [...(gastos?.formal || []), ...sheetItems].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const normalizar = (value) => (value || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = items.filter(item => {
    if (filtroCategoria && item.categoria !== filtroCategoria) return false;
    if (filtroOrigen === 'sheet' && !item.origen) return false;
    if (filtroOrigen === 'manual' && item.origen) return false;
    if (busqueda) {
      const text = normalizar([item.descripcion, item.proveedor, item.nota, item.comprobante, item.categoria].join(' '));
      if (!text.includes(normalizar(busqueda))) return false;
    }
    return true;
  });
  const visibleItems = filtered.slice(0, visibleCount);
  const totalGeneral = items.reduce((a, i) => a + (i.monto || 0), 0);
  const totalFiltrado = filtered.reduce((a, i) => a + (i.monto || 0), 0);
  const totalSheet = sheetItems.reduce((a, i) => a + i.monto, 0);
  const totalIva = sheetItems.reduce((a, i) => a + i.iva, 0);
  const proveedores = new Set(items.map(i => i.proveedor).filter(Boolean)).size;
  const porCategoria = items.reduce((acc, item) => {
    const cat = item.categoria || 'Otro';
    acc[cat] = (acc[cat] || 0) + (item.monto || 0);
    return acc;
  }, {});
  const topCategorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
  const maxBar = Math.max(...Object.values(porCategoria), 1);
  const hasFilters = Boolean(filtroCategoria || filtroOrigen || busqueda);

  const uid = () => '_' + Math.random().toString(36).slice(2, 9);
  const hoy = () => new Date().toISOString().slice(0, 10);
  const money = (value) => '$' + (value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatFecha = (fecha) => {
    if (!fecha) return '—';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  };
  const clearFilters = () => {
    setBusqueda('');
    setFiltroCategoria('');
    setFiltroOrigen('');
    setVisibleCount(50);
  };

  const openNew = (tipoRegistro = 'sin_factura') => {
    setEditId(null);
    setForm({ tipoRegistro, fecha: hoy(), descripcion: '', categoria: CATEGORIAS[0], monto: '', metodoPago: 'Efectivo', comprobante: '', nota: '' });
    setShowForm(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };
  const openEdit = (item) => {
    setEditId(item.id);
    setForm({ ...item, tipoRegistro: item.tipoRegistro || (item.comprobante ? 'con_factura' : 'sin_factura') });
    setShowForm(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };
  const save = () => {
    if (!form.descripcion?.trim() || !form.monto) return;
    if (form.tipoRegistro === 'con_factura' && !form.comprobante?.trim()) return;
    const item = { ...form, monto: parseFloat(form.monto) || 0, id: editId || uid() };
    setGastos(prev => {
      const list = prev?.formal || [];
      return { ...prev, formal: editId ? list.map(x => x.id === editId ? item : x) : [...list, item] };
    });
    setShowForm(false);
    setEditId(null);
  };
  const remove = (id) => setGastos(prev => ({ ...prev, formal: (prev?.formal || []).filter(x => x.id !== id) }));
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const fl = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 13 };
  const lbl = (t) => <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>{t}</label>;

  return (
    <div className="gastos-page">
      <style>{`
        .gastos-page{ --gastos-muted: var(--text-3); }
        .gastos-sync{ display:flex; align-items:center; gap:10px; padding:10px 14px; margin-bottom:16px; border:1px solid var(--border); border-radius:8px; background:var(--surface); font-size:12px; }
        .gastos-kpis{ display:grid; grid-template-columns:1.35fr repeat(3,1fr); gap:12px; margin-bottom:18px; }
        .gastos-kpi{ padding:15px 16px; min-width:0; }
        .gastos-kpi.primary{ background:var(--sidebar-bg); color:#fff; border-color:var(--sidebar-bg); }
        .gastos-kpi.primary .kpi-label, .gastos-kpi.primary .kpi-target{ color:rgba(255,255,255,.62); }
        .gastos-kpi .kpi-value{ font-size:24px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .gastos-layout{ display:grid; grid-template-columns:minmax(0,1fr) 280px; gap:16px; align-items:start; }
        .gastos-filters{ display:grid; grid-template-columns:minmax(220px,1fr) 190px 150px auto; gap:8px; padding:12px 14px; border-bottom:1px solid var(--border); background:var(--surface-2); }
        .gastos-search{ position:relative; }
        .gastos-search .ico{ position:absolute; left:10px; top:9px; color:var(--text-3); }
        .gastos-search input{ padding-left:32px !important; }
        .gastos-filter-input{ width:100%; height:34px; padding:6px 10px; border:1px solid var(--border); border-radius:6px; background:var(--surface); font-size:12px; outline:none; }
        .gastos-filter-input:focus{ border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); }
        .gastos-table-wrap{ overflow-x:auto; max-height:680px; overflow-y:auto; }
        .gastos-table{ table-layout:fixed; min-width:850px; }
        .gastos-table thead th{ z-index:2; padding:10px 12px; }
        .gastos-table tbody td{ padding:11px 12px; }
        .gastos-table .expense-row{ cursor:pointer; }
        .gastos-table .expense-row:hover{ background:var(--accent-soft); }
        .gastos-description{ font-size:13px; font-weight:500; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .gastos-provider{ font-size:11px; color:var(--text-3); margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .gastos-doc{ font-family:var(--font-mono); font-size:10px; color:var(--text-2); word-break:break-all; line-height:1.4; }
        .gastos-detail td{ background:var(--surface-2); padding:14px 18px !important; }
        .gastos-detail-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .gastos-detail-label{ font-size:10px; text-transform:uppercase; letter-spacing:.04em; color:var(--text-3); margin-bottom:3px; }
        .gastos-detail-value{ font-size:12px; color:var(--text-2); word-break:break-word; }
        .gastos-side{ display:flex; flex-direction:column; gap:16px; position:sticky; top:16px; }
        .gastos-category{ padding:8px 0; }
        .gastos-category-head{ display:flex; justify-content:space-between; gap:8px; font-size:12px; margin-bottom:5px; }
        .gastos-category-name{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-2); }
        .gastos-table-footer{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 14px; border-top:1px solid var(--border); background:var(--surface-2); font-size:12px; color:var(--text-3); }
        @media(max-width:1150px){ .gastos-layout{ grid-template-columns:1fr; } .gastos-side{ position:static; display:grid; grid-template-columns:1fr 1fr; } .gastos-kpis{ grid-template-columns:repeat(2,1fr); } }
        @media(max-width:760px){ .gastos-kpis{ grid-template-columns:1fr 1fr; } .gastos-filters{ grid-template-columns:1fr; } .gastos-side{ grid-template-columns:1fr; } .gastos-detail-grid{ grid-template-columns:1fr 1fr; } .gastos-sync{ flex-wrap:wrap; } }
      `}</style>

      <div className="page-head">
        <div>
          <h1 className="page-title">Gastos</h1>
          <div className="page-sub">Compras, facturas y gastos operativos del negocio</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => openNew('sin_factura')}><Icon name="plus" size={14} /> Sin factura</button>
          <button className="btn btn-primary" onClick={() => openNew('con_factura')}><Icon name="plus" size={14} /> Con factura</button>
        </div>
      </div>

      <div className="gastos-sync">
        <span style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background: sheetStatus === 'error' ? 'var(--bad)' : sheetStatus === 'loading' ? 'var(--warn)' : 'var(--good)' }} />
        <Icon name="database" size={14} style={{ color:'var(--text-3)' }} />
        <span style={{ color:'var(--text-2)', fontWeight:500 }}>
          {sheetStatus === 'error' ? 'Sin conexión con Google Sheets' : sheetStatus === 'loading' ? 'Sincronizando Google Sheets…' : 'Google Sheets conectado'}
        </span>
        {sheetStatus === 'ok' && <span style={{ color:'var(--text-3)' }}>{sheetItems.length} registros en este mes{sheetUpdatedAt ? ` · ${new Date(sheetUpdatedAt).toLocaleTimeString('es-SV', { hour:'2-digit', minute:'2-digit' })}` : ''}</span>}
        <button className="btn btn-sm" onClick={onSyncSheet} disabled={sheetStatus === 'loading'} style={{ marginLeft:'auto' }}><Icon name="refresh" size={13} /> Actualizar</button>
      </div>

      <div className="gastos-kpis">
        <div className="kpi gastos-kpi primary">
          <div className="kpi-label">Gasto total del mes</div>
          <div className="kpi-value">{money(totalGeneral)}</div>
          <div className="kpi-foot"><span className="kpi-target">{items.length} movimientos registrados</span></div>
        </div>
        <div className="kpi gastos-kpi">
          <div className="kpi-label">Importado de Sheets</div>
          <div className="kpi-value">{money(totalSheet)}</div>
          <div className="kpi-foot"><span className="kpi-target">{sheetItems.length} documentos</span></div>
        </div>
        <div className="kpi gastos-kpi">
          <div className="kpi-label">IVA en compras</div>
          <div className="kpi-value">{money(totalIva)}</div>
          <div className="kpi-foot"><span className="kpi-target">Según documentos importados</span></div>
        </div>
        <div className="kpi gastos-kpi">
          <div className="kpi-label">Proveedores</div>
          <div className="kpi-value">{proveedores}</div>
          <div className="kpi-foot"><span className="kpi-target">{topCategorias.length} categorías con gasto</span></div>
        </div>
      </div>

      <div className="gastos-layout">
        <div className="card" style={{ minWidth:0, overflow:'hidden' }}>
          <div className="gastos-filters">
            <div className="gastos-search">
              <Icon name="search" size={14} />
              <input className="gastos-filter-input" value={busqueda} onChange={e => { setBusqueda(e.target.value); setVisibleCount(50); }} placeholder="Buscar proveedor, gasto o documento…" />
            </div>
            <select className="gastos-filter-input" value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setVisibleCount(50); }}>
              <option value="">Todas las categorías</option>
              {[...new Set([...CATEGORIAS, ...Object.keys(porCategoria)])].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="gastos-filter-input" value={filtroOrigen} onChange={e => { setFiltroOrigen(e.target.value); setVisibleCount(50); }}>
              <option value="">Todos los orígenes</option>
              <option value="sheet">Google Sheets</option>
              <option value="manual">Registro manual</option>
            </select>
            <button className="btn btn-sm" onClick={clearFilters} disabled={!hasFilters} style={{ justifyContent:'center' }}><Icon name="close" size={12} /> Limpiar</button>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, padding: '9px 14px', borderBottom:'1px solid var(--border)', fontSize:12 }}>
            <span style={{ color:'var(--text-2)', fontWeight:500 }}>{filtered.length} gastos</span>
            {hasFilters && <span style={{ color:'var(--text-3)' }}>de {items.length} totales</span>}
            <span className="num" style={{ marginLeft:'auto', fontWeight:600 }}>{money(totalFiltrado)}</span>
          </div>

          <div className="gastos-table-wrap">
            {filtered.length === 0 ? (
              <div style={{ padding:'48px 20px', textAlign:'center' }}>
                <Icon name="search" size={24} style={{ color:'var(--text-3)' }} />
                <div style={{ fontSize:14, fontWeight:500, marginTop:10 }}>No encontramos gastos</div>
                <div style={{ fontSize:12, color:'var(--text-3)', marginTop:4 }}>Prueba con otros filtros o registra un gasto manual.</div>
                {hasFilters && <button className="btn btn-sm" onClick={clearFilters} style={{ marginTop:14 }}>Limpiar filtros</button>}
              </div>
            ) : (
              <table className="tbl gastos-table">
                <colgroup>
                  <col style={{ width:88 }} />
                  <col />
                  <col style={{ width:145 }} />
                  <col style={{ width:180 }} />
                  <col style={{ width:105 }} />
                  <col style={{ width:42 }} />
                </colgroup>
                <thead><tr><th>Fecha</th><th>Proveedor y descripción</th><th>Categoría</th><th>Documento</th><th className="right">Total</th><th></th></tr></thead>
                <tbody>
                  {visibleItems.map(item => (
                    <React.Fragment key={item.id}>
                      <tr className="expense-row" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                        <td style={{ whiteSpace:'nowrap' }}>
                          <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-2)' }}>{formatFecha(item.fecha)}</div>
                          {item.origen && <div style={{ fontSize:9, color:'var(--accent-text)', marginTop:4 }}>SHEETS</div>}
                        </td>
                        <td style={{ minWidth:0 }}>
                          {item.proveedor && <div style={{ fontSize:12, fontWeight:600, marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.proveedor}</div>}
                          <div className="gastos-description">{item.descripcion}</div>
                          {!item.proveedor && item.nota && <div className="gastos-provider">{item.nota}</div>}
                        </td>
                        <td><span className="tag" style={{ maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis' }}>{item.categoria}</span></td>
                        <td>
                          {item.tipoDocumento && <div style={{ fontSize:10, color:'var(--text-3)', marginBottom:3 }}>{item.tipoDocumento}</div>}
                          <div className="gastos-doc">{item.comprobante || 'Sin comprobante'}</div>
                        </td>
                        <td className="right"><span className="num" style={{ fontWeight:600, fontSize:13 }}>{money(item.monto)}</span></td>
                        <td className="center" onClick={e => e.stopPropagation()}>
                          {item.origen ? <Icon name="chevron" size={13} style={{ color:'var(--text-3)', transform: expandedId === item.id ? 'rotate(180deg)' : 'rotate(90deg)' }} /> : (
                            <div style={{ display:'flex', gap:2 }}>
                              <button className="icon-btn" onClick={() => openEdit(item)} data-tip="Editar"><Icon name="edit" size={13} /></button>
                              <button className="icon-btn" onClick={() => remove(item.id)} data-tip="Eliminar" style={{ color:'var(--bad)' }}><Icon name="trash" size={13} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {expandedId === item.id && (
                        <tr className="gastos-detail"><td colSpan={6}>
                          <div className="gastos-detail-grid">
                            <div><div className="gastos-detail-label">Subtotal sin IVA</div><div className="gastos-detail-value num">{money(item.subtotal)}</div></div>
                            <div><div className="gastos-detail-label">IVA</div><div className="gastos-detail-value num">{money(item.iva)}</div></div>
                            <div><div className="gastos-detail-label">Otros cargos</div><div className="gastos-detail-value num">{money(item.otrosCargos)}</div></div>
                            <div><div className="gastos-detail-label">Categoría original</div><div className="gastos-detail-value">{item.categoriaOriginal || item.categoria}</div></div>
                            <div style={{ gridColumn:'1 / -1' }}><div className="gastos-detail-label">Razón social</div><div className="gastos-detail-value">{item.nota || item.proveedor || '—'}</div></div>
                            {item.codigoGeneracion && <div style={{ gridColumn:'1 / -1' }}><div className="gastos-detail-label">Código de generación</div><div className="gastos-detail-value num">{item.codigoGeneracion}</div></div>}
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {filtered.length > 0 && <div className="gastos-table-footer">
            <span>Mostrando {visibleItems.length} de {filtered.length}</span>
            {visibleCount < filtered.length && <button className="btn btn-sm" onClick={() => setVisibleCount(c => c + 50)}>Mostrar 50 más</button>}
          </div>}
        </div>

        <div className="gastos-side">
          <div className="card">
            <div className="card-head"><div><div className="card-title">Distribución por categoría</div><div className="card-sub">Participación sobre el gasto total</div></div></div>
            <div className="card-body" style={{ paddingTop:10 }}>
              {topCategorias.length === 0 ? <div style={{ fontSize:13, color:'var(--text-3)', textAlign:'center', padding:'16px 0' }}>Sin datos</div> : topCategorias.slice(0, 8).map(([cat, total]) => (
                <div key={cat} className="gastos-category">
                  <div className="gastos-category-head"><span className="gastos-category-name" title={cat}>{cat}</span><span className="num" style={{ fontWeight:600 }}>{money(total)}</span></div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div className="bar-track" style={{ flex:1, height:6 }}><div className="bar-fill" style={{ width:`${(total / maxBar) * 100}%` }} /></div>
                    <span className="num" style={{ width:38, textAlign:'right', fontSize:10, color:'var(--text-3)' }}>{totalGeneral ? (total / totalGeneral * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><div className="card-title">Actividad reciente</div><div className="card-sub">Últimos movimientos del mes</div></div></div>
            <div className="card-body" style={{ padding:0 }}>
              {items.slice(0, 5).map((item, i) => (
                <div key={item.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'11px 14px', borderBottom: i < Math.min(items.length, 5) - 1 ? '1px solid var(--border)' : 0 }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:'var(--bad-soft)', display:'grid', placeItems:'center', flexShrink:0 }}><Icon name="arrow-up" size={12} style={{ color:'var(--bad)' }} /></div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.proveedor || item.descripcion}</div>
                      <div style={{ fontSize:10, color:'var(--text-3)', marginTop:2 }}>{formatFecha(item.fecha)}</div>
                    </div>
                    <div className="num" style={{ fontWeight:600, fontSize:11, color:'var(--bad)', flexShrink:0 }}>−{money(item.monto)}</div>
                </div>
              ))}
              {items.length === 0 && <div style={{ padding:20, textAlign:'center', fontSize:12, color:'var(--text-3)' }}>Sin movimientos</div>}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <>
          <div className="drawer-overlay" onClick={() => setShowForm(false)} />
          <div className="drawer">
            <div className="drawer-head">
              <div>
                <div style={{ fontSize:16, fontWeight:600 }}>{editId ? 'Editar gasto' : (form.tipoRegistro === 'con_factura' ? 'Registrar gasto con factura' : 'Registrar gasto sin factura')}</div>
                <div style={{ fontSize:12, color:'var(--text-3)', marginTop:3 }}>{form.tipoRegistro === 'con_factura' ? 'Registro completo con comprobante o factura' : 'Registro simplificado sin comprobante fiscal'}</div>
              </div>
              <button className="icon-btn" onClick={() => setShowForm(false)}><Icon name="close" size={15} /></button>
            </div>
            <div className="drawer-body">
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>{lbl('Fecha')}<input ref={inputRef} type="date" value={form.fecha || ''} onChange={e => upd('fecha', e.target.value)} style={fl} /></div>
                  <div>{lbl('Monto (USD)')}<input type="number" min="0" step="0.01" placeholder="0.00" value={form.monto || ''} onChange={e => upd('monto', e.target.value)} style={{ ...fl, fontFamily:'var(--font-mono)' }} /></div>
                </div>
                <div>{lbl('Descripción')}<input type="text" placeholder="¿En qué se gastó?" value={form.descripcion || ''} onChange={e => upd('descripcion', e.target.value)} style={fl} /></div>
                <div>{lbl('Categoría')}<select value={form.categoria || CATEGORIAS[0]} onChange={e => upd('categoria', e.target.value)} style={fl}>{CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div>{lbl('Método de pago')}<select value={form.metodoPago || 'Efectivo'} onChange={e => upd('metodoPago', e.target.value)} style={fl}>{METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                {form.tipoRegistro === 'con_factura' && <div>{lbl('Número de comprobante / factura')}<input type="text" placeholder="Ej: FAC-00123" value={form.comprobante || ''} onChange={e => upd('comprobante', e.target.value)} style={fl} /></div>}
                <div>{lbl('Nota (opcional)')}<textarea rows={3} placeholder="Observaciones adicionales..." value={form.nota || ''} onChange={e => upd('nota', e.target.value)} style={{ ...fl, resize:'vertical' }} /></div>
              </div>
            </div>
            <div className="drawer-foot">
              <button className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.descripcion?.trim() || !form.monto || (form.tipoRegistro === 'con_factura' && !form.comprobante?.trim())}>{editId ? 'Guardar cambios' : 'Registrar'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

window.GastosPage = GastosPage;
