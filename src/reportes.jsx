// Reportes — P&L con Gastos integrados + comparativo mes a mes
const Reportes = ({ insumos, subrecetas, recetas, fixedCosts, monthLabel, gastos, store, viewMonthId }) => {
  const C = window.PB_CALC;
  const D = window.PB_DATA;
  const all = recetas.map(r => ({ receta: r, m: C.recetaMetrics(r, insumos, subrecetas, fixedCosts) }));

  const totalRevenue    = all.reduce((a, x) => a + x.m.monthlyRevenue, 0);
  const totalIngredient = all.reduce((a, x) => a + x.m.ingredientCost * x.receta.monthlySales, 0);
  const totalLabor      = all.reduce((a, x) => a + x.m.laborCost * x.receta.monthlySales, 0);
  const totalPackaging  = all.reduce((a, x) => a + x.m.packagingCost * x.receta.monthlySales, 0);

  const staffSalary = (fixedCosts.staff || []).reduce((a, m) => a + (m.salary || 0), 0)
                   || (fixedCosts.salaries || 0);
  const totalFixed = (fixedCosts.rent        || 0) +
                     staffSalary                   +
                     (fixedCosts.gas        || 0) +
                     (fixedCosts.water      || 0) +
                     (fixedCosts.internet   || 0) +
                     (fixedCosts.gasoline   || 0) +
                     (fixedCosts.charcoal   || 0) +
                     (fixedCosts.wood       || 0) +
                     (fixedCosts.aluminum   || 0) +
                     (fixedCosts.electricity|| 0) +
                     (fixedCosts.accountant || 0) +
                     (fixedCosts.cleaning   || 0) +
                     (fixedCosts.utilities  || 0) +
                     (fixedCosts.insurance  || 0) +
                     (fixedCosts.software   || 0);

  // ── Gastos registrados (caja chica + formales) ──
  const totalCaja   = (gastos?.caja   || []).reduce((a, i) => a + (i.monto || 0), 0);
  const totalFormal = (gastos?.formal || []).reduce((a, i) => a + (i.monto || 0), 0);
  const totalGastos = totalCaja + totalFormal;

  // Gastos por categoría para detalle
  const categoriasFormal = {};
  (gastos?.formal || []).forEach(g => {
    categoriasFormal[g.categoria] = (categoriasFormal[g.categoria] || 0) + g.monto;
  });

  const grossProfit = totalRevenue - totalIngredient - totalLabor - totalPackaging - totalFixed - totalGastos;

  const byCategory = {};
  all.forEach(({ receta, m }) => {
    if (!byCategory[receta.category]) byCategory[receta.category] = { revenue: 0, cost: 0, units: 0 };
    byCategory[receta.category].revenue += m.monthlyRevenue;
    byCategory[receta.category].cost    += m.ingredientCost * receta.monthlySales;
    byCategory[receta.category].units   += receta.monthlySales;
  });

  // ── Comparativo mes anterior ──
  const meses = store ? Object.keys(store.months).sort() : [];
  const idxActual = meses.indexOf(viewMonthId || '');
  const mesAnteriorId = idxActual > 0 ? meses[idxActual - 1] : null;
  const mesAnt = mesAnteriorId ? store.months[mesAnteriorId] : null;

  const antMetrics = mesAnt
    ? mesAnt.recetas.map(r => ({ receta: r, m: C.recetaMetrics(r, mesAnt.insumos, mesAnt.subrecetas, mesAnt.fixedCosts) }))
    : [];
  const antRevenue    = antMetrics.reduce((a, x) => a + x.m.monthlyRevenue, 0);
  const antIngredient = antMetrics.reduce((a, x) => a + x.m.ingredientCost * x.receta.monthlySales, 0);
  const antGastos     = ((mesAnt?.gastos?.caja || []).reduce((a, i) => a + i.monto, 0)) +
                        ((mesAnt?.gastos?.formal || []).reduce((a, i) => a + i.monto, 0));
  const antFixed      = mesAnt ? (() => {
    const fc = mesAnt.fixedCosts || {};
    const ss = (fc.staff || []).reduce((a, m) => a + (m.salary || 0), 0) || (fc.salaries || 0);
    return (fc.rent||0)+ss+(fc.gas||0)+(fc.water||0)+(fc.internet||0)+(fc.gasoline||0)+(fc.charcoal||0)+(fc.wood||0)+(fc.aluminum||0)+(fc.electricity||0)+(fc.accountant||0)+(fc.cleaning||0);
  })() : 0;
  const antProfit = antRevenue - antIngredient - antFixed - antGastos;

  const delta = (curr, prev) => {
    if (!prev || prev === 0) return null;
    return ((curr - prev) / Math.abs(prev)) * 100;
  };

  const safeRev = Math.max(totalRevenue, 0.0001);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reportes</h1>
          <div className="page-sub">P&L del mes · {monthLabel || 'Mes actual'}</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => window.print()}><Icon name="download" /> Exportar PDF</button>
        </div>
      </div>

      {/* Comparativo rápido si hay mes anterior */}
      {mesAnt && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-head">
            <div className="card-title">Comparativo vs {mesAnt.label}</div>
            <div className="card-sub">Variación mensual en métricas clave</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
            {[
              { label: 'Ingresos',        curr: totalRevenue,    prev: antRevenue,    fmt: fmt$0 },
              { label: 'Costo ingredientes', curr: totalIngredient, prev: antIngredient, fmt: fmt$0 },
              { label: 'Gastos adicionales', curr: totalGastos,   prev: antGastos,    fmt: fmt$0 },
              { label: 'Utilidad operativa', curr: grossProfit,   prev: antProfit,     fmt: fmt$0 },
            ].map((k, i) => {
              const d = delta(k.curr, k.prev);
              const isGoodUp = k.label === 'Ingresos' || k.label === 'Utilidad operativa';
              const up = d > 0;
              const color = d == null ? 'var(--text-3)' : (up === isGoodUp ? 'var(--good)' : 'var(--bad)');
              return (
                <div key={i} style={{ padding: '14px 20px', borderRight: i < 3 ? '1px solid var(--border)' : 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18 }}>{k.fmt(k.curr)}</div>
                  {d != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Icon name={up ? 'arrow-up' : 'arrow-down'} size={11} style={{ color }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, fontWeight: 600 }}>
                        {Math.abs(d).toFixed(1)}% vs {mesAnt.label}
                      </span>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Anterior: {k.fmt(k.prev)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="two-col">
        {/* P&L completo */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Estado de resultados (P&L)</div>
            <div className="card-sub">Vista mensual completa</div>
          </div>
          <div className="card-body">
            <PLRow label="Ingresos por ventas" value={totalRevenue} kind="header" />
            <div className="divider" />
            <PLRow label="Costo de ingredientes"  value={-totalIngredient} pct={(totalIngredient/safeRev)*100} />
            <PLRow label="Mano de obra (cocina)"  value={-totalLabor}      pct={(totalLabor/safeRev)*100} />
            <PLRow label="Empaques"               value={-totalPackaging}  pct={(totalPackaging/safeRev)*100} />
            <div className="divider" />
            <PLRow label="Margen bruto"
              value={totalRevenue - totalIngredient - totalLabor - totalPackaging}
              pct={((totalRevenue-totalIngredient-totalLabor-totalPackaging)/safeRev)*100}
              kind="subtotal" />
            <div className="divider" />

            {/* Costos fijos */}
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 0 2px' }}>Costos fijos</div>
            <PLRow label="Alquiler"           value={-(fixedCosts.rent        || 0)} />
            <PLRow label="Salarios personal"  value={-staffSalary} />
            <PLRow label="Electricidad"       value={-(fixedCosts.electricity || 0)} />
            <PLRow label="Gas"                value={-(fixedCosts.gas        || 0)} />
            <PLRow label="Agua"               value={-(fixedCosts.water      || 0)} />
            <PLRow label="Internet"           value={-(fixedCosts.internet   || 0)} />
            <PLRow label="Gasolina"           value={-(fixedCosts.gasoline   || 0)} />
            <PLRow label="Carbón"             value={-(fixedCosts.charcoal   || 0)} />
            <PLRow label="Madera"             value={-(fixedCosts.wood       || 0)} />
            <PLRow label="Aluminio (foil)"    value={-(fixedCosts.aluminum   || 0)} />
            <PLRow label="Contador"           value={-(fixedCosts.accountant || 0)} />
            <PLRow label="Equipo limpieza"    value={-(fixedCosts.cleaning   || 0)} />

            {/* Gastos adicionales */}
            {totalGastos > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '10px 0 2px' }}>Gastos adicionales</div>
                {totalCaja > 0 && <PLRow label="Caja chica" value={-totalCaja} pct={(totalCaja/safeRev)*100} />}
                {Object.entries(categoriasFormal).sort((a,b)=>b[1]-a[1]).map(([cat, monto]) => (
                  <PLRow key={cat} label={cat} value={-monto} pct={(monto/safeRev)*100} />
                ))}
              </>
            )}

            <div className="divider" />
            <PLRow label="Utilidad operativa"
              value={grossProfit}
              pct={totalRevenue > 0 ? (grossProfit/safeRev)*100 : 0}
              kind="total" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Ventas por categoría */}
          <div className="card">
            <div className="card-head"><div className="card-title">Ventas por categoría</div></div>
            <div className="card-body">
              {Object.entries(byCategory).sort((a,b) => b[1].revenue - a[1].revenue).map(([cat, v]) => (
                <div key={cat} className="bar-row" style={{ gridTemplateColumns: '110px 1fr 80px' }}>
                  <span style={{ fontSize: 12 }}>{cat}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: ((v.revenue / Math.max(totalRevenue,1)) * 100) + '%' }} />
                  </div>
                  <span className="num" style={{ textAlign: 'right', fontSize: 12 }}>{fmt$0(v.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Desglose de gastos */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Gastos adicionales del mes</div>
              <div className="card-sub">Caja chica + formales</div>
            </div>
            <div className="card-body">
              {totalGastos === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>
                  Sin gastos registrados este mes
                </div>
              ) : (
                <>
                  {totalCaja > 0 && (
                    <div className="bar-row" style={{ gridTemplateColumns: '110px 1fr 80px' }}>
                      <span style={{ fontSize: 12 }}>Caja chica</span>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(totalCaja/totalGastos)*100}%`, background: 'var(--warn)' }} /></div>
                      <span className="num" style={{ textAlign: 'right', fontSize: 12 }}>{fmt$0(totalCaja)}</span>
                    </div>
                  )}
                  {Object.entries(categoriasFormal).sort((a,b)=>b[1]-a[1]).map(([cat, monto]) => (
                    <div key={cat} className="bar-row" style={{ gridTemplateColumns: '110px 1fr 80px' }}>
                      <span style={{ fontSize: 12 }}>{cat}</span>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(monto/totalGastos)*100}%` }} /></div>
                      <span className="num" style={{ textAlign: 'right', fontSize: 12 }}>{fmt$0(monto)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13 }}>
                    <span>Total gastos</span>
                    <span style={{ color: 'var(--bad)' }}>{fmt$0(totalGastos)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tendencia */}
          <div className="card">
            <div className="card-head"><div className="card-title">Tendencia 12 meses</div></div>
            <div className="card-body">
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Food cost %</div>
              <Sparkline data={D.SEED_FOODCOST_TREND} height={60} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                <span>May'25</span><span>Abr'26</span>
              </div>
              <div style={{ height: 12 }} />
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Ingreso (miles USD)</div>
              <Sparkline data={D.SEED_REVENUE_TREND} height={60} color="var(--good)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PLRow = ({ label, value, pct, kind }) => {
  const isNeg = value < 0;
  const styles = { display: 'grid', gridTemplateColumns: '1fr 60px 100px', padding: '6px 0', alignItems: 'center', fontSize: 13 };
  if (kind === 'header')   { styles.fontWeight = 600; }
  if (kind === 'subtotal') { styles.fontWeight = 600; styles.fontSize = 14; }
  if (kind === 'total')    { styles.fontWeight = 700; styles.fontSize = 15; styles.padding = '10px 0'; }
  return (
    <div style={styles}>
      <span style={{ color: kind ? 'var(--text)' : 'var(--text-2)' }}>{label}</span>
      <span className="num" style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-3)' }}>
        {pct != null ? fmtPct(pct, 1) : ''}
      </span>
      <span className="num" style={{ textAlign: 'right', color: isNeg ? 'var(--text)' : (kind === 'total' && value > 0 ? 'var(--good)' : 'var(--text)') }}>
        {isNeg ? '(' : ''}{fmt$0(Math.abs(value))}{isNeg ? ')' : ''}
      </span>
    </div>
  );
};

window.Reportes = Reportes;
