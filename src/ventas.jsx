// Ventas — Registro de ingresos por documento
const Ventas = ({ ventas, setVentas, monthLabel, config }) => {
  const { useState, useRef, useMemo } = React;

  const TIPOS_DOC = ['Crédito Fiscal', 'Factura'];
  const CATEGORIAS = ['Restaurante', 'Evento', 'Pedidos Ya', 'Banquete'];
  const MEDIOS_PAGO = ['BAC', 'NICO', 'Pedidos Ya'];

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroMedio, setFiltroMedio] = useState('');
  const [sortBy, setSortBy] = useState('fecha');
  const [form, setForm] = useState({});
  const inputRef = useRef(null);

  const items = (ventas || []).slice().sort((a, b) => {
    if (sortBy === 'fecha') return b.fecha.localeCompare(a.fecha);
    if (sortBy === 'ingreso') return (b.ingresoTotal || 0) - (a.ingresoTotal || 0);
    if (sortBy === 'neto') return (b.ingresoNeto || 0) - (a.ingresoNeto || 0);
    return 0;
  });

  const filtered = items
    .filter(i => !filtroCategoria || i.categoria === filtroCategoria)
    .filter(i => !filtroMedio || i.medioPago === filtroMedio);

  // Totales
  const totales = useMemo(() => {
    const list = filtered;
    return {
      ingresoTotal: list.reduce((a, i) => a + (i.ingresoTotal || 0), 0),
      comision: list.reduce((a, i) => a + (i.comision || 0), 0),
      impuestos: list.reduce((a, i) => a + (i.impuestos || 0), 0),
      ingresoNeto: list.reduce((a, i) => a + (i.ingresoNeto || 0), 0),
    };
  }, [filtered]);

  const totalesGenerales = useMemo(() => {
    const list = ventas || [];
    return {
      ingresoTotal: list.reduce((a, i) => a + (i.ingresoTotal || 0), 0),
      comision: list.reduce((a, i) => a + (i.comision || 0), 0),
      impuestos: list.reduce((a, i) => a + (i.impuestos || 0), 0),
      ingresoNeto: list.reduce((a, i) => a + (i.ingresoNeto || 0), 0),
    };
  }, [ventas]);

  // Resumen por categoría
  const porCategoria = useMemo(() => {
    return CATEGORIAS.reduce((acc, cat) => {
      const list = (ventas || []).filter(i => i.categoria === cat);
      if (list.length > 0) {
        acc[cat] = {
          total: list.reduce((a, i) => a + (i.ingresoTotal || 0), 0),
          neto: list.reduce((a, i) => a + (i.ingresoNeto || 0), 0),
          count: list.length,
        };
      }
      return acc;
    }, {});
  }, [ventas]);

  // Resumen por medio de pago
  const porMedio = useMemo(() => {
    return MEDIOS_PAGO.reduce((acc, medio) => {
      const list = (ventas || []).filter(i => i.medioPago === medio);
      if (list.length > 0) {
        acc[medio] = {
          total: list.reduce((a, i) => a + (i.ingresoTotal || 0), 0),
          neto: list.reduce((a, i) => a + (i.ingresoNeto || 0), 0),
          count: list.length,
        };
      }
      return acc;
    }, {});
  }, [ventas]);

  const tasaImpuesto = config?.tasaImpuesto ?? 13;
  const tasaComision = config?.tasaComision ?? 3;

  const uid = () => '_' + Math.random().toString(36).slice(2, 9);
  const hoy = () => new Date().toISOString().slice(0, 10);

  const calcNeto = (total, comision, impuestos) =>
    (parseFloat(total) || 0) - (parseFloat(comision) || 0) - (parseFloat(impuestos) || 0);

  const calcFromTotal = (total) => {
    const t = parseFloat(total) || 0;
    return { comision: +(t * tasaComision / 100).toFixed(2), impuestos: +(t * tasaImpuesto / 100).toFixed(2) };
  };

  const openNew = () => {
    setEditId(null);
    setForm({
      fecha: hoy(),
      tipoDoc: TIPOS_DOC[0],
      categoria: CATEGORIAS[0],
      ingresoTotal: '',
      comision: '',
      impuestos: '',
      medioPago: MEDIOS_PAGO[0],
      nota: '',
    });
    setShowForm(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const openEdit = (item) => {
    setEditId(item.id);
    setForm({ ...item });
    setShowForm(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const save = () => {
    if (!form.ingresoTotal) return;
    const ingresoTotal = parseFloat(form.ingresoTotal) || 0;
    const comision = parseFloat(form.comision) || 0;
    const impuestos = parseFloat(form.impuestos) || 0;
    const item = {
      ...form,
      ingresoTotal,
      comision,
      impuestos,
      ingresoNeto: ingresoTotal - comision - impuestos,
      id: editId || uid(),
    };
    setVentas(prev => {
      const list = prev || [];
      return editId ? list.map(x => x.id === editId ? item : x) : [...list, item];
    });
    setShowForm(false);
    setEditId(null);
  };

  const remove = (id) => {
    setVentas(prev => (prev || []).filter(x => x.id !== id));
  };

  const upd = (k, v) => {
    if (k === 'ingresoTotal') {
      const calc = calcFromTotal(v);
      setForm(p => ({ ...p, ingresoTotal: v, comision: calc.comision, impuestos: calc.impuestos }));
    } else {
      setForm(p => ({ ...p, [k]: v }));
    }
  };

  const fmt$ = (n) => '$' + (n || 0).toFixed(2);
  const fmt$0 = (n) => '$' + Math.round(n || 0).toLocaleString();

  // Estilos
  const fl = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 13 };
  const lbl = (t) => <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>{t}</label>;

  const maxBar = Math.max(...Object.values(porCategoria).map(v => v.neto), 1);
  const maxBarMedio = Math.max(...Object.values(porMedio).map(v => v.neto), 1);

  const SortBtn = ({ id, label }) => (
    <button className={`btn btn-sm ${sortBy === id ? 'btn-primary' : 'btn-ghost'}`}
      onClick={() => setSortBy(id)} style={{ fontSize: 11 }}>
      {label}
    </button>
  );

  return (
    <div>
      {/* Cabecera */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Ventas del mes</h1>
          <div className="page-sub">Registro de ingresos · {monthLabel}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openNew}>
            <Icon name="plus" size={14} /> Registrar venta
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi">
          <div className="kpi-label">Ingreso Total</div>
          <div className="kpi-value">{fmt$0(totalesGenerales.ingresoTotal)}</div>
          <div className="kpi-foot"><span className="kpi-target">{(ventas || []).length} documentos</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Comisiones</div>
          <div className="kpi-value" style={{ color: 'var(--bad)' }}>{fmt$0(totalesGenerales.comision)}</div>
          <div className="kpi-foot"><span className="kpi-target">{totalesGenerales.ingresoTotal > 0 ? ((totalesGenerales.comision / totalesGenerales.ingresoTotal) * 100).toFixed(1) : '0.0'}% del ingreso</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Impuestos</div>
          <div className="kpi-value" style={{ color: 'var(--warn)' }}>{fmt$0(totalesGenerales.impuestos)}</div>
          <div className="kpi-foot"><span className="kpi-target">{totalesGenerales.ingresoTotal > 0 ? ((totalesGenerales.impuestos / totalesGenerales.ingresoTotal) * 100).toFixed(1) : '0.0'}% del ingreso</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Ingreso Neto</div>
          <div className="kpi-value" style={{ color: 'var(--good)' }}>{fmt$0(totalesGenerales.ingresoNeto)}</div>
          <div className="kpi-foot"><span className="kpi-target">Total - Comisión - Impuestos</span></div>
        </div>
      </div>

      <div className="two-col" style={{ gap: 16 }}>
        {/* Panel izquierdo: tabla */}
        <div className="card">
          {/* Filtros + orden */}
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Filtrar:</span>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--surface)' }}>
              <option value="">Todas las categorías</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filtroMedio} onChange={e => setFiltroMedio(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--surface)' }}>
              <option value="">Todos los medios</option>
              {MEDIOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', marginRight: 4 }}>Ordenar:</span>
              <SortBtn id="fecha" label="Fecha" />
              <SortBtn id="ingreso" label="Ingreso" />
              <SortBtn id="neto" label="Neto" />
            </div>
          </div>

          {/* Tabla */}
          <div style={{ overflowX: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                No hay ventas registradas. Presiona "Registrar venta" para agregar una.
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo Doc.</th>
                    <th>Categoría</th>
                    <th className="right">Ingreso Total</th>
                    <th className="right">Comisión</th>
                    <th className="right">Impuestos</th>
                    <th className="right">Ingreso Neto</th>
                    <th>Medio de Pago</th>
                    <th className="center"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{item.fecha}</td>
                      <td><span className={`tag ${item.tipoDoc === 'Crédito Fiscal' ? 'good' : ''}`}>{item.tipoDoc}</span></td>
                      <td><span className="tag">{item.categoria}</span></td>
                      <td className="right" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt$(item.ingresoTotal)}</td>
                      <td className="right" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--bad)' }}>{fmt$(item.comision)}</td>
                      <td className="right" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--warn)' }}>{fmt$(item.impuestos)}</td>
                      <td className="right" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--good)' }}>{fmt$(item.ingresoNeto)}</td>
                      <td><span className="tag">{item.medioPago}</span></td>
                      <td className="center">
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button className="icon-btn" onClick={() => openEdit(item)} data-tip="Editar">
                            <Icon name="edit" size={13} />
                          </button>
                          <button className="icon-btn" onClick={() => remove(item.id)} data-tip="Eliminar"
                            style={{ color: 'var(--bad)' }}>
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--surface-sunk)', borderTop: '2px solid var(--border-strong)' }}>
                    <td colSpan="3" style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700 }}>
                      Total ({filtered.length} {filtered.length === 1 ? 'registro' : 'registros'})
                    </td>
                    <td className="right" style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt$(totales.ingresoTotal)}</td>
                    <td className="right" style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--bad)' }}>{fmt$(totales.comision)}</td>
                    <td className="right" style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--warn)' }}>{fmt$(totales.impuestos)}</td>
                    <td className="right" style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--good)' }}>{fmt$(totales.ingresoNeto)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Panel derecho: resúmenes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Por categoría */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Por categoría</div>
                <div className="card-sub">Ingreso neto</div>
              </div>
            </div>
            <div className="card-body">
              {Object.keys(porCategoria).length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>Sin datos</div>
              ) : (
                Object.entries(porCategoria)
                  .sort((a, b) => b[1].neto - a[1].neto)
                  .map(([cat, data]) => (
                    <div key={cat} className="bar-row">
                      <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat}
                        <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>({data.count})</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(data.neto / maxBar) * 100}%`, background: 'var(--good)' }} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, textAlign: 'right', color: 'var(--good)' }}>${data.neto.toFixed(0)}</div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Por medio de pago */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Por medio de pago</div>
                <div className="card-sub">Ingreso neto</div>
              </div>
            </div>
            <div className="card-body">
              {Object.keys(porMedio).length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>Sin datos</div>
              ) : (
                Object.entries(porMedio)
                  .sort((a, b) => b[1].neto - a[1].neto)
                  .map(([medio, data]) => (
                    <div key={medio} className="bar-row">
                      <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {medio}
                        <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>({data.count})</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(data.neto / maxBarMedio) * 100}%` }} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, textAlign: 'right' }}>${data.neto.toFixed(0)}</div>
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
                <div style={{ fontSize: 16, fontWeight: 600 }}>{editId ? 'Editar venta' : 'Registrar venta'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                  Ingreso neto = Ingreso Total − Comisión − Impuestos
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
                    {lbl('Tipo de Documento')}
                    <select value={form.tipoDoc || TIPOS_DOC[0]} onChange={e => upd('tipoDoc', e.target.value)} style={fl}>
                      {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    {lbl('Categoría')}
                    <select value={form.categoria || CATEGORIAS[0]} onChange={e => upd('categoria', e.target.value)} style={fl}>
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    {lbl('Medio de Pago')}
                    <select value={form.medioPago || MEDIOS_PAGO[0]} onChange={e => upd('medioPago', e.target.value)} style={fl}>
                      {MEDIOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    {lbl('Ingreso Total ($)')}
                    <input type="number" min="0" step="0.01" placeholder="0.00"
                      value={form.ingresoTotal || ''} onChange={e => upd('ingresoTotal', e.target.value)}
                      style={{ ...fl, fontFamily: 'var(--font-mono)' }} />
                  </div>
                  <div>
                    {lbl(`Comisión (${tasaComision}%)`)}
                    <input type="number" min="0" step="0.01" placeholder="0.00"
                      value={form.comision ?? ''} onChange={e => upd('comision', e.target.value)}
                      style={{ ...fl, fontFamily: 'var(--font-mono)' }} />
                  </div>
                  <div>
                    {lbl(`Impuestos (${tasaImpuesto}%)`)}
                    <input type="number" min="0" step="0.01" placeholder="0.00"
                      value={form.impuestos ?? ''} onChange={e => upd('impuestos', e.target.value)}
                      style={{ ...fl, fontFamily: 'var(--font-mono)' }} />
                  </div>
                </div>

                {/* Preview ingreso neto */}
                <div style={{ background: 'var(--surface-sunk)', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Ingreso Neto</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--good)' }}>
                    ${calcNeto(form.ingresoTotal, form.comision, form.impuestos).toFixed(2)}
                  </span>
                </div>

                <div>
                  {lbl('Nota (opcional)')}
                  <textarea rows={2} placeholder="Observaciones adicionales..."
                    value={form.nota || ''} onChange={e => upd('nota', e.target.value)}
                    style={{ ...fl, resize: 'vertical' }} />
                </div>
              </div>
            </div>
            <div className="drawer-foot">
              <button className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}
                disabled={!form.ingresoTotal}>
                {editId ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

window.Ventas = Ventas;
