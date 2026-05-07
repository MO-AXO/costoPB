// Empleados — Planilla de personal, asistencia y pagos
const EmpleadosPage = ({ empleados, setEmpleados }) => {
  const { useState, useRef } = React;

  const PUESTOS = ['Jefe de cocina', 'Ayudante de cocina', 'Cajero/a', 'Mesero/a', 'Repartidor', 'Limpieza', 'Administración', 'Otro'];
  const TIPOS_PAGO = ['Quincenal', 'Semanal', 'Mensual'];
  const ESTADOS = ['Activo', 'Inactivo', 'Vacaciones', 'Licencia'];

  const [tab, setTab] = useState('planilla');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [pagoForm, setPagoForm] = useState({});
  const [form, setForm] = useState({});
  const inputRef = useRef(null);

  const lista = empleados?.lista || [];
  const pagos = empleados?.pagos || [];

  const uid = () => '_' + Math.random().toString(36).slice(2, 9);
  const hoy = () => new Date().toISOString().slice(0, 10);

  // Totales
  const totalNomina = lista.filter(e => e.estado === 'Activo').reduce((a, e) => a + (e.salario || 0), 0);
  const totalPagado = pagos.reduce((a, p) => a + (p.monto || 0), 0);
  const empActivos  = lista.filter(e => e.estado === 'Activo').length;

  // ── EMPLEADO CRUD ──
  const openNew = () => {
    setEditId(null);
    setForm({
      nombre: '', puesto: PUESTOS[0], salario: '', tipoPago: 'Quincenal',
      horasDia: 8, diasSemana: 6, fechaIngreso: hoy(), estado: 'Activo',
      dpi: '', telefono: '', nota: '',
    });
    setShowForm(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const openEdit = (emp) => {
    setEditId(emp.id);
    setForm({ ...emp });
    setShowForm(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const saveEmp = () => {
    if (!form.nombre?.trim()) return;
    const emp = { ...form, salario: parseFloat(form.salario) || 0, id: editId || uid() };
    setEmpleados(prev => {
      const list = prev?.lista || [];
      return { ...prev, lista: editId ? list.map(x => x.id === editId ? emp : x) : [...list, emp] };
    });
    setShowForm(false);
  };

  const removeEmp = (id) => {
    setEmpleados(prev => ({
      ...prev,
      lista: (prev?.lista || []).filter(x => x.id !== id),
      pagos: (prev?.pagos || []).filter(x => x.empId !== id),
    }));
    if (selectedEmpId === id) setSelectedEmpId(null);
  };

  const updForm = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ── PAGOS ──
  const openPago = (empId) => {
    const emp = lista.find(e => e.id === empId);
    setPagoForm({
      empId,
      fecha: hoy(),
      periodo: '',
      monto: emp?.salario || '',
      tipo: emp?.tipoPago || 'Quincenal',
      nota: '',
    });
    setShowPagoForm(true);
  };

  const savePago = () => {
    if (!pagoForm.monto) return;
    const pago = { ...pagoForm, monto: parseFloat(pagoForm.monto) || 0, id: uid() };
    setEmpleados(prev => ({ ...prev, pagos: [...(prev?.pagos || []), pago] }));
    setShowPagoForm(false);
  };

  const removePago = (id) => setEmpleados(prev => ({ ...prev, pagos: (prev?.pagos || []).filter(x => x.id !== id) }));

  const pagosEmp = (empId) => pagos.filter(p => p.empId === empId).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const selectedEmp = lista.find(e => e.id === selectedEmpId);

  // Cálculo horas/mes y costo/hora
  const calcEmp = (emp) => {
    const hrsmes = (emp.horasDia || 0) * (emp.diasSemana || 0) * 4;
    const costoHora = hrsmes > 0 ? (emp.salario || 0) / hrsmes : 0;
    return { hrsmes, costoHora };
  };

  // Estilos comunes
  const fl = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 13 };
  const lbl = (t) => <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>{t}</label>;

  const estadoColor = { Activo: 'good', Inactivo: 'bad', Vacaciones: 'warn', Licencia: 'accent' };

  return (
    <div>
      {/* Cabecera */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Empleados</h1>
          <div className="page-sub">Planilla, pagos y control de personal</div>
        </div>
        <div className="page-actions">
          {tab === 'planilla' && (
            <button className="btn btn-primary" onClick={openNew}>
              <Icon name="plus" size={14} /> Agregar empleado
            </button>
          )}
          {tab === 'pagos' && selectedEmpId && (
            <button className="btn btn-primary" onClick={() => openPago(selectedEmpId)}>
              <Icon name="plus" size={14} /> Registrar pago
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <div className="kpi">
          <div className="kpi-label">Empleados activos</div>
          <div className="kpi-value">{empActivos}</div>
          <div className="kpi-foot"><span className="kpi-target">{lista.length} en total</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Nómina mensual</div>
          <div className="kpi-value">${totalNomina.toFixed(0)}</div>
          <div className="kpi-foot"><span className="kpi-target">Solo activos</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total pagado (mes)</div>
          <div className="kpi-value">${totalPagado.toFixed(0)}</div>
          <div className="kpi-foot">
            <span className={`kpi-delta ${totalPagado >= totalNomina ? 'up' : 'flat'}`}>
              {totalNomina > 0 ? ((totalPagado / totalNomina) * 100).toFixed(0) : 0}%
            </span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Pendiente de pago</div>
          <div className="kpi-value" style={{ color: totalNomina - totalPagado > 0 ? 'var(--bad)' : 'var(--good)' }}>
            ${Math.max(totalNomina - totalPagado, 0).toFixed(0)}
          </div>
          <div className="kpi-foot"><span className="kpi-target">Nómina − pagado</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'planilla' ? 'active' : ''}`} onClick={() => setTab('planilla')}>Planilla</button>
        <button className={`tab ${tab === 'pagos' ? 'active' : ''}`} onClick={() => setTab('pagos')}>Historial de pagos</button>
      </div>

      {/* ── PLANILLA ── */}
      {tab === 'planilla' && (
        <div className="card">
          {lista.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No hay empleados registrados. Presiona "Agregar empleado" para comenzar.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Puesto</th>
                    <th className="center">Estado</th>
                    <th className="right">Salario/mes</th>
                    <th className="right">Hrs/mes</th>
                    <th className="right">$/hora</th>
                    <th>Tipo de pago</th>
                    <th>Ingreso</th>
                    <th className="center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(emp => {
                    const { hrsmes, costoHora } = calcEmp(emp);
                    return (
                      <tr key={emp.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.nombre}</div>
                          {emp.telefono && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{emp.telefono}</div>}
                        </td>
                        <td style={{ fontSize: 13 }}>{emp.puesto}</td>
                        <td className="center">
                          <span className={`tag ${estadoColor[emp.estado] || ''}`}>{emp.estado}</span>
                        </td>
                        <td className="right" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${(emp.salario || 0).toFixed(2)}</td>
                        <td className="right" style={{ fontFamily: 'var(--font-mono)' }}>{hrsmes}</td>
                        <td className="right" style={{ fontFamily: 'var(--font-mono)', color: 'var(--good)', fontWeight: 600 }}>${costoHora.toFixed(2)}</td>
                        <td style={{ fontSize: 12 }}>{emp.tipoPago}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>{emp.fechaIngreso || '—'}</td>
                        <td className="center">
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button className="btn btn-sm" onClick={() => { setSelectedEmpId(emp.id); setTab('pagos'); }} data-tip="Ver pagos">
                              <Icon name="chart" size={12} />
                            </button>
                            <button className="icon-btn" onClick={() => openEdit(emp)} data-tip="Editar">
                              <Icon name="edit" size={13} />
                            </button>
                            <button className="icon-btn" style={{ color: 'var(--bad)' }} onClick={() => removeEmp(emp.id)} data-tip="Eliminar">
                              <Icon name="trash" size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <td colSpan={3} style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>
                      Total ({empActivos} activos)
                    </td>
                    <td className="right" style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14 }}>
                      ${totalNomina.toFixed(2)}
                    </td>
                    <td colSpan={5} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PAGOS ── */}
      {tab === 'pagos' && (
        <div className="two-col" style={{ gap: 16 }}>
          {/* Selector de empleado */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head">
                <div className="card-title">Seleccionar empleado</div>
              </div>
              <div style={{ padding: '8px' }}>
                {lista.length === 0 ? (
                  <div style={{ padding: 16, fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>Sin empleados registrados</div>
                ) : (
                  lista.map(emp => {
                    const pagosEmpresa = pagosEmp(emp.id);
                    const totalPagadoEmp = pagosEmpresa.reduce((a, p) => a + (p.monto || 0), 0);
                    const pendiente = Math.max((emp.salario || 0) - totalPagadoEmp, 0);
                    return (
                      <button key={emp.id}
                        onClick={() => setSelectedEmpId(emp.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                          padding: '10px 12px', border: 0, borderRadius: 6, textAlign: 'left', cursor: 'pointer',
                          background: selectedEmpId === emp.id ? 'var(--accent-soft)' : 'transparent',
                          borderLeft: selectedEmpId === emp.id ? '3px solid var(--accent)' : '3px solid transparent',
                          marginBottom: 2,
                        }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-sunk)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                          {emp.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{emp.nombre}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{emp.puesto}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>${(emp.salario || 0).toFixed(0)}/mes</div>
                          {pendiente > 0 && (
                            <div style={{ fontSize: 10, color: 'var(--bad)', fontFamily: 'var(--font-mono)' }}>-${pendiente.toFixed(0)} pdte.</div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Detalle de pagos */}
          <div>
            {!selectedEmp ? (
              <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                Selecciona un empleado para ver su historial de pagos
              </div>
            ) : (
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">{selectedEmp.nombre}</div>
                    <div className="card-sub">{selectedEmp.puesto} · ${(selectedEmp.salario || 0).toFixed(2)}/mes · {selectedEmp.tipoPago}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => openPago(selectedEmpId)}>
                    <Icon name="plus" size={12} /> Registrar pago
                  </button>
                </div>

                {/* Resumen rápido */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderBottom: '1px solid var(--border)' }}>
                  {[
                    { label: 'Nómina mensual', val: `$${(selectedEmp.salario || 0).toFixed(2)}` },
                    { label: 'Total pagado', val: `$${pagosEmp(selectedEmpId).reduce((a, p) => a + p.monto, 0).toFixed(2)}` },
                    { label: 'Pagos realizados', val: pagosEmp(selectedEmpId).length },
                  ].map((k, i) => (
                    <div key={i} style={{ padding: '12px 16px', borderRight: i < 2 ? '1px solid var(--border)' : 0 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{k.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16 }}>{k.val}</div>
                    </div>
                  ))}
                </div>

                {/* Lista de pagos */}
                <div>
                  {pagosEmp(selectedEmpId).length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                      Sin pagos registrados para este empleado
                    </div>
                  ) : (
                    pagosEmp(selectedEmpId).map((pago, i) => (
                      <div key={pago.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--good-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <Icon name="check" size={14} style={{ color: 'var(--good)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{pago.tipo}{pago.periodo ? ` — ${pago.periodo}` : ''}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{pago.fecha}{pago.nota ? ` · ${pago.nota}` : ''}</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--good)' }}>${pago.monto.toFixed(2)}</div>
                        <button className="icon-btn" style={{ color: 'var(--bad)' }} onClick={() => removePago(pago.id)}>
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Drawer: Formulario Empleado ── */}
      {showForm && (
        <>
          <div className="drawer-overlay" onClick={() => setShowForm(false)} />
          <div className="drawer">
            <div className="drawer-head">
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{editId ? 'Editar empleado' : 'Agregar empleado'}</div>
              </div>
              <button className="icon-btn" onClick={() => setShowForm(false)}><Icon name="close" size={15} /></button>
            </div>
            <div className="drawer-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div>
                  {lbl('Nombre completo')}
                  <input ref={inputRef} type="text" placeholder="Nombre del empleado"
                    value={form.nombre || ''} onChange={e => updForm('nombre', e.target.value)} style={fl} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    {lbl('Puesto')}
                    <select value={form.puesto || PUESTOS[0]} onChange={e => updForm('puesto', e.target.value)} style={fl}>
                      {PUESTOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    {lbl('Estado')}
                    <select value={form.estado || 'Activo'} onChange={e => updForm('estado', e.target.value)} style={fl}>
                      {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    {lbl('Salario mensual (USD)')}
                    <input type="number" min="0" step="0.01" placeholder="0.00"
                      value={form.salario || ''} onChange={e => updForm('salario', e.target.value)}
                      style={{ ...fl, fontFamily: 'var(--font-mono)' }} />
                  </div>
                  <div>
                    {lbl('Tipo de pago')}
                    <select value={form.tipoPago || 'Quincenal'} onChange={e => updForm('tipoPago', e.target.value)} style={fl}>
                      {TIPOS_PAGO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    {lbl('Horas por día')}
                    <input type="number" min="0" max="24" step="0.5"
                      value={form.horasDia || ''} onChange={e => updForm('horasDia', parseFloat(e.target.value) || 0)}
                      style={{ ...fl, fontFamily: 'var(--font-mono)' }} />
                  </div>
                  <div>
                    {lbl('Días por semana')}
                    <input type="number" min="0" max="7"
                      value={form.diasSemana || ''} onChange={e => updForm('diasSemana', parseFloat(e.target.value) || 0)}
                      style={{ ...fl, fontFamily: 'var(--font-mono)' }} />
                  </div>
                </div>

                {/* Preview costo/hora */}
                {form.salario && form.horasDia && form.diasSemana && (
                  <div className="hint">
                    <b>Costo/hora:</b> ${(parseFloat(form.salario) / Math.max(parseFloat(form.horasDia) * parseFloat(form.diasSemana) * 4, 1)).toFixed(2)} · <b>Hrs/mes:</b> {parseFloat(form.horasDia) * parseFloat(form.diasSemana) * 4}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    {lbl('Fecha de ingreso')}
                    <input type="date" value={form.fechaIngreso || ''} onChange={e => updForm('fechaIngreso', e.target.value)} style={fl} />
                  </div>
                  <div>
                    {lbl('Teléfono (opcional)')}
                    <input type="text" placeholder="0000-0000" value={form.telefono || ''}
                      onChange={e => updForm('telefono', e.target.value)} style={fl} />
                  </div>
                </div>

                <div>
                  {lbl('DPI / Identidad (opcional)')}
                  <input type="text" placeholder="Número de identificación"
                    value={form.dpi || ''} onChange={e => updForm('dpi', e.target.value)} style={fl} />
                </div>

                <div>
                  {lbl('Nota (opcional)')}
                  <textarea rows={2} value={form.nota || ''} onChange={e => updForm('nota', e.target.value)}
                    style={{ ...fl, resize: 'vertical' }} />
                </div>
              </div>
            </div>
            <div className="drawer-foot">
              <button className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveEmp} disabled={!form.nombre?.trim()}>
                {editId ? 'Guardar cambios' : 'Agregar empleado'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Drawer: Registrar pago ── */}
      {showPagoForm && selectedEmp && (
        <>
          <div className="drawer-overlay" onClick={() => setShowPagoForm(false)} />
          <div className="drawer" style={{ width: 400 }}>
            <div className="drawer-head">
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Registrar pago</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{selectedEmp.nombre} — {selectedEmp.puesto}</div>
              </div>
              <button className="icon-btn" onClick={() => setShowPagoForm(false)}><Icon name="close" size={15} /></button>
            </div>
            <div className="drawer-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  {lbl('Fecha de pago')}
                  <input type="date" value={pagoForm.fecha || ''} onChange={e => setPagoForm(p => ({ ...p, fecha: e.target.value }))} style={fl} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    {lbl('Tipo de pago')}
                    <select value={pagoForm.tipo || 'Quincenal'} onChange={e => setPagoForm(p => ({ ...p, tipo: e.target.value }))} style={fl}>
                      {TIPOS_PAGO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    {lbl('Período')}
                    <input type="text" placeholder="Ej: 1-15 Mayo" value={pagoForm.periodo || ''}
                      onChange={e => setPagoForm(p => ({ ...p, periodo: e.target.value }))} style={fl} />
                  </div>
                </div>
                <div>
                  {lbl('Monto pagado (USD)')}
                  <input type="number" min="0" step="0.01"
                    value={pagoForm.monto || ''} onChange={e => setPagoForm(p => ({ ...p, monto: e.target.value }))}
                    style={{ ...fl, fontFamily: 'var(--font-mono)' }} />
                </div>
                <div>
                  {lbl('Nota (opcional)')}
                  <textarea rows={2} placeholder="Bonificación, descuento, etc."
                    value={pagoForm.nota || ''} onChange={e => setPagoForm(p => ({ ...p, nota: e.target.value }))}
                    style={{ ...fl, resize: 'vertical' }} />
                </div>
                <div className="hint">
                  <b>Nómina mensual:</b> ${(selectedEmp.salario || 0).toFixed(2)} · <b>Tipo:</b> {selectedEmp.tipoPago}
                </div>
              </div>
            </div>
            <div className="drawer-foot">
              <button className="btn" onClick={() => setShowPagoForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={savePago} disabled={!pagoForm.monto}>
                Registrar pago
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

window.EmpleadosPage = EmpleadosPage;
