// Gastos — Registro de gastos del negocio
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
    nota: [item.Proveedor, item['Razón social']].filter(Boolean).join(' · '),
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
  const [form, setForm] = useState({});
  const inputRef = useRef(null);

  const items = [...(gastos?.formal || []), ...sheetItems].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const filtered = filtroCategoria ? items.filter(i => i.categoria === filtroCategoria) : items;

  const totalGeneral = items.reduce((a, i) => a + (i.monto || 0), 0);
  const totalFiltrado = filtered.reduce((a, i) => a + (i.monto || 0), 0);

  // Resumen por categoría
  const porCategoria = items.reduce((acc, item) => {
    const cat = item.categoria || 'Otro';
    acc[cat] = (acc[cat] || 0) + (item.monto || 0);
    return acc;
  }, {});

  const uid = () => '_' + Math.random().toString(36).slice(2, 9);
  const hoy = () => new Date().toISOString().slice(0, 10);

  const openNew = (tipoRegistro = 'sin_factura') => {
    setEditId(null);
    setForm({
      tipoRegistro,
      fecha: hoy(),
      descripcion: '',
      categoria: CATEGORIAS[0],
      monto: '',
      metodoPago: 'Efectivo',
      comprobante: '',
      nota: '',
    });
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
      return {
        ...prev,
        formal: editId ? list.map(x => x.id === editId ? item : x) : [...list, item],
      };
    });
    setShowForm(false);
    setEditId(null);
  };

  const remove = (id) => {
    setGastos(prev => ({ ...prev, formal: (prev?.formal || []).filter(x => x.id !== id) }));
  };

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Estilos
  const fl = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 13 };
  const lbl = (t) => <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>{t}</label>;

  const maxBar = Math.max(...Object.values(porCategoria), 1);

  return (
    <div>
      {/* Cabecera */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Gastos</h1>
          <div className="page-sub">Control de gastos del negocio</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => openNew('sin_factura')}>
            <Icon name="plus" size={14} /> Gasto sin factura
          </button>
          <button className="btn btn-primary" onClick={() => openNew('con_factura')}>
            <Icon name="plus" size={14} /> Gasto con factura
          </button>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', marginBottom:16, border:'1px solid var(--border)', borderRadius:8, background:'var(--surface-2)', fontSize:12 }}>
        <span style={{ width:8, height:8, borderRadius:'50%', background: sheetStatus === 'error' ? 'var(--bad)' : sheetStatus === 'loading' ? 'var(--warn)' : 'var(--good)' }} />
        <span style={{ color:'var(--text-2)' }}>
          {sheetStatus === 'error' ? 'No se pudo conectar con Google Sheets' : sheetStatus === 'loading' ? 'Sincronizando Google Sheets…' : `${sheetItems.length} gastos importados de Google Sheets`}
        </span>
        {sheetUpdatedAt && sheetStatus === 'ok' && <span style={{ color:'var(--text-3)' }}>Actualizado {new Date(sheetUpdatedAt).toLocaleTimeString('es-SV', { hour:'2-digit', minute:'2-digit' })}</span>}
        <button className="btn btn-sm" onClick={onSyncSheet} disabled={sheetStatus === 'loading'} style={{ marginLeft:'auto' }}>
          <Icon name="refresh" size={13} /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        <div className="kpi">
          <div className="kpi-label">Total del mes</div>
          <div className="kpi-value">${totalGeneral.toFixed(2)}</div>
          <div className="kpi-foot"><span className="kpi-target">{items.length} registros</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Categorías con gasto</div>
          <div className="kpi-value">{Object.keys(porCategoria).length}</div>
          <div className="kpi-foot"><span className="kpi-target">de {CATEGORIAS.length} disponibles</span></div>
        </div>
      </div>

      <div className="two-col" style={{ gap: 16 }}>
        {/* Panel izquierdo: tabla */}
        <div className="card">
          {/* Filtro + resumen */}
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Filtrar:</span>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--surface)' }}>
              <option value="">Todas las categorías</option>
              {[...new Set([...CATEGORIAS, ...Object.keys(porCategoria)])].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>
              ${totalFiltrado.toFixed(2)}
              {filtroCategoria && <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}> / ${totalGeneral.toFixed(2)} total</span>}
            </span>
          </div>

          {/* Tabla */}
          <div style={{ overflowX: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                No hay gastos registrados. Presiona "Registrar gasto" para agregar uno.
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Método de pago</th>
                    <th>Comprobante</th>
                    <th className="right">Monto</th>
                    <th className="center"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{item.fecha}</td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{item.descripcion}</div>
                        {item.nota && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{item.nota}</div>}
                      </td>
                      <td>
                        <span className="tag">{item.categoria}</span>
                        {item.origen && <div style={{ fontSize:10, color:'var(--text-3)', marginTop:3 }}>{item.origen}</div>}
                      </td>
                      <td style={{ fontSize: 12 }}>{item.metodoPago || '—'}</td>
                      <td style={{ fontSize: 12, color: item.comprobante ? 'var(--good)' : 'var(--text-3)' }}>
                        {item.comprobante || 'Sin comprobante'}
                      </td>
                      <td className="right" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${(item.monto || 0).toFixed(2)}</td>
                      <td className="center">
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          {!item.origen && <>
                            <button className="icon-btn" onClick={() => openEdit(item)} data-tip="Editar">
                              <Icon name="edit" size={13} />
                            </button>
                            <button className="icon-btn" onClick={() => remove(item.id)} data-tip="Eliminar"
                              style={{ color: 'var(--bad)' }}>
                              <Icon name="trash" size={13} />
                            </button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel derecho: resumen por categoría */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Por categoría</div>
                <div className="card-sub">Gastos del mes</div>
              </div>
            </div>
            <div className="card-body">
              {Object.keys(porCategoria).length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>Sin datos</div>
              ) : (
                Object.entries(porCategoria)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, total]) => (
                    <div key={cat} className="bar-row">
                      <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(total / maxBar) * 100}%` }} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, textAlign: 'right' }}>${total.toFixed(0)}</div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Últimos movimientos */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Últimos 5 movimientos</div>
            </div>
            <div className="card-body" style={{ padding: '0' }}>
              {items.slice(0, 5).length === 0 ? (
                <div style={{ padding: 16, fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>Sin movimientos</div>
              ) : (
                items.slice(0, 5).map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < 4 ? '1px solid var(--border)' : 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bad-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name="arrow-up" size={13} style={{ color: 'var(--bad)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.descripcion}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.fecha} · {item.categoria}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--bad)', flexShrink: 0 }}>-${(item.monto || 0).toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer / Formulario */}
      {showForm && (
        <>
          <div className="drawer-overlay" onClick={() => setShowForm(false)} />
          <div className="drawer">
            <div className="drawer-head">
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{editId ? 'Editar gasto' : (form.tipoRegistro === 'con_factura' ? 'Registrar gasto con factura' : 'Registrar gasto sin factura')}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                  {form.tipoRegistro === 'con_factura' ? 'Registro completo con comprobante o factura' : 'Registro simplificado sin comprobante fiscal'}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowForm(false)}><Icon name="close" size={15} /></button>
            </div>
            <div className="drawer-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    {lbl('Fecha')}
                    <input ref={inputRef} type="date" value={form.fecha || ''} onChange={e => upd('fecha', e.target.value)} style={fl} />
                  </div>
                  <div>
                    {lbl('Monto (USD)')}
                    <input type="number" min="0" step="0.01" placeholder="0.00"
                      value={form.monto || ''} onChange={e => upd('monto', e.target.value)} style={{ ...fl, fontFamily: 'var(--font-mono)' }} />
                  </div>
                </div>

                <div>
                  {lbl('Descripción')}
                  <input type="text" placeholder="¿En qué se gastó?" value={form.descripcion || ''}
                    onChange={e => upd('descripcion', e.target.value)} style={fl} />
                </div>

                <div>
                  {lbl('Categoría')}
                  <select value={form.categoria || CATEGORIAS[0]} onChange={e => upd('categoria', e.target.value)} style={fl}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  {lbl('Método de pago')}
                  <select value={form.metodoPago || 'Efectivo'} onChange={e => upd('metodoPago', e.target.value)} style={fl}>
                    {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {form.tipoRegistro === 'con_factura' && (
                  <div>
                    {lbl('Número de comprobante / factura')}
                    <input type="text" placeholder="Ej: FAC-00123" value={form.comprobante || ''}
                      onChange={e => upd('comprobante', e.target.value)} style={fl} />
                  </div>
                )}

                <div>
                  {lbl('Nota (opcional)')}
                  <textarea rows={3} placeholder="Observaciones adicionales..."
                    value={form.nota || ''} onChange={e => upd('nota', e.target.value)}
                    style={{ ...fl, resize: 'vertical' }} />
                </div>
              </div>
            </div>
            <div className="drawer-foot">
              <button className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}
                disabled={!form.descripcion?.trim() || !form.monto || (form.tipoRegistro === 'con_factura' && !form.comprobante?.trim())}>
                {editId ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

window.GastosPage = GastosPage;
