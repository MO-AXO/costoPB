// Reportes — vistas adicionales
const Reportes = ({ insumos, subrecetas, recetas, fixedCosts, monthLabel }) => {
  const C = window.PB_CALC;
  const D = window.PB_DATA;
  const all = recetas.map(r => ({ receta: r, m: C.recetaMetrics(r, insumos, subrecetas, fixedCosts) }));

  const totalRevenue = all.reduce((a, x) => a + x.m.monthlyRevenue, 0);
  const totalIngredient = all.reduce((a, x) => a + x.m.ingredientCost * x.receta.monthlySales, 0);
  const totalLabor = all.reduce((a, x) => a + x.m.laborCost * x.receta.monthlySales, 0);
  const totalPackaging = all.reduce((a, x) => a + x.m.packagingCost * x.receta.monthlySales, 0);
  const totalFixed = (fixedCosts.rent        || 0) +
                     (fixedCosts.salaries    || 0) +
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
  const grossProfit = totalRevenue - totalIngredient - totalLabor - totalPackaging - totalFixed;

  const byCategory = {};
  all.forEach(({ receta, m }) => {
    if (!byCategory[receta.category]) byCategory[receta.category] = { revenue: 0, cost: 0, units: 0 };
    byCategory[receta.category].revenue += m.monthlyRevenue;
    byCategory[receta.category].cost += m.ingredientCost * receta.monthlySales;
    byCategory[receta.category].units += receta.monthlySales;
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reportes</h1>
          <div className="page-sub">P&L del mes · {monthLabel || 'Abr 2026'}</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => window.print()}><Icon name="download" /> Exportar PDF</button>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Estado de resultados (P&L)</div>
            <div className="card-sub">Vista mensual</div>
          </div>
          <div className="card-body">
            <PLRow label="Ingresos por ventas" value={totalRevenue} kind="header" />
            <div className="divider" />
            <PLRow label="Costo de ingredientes" value={-totalIngredient} pct={(totalIngredient/totalRevenue)*100} />
            <PLRow label="Mano de obra (cocina)" value={-totalLabor} pct={(totalLabor/totalRevenue)*100} />
            <PLRow label="Empaques" value={-totalPackaging} pct={(totalPackaging/totalRevenue)*100} />
            <div className="divider" />
            <PLRow label="Margen bruto" value={totalRevenue - totalIngredient - totalLabor - totalPackaging} pct={((totalRevenue-totalIngredient-totalLabor-totalPackaging)/totalRevenue)*100} kind="subtotal" />
            <div className="divider" />
            <PLRow label="Alquiler"          value={-(fixedCosts.rent        || 0)} />
            <PLRow label="Salarios"          value={-(fixedCosts.salaries    || 0)} />
            <PLRow label="Electricidad"      value={-(fixedCosts.electricity || 0)} />
            <PLRow label="Gas"               value={-(fixedCosts.gas        || 0)} />
            <PLRow label="Agua"              value={-(fixedCosts.water      || 0)} />
            <PLRow label="Internet"          value={-(fixedCosts.internet   || 0)} />
            <PLRow label="Gasolina"          value={-(fixedCosts.gasoline   || 0)} />
            <PLRow label="Carbón"            value={-(fixedCosts.charcoal   || 0)} />
            <PLRow label="Madera"            value={-(fixedCosts.wood       || 0)} />
            <PLRow label="Aluminio (foil)"   value={-(fixedCosts.aluminum   || 0)} />
            <PLRow label="Contador"          value={-(fixedCosts.accountant || 0)} />
            <PLRow label="Equipo limpieza"   value={-(fixedCosts.cleaning   || 0)} />
            <div className="divider" />
            <PLRow label="Utilidad operativa" value={grossProfit} pct={totalRevenue > 0 ? (grossProfit/totalRevenue)*100 : 0} kind="total" />
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
          <div className="card">
            <div className="card-head"><div className="card-title">Ventas por categoría</div></div>
            <div className="card-body">
              {Object.entries(byCategory).sort((a,b) => b[1].revenue - a[1].revenue).map(([cat, v]) => (
                <div key={cat} className="bar-row" style={{gridTemplateColumns: '110px 1fr 80px'}}>
                  <span style={{fontSize: 12}}>{cat}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{width: ((v.revenue / totalRevenue) * 100) + '%'}} />
                  </div>
                  <span className="num" style={{textAlign: 'right', fontSize: 12}}>{fmt$0(v.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div className="card-title">Tendencia 12 meses</div></div>
            <div className="card-body">
              <div style={{fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4}}>Food cost %</div>
              <Sparkline data={D.SEED_FOODCOST_TREND} height={60} />
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)'}}>
                <span>May'25</span><span>Abr'26</span>
              </div>
              <div style={{height: 12}}></div>
              <div style={{fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4}}>Ingreso (miles USD)</div>
              <Sparkline data={D.SEED_REVENUE_TREND} height={60} color="var(--good)" />
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)'}}>
                <span>$62k</span><span>$88k</span>
              </div>
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
  if (kind === 'header') styles.fontWeight = 600;
  if (kind === 'subtotal') { styles.fontWeight = 600; styles.fontSize = 14; }
  if (kind === 'total') { styles.fontWeight = 700; styles.fontSize = 15; styles.padding = '10px 0'; }
  return (
    <div style={styles}>
      <span style={{color: kind ? 'var(--text)' : 'var(--text-2)'}}>{label}</span>
      <span className="num" style={{textAlign: 'right', fontSize: 11, color: 'var(--text-3)'}}>{pct != null ? fmtPct(pct, 1) : ''}</span>
      <span className="num" style={{textAlign: 'right', color: isNeg ? 'var(--text)' : (kind === 'total' && value > 0 ? 'var(--good)' : 'var(--text)')}}>
        {isNeg ? '(' : ''}{fmt$0(Math.abs(value))}{isNeg ? ')' : ''}
      </span>
    </div>
  );
};

window.Reportes = Reportes;
