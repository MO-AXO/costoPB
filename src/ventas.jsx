// Ventas — registro de unidades vendidas por producto
const Ventas = ({ recetas, setRecetas, insumos, subrecetas, fixedCosts, monthLabel }) => {
  const C = window.PB_CALC;
  const [sortBy, setSortBy] = React.useState('category');

  const all = recetas.map(r => ({
    receta: r,
    m: C.recetaMetrics(r, insumos, subrecetas, fixedCosts),
  }));

  const totalRevenue = all.reduce((a, x) => a + x.m.monthlyRevenue, 0);
  const totalUnits   = recetas.reduce((a, r) => a + r.monthlySales, 0);
  const totalProfit  = all.reduce((a, x) => a + x.m.monthlyMargin, 0);
  const avgTicket    = totalRevenue / Math.max(totalUnits, 1);

  const update = (id, val) => {
    setRecetas(prev => prev.map(r => r.id === id ? { ...r, monthlySales: Math.max(0, parseInt(val) || 0) } : r));
  };

  const sorted = [...all].sort((a, b) => {
    if (sortBy === 'category') return a.receta.category.localeCompare(b.receta.category) || a.receta.name.localeCompare(b.receta.name);
    if (sortBy === 'revenue')  return b.m.monthlyRevenue - a.m.monthlyRevenue;
    if (sortBy === 'profit')   return b.m.monthlyMargin - a.m.monthlyMargin;
    if (sortBy === 'units')    return b.receta.monthlySales - a.receta.monthlySales;
    return 0;
  });

  const SortBtn = ({ id, label }) => (
    <button
      className={`btn btn-sm ${sortBy === id ? 'btn-primary' : 'btn-ghost'}`}
      onClick={() => setSortBy(id)}
      style={{ fontSize: 11 }}
    >
      {label}
    </button>
  );

  const inputStyle = {
    fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600,
    width: 88, textAlign: 'right',
    border: '1px solid var(--border)', borderRadius: 5,
    padding: '5px 8px', background: 'var(--surface)', color: 'var(--text)',
    outline: 0,
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Ventas del mes</h1>
          <div className="page-sub">Unidades vendidas · {monthLabel || 'Abr 2026'} · Los ingresos y márgenes se recalculan al instante</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => window.print()}><Icon name="download" /> Exportar</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <KPI label="Ingreso mensual" value={fmt$0(totalRevenue)} target={`${totalUnits.toLocaleString()} unidades vendidas`} />
        <KPI label="Ticket promedio" value={fmt$(avgTicket)} target="Ingreso por unidad" />
        <KPI label="Utilidad total" value={fmt$0(totalProfit)} target={`${((totalProfit / Math.max(totalRevenue, 1)) * 100).toFixed(1)}% del ingreso`} />
        <KPI label="Productos activos" value={recetas.length} target={`${recetas.filter(r => r.monthlySales > 0).length} con ventas`} />
      </div>

      <div className="card">
        <div className="card-head" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div className="card-title">Unidades vendidas por producto</div>
            <div className="card-sub">Edita el campo de unidades — todo se actualiza en tiempo real</div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', marginRight: 4 }}>Ordenar:</span>
            <SortBtn id="category" label="Categoría" />
            <SortBtn id="units" label="Unidades" />
            <SortBtn id="revenue" label="Ingreso" />
            <SortBtn id="profit" label="Utilidad" />
          </div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th className="right">Precio</th>
              <th className="right" style={{ minWidth: 130 }}>Unidades vendidas</th>
              <th className="right">Ingreso mes</th>
              <th className="right">Margen u.</th>
              <th className="right">Utilidad mes</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ receta, m }) => (
              <tr key={receta.id}>
                <td style={{ fontWeight: 500 }}>{receta.name}</td>
                <td><Tag>{receta.category}</Tag></td>
                <td className="right num">{fmt$(receta.sellPrice)}</td>
                <td className="right">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={receta.monthlySales}
                    onChange={e => update(receta.id, e.target.value)}
                    onFocus={e => e.target.select()}
                    style={inputStyle}
                  />
                </td>
                <td className="right num">{fmt$0(m.monthlyRevenue)}</td>
                <td className="right num">{fmt$(m.margin$)}</td>
                <td className="right num" style={{ fontWeight: 600, color: m.monthlyMargin > 0 ? 'var(--good)' : 'var(--bad)' }}>
                  {fmt$0(m.monthlyMargin)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--surface-sunk)', borderTop: '2px solid var(--border-strong)' }}>
              <td colSpan="3" style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700 }}>Total</td>
              <td className="right num" style={{ padding: '12px 14px', fontWeight: 700 }}>{totalUnits.toLocaleString()}</td>
              <td className="right num" style={{ padding: '12px 14px', fontWeight: 700 }}>{fmt$0(totalRevenue)}</td>
              <td></td>
              <td className="right num" style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--good)' }}>{fmt$0(totalProfit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

window.Ventas = Ventas;
