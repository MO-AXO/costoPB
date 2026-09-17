// Reporte Anual — comparativo mes a mes con tendencias
const ReporteAnual = ({ store }) => {
  const { useMemo, useState } = React;

  const years = useMemo(function() {
    var yrs = {};
    Object.keys(store.months).forEach(function(id) { yrs[id.split('-')[0]] = true; });
    return Object.keys(yrs).sort().reverse();
  }, [store]);

  const [selectedYear, setSelectedYear] = useState(years[0] || '2026');

  const MESES_LABEL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  const montoNetoPago = function(p) { return (p.monto || 0) + (p.bonificacion || 0) - (p.deduccion || 0); };

  // Calcular datos por mes para el año seleccionado
  const monthlyData = useMemo(function() {
    var data = [];
    for (var m = 1; m <= 12; m++) {
      var mid = selectedYear + '-' + String(m).padStart(2, '0');
      var month = store.months[mid];
      if (!month) {
        data.push({ mid: mid, label: MESES_LABEL[m-1], exists: false, ingresoTotal: 0, ingresoNeto: 0, comisiones: 0, impuestos: 0, gastos: 0, nomina: 0, utilidad: 0, ventasCount: 0 });
        continue;
      }
      var v = month.ventas || [];
      var g = (month.gastos?.formal || []).filter(function(x) { return !x.pagoEmpleadoId; });
      var p = (month.empleados?.pagos || []);
      var ingresoTotal = v.reduce(function(a, x) { return a + (x.ingresoTotal || 0); }, 0);
      var ingresoNeto = v.reduce(function(a, x) { return a + (x.ingresoNeto || 0); }, 0);
      var comisiones = v.reduce(function(a, x) { return a + (x.comision || 0); }, 0);
      var impuestos = v.reduce(function(a, x) { return a + (x.impuestos || 0); }, 0);
      var gastos = g.reduce(function(a, x) { return a + (x.monto || 0); }, 0);
      var nomina = p.reduce(function(a, x) { return a + montoNetoPago(x); }, 0);
      var utilidad = ingresoNeto - gastos - nomina;
      data.push({ mid: mid, label: MESES_LABEL[m-1], exists: true, ingresoTotal: ingresoTotal, ingresoNeto: ingresoNeto, comisiones: comisiones, impuestos: impuestos, gastos: gastos, nomina: nomina, utilidad: utilidad, ventasCount: v.length });
    }
    return data;
  }, [store, selectedYear]);

  var activeMonths = monthlyData.filter(function(d) { return d.exists; });

  // Totales del año
  var totals = useMemo(function() {
    return {
      ingresoTotal: activeMonths.reduce(function(a, d) { return a + d.ingresoTotal; }, 0),
      ingresoNeto: activeMonths.reduce(function(a, d) { return a + d.ingresoNeto; }, 0),
      comisiones: activeMonths.reduce(function(a, d) { return a + d.comisiones; }, 0),
      impuestos: activeMonths.reduce(function(a, d) { return a + d.impuestos; }, 0),
      gastos: activeMonths.reduce(function(a, d) { return a + d.gastos; }, 0),
      nomina: activeMonths.reduce(function(a, d) { return a + d.nomina; }, 0),
      utilidad: activeMonths.reduce(function(a, d) { return a + d.utilidad; }, 0),
      ventasCount: activeMonths.reduce(function(a, d) { return a + d.ventasCount; }, 0),
    };
  }, [activeMonths]);

  var margenAnual = totals.ingresoNeto > 0 ? (totals.utilidad / totals.ingresoNeto * 100) : 0;

  // Promedios
  var promedios = activeMonths.length > 0 ? {
    ingresoNeto: totals.ingresoNeto / activeMonths.length,
    gastos: totals.gastos / activeMonths.length,
    nomina: totals.nomina / activeMonths.length,
    utilidad: totals.utilidad / activeMonths.length,
  } : { ingresoNeto: 0, gastos: 0, nomina: 0, utilidad: 0 };

  // Mejor y peor mes
  var mejorMes = activeMonths.length > 0 ? activeMonths.reduce(function(best, d) { return d.utilidad > best.utilidad ? d : best; }) : null;
  var peorMes = activeMonths.length > 0 ? activeMonths.reduce(function(worst, d) { return d.utilidad < worst.utilidad ? d : worst; }) : null;

  var fmt$ = function(n) { return '$' + (n || 0).toFixed(2); };
  var fmt$0 = function(n) { return '$' + Math.round(n || 0).toLocaleString(); };

  // Mini bar chart
  var maxIngreso = Math.max.apply(null, monthlyData.map(function(d) { return d.ingresoNeto; }).concat([1]));
  var maxGasto = Math.max.apply(null, monthlyData.map(function(d) { return d.gastos + d.nomina; }).concat([1]));
  var chartMax = Math.max(maxIngreso, maxGasto, 1);

  var barH = 120;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reporte Anual</h1>
          <div className="page-sub">Comparativo mes a mes · {selectedYear}</div>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={selectedYear} onChange={function(e) { setSelectedYear(e.target.value); }}
            style={{ fontSize: 13, padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)' }}>
            {years.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
          </select>
          <button className="btn" onClick={function() { window.print(); }}><Icon name="download" size={14} /> Imprimir</button>
        </div>
      </div>

      {/* KPIs anuales */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi">
          <div className="kpi-label">Ingreso Neto Anual</div>
          <div className="kpi-value" style={{ color: 'var(--good)' }}>{fmt$0(totals.ingresoNeto)}</div>
          <div className="kpi-foot"><span className="kpi-target">{totals.ventasCount} ventas en {activeMonths.length} meses</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Egresos</div>
          <div className="kpi-value" style={{ color: 'var(--bad)' }}>{fmt$0(totals.gastos + totals.nomina)}</div>
          <div className="kpi-foot"><span className="kpi-target">Gastos {fmt$0(totals.gastos)} + N&oacute;mina {fmt$0(totals.nomina)}</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Utilidad Anual</div>
          <div className="kpi-value" style={{ color: totals.utilidad >= 0 ? 'var(--good)' : 'var(--bad)' }}>{fmt$0(totals.utilidad)}</div>
          <div className="kpi-foot"><span className="kpi-target">{margenAnual.toFixed(1)}% margen</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Promedio Mensual</div>
          <div className="kpi-value">{fmt$0(promedios.utilidad)}</div>
          <div className="kpi-foot"><span className="kpi-target">utilidad / mes</span></div>
        </div>
      </div>

      {/* Gráfico de barras mes a mes */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div>
            <div className="card-title">Tendencia Mensual</div>
            <div className="card-sub">Ingresos vs Egresos por mes</div>
          </div>
        </div>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', minWidth: 700, height: barH + 40, padding: '0 8px' }}>
            {monthlyData.map(function(d) {
              var ingH = chartMax > 0 ? (d.ingresoNeto / chartMax) * barH : 0;
              var egH = chartMax > 0 ? ((d.gastos + d.nomina) / chartMax) * barH : 0;
              return (
                <div key={d.mid} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: barH }}>
                    <div style={{ width: 18, height: Math.max(ingH, 2), background: d.exists ? 'var(--good)' : 'var(--border)', borderRadius: '3px 3px 0 0', opacity: d.exists ? 1 : 0.3 }} title={'Ingreso: ' + fmt$0(d.ingresoNeto)} />
                    <div style={{ width: 18, height: Math.max(egH, 2), background: d.exists ? 'var(--bad)' : 'var(--border)', borderRadius: '3px 3px 0 0', opacity: d.exists ? 0.7 : 0.3 }} title={'Egresos: ' + fmt$0(d.gastos + d.nomina)} />
                  </div>
                  <div style={{ fontSize: 10, color: d.exists ? 'var(--text-2)' : 'var(--text-3)', fontWeight: d.exists ? 600 : 400, marginTop: 4 }}>{d.label}</div>
                  {d.exists && <div style={{ fontSize: 9, color: d.utilidad >= 0 ? 'var(--good)' : 'var(--bad)', fontFamily: 'var(--font-mono)' }}>{fmt$0(d.utilidad)}</div>}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-3)' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--good)', borderRadius: 2, marginRight: 4, verticalAlign: -1 }} />Ingreso Neto</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--bad)', borderRadius: 2, marginRight: 4, verticalAlign: -1, opacity: 0.7 }} />Egresos</span>
          </div>
        </div>
      </div>

      <div className="two-col" style={{ gap: 16 }}>
        {/* Tabla comparativa */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Comparativo Mensual</div>
              <div className="card-sub">Desglose por mes</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th className="right">Ingreso Neto</th>
                  <th className="right">Gastos Op.</th>
                  <th className="right">N&oacute;mina</th>
                  <th className="right">Utilidad</th>
                  <th className="right">Margen</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.filter(function(d) { return d.exists; }).map(function(d) {
                  var margen = d.ingresoNeto > 0 ? (d.utilidad / d.ingresoNeto * 100) : 0;
                  return (
                    <tr key={d.mid}>
                      <td style={{ fontWeight: 500 }}>{d.label} {selectedYear}</td>
                      <td className="right" style={{ fontFamily: 'var(--font-mono)', color: 'var(--good)', fontWeight: 600 }}>{fmt$(d.ingresoNeto)}</td>
                      <td className="right" style={{ fontFamily: 'var(--font-mono)', color: 'var(--bad)' }}>{fmt$(d.gastos)}</td>
                      <td className="right" style={{ fontFamily: 'var(--font-mono)', color: 'var(--bad)' }}>{fmt$(d.nomina)}</td>
                      <td className="right" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: d.utilidad >= 0 ? 'var(--good)' : 'var(--bad)' }}>{fmt$(d.utilidad)}</td>
                      <td className="right" style={{ fontFamily: 'var(--font-mono)', color: margen >= 20 ? 'var(--good)' : margen >= 0 ? 'var(--warn)' : 'var(--bad)' }}>{margen.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--surface-sunk)', borderTop: '2px solid var(--border-strong)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>Total {selectedYear}</td>
                  <td className="right" style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--good)' }}>{fmt$(totals.ingresoNeto)}</td>
                  <td className="right" style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--bad)' }}>{fmt$(totals.gastos)}</td>
                  <td className="right" style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--bad)' }}>{fmt$(totals.nomina)}</td>
                  <td className="right" style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: totals.utilidad >= 0 ? 'var(--good)' : 'var(--bad)' }}>{fmt$(totals.utilidad)}</td>
                  <td className="right" style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: margenAnual >= 20 ? 'var(--good)' : margenAnual >= 0 ? 'var(--warn)' : 'var(--bad)' }}>{margenAnual.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Panel derecho */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Indicadores */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Indicadores Anuales</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Meses con datos', value: activeMonths.length + ' / 12' },
                { label: 'Ingreso bruto total', value: fmt$0(totals.ingresoTotal) },
                { label: 'Comisiones totales', value: fmt$0(totals.comisiones) },
                { label: 'Impuestos totales', value: fmt$0(totals.impuestos) },
                { label: 'Promedio ingreso/mes', value: fmt$0(promedios.ingresoNeto) },
                { label: 'Promedio gastos/mes', value: fmt$0(promedios.gastos) },
                { label: 'Promedio nómina/mes', value: fmt$0(promedios.nomina) },
                { label: 'Costo nómina / ingreso', value: totals.ingresoNeto > 0 ? (totals.nomina / totals.ingresoNeto * 100).toFixed(1) + '%' : '0%' },
                { label: 'Gastos op. / ingreso', value: totals.ingresoNeto > 0 ? (totals.gastos / totals.ingresoNeto * 100).toFixed(1) + '%' : '0%' },
              ].map(function(item, i) {
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{item.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mejor y peor mes */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Mejor y Peor Mes</div>
            </div>
            <div className="card-body">
              {mejorMes ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--good-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 16 }}>&#x1F3C6;</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{mejorMes.label} {selectedYear}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Mejor utilidad</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--good)' }}>{fmt$0(mejorMes.utilidad)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bad-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 16 }}>&#x26A0;</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{peorMes.label} {selectedYear}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Menor utilidad</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: peorMes.utilidad >= 0 ? 'var(--warn)' : 'var(--bad)' }}>{fmt$0(peorMes.utilidad)}</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Sin datos para comparar</div>
              )}
            </div>
          </div>

          {/* Tendencia utilidad */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Tendencia de Utilidad</div>
                <div className="card-sub">Evoluci&oacute;n mes a mes</div>
              </div>
            </div>
            <div className="card-body">
              {activeMonths.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Sin datos</div>
              ) : (
                activeMonths.map(function(d, i) {
                  var maxUtil = Math.max.apply(null, activeMonths.map(function(x) { return Math.abs(x.utilidad); }).concat([1]));
                  var pct = Math.abs(d.utilidad) / maxUtil * 100;
                  var prev = i > 0 ? activeMonths[i - 1] : null;
                  var cambio = prev && prev.utilidad !== 0 ? ((d.utilidad - prev.utilidad) / Math.abs(prev.utilidad) * 100) : null;
                  return (
                    <div key={d.mid} className="bar-row">
                      <div style={{ fontSize: 12, color: 'var(--text-2)', minWidth: 32 }}>{d.label}</div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: pct + '%', background: d.utilidad >= 0 ? 'var(--good)' : 'var(--bad)' }} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textAlign: 'right', minWidth: 60, color: d.utilidad >= 0 ? 'var(--good)' : 'var(--bad)' }}>{fmt$0(d.utilidad)}</div>
                      {cambio !== null && (
                        <div style={{ fontSize: 10, color: cambio >= 0 ? 'var(--good)' : 'var(--bad)', minWidth: 45, textAlign: 'right' }}>
                          {cambio >= 0 ? '\u2191' : '\u2193'}{Math.abs(cambio).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.ReporteAnual = ReporteAnual;
