// Reportes — Estado de resultados mensual
const Reportes = ({ ventas, gastos, empleados, monthLabel, store, viewMonthId }) => {
  const { useMemo } = React;

  // ── Datos ──
  const ventasList = ventas || [];
  const gastosList = (gastos?.formal || []);
  const pagosList  = (empleados?.pagos || []);
  const listaEmp   = (empleados?.lista || []);

  const montoNetoPago = (p) => (p.monto || 0) + (p.bonificacion || 0) - (p.deduccion || 0);

  // ── Ingresos ──
  const ingresos = useMemo(() => {
    const total      = ventasList.reduce((a, v) => a + (v.ingresoTotal || 0), 0);
    const comisiones = ventasList.reduce((a, v) => a + (v.comision || 0), 0);
    const impuestos  = ventasList.reduce((a, v) => a + (v.impuestos || 0), 0);
    const neto       = ventasList.reduce((a, v) => a + (v.ingresoNeto || 0), 0);
    return { total, comisiones, impuestos, neto, count: ventasList.length };
  }, [ventasList]);

  // ── Gastos (sin nomina para no duplicar) ──
  const gastosData = useMemo(() => {
    const sinNomina = gastosList.filter(g => !g.pagoEmpleadoId);
    const total = sinNomina.reduce((a, g) => a + (g.monto || 0), 0);
    const porCategoria = {};
    sinNomina.forEach(g => {
      var cat = g.categoria || 'Otro';
      porCategoria[cat] = (porCategoria[cat] || 0) + (g.monto || 0);
    });
    return { total, porCategoria, count: sinNomina.length };
  }, [gastosList]);

  // ── Nomina ──
  const nomina = useMemo(() => {
    const totalPagos = pagosList.reduce((a, p) => a + montoNetoPago(p), 0);
    const totalBonos = pagosList.reduce((a, p) => a + (p.bonificacion || 0), 0);
    const totalDeduc = pagosList.reduce((a, p) => a + (p.deduccion || 0), 0);
    const totalBase  = pagosList.reduce((a, p) => a + (p.monto || 0), 0);
    return { totalPagos, totalBase, totalBonos, totalDeduc, count: pagosList.length };
  }, [pagosList]);

  // ── Totales ──
  const totalEgresos = gastosData.total + nomina.totalPagos;
  const utilidad     = ingresos.neto - totalEgresos;
  const margen       = ingresos.neto > 0 ? (utilidad / ingresos.neto) * 100 : 0;

  // ── Ingresos por categoria ──
  const ingresoPorCat = useMemo(() => {
    var result = {};
    ventasList.forEach(v => {
      var cat = v.categoria || 'Otro';
      if (!result[cat]) result[cat] = { total: 0, neto: 0, count: 0 };
      result[cat].total += (v.ingresoTotal || 0);
      result[cat].neto  += (v.ingresoNeto || 0);
      result[cat].count += 1;
    });
    return result;
  }, [ventasList]);

  // ── Ingresos por medio de pago ──
  const ingresoPorMedio = useMemo(() => {
    var result = {};
    ventasList.forEach(v => {
      var medio = v.medioPago || 'Otro';
      if (!result[medio]) result[medio] = { total: 0, neto: 0, count: 0 };
      result[medio].total += (v.ingresoTotal || 0);
      result[medio].neto  += (v.ingresoNeto || 0);
      result[medio].count += 1;
    });
    return result;
  }, [ventasList]);

  // ── Mes anterior (comparativo) ──
  const prevData = useMemo(() => {
    var ids = Object.keys(store.months).sort();
    var idx = ids.indexOf(viewMonthId);
    if (idx <= 0) return null;
    var prevMonth = store.months[ids[idx - 1]];
    if (!prevMonth) return null;
    var pVentas  = (prevMonth.ventas || []);
    var pGastos  = (prevMonth.gastos?.formal || []).filter(g => !g.pagoEmpleadoId);
    var pPagos   = (prevMonth.empleados?.pagos || []);
    var pIngresoNeto = pVentas.reduce((a, v) => a + (v.ingresoNeto || 0), 0);
    var pGastosTotal = pGastos.reduce((a, g) => a + (g.monto || 0), 0);
    var pNomina      = pPagos.reduce((a, p) => a + (p.monto || 0) + (p.bonificacion || 0) - (p.deduccion || 0), 0);
    var pUtilidad    = pIngresoNeto - pGastosTotal - pNomina;
    return { ingresoNeto: pIngresoNeto, gastos: pGastosTotal, nomina: pNomina, utilidad: pUtilidad, label: prevMonth.label };
  }, [store, viewMonthId]);

  const pctChange = (curr, prev) => {
    if (!prev || prev === 0) return null;
    return ((curr - prev) / Math.abs(prev)) * 100;
  };

  const fmt$ = (n) => '$' + (n || 0).toFixed(2);
  const fmt$0 = (n) => '$' + Math.round(n || 0).toLocaleString();

  const DeltaBadge = ({ value }) => {
    if (value == null) return null;
    var color = value > 0 ? 'var(--good)' : value < 0 ? 'var(--bad)' : 'var(--text-3)';
    var arrow = value > 0 ? '↑' : value < 0 ? '↓' : '–';
    return React.createElement('span', {
      style: { fontSize: 11, fontWeight: 600, color: color, marginLeft: 6 }
    }, arrow + ' ' + Math.abs(value).toFixed(1) + '%');
  };

  const maxGasto = Math.max(...Object.values(gastosData.porCategoria), 1);
  const maxIngCat = Math.max(...Object.values(ingresoPorCat).map(v => v.neto), 1);
  const maxIngMedio = Math.max(...Object.values(ingresoPorMedio).map(v => v.neto), 1);

  // ── Estilo fila P&L ──
  const plRow = (label, value, opts) => {
    var st = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 14 };
    if (opts?.bold) { st.fontWeight = 700; st.fontSize = 15; }
    if (opts?.border) { st.borderTop = '2px solid var(--border)'; st.paddingTop = 12; st.marginTop = 4; }
    if (opts?.sub) { st.paddingLeft = 20; st.fontSize = 13; st.color = 'var(--text-2)'; }
    return React.createElement('div', { style: st, key: label },
      React.createElement('span', null, label),
      React.createElement('span', {
        style: { fontFamily: 'var(--font-mono)', fontWeight: opts?.bold ? 700 : 600, color: opts?.color || 'var(--text)' }
      }, typeof value === 'number' ? fmt$(value) : value)
    );
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reporte Mensual</h1>
          <div className="page-sub">Estado de resultados · {monthLabel}</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => window.print()}><Icon name="download" size={14} /> Imprimir</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi">
          <div className="kpi-label">Ingreso Neto</div>
          <div className="kpi-value" style={{ color: 'var(--good)' }}>{fmt$0(ingresos.neto)}</div>
          <div className="kpi-foot">
            <span className="kpi-target">{ingresos.count} ventas</span>
            <DeltaBadge value={pctChange(ingresos.neto, prevData?.ingresoNeto)} />
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Egresos</div>
          <div className="kpi-value" style={{ color: 'var(--bad)' }}>{fmt$0(totalEgresos)}</div>
          <div className="kpi-foot">
            <span className="kpi-target">Gastos + N&oacute;mina</span>
            <DeltaBadge value={pctChange(totalEgresos, prevData ? prevData.gastos + prevData.nomina : null)} />
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Utilidad</div>
          <div className="kpi-value" style={{ color: utilidad >= 0 ? 'var(--good)' : 'var(--bad)' }}>{fmt$0(utilidad)}</div>
          <div className="kpi-foot">
            <span className="kpi-target">{margen.toFixed(1)}% margen</span>
            <DeltaBadge value={pctChange(utilidad, prevData?.utilidad)} />
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Margen de Utilidad</div>
          <div className="kpi-value" style={{ color: margen >= 20 ? 'var(--good)' : margen >= 0 ? 'var(--warn)' : 'var(--bad)' }}>{margen.toFixed(1)}%</div>
          <div className="kpi-foot"><span className="kpi-target">Utilidad / Ingreso Neto</span></div>
        </div>
      </div>

      <div className="two-col" style={{ gap: 16 }}>
        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Estado de Resultados */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Estado de Resultados</div>
                <div className="card-sub">{monthLabel}{prevData ? ' vs ' + prevData.label : ''}</div>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column' }}>
              {plRow('Ingreso Total (bruto)', ingresos.total, { bold: true })}
              {plRow('Comisiones', -ingresos.comisiones, { sub: true, color: 'var(--bad)' })}
              {plRow('Impuestos', -ingresos.impuestos, { sub: true, color: 'var(--bad)' })}
              {plRow('Ingreso Neto', ingresos.neto, { bold: true, border: true, color: 'var(--good)' })}

              <div style={{ height: 16 }} />

              {plRow('Gastos operativos', -gastosData.total, { bold: true, color: 'var(--bad)' })}
              {Object.entries(gastosData.porCategoria)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([cat, total]) => plRow(cat, -total, { sub: true, color: 'var(--bad)' }))}
              {Object.keys(gastosData.porCategoria).length > 8 && plRow('... y ' + (Object.keys(gastosData.porCategoria).length - 8) + ' m\u00e1s', '', { sub: true })}

              {plRow('N\u00f3mina', -nomina.totalPagos, { bold: true, color: 'var(--bad)' })}
              {plRow('Salarios base', -nomina.totalBase, { sub: true, color: 'var(--bad)' })}
              {nomina.totalBonos > 0 && plRow('Bonificaciones', -nomina.totalBonos, { sub: true, color: 'var(--bad)' })}
              {nomina.totalDeduc > 0 && plRow('Deducciones recuperadas', nomina.totalDeduc, { sub: true, color: 'var(--good)' })}

              {plRow('UTILIDAD OPERATIVA', utilidad, { bold: true, border: true, color: utilidad >= 0 ? 'var(--good)' : 'var(--bad)' })}
              {plRow('Margen', margen.toFixed(1) + '%', { sub: true, color: margen >= 20 ? 'var(--good)' : margen >= 0 ? 'var(--warn)' : 'var(--bad)' })}
            </div>
          </div>

          {/* Empleados resumen */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Resumen de N\u00f3mina</div>
                <div className="card-sub">{nomina.count} pagos registrados · {listaEmp.filter(e => e.estado === 'Activo').length} empleados activos</div>
              </div>
            </div>
            <div className="card-body">
              {listaEmp.filter(e => {
                return pagosList.some(p => p.empId === e.id);
              }).map(emp => {
                var empPagos = pagosList.filter(p => p.empId === emp.id);
                var empTotal = empPagos.reduce((a, p) => a + montoNetoPago(p), 0);
                return (
                  <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--surface-sunk)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{emp.nombre[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{emp.nombre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{emp.puesto} · {empPagos.length} pago{empPagos.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{fmt$(empTotal)}</div>
                  </div>
                );
              })}
              {pagosList.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Sin pagos este mes</div>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Ingresos por categoria */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Ingresos por Categor\u00eda</div>
                <div className="card-sub">Ingreso neto</div>
              </div>
            </div>
            <div className="card-body">
              {Object.keys(ingresoPorCat).length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>Sin ventas</div>
              ) : Object.entries(ingresoPorCat).sort((a, b) => b[1].neto - a[1].neto).map(([cat, data]) => (
                <div key={cat} className="bar-row">
                  <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat} <span style={{ fontSize: 10, color: 'var(--text-3)' }}>({data.count})</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: (data.neto / maxIngCat * 100) + '%', background: 'var(--good)' }} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, textAlign: 'right', color: 'var(--good)' }}>{fmt$0(data.neto)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ingresos por medio de pago */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Ingresos por Medio de Pago</div>
                <div className="card-sub">Ingreso neto</div>
              </div>
            </div>
            <div className="card-body">
              {Object.keys(ingresoPorMedio).length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>Sin ventas</div>
              ) : Object.entries(ingresoPorMedio).sort((a, b) => b[1].neto - a[1].neto).map(([medio, data]) => (
                <div key={medio} className="bar-row">
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    {medio} <span style={{ fontSize: 10, color: 'var(--text-3)' }}>({data.count})</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: (data.neto / maxIngMedio * 100) + '%' }} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{fmt$0(data.neto)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top gastos */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Gastos por Categor\u00eda</div>
                <div className="card-sub">{gastosData.count} registros</div>
              </div>
            </div>
            <div className="card-body">
              {Object.keys(gastosData.porCategoria).length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>Sin gastos</div>
              ) : Object.entries(gastosData.porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
                <div key={cat} className="bar-row">
                  <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: (total / maxGasto * 100) + '%', background: 'var(--bad)' }} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, textAlign: 'right', color: 'var(--bad)' }}>{fmt$0(total)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicadores clave */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Indicadores Clave</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Ticket promedio', value: ingresos.count > 0 ? fmt$(ingresos.neto / ingresos.count) : '$0.00' },
                { label: 'Gasto promedio por registro', value: gastosData.count > 0 ? fmt$(gastosData.total / gastosData.count) : '$0.00' },
                { label: 'Costo n\u00f3mina / ingreso', value: ingresos.neto > 0 ? (nomina.totalPagos / ingresos.neto * 100).toFixed(1) + '%' : '0%' },
                { label: 'Gastos op. / ingreso', value: ingresos.neto > 0 ? (gastosData.total / ingresos.neto * 100).toFixed(1) + '%' : '0%' },
                { label: 'Empleados con pago', value: new Set(pagosList.map(p => p.empId)).size + ' / ' + listaEmp.length },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{item.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Reportes = Reportes;
