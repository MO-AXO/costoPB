// Empleados — Planilla, pagos, bonificaciones, deducciones y ausencias
const EmpleadosPage = ({ empleados, setEmpleados }) => {
  const { useState, useRef } = React;

  const PUESTOS     = ['Jefe de cocina', 'Ayudante de cocina', 'Cajero/a', 'Mesero/a', 'Repartidor', 'Limpieza', 'Administración', 'Otro'];
  const TIPOS_PAGO  = ['Quincenal', 'Semanal', 'Mensual'];
  const ESTADOS     = ['Activo', 'Inactivo', 'Vacaciones', 'Licencia'];
  const TIPOS_AUS   = ['Falta sin aviso', 'Permiso con goce', 'Permiso sin goce', 'Vacaciones', 'Enfermedad', 'Licencia especial'];

  const [tab, setTab]                 = useState('planilla');
  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState(null);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [showPagoForm, setShowPagoForm]   = useState(false);
  const [showAusForm, setShowAusForm]     = useState(false);
  const [pagoForm, setPagoForm]       = useState({});
  const [ausForm, setAusForm]         = useState({});
  const [form, setForm]               = useState({});
  const inputRef = useRef(null);

  const lista    = empleados?.lista    || [];
  const pagos    = empleados?.pagos    || [];
  const ausencias= empleados?.ausencias|| [];

  const uid = () => '_' + Math.random().toString(36).slice(2, 9);
  const hoy = () => new Date().toISOString().slice(0, 10);

  // ── Totales globales ──
  const totalNomina  = lista.filter(e => e.estado === 'Activo').reduce((a, e) => a + (e.salario || 0), 0);
  const totalPagado  = pagos.reduce((a, p) => a + (p.monto || 0), 0);
  const empActivos   = lista.filter(e => e.estado === 'Activo').length;
  const totalBonos   = pagos.reduce((a, p) => a + (p.bonificacion || 0), 0);
  const totalDeduc   = pagos.reduce((a, p) => a + (p.deduccion || 0), 0);

  // ── Helpers por empleado ──
  const calcEmp = (emp) => {
    const hrsmes = (emp.horasDia || 0) * (emp.diasSemana || 0) * 4;
    return { hrsmes, costoHora: hrsmes > 0 ? (emp.salario || 0) / hrsmes : 0 };
  };
  const pagosEmp    = (id) => pagos.filter(p => p.empId === id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ausenciasEmp= (id) => ausencias.filter(a => a.empId === id).sort((a, b) => b.fecha.localeCompare(a.fecha));

  // Monto neto de un pago = monto base + bonificacion - deduccion
  const montoNeto = (p) => (p.monto || 0) + (p.bonificacion || 0) - (p.deduccion || 0);

  // Días de ausencia sin goce → descuento proporcional
  const descuentoAusencias = (emp) => {
    const aus = ausenciasEmp(emp.id).filter(a => a.tipo === 'Permiso sin goce' || a.tipo === 'Falta sin aviso');
    const diasDesc = aus.reduce((a, x) => a + (x.dias || 0), 0);
    const salarioDia = (emp.salario || 0) / 30;
    return diasDesc * salarioDia;
  };

  const selectedEmp = lista.find(e => e.id === selectedEmpId);

  // ── CRUD Empleado ──
  const openNew = () => {
    setEditId(null);
    setForm({ nombre: '', puesto: PUESTOS[0], salario: '', tipoPago: 'Quincenal', horasDia: 8, diasSemana: 6, fechaIngreso: hoy(), estado: 'Activo', dpi: '', telefono: '', nota: '' });
    setShowForm(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };
  const openEdit = (emp) => { setEditId(emp.id); setForm({ ...emp }); setShowForm(true); setTimeout(() => inputRef.current?.focus(), 80); };
  const saveEmp  = () => {
    if (!form.nombre?.trim()) return;
    const emp = { ...form, salario: parseFloat(form.salario) || 0, id: editId || uid() };
    setEmpleados(prev => ({ ...prev, lista: editId ? (prev?.lista||[]).map(x=>x.id===editId?emp:x) : [...(prev?.lista||[]), emp] }));
    setShowForm(false);
  };
  const removeEmp = (id) => {
    setEmpleados(prev => ({ ...prev, lista: (prev?.lista||[]).filter(x=>x.id!==id), pagos: (prev?.pagos||[]).filter(x=>x.empId!==id), ausencias: (prev?.ausencias||[]).filter(x=>x.empId!==id) }));
    if (selectedEmpId === id) setSelectedEmpId(null);
  };
  const updForm = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ── Pagos con bonificación y deducción ──
  const openPago = (empId) => {
    const emp = lista.find(e => e.id === empId);
    const desc = descuentoAusencias(emp || {});
    setPagoForm({ empId, fecha: hoy(), periodo: '', monto: emp?.salario || '', tipo: emp?.tipoPago || 'Quincenal', bonificacion: '', deduccion: desc > 0 ? desc.toFixed(2) : '', notaBono: '', notaDeduc: desc > 0 ? 'Descuento por ausencias sin goce' : '', nota: '' });
    setShowPagoForm(true);
  };
  const savePago = () => {
    if (!pagoForm.monto) return;
    const pago = { ...pagoForm, monto: parseFloat(pagoForm.monto)||0, bonificacion: parseFloat(pagoForm.bonificacion)||0, deduccion: parseFloat(pagoForm.deduccion)||0, id: uid() };
    setEmpleados(prev => ({ ...prev, pagos: [...(prev?.pagos||[]), pago] }));
    setShowPagoForm(false);
  };
  const removePago = (id) => setEmpleados(prev => ({ ...prev, pagos: (prev?.pagos||[]).filter(x=>x.id!==id) }));

  // ── Ausencias ──
  const openAus = (empId) => { setAusForm({ empId, fecha: hoy(), tipo: TIPOS_AUS[0], dias: 1, nota: '' }); setShowAusForm(true); };
  const saveAus = () => {
    if (!ausForm.dias) return;
    const aus = { ...ausForm, dias: parseFloat(ausForm.dias)||0, id: uid() };
    setEmpleados(prev => ({ ...prev, ausencias: [...(prev?.ausencias||[]), aus] }));
    setShowAusForm(false);
  };
  const removeAus = (id) => setEmpleados(prev => ({ ...prev, ausencias: (prev?.ausencias||[]).filter(x=>x.id!==id) }));

  // Estilos
  const fl  = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 13 };
  const lbl = (t) => <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>{t}</label>;
  const estadoColor = { Activo: 'good', Inactivo: 'bad', Vacaciones: 'warn', Licencia: 'accent' };
  const ausColor = { 'Falta sin aviso': 'bad', 'Permiso con goce': 'warn', 'Permiso sin goce': 'bad', 'Vacaciones': 'accent', 'Enfermedad': 'warn', 'Licencia especial': 'accent' };

  return (
    <div>
      {/* Cabecera */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Empleados</h1>
          <div className="page-sub">Planilla, pagos, bonificaciones, deducciones y ausencias</div>
        </div>
        <div className="page-actions">
          {tab === 'planilla' && <button className="btn btn-primary" onClick={openNew}><Icon name="plus" size={14} /> Agregar empleado</button>}
          {tab === 'pagos' && selectedEmpId && <button className="btn btn-primary" onClick={() => openPago(selectedEmpId)}><Icon name="plus" size={14} /> Registrar pago</button>}
          {tab === 'ausencias' && selectedEmpId && <button className="btn btn-primary" onClick={() => openAus(selectedEmpId)}><Icon name="plus" size={14} /> Registrar ausencia</button>}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
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
          <div className="kpi-label">Total pagado</div>
          <div className="kpi-value">${pagos.reduce((a,p)=>a+montoNeto(p),0).toFixed(0)}</div>
          <div className="kpi-foot"><span className={`kpi-delta ${totalPagado>=totalNomina?'up':'flat'}`}>{totalNomina>0?((totalPagado/totalNomina)*100).toFixed(0):0}%</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Bonos / Deducciones</div>
          <div className="kpi-value" style={{ fontSize: 18 }}>
            <span style={{ color: 'var(--good)' }}>+${totalBonos.toFixed(0)}</span>
            <span style={{ color: 'var(--text-3)', margin: '0 4px' }}>/</span>
            <span style={{ color: 'var(--bad)' }}>-${totalDeduc.toFixed(0)}</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Pendiente de pago</div>
          <div className="kpi-value" style={{ color: totalNomina-totalPagado>0?'var(--bad)':'var(--good)' }}>
            ${Math.max(totalNomina-totalPagado,0).toFixed(0)}
          </div>
          <div className="kpi-foot"><span className="kpi-target">Nómina − pagado</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab==='planilla'?'active':''}`}   onClick={()=>setTab('planilla')}>Planilla</button>
        <button className={`tab ${tab==='pagos'?'active':''}`}      onClick={()=>setTab('pagos')}>Historial de pagos</button>
        <button className={`tab ${tab==='ausencias'?'active':''}`}  onClick={()=>setTab('ausencias')}>Ausencias y vacaciones</button>
      </div>

      {/* ── PLANILLA ── */}
      {tab === 'planilla' && (
        <div className="card">
          {lista.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No hay empleados. Presiona "Agregar empleado".</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead><tr>
                  <th>Nombre</th><th>Puesto</th><th className="center">Estado</th>
                  <th className="right">Salario/mes</th><th className="right">Hrs/mes</th>
                  <th className="right">$/hora</th><th>Tipo pago</th><th>Ingreso</th><th className="center">Acciones</th>
                </tr></thead>
                <tbody>
                  {lista.map(emp => {
                    const { hrsmes, costoHora } = calcEmp(emp);
                    const desc = descuentoAusencias(emp);
                    return (
                      <tr key={emp.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{emp.nombre}</div>
                          {emp.telefono && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{emp.telefono}</div>}
                        </td>
                        <td style={{ fontSize: 13 }}>{emp.puesto}</td>
                        <td className="center"><span className={`tag ${estadoColor[emp.estado]||''}`}>{emp.estado}</span></td>
                        <td className="right" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${(emp.salario||0).toFixed(2)}</td>
                        <td className="right" style={{ fontFamily: 'var(--font-mono)' }}>{hrsmes}</td>
                        <td className="right" style={{ fontFamily: 'var(--font-mono)', color: 'var(--good)', fontWeight: 600 }}>${costoHora.toFixed(2)}</td>
                        <td style={{ fontSize: 12 }}>{emp.tipoPago}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>{emp.fechaIngreso||'—'}</td>
                        <td className="center">
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            {desc > 0 && <span className="tag bad" style={{ fontSize: 10 }} data-tip={`Descuento por ausencias: $${desc.toFixed(2)}`}>-${desc.toFixed(0)}</span>}
                            <button className="btn btn-sm" onClick={()=>{setSelectedEmpId(emp.id);setTab('pagos');}}>$</button>
                            <button className="btn btn-sm" onClick={()=>{setSelectedEmpId(emp.id);setTab('ausencias');}}>
                              <Icon name="history" size={12} />
                            </button>
                            <button className="icon-btn" onClick={()=>openEdit(emp)}><Icon name="edit" size={13} /></button>
                            <button className="icon-btn" style={{ color:'var(--bad)' }} onClick={()=>removeEmp(emp.id)}><Icon name="trash" size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <td colSpan={3} style={{ padding: '10px 14px', fontWeight: 600 }}>Total ({empActivos} activos)</td>
                    <td className="right" style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14 }}>${totalNomina.toFixed(2)}</td>
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
          {/* Selector */}
          <div>
            <div className="card">
              <div className="card-head"><div className="card-title">Empleado</div></div>
              <div style={{ padding: 8 }}>
                {lista.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>Sin empleados</div>
                ) : lista.map(emp => {
                  const neto = pagosEmp(emp.id).reduce((a,p)=>a+montoNeto(p),0);
                  const pdte = Math.max((emp.salario||0)-neto,0);
                  return (
                    <button key={emp.id} onClick={()=>setSelectedEmpId(emp.id)}
                      style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 10px', border:0, borderRadius:6, textAlign:'left', cursor:'pointer', background:selectedEmpId===emp.id?'var(--accent-soft)':'transparent', borderLeft:selectedEmpId===emp.id?'3px solid var(--accent)':'3px solid transparent', marginBottom:2 }}>
                      <div style={{ width:34,height:34,borderRadius:'50%',background:'var(--surface-sunk)',display:'grid',placeItems:'center',fontWeight:700,fontSize:13,flexShrink:0 }}>{emp.nombre[0]}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:13,fontWeight:600 }}>{emp.nombre}</div>
                        <div style={{ fontSize:11,color:'var(--text-3)' }}>{emp.puesto}</div>
                      </div>
                      <div style={{ textAlign:'right',flexShrink:0 }}>
                        <div style={{ fontFamily:'var(--font-mono)',fontSize:12,fontWeight:600 }}>${(emp.salario||0).toFixed(0)}/mes</div>
                        {pdte>0&&<div style={{ fontSize:10,color:'var(--bad)',fontFamily:'var(--font-mono)' }}>-${pdte.toFixed(0)} pdte.</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detalle */}
          <div>
            {!selectedEmp ? (
              <div className="card" style={{ padding:32,textAlign:'center',color:'var(--text-3)',fontSize:13 }}>Selecciona un empleado</div>
            ) : (
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">{selectedEmp.nombre}</div>
                    <div className="card-sub">{selectedEmp.puesto} · ${(selectedEmp.salario||0).toFixed(2)}/mes</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={()=>openPago(selectedEmpId)}><Icon name="plus" size={12}/> Registrar pago</button>
                </div>
                {/* Resumen */}
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:0,borderBottom:'1px solid var(--border)' }}>
                  {[
                    { l:'Nómina', v:`$${(selectedEmp.salario||0).toFixed(2)}` },
                    { l:'Bonos', v:`+$${pagosEmp(selectedEmpId).reduce((a,p)=>a+(p.bonificacion||0),0).toFixed(2)}`, c:'var(--good)' },
                    { l:'Deducciones', v:`-$${pagosEmp(selectedEmpId).reduce((a,p)=>a+(p.deduccion||0),0).toFixed(2)}`, c:'var(--bad)' },
                    { l:'Neto pagado', v:`$${pagosEmp(selectedEmpId).reduce((a,p)=>a+montoNeto(p),0).toFixed(2)}` },
                  ].map((k,i)=>(
                    <div key={i} style={{ padding:'10px 14px',borderRight:i<3?'1px solid var(--border)':0 }}>
                      <div style={{ fontSize:11,color:'var(--text-3)',marginBottom:4 }}>{k.l}</div>
                      <div style={{ fontFamily:'var(--font-mono)',fontWeight:700,fontSize:15,color:k.c||'var(--text)' }}>{k.v}</div>
                    </div>
                  ))}
                </div>
                {/* Lista pagos */}
                {pagosEmp(selectedEmpId).length === 0 ? (
                  <div style={{ padding:'24px',textAlign:'center',color:'var(--text-3)',fontSize:13 }}>Sin pagos registrados</div>
                ) : pagosEmp(selectedEmpId).map(pago => (
                  <div key={pago.id} style={{ display:'flex',alignItems:'flex-start',gap:12,padding:'12px 16px',borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:32,height:32,borderRadius:8,background:'var(--good-soft)',display:'grid',placeItems:'center',flexShrink:0 }}>
                      <Icon name="check" size={14} style={{ color:'var(--good)' }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:500 }}>{pago.tipo}{pago.periodo?` — ${pago.periodo}`:''}</div>
                      <div style={{ fontSize:11,color:'var(--text-3)' }}>{pago.fecha}{pago.nota?` · ${pago.nota}`:''}</div>
                      {(pago.bonificacion>0||pago.deduccion>0) && (
                        <div style={{ display:'flex',gap:8,marginTop:4 }}>
                          {pago.bonificacion>0&&<span className="tag good" style={{ fontSize:10 }}>+${pago.bonificacion.toFixed(2)} bono{pago.notaBono?`: ${pago.notaBono}`:''}</span>}
                          {pago.deduccion>0&&<span className="tag bad" style={{ fontSize:10 }}>-${pago.deduccion.toFixed(2)} deduc{pago.notaDeduc?`: ${pago.notaDeduc}`:''}</span>}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign:'right',flexShrink:0 }}>
                      <div style={{ fontFamily:'var(--font-mono)',fontWeight:700,fontSize:14,color:'var(--good)' }}>${montoNeto(pago).toFixed(2)}</div>
                      <div style={{ fontSize:11,color:'var(--text-3)' }}>base ${(pago.monto||0).toFixed(2)}</div>
                    </div>
                    <button className="icon-btn" style={{ color:'var(--bad)',flexShrink:0 }} onClick={()=>removePago(pago.id)}><Icon name="trash" size={13}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AUSENCIAS ── */}
      {tab === 'ausencias' && (
        <div className="two-col" style={{ gap:16 }}>
          {/* Selector */}
          <div>
            <div className="card">
              <div className="card-head"><div className="card-title">Empleado</div></div>
              <div style={{ padding:8 }}>
                {lista.map(emp => {
                  const diasTotal = ausenciasEmp(emp.id).reduce((a,x)=>a+(x.dias||0),0);
                  const descuento = descuentoAusencias(emp);
                  return (
                    <button key={emp.id} onClick={()=>setSelectedEmpId(emp.id)}
                      style={{ display:'flex',alignItems:'center',gap:10,width:'100%',padding:'9px 10px',border:0,borderRadius:6,textAlign:'left',cursor:'pointer',background:selectedEmpId===emp.id?'var(--accent-soft)':'transparent',borderLeft:selectedEmpId===emp.id?'3px solid var(--accent)':'3px solid transparent',marginBottom:2 }}>
                      <div style={{ width:34,height:34,borderRadius:'50%',background:'var(--surface-sunk)',display:'grid',placeItems:'center',fontWeight:700,fontSize:13,flexShrink:0 }}>{emp.nombre[0]}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:13,fontWeight:600 }}>{emp.nombre}</div>
                        <div style={{ fontSize:11,color:'var(--text-3)' }}>{emp.puesto}</div>
                      </div>
                      <div style={{ textAlign:'right',flexShrink:0 }}>
                        <div style={{ fontSize:12,fontFamily:'var(--font-mono)' }}>{diasTotal} días</div>
                        {descuento>0&&<div style={{ fontSize:10,color:'var(--bad)',fontFamily:'var(--font-mono)' }}>-${descuento.toFixed(0)}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detalle ausencias */}
          <div>
            {!selectedEmp ? (
              <div className="card" style={{ padding:32,textAlign:'center',color:'var(--text-3)',fontSize:13 }}>Selecciona un empleado</div>
            ) : (
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">{selectedEmp.nombre} — Ausencias</div>
                    <div className="card-sub">
                      {ausenciasEmp(selectedEmpId).reduce((a,x)=>a+(x.dias||0),0)} días registrados · Descuento: ${descuentoAusencias(selectedEmp).toFixed(2)}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={()=>openAus(selectedEmpId)}><Icon name="plus" size={12}/> Registrar ausencia</button>
                </div>
                {ausenciasEmp(selectedEmpId).length === 0 ? (
                  <div style={{ padding:'24px',textAlign:'center',color:'var(--text-3)',fontSize:13 }}>Sin ausencias registradas</div>
                ) : ausenciasEmp(selectedEmpId).map(aus => (
                  <div key={aus.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:32,height:32,borderRadius:8,background:'var(--warn-soft)',display:'grid',placeItems:'center',flexShrink:0 }}>
                      <Icon name="history" size={14} style={{ color:'var(--warn)' }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <span style={{ fontSize:13,fontWeight:500 }}>{aus.tipo}</span>
                        <span className={`tag ${ausColor[aus.tipo]||''}`} style={{ fontSize:10 }}>{aus.dias} día{aus.dias!==1?'s':''}</span>
                      </div>
                      <div style={{ fontSize:11,color:'var(--text-3)' }}>{aus.fecha}{aus.nota?` · ${aus.nota}`:''}</div>
                    </div>
                    {(aus.tipo==='Permiso sin goce'||aus.tipo==='Falta sin aviso') && (
                      <div style={{ fontFamily:'var(--font-mono)',fontSize:12,color:'var(--bad)',fontWeight:600,flexShrink:0 }}>
                        -${((selectedEmp.salario||0)/30*(aus.dias||0)).toFixed(2)}
                      </div>
                    )}
                    <button className="icon-btn" style={{ color:'var(--bad)',flexShrink:0 }} onClick={()=>removeAus(aus.id)}><Icon name="trash" size={13}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Drawer: Empleado ── */}
      {showForm && (
        <>
          <div className="drawer-overlay" onClick={()=>setShowForm(false)}/>
          <div className="drawer">
            <div className="drawer-head">
              <div style={{ fontSize:16,fontWeight:600 }}>{editId?'Editar empleado':'Agregar empleado'}</div>
              <button className="icon-btn" onClick={()=>setShowForm(false)}><Icon name="close" size={15}/></button>
            </div>
            <div className="drawer-body">
              <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                <div>{lbl('Nombre completo')}<input ref={inputRef} type="text" placeholder="Nombre" value={form.nombre||''} onChange={e=>updForm('nombre',e.target.value)} style={fl}/></div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                  <div>{lbl('Puesto')}<select value={form.puesto||PUESTOS[0]} onChange={e=>updForm('puesto',e.target.value)} style={fl}>{PUESTOS.map(p=><option key={p}>{p}</option>)}</select></div>
                  <div>{lbl('Estado')}<select value={form.estado||'Activo'} onChange={e=>updForm('estado',e.target.value)} style={fl}>{ESTADOS.map(s=><option key={s}>{s}</option>)}</select></div>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                  <div>{lbl('Salario mensual (USD)')}<input type="number" min="0" step="0.01" value={form.salario||''} onChange={e=>updForm('salario',e.target.value)} style={{ ...fl,fontFamily:'var(--font-mono)' }}/></div>
                  <div>{lbl('Tipo de pago')}<select value={form.tipoPago||'Quincenal'} onChange={e=>updForm('tipoPago',e.target.value)} style={fl}>{TIPOS_PAGO.map(t=><option key={t}>{t}</option>)}</select></div>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                  <div>{lbl('Horas por día')}<input type="number" min="0" max="24" step="0.5" value={form.horasDia||''} onChange={e=>updForm('horasDia',parseFloat(e.target.value)||0)} style={{ ...fl,fontFamily:'var(--font-mono)' }}/></div>
                  <div>{lbl('Días por semana')}<input type="number" min="0" max="7" value={form.diasSemana||''} onChange={e=>updForm('diasSemana',parseFloat(e.target.value)||0)} style={{ ...fl,fontFamily:'var(--font-mono)' }}/></div>
                </div>
                {form.salario&&form.horasDia&&form.diasSemana&&(
                  <div className="hint"><b>Costo/hora:</b> ${(parseFloat(form.salario)/Math.max(parseFloat(form.horasDia)*parseFloat(form.diasSemana)*4,1)).toFixed(2)} · <b>Hrs/mes:</b> {parseFloat(form.horasDia)*parseFloat(form.diasSemana)*4}</div>
                )}
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                  <div>{lbl('Fecha de ingreso')}<input type="date" value={form.fechaIngreso||''} onChange={e=>updForm('fechaIngreso',e.target.value)} style={fl}/></div>
                  <div>{lbl('Teléfono')}<input type="text" placeholder="0000-0000" value={form.telefono||''} onChange={e=>updForm('telefono',e.target.value)} style={fl}/></div>
                </div>
                <div>{lbl('DPI / Identidad')}<input type="text" value={form.dpi||''} onChange={e=>updForm('dpi',e.target.value)} style={fl}/></div>
                <div>{lbl('Nota')}<textarea rows={2} value={form.nota||''} onChange={e=>updForm('nota',e.target.value)} style={{ ...fl,resize:'vertical' }}/></div>
              </div>
            </div>
            <div className="drawer-foot">
              <button className="btn" onClick={()=>setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveEmp} disabled={!form.nombre?.trim()}>{editId?'Guardar':'Agregar'}</button>
            </div>
          </div>
        </>
      )}

      {/* ── Drawer: Pago con bonos y deducciones ── */}
      {showPagoForm && selectedEmp && (
        <>
          <div className="drawer-overlay" onClick={()=>setShowPagoForm(false)}/>
          <div className="drawer">
            <div className="drawer-head">
              <div>
                <div style={{ fontSize:16,fontWeight:600 }}>Registrar pago</div>
                <div style={{ fontSize:12,color:'var(--text-3)',marginTop:3 }}>{selectedEmp.nombre} — {selectedEmp.puesto}</div>
              </div>
              <button className="icon-btn" onClick={()=>setShowPagoForm(false)}><Icon name="close" size={15}/></button>
            </div>
            <div className="drawer-body">
              <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                  <div>{lbl('Fecha')}<input type="date" value={pagoForm.fecha||''} onChange={e=>setPagoForm(p=>({...p,fecha:e.target.value}))} style={fl}/></div>
                  <div>{lbl('Tipo')}<select value={pagoForm.tipo||'Quincenal'} onChange={e=>setPagoForm(p=>({...p,tipo:e.target.value}))} style={fl}>{TIPOS_PAGO.map(t=><option key={t}>{t}</option>)}</select></div>
                </div>
                <div>{lbl('Período')}<input type="text" placeholder="Ej: 1-15 Mayo" value={pagoForm.periodo||''} onChange={e=>setPagoForm(p=>({...p,periodo:e.target.value}))} style={fl}/></div>
                <div>{lbl('Salario base (USD)')}<input type="number" min="0" step="0.01" value={pagoForm.monto||''} onChange={e=>setPagoForm(p=>({...p,monto:e.target.value}))} style={{ ...fl,fontFamily:'var(--font-mono)' }}/></div>

                <div className="divider" />
                <div style={{ fontSize:11,fontWeight:600,color:'var(--text-3)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Bonificaciones y deducciones</div>

                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                  <div>{lbl('Bonificación (USD)')}<input type="number" min="0" step="0.01" placeholder="0.00" value={pagoForm.bonificacion||''} onChange={e=>setPagoForm(p=>({...p,bonificacion:e.target.value}))} style={{ ...fl,fontFamily:'var(--font-mono)',color:'var(--good)' }}/></div>
                  <div>{lbl('Deducción (USD)')}<input type="number" min="0" step="0.01" placeholder="0.00" value={pagoForm.deduccion||''} onChange={e=>setPagoForm(p=>({...p,deduccion:e.target.value}))} style={{ ...fl,fontFamily:'var(--font-mono)',color:'var(--bad)' }}/></div>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                  <div>{lbl('Motivo bono')}<input type="text" placeholder="Productividad, extra..." value={pagoForm.notaBono||''} onChange={e=>setPagoForm(p=>({...p,notaBono:e.target.value}))} style={fl}/></div>
                  <div>{lbl('Motivo deducción')}<input type="text" placeholder="Ausencias, adelanto..." value={pagoForm.notaDeduc||''} onChange={e=>setPagoForm(p=>({...p,notaDeduc:e.target.value}))} style={fl}/></div>
                </div>

                {/* Preview neto */}
                <div className="hint" style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <span>Base: <b>${parseFloat(pagoForm.monto||0).toFixed(2)}</b> + <b style={{color:'var(--good)'}}>+${parseFloat(pagoForm.bonificacion||0).toFixed(2)}</b> − <b style={{color:'var(--bad)'}}>-${parseFloat(pagoForm.deduccion||0).toFixed(2)}</b></span>
                  <span>Neto: <b>${(parseFloat(pagoForm.monto||0)+parseFloat(pagoForm.bonificacion||0)-parseFloat(pagoForm.deduccion||0)).toFixed(2)}</b></span>
                </div>

                <div>{lbl('Nota general')}<textarea rows={2} value={pagoForm.nota||''} onChange={e=>setPagoForm(p=>({...p,nota:e.target.value}))} style={{ ...fl,resize:'vertical' }}/></div>
              </div>
            </div>
            <div className="drawer-foot">
              <button className="btn" onClick={()=>setShowPagoForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={savePago} disabled={!pagoForm.monto}>Registrar pago</button>
            </div>
          </div>
        </>
      )}

      {/* ── Drawer: Ausencia ── */}
      {showAusForm && selectedEmp && (
        <>
          <div className="drawer-overlay" onClick={()=>setShowAusForm(false)}/>
          <div className="drawer" style={{ width:420 }}>
            <div className="drawer-head">
              <div>
                <div style={{ fontSize:16,fontWeight:600 }}>Registrar ausencia</div>
                <div style={{ fontSize:12,color:'var(--text-3)',marginTop:3 }}>{selectedEmp.nombre}</div>
              </div>
              <button className="icon-btn" onClick={()=>setShowAusForm(false)}><Icon name="close" size={15}/></button>
            </div>
            <div className="drawer-body">
              <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                <div>{lbl('Fecha')}<input type="date" value={ausForm.fecha||''} onChange={e=>setAusForm(p=>({...p,fecha:e.target.value}))} style={fl}/></div>
                <div>{lbl('Tipo de ausencia')}<select value={ausForm.tipo||TIPOS_AUS[0]} onChange={e=>setAusForm(p=>({...p,tipo:e.target.value}))} style={fl}>{TIPOS_AUS.map(t=><option key={t}>{t}</option>)}</select></div>
                <div>{lbl('Días')}<input type="number" min="0.5" step="0.5" value={ausForm.dias||''} onChange={e=>setAusForm(p=>({...p,dias:parseFloat(e.target.value)||0}))} style={{ ...fl,fontFamily:'var(--font-mono)' }}/></div>
                <div>{lbl('Nota')}<textarea rows={2} value={ausForm.nota||''} onChange={e=>setAusForm(p=>({...p,nota:e.target.value}))} style={{ ...fl,resize:'vertical' }}/></div>
                {(ausForm.tipo==='Permiso sin goce'||ausForm.tipo==='Falta sin aviso') && ausForm.dias > 0 && (
                  <div className="hint" style={{ background:'var(--bad-soft)',borderColor:'var(--bad)' }}>
                    <b>Descuento automático:</b> ${((selectedEmp.salario||0)/30*(ausForm.dias||0)).toFixed(2)} (${((selectedEmp.salario||0)/30).toFixed(2)}/día × {ausForm.dias} día{ausForm.dias!==1?'s':''})
                  </div>
                )}
                {(ausForm.tipo==='Permiso con goce'||ausForm.tipo==='Vacaciones'||ausForm.tipo==='Enfermedad'||ausForm.tipo==='Licencia especial') && (
                  <div className="hint"><b>Sin descuento salarial</b> — se registra solo para control de asistencia.</div>
                )}
              </div>
            </div>
            <div className="drawer-foot">
              <button className="btn" onClick={()=>setShowAusForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveAus} disabled={!ausForm.dias}>Registrar</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

window.EmpleadosPage = EmpleadosPage;
