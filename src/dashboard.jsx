// Dashboard principal
const Dashboard = ({ insumos, subrecetas, recetas, fixedCosts, onNavigate, onOpenReceta, monthLabel, gastos, empleados }) => {
  const C = window.PB_CALC;
  const D = window.PB_DATA;

  const allMetrics = recetas.map(r => ({ receta: r, m: C.recetaMetrics(r, insumos, subrecetas, fixedCosts) }));

  // KPIs recetas
  const totalRevenue       = allMetrics.reduce((a, x) => a + x.m.monthlyRevenue, 0);
  const totalIngredientCost= allMetrics.reduce((a, x) => a + x.m.ingredientCost * x.receta.monthlySales, 0);
  const totalLaborCost     = allMetrics.reduce((a, x) => a + x.m.laborCost * x.receta.monthlySales, 0);
  const safeRevenue        = Math.max(totalRevenue, 0.0001);
  const blendedFoodCost    = (totalIngredientCost / safeRevenue) * 100;
  const primeCost          = ((totalIngredientCost + totalLaborCost) / safeRevenue) * 100;
  const totalMargin        = allMetrics.reduce((a, x) => a + x.m.monthlyMargin, 0);
  const avgMarginPct       = (totalMargin / safeRevenue) * 100;

  // KPIs gastos
  const totalCaja   = (gastos?.caja   || []).reduce((a, i) => a + (i.monto || 0), 0);
  const totalFormal = (gastos?.formal || []).reduce((a, i) => a + (i.monto || 0), 0);
  const totalGastos = totalCaja + totalFormal;

  // KPIs empleados
  const listaEmpleados  = empleados?.lista || [];
  const pagosEmpleados  = empleados?.pagos || [];
  const nominaMensual   = listaEmpleados.filter(e => e.estado === 'Activo').reduce((a, e) => a + (e.salario || 0), 0);
  const totalPagado     = pagosEmpleados.reduce((a, p) => a + (p.monto || 0), 0);
  const pendientePago   = Math.max(nominaMensual - totalPagado, 0);
  const empActivos      = listaEmpleados.filter(e => e.estado === 'Activo').length;

  // Utilidad operativa real (incluye gastos)
  const staffSalary = (fixedCosts.staff || []).reduce((a, m) => a + (m.salary || 0), 0) || (fixedCosts.salaries || 0);
  const totalFixed  = (fixedCosts.rent||0) + staffSalary + (fixedCosts.gas||0) + (fixedCosts.water||0) +
                      (fixedCosts.internet||0) + (fixedCosts.gasoline||0) + (fixedCosts.charcoal||0) +
                      (fixedCosts.wood||0) + (fixedCosts.aluminum||0) + (fixedCosts.electricity||0) +
                      (fixedCosts.accountant||0) + (fixedCosts.cleaning||0);
  const utilidadOperativa = totalMargin - totalFixed - totalGastos;

  const sorted      = [...allMetrics].sort((a, b) => b.m.monthlyMargin - a.m.monthlyMargin);
  const topProducts = sorted.slice(0, 4);

  // Alertas
  const alerts = [];
  allMetrics.forEach(({ receta, m }) => {
    if (m.foodCostPct > receta.targetFoodCost + 5)
      alerts.push({ kind: 'bad', icon: 'warn', title: receta.name, body: `Food cost ${m.foodCostPct.toFixed(1)}% vs objetivo ${receta.targetFoodCost}%`, recetaId: receta.id });
  });
  if (pendientePago > 0)
    alerts.push({ kind: 'warn', icon: 'users', title: 'Pago de nómina pendiente', body: `$${pendientePago.toFixed(2)} sin pagar este mes`, recetaId: null });
  if (totalGastos > totalRevenue * 0.1)
    alerts.push({ kind: 'warn', icon: 'wallet', title: 'Gastos adicionales altos', body: `$${totalGastos.toFixed(0)} representa ${((totalGastos/safeRevenue)*100).toFixed(1)}% del ingreso`, recetaId: null });
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
          <div className="page-sub">Resumen del mes · {monthLabel || 'Mes actual'} · USD</div>
        </div>
        <div className="page-actions">
          <span className="pill"><span className="dot" /></span>
          <button className="btn" onClick={() => window.print()}><Icon name="download" /> Exportar</button>
          <button className="btn btn-primary" onClick={() => onNavigate('recetas')}><Icon name="plus" /> Nueva receta</button>
        </div>
      </div>

      {/* KPIs fila 1: métricas de recetas */}
      <div className="kpi-grid">
        <KPI label="Food Cost %" value={fmtPct(blendedFoodCost)} delta={-1.2} target={`Objetivo ≤ 32% · Industria 28-35%`} trend={D.SEED_FOODCOST_TREND} />
        <KPI label="Margen promedio" value={fmtPct(avgMarginPct)} delta={+2.1} target={`Margen $${(totalMargin/1000).toFixed(1)}k este mes`} trend={D.SEED_REVENUE_TREND} />
        <KPI label="Prime Cost" value={fmtPct(primeCost)} delta={+0.4} deltaDir="up" target="Objetivo ≤ 60% · Food + Labor" />
        <KPI label="Ingreso mensual" value={fmt$0(totalRevenue)} delta={+4.8} target={`${recetas.reduce((a,r)=>a+r.monthlySales,0).toLocaleString()} platos vendidos`} />
      </div>

      {/* KPIs fila 2: gastos + empleados + utilidad real */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {/* Caja chica */}
        <div className="kpi" style={{ cursor: 'pointer' }} onClick={() => onNavigate('gastos')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="kpi-label">Caja chica</div>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--warn-soft)', display: 'grid', placeItems: 'center' }}>
              <Icon name="wallet" size={14} style={{ color: 'var(--warn)' }} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{fmt$0(totalCaja)}</div>
          <div className="kpi-foot">
            <span className="kpi-target">{(gastos?.caja || []).length} movimientos</span>
            <span className="kpi-delta flat">{fmt$0(totalFormal)} formales</span>
          </div>
        </div>

        {/* Empleados activos */}
        <div className="kpi" style={{ cursor: 'pointer' }} onClick={() => onNavigate('empleados')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="kpi-label">Empleados activos</div>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center' }}>
              <Icon name="users" size={14} style={{ color: 'var(--accent)' }} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{empActivos}</div>
          <div className="kpi-foot">
            <span className="kpi-target">Nómina {fmt$0(nominaMensual)}/mes</span>
            {pendientePago > 0 && <span className="kpi-delta down">{fmt$0(pendientePago)} pdte.</span>}
          </div>
        </div>

        {/* Total gastos adicionales */}
        <div className="kpi">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="kpi-label">Gastos adicionales</div>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bad-soft)', display: 'grid', placeItems: 'center' }}>
              <Icon name="arrow-up" size={14} style={{ color: 'var(--bad)' }} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{fmt$0(totalGastos)}</div>
          <div className="kpi-foot">
            <span className="kpi-target">{fmtPct((totalGastos/safeRevenue)*100, 1)} del ingreso</span>
          </div>
        </div>

        {/* Utilidad operativa real */}
        <div className="kpi">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="kpi-label">Utilidad operativa real</div>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: utilidadOperativa >= 0 ? 'var(--good-soft)' : 'var(--bad-soft)', display: 'grid', placeItems: 'center' }}>
              <Icon name="trending" size={14} style={{ color: utilidadOperativa >= 0 ? 'var(--good)' : 'var(--bad)' }} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: 22, color: utilidadOperativa >= 0 ? 'var(--good)' : 'var(--bad)' }}>
            {fmt$0(utilidadOperativa)}
          </div>
          <div className="kpi-foot">
            <span className="kpi-target">Margen − fijos − gastos</span>
            <span className={`kpi-delta ${utilidadOperativa >= 0 ? 'up' : 'down'}`}>
              {fmtPct(Math.abs(utilidadOperativa/safeRevenue)*100, 1)}
            </span>
          </div>
        </div>
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
                <tr key={receta.id} style={{ cursor: 'pointer' }} onClick={() => onOpenReceta(receta.id)}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{receta.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{receta.category}</div>
                  </td>
                  <td className="right num">{fmt$(receta.sellPrice)}</td>
                  <td className="right num">{fmt$(m.ingredientCost)}</td>
                  <td className="right"><FoodCostBadge pct={m.foodCostPct} target={receta.targetFoodCost} /></td>
                  <td className="right num">{fmtPct(m.marginPct, 0)}</td>
                  <td className="right num">{receta.monthlySales}</td>
                  <td className="right num" style={{ fontWeight: 600 }}>{fmt$0(m.monthlyMargin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Side: alertas + top */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title">Alertas</div>
              <Tag kind={alerts.length > 0 ? 'warn' : 'good'}>{alerts.length}</Tag>
            </div>
            <div className="card-body" style={{ paddingTop: 4, paddingBottom: 4 }}>
              {alerts.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>Sin alertas ✓</div>
              )}
              {alerts.slice(0, 6).map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < Math.min(alerts.length,6) - 1 ? '1px solid var(--border)' : 0, cursor: a.recetaId ? 'pointer' : 'default' }}
                  onClick={() => a.recetaId && onOpenReceta(a.recetaId)}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: a.kind === 'bad' ? 'var(--bad-soft)' : 'var(--warn-soft)',
                    color: a.kind === 'bad' ? 'var(--bad)' : 'var(--warn)',
                    display: 'grid', placeItems: 'center',
                  }}>
                    <Icon name={a.icon} size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{a.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">Top utilidad este mes</div>
            </div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              {topProducts.map(({ receta, m }, i) => (
                <div key={receta.id} className="bar-row" style={{ gridTemplateColumns: '20px 1fr 80px' }}>
                  <span className="num" style={{ color: 'var(--text-3)', fontSize: 11 }}>0{i+1}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{receta.name}</div>
                    <div className="bar-track" style={{ marginTop: 4 }}>
                      <div className="bar-fill" style={{ width: ((m.monthlyMargin / Math.max(topProducts[0].m.monthlyMargin, 1)) * 100) + '%' }} />
                    </div>
                  </div>
                  <span className="num" style={{ textAlign: 'right', fontSize: 12 }}>{fmt$0(m.monthlyMargin)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini resumen gastos + empleados */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Administración</div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => onNavigate('gastos')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="wallet" size={14} style={{ color: 'var(--warn)' }} />
                  <span style={{ fontSize: 13 }}>Gastos del mes</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{fmt$0(totalGastos)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', cursor: 'pointer' }}
                onClick={() => onNavigate('empleados')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="users" size={14} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 13 }}>Nómina pagada</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{fmt$0(totalPagado)}</div>
                  {pendientePago > 0 && <div style={{ fontSize: 11, color: 'var(--bad)' }}>{fmt$0(pendientePago)} pendiente</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insumos críticos */}
      <div style={{ marginTop: 20 }}>
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
                    <td style={{ fontWeight: 500 }}>{ins.name}</td>
                    <td><Tag>{ins.category}</Tag></td>
                    <td className="right num">{fmt$(ins.cost)} / {ins.unit}</td>
                    <td className="right">
                      <span className="num" style={{ color: h.change > 0 ? 'var(--bad)' : 'var(--good)', fontWeight: 500 }}>
                        {h.change > 0 ? '+' : ''}{h.change.toFixed(1)}%
                      </span>
                    </td>
                    <td><span style={{ color: 'var(--text-2)', fontSize: 12 }}>{affects} platos</span></td>
                    <td><span style={{ color: 'var(--text-2)', fontSize: 12 }}>{ins.supplier}</span></td>
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
