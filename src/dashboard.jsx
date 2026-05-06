// Dashboard principal
const Dashboard = ({ insumos, subrecetas, recetas, fixedCosts, onNavigate, onOpenReceta, monthLabel }) => {
  const C = window.PB_CALC;
  const D = window.PB_DATA;

  const allMetrics = recetas.map(r => ({ receta: r, m: C.recetaMetrics(r, insumos, subrecetas, fixedCosts) }));

  // KPIs agregados
  const totalRevenue = allMetrics.reduce((a, x) => a + x.m.monthlyRevenue, 0);
  const totalIngredientCost = allMetrics.reduce((a, x) => a + x.m.ingredientCost * x.receta.monthlySales, 0);
  const totalLaborCost = allMetrics.reduce((a, x) => a + x.m.laborCost * x.receta.monthlySales, 0);
  const safeRevenue = Math.max(totalRevenue, 0.0001);
  const blendedFoodCost = (totalIngredientCost / safeRevenue) * 100;
  const primeCost = ((totalIngredientCost + totalLaborCost) / safeRevenue) * 100;
  const totalMargin = allMetrics.reduce((a, x) => a + x.m.monthlyMargin, 0);
  const avgMarginPct = (totalMargin / safeRevenue) * 100;

  const sorted = [...allMetrics].sort((a, b) => b.m.monthlyMargin - a.m.monthlyMargin);
  const topProducts = sorted.slice(0, 4);

  // Alertas
  const alerts = [];
  allMetrics.forEach(({ receta, m }) => {
    if (m.foodCostPct > receta.targetFoodCost + 5) {
      alerts.push({ kind: 'bad', icon: 'warn', title: `${receta.name}`, body: `Food cost ${m.foodCostPct.toFixed(1)}% vs objetivo ${receta.targetFoodCost}%`, recetaId: receta.id });
    }
  });
  D.SEED_PRICE_HISTORY.slice(0, 3).forEach(h => {
    if (h.change > 5) {
      const ins = insumos.find(i => i.id === h.insumoId);
      alerts.push({ kind: 'warn', icon: 'arrow-up', title: ins?.name, body: `+${h.change.toFixed(1)}% el ${h.date}`, recetaId: null });
    }
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-sub">Resumen del mes · {monthLabel || 'Abr 2026'} · USD</div>
        </div>
        <div className="page-actions">
          <span className="pill"><span className="dot"></span>Datos al día</span>
          <button className="btn" onClick={() => window.print()}><Icon name="download" /> Exportar</button>
          <button className="btn btn-primary" onClick={() => onNavigate('recetas')}><Icon name="plus" /> Nueva receta</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KPI label="Food Cost %" value={fmtPct(blendedFoodCost)} delta={-1.2} target={`Objetivo ≤ 32% · Industria 28-35%`} trend={D.SEED_FOODCOST_TREND} />
        <KPI label="Margen promedio" value={fmtPct(avgMarginPct)} delta={+2.1} target={`Margen $${(totalMargin/1000).toFixed(1)}k este mes`} trend={D.SEED_REVENUE_TREND} />
        <KPI label="Prime Cost" value={fmtPct(primeCost)} delta={+0.4} deltaDir="up" target="Objetivo ≤ 60% · Food + Labor" />
        <KPI label="Ingreso mensual" value={fmt$0(totalRevenue)} delta={+4.8} target={`${recetas.reduce((a,r)=>a+r.monthlySales,0).toLocaleString()} platos vendidos`} />
      </div>

      <div className="two-col">
        {/* Tabla productos */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Rentabilidad por producto</div>
              <div className="card-sub">Costo, precio y margen calculados al cierre de mes</div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('rentabilidad')}>Ver análisis completo <Icon name="arrow-right" size={12} /></button>
          </div>
          <table className="tbl">
            <thead><tr>
              <th>Producto</th>
              <th className="right">Precio</th>
              <th className="right">Costo</th>
              <th className="right">Food&nbsp;Cost</th>
              <th className="right">Margen</th>
              <th className="right">Vendidos</th>
              <th className="right">Utilidad</th>
            </tr></thead>
            <tbody>
              {sorted.map(({ receta, m }) => (
                <tr key={receta.id} style={{cursor: 'pointer'}} onClick={() => onOpenReceta(receta.id)}>
                  <td>
                    <div style={{fontWeight: 500}}>{receta.name}</div>
                    <div style={{fontSize: 11, color: 'var(--text-3)'}}>{receta.category}</div>
                  </td>
                  <td className="right num">{fmt$(receta.sellPrice)}</td>
                  <td className="right num">{fmt$(m.ingredientCost)}</td>
                  <td className="right"><FoodCostBadge pct={m.foodCostPct} target={receta.targetFoodCost} /></td>
                  <td className="right num">{fmtPct(m.marginPct, 0)}</td>
                  <td className="right num">{receta.monthlySales}</td>
                  <td className="right num" style={{fontWeight: 600}}>{fmt$0(m.monthlyMargin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Side: alertas + top */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
          <div className="card">
            <div className="card-head">
              <div className="card-title">Alertas</div>
              <Tag kind="warn">{alerts.length}</Tag>
            </div>
            <div className="card-body" style={{paddingTop: 4, paddingBottom: 4}}>
              {alerts.slice(0, 5).map((a, i) => (
                <div key={i} style={{display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 0}}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: a.kind === 'bad' ? 'var(--bad-soft)' : 'var(--warn-soft)',
                    color: a.kind === 'bad' ? 'var(--bad)' : 'var(--warn)',
                    display: 'grid', placeItems: 'center'
                  }}>
                    <Icon name={a.icon} size={14} />
                  </div>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{fontSize: 13, fontWeight: 500}}>{a.title}</div>
                    <div style={{fontSize: 11, color: 'var(--text-3)', marginTop: 2}}>{a.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">Top utilidad este mes</div>
            </div>
            <div className="card-body" style={{paddingTop: 8}}>
              {topProducts.map(({ receta, m }, i) => (
                <div key={receta.id} className="bar-row" style={{gridTemplateColumns: '20px 1fr 80px'}}>
                  <span className="num" style={{color: 'var(--text-3)', fontSize: 11}}>0{i+1}</span>
                  <div>
                    <div style={{fontSize: 12, fontWeight: 500}}>{receta.name}</div>
                    <div className="bar-track" style={{marginTop: 4}}>
                      <div className="bar-fill" style={{width: ((m.monthlyMargin / topProducts[0].m.monthlyMargin) * 100) + '%'}} />
                    </div>
                  </div>
                  <span className="num" style={{textAlign: 'right', fontSize: 12}}>{fmt$0(m.monthlyMargin)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insumos críticos */}
      <div style={{marginTop: 20}}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Insumos con mayor impacto</div>
              <div className="card-sub">Cambios recientes que afectan tus costos</div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('historico')}>Ver histórico completo <Icon name="arrow-right" size={12} /></button>
          </div>
          <table className="tbl">
            <thead><tr>
              <th>Insumo</th>
              <th>Categoría</th>
              <th className="right">Costo actual</th>
              <th className="right">Cambio</th>
              <th>Afecta a</th>
              <th>Proveedor</th>
            </tr></thead>
            <tbody>
              {D.SEED_PRICE_HISTORY.slice(0, 5).map((h, i) => {
                const ins = insumos.find(x => x.id === h.insumoId);
                if (!ins) return null;
                const affects = recetas.filter(r =>
                  r.ingredients.some(ing => ing.type === 'insumo' && ing.insumoId === ins.id) ||
                  r.ingredients.some(ing => ing.type === 'sub' && subrecetas.find(s => s.id === ing.subId)?.ingredients.some(si => si.insumoId === ins.id))
                ).length;
                return (
                  <tr key={i}>
                    <td style={{fontWeight: 500}}>{ins.name}</td>
                    <td><Tag>{ins.category}</Tag></td>
                    <td className="right num">{fmt$(ins.cost)} / {ins.unit}</td>
                    <td className="right">
                      <span className="num" style={{color: h.change > 0 ? 'var(--bad)' : 'var(--good)', fontWeight: 500}}>
                        {h.change > 0 ? '+' : ''}{h.change.toFixed(1)}%
                      </span>
                    </td>
                    <td><span style={{color: 'var(--text-2)', fontSize: 12}}>{affects} platos</span></td>
                    <td><span style={{color: 'var(--text-2)', fontSize: 12}}>{ins.supplier}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
