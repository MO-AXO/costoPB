// Análisis de rentabilidad — Menu Engineering Matrix
const Rentabilidad = ({ insumos, subrecetas, recetas, fixedCosts, onOpenReceta }) => {
  const C = window.PB_CALC;
  const all = recetas.map(r => ({ receta: r, m: C.recetaMetrics(r, insumos, subrecetas, fixedCosts) }));
  const avgPopularity = all.reduce((a, x) => a + x.receta.monthlySales, 0) / all.length;
  const avgMargin = all.reduce((a, x) => a + x.m.margin$, 0) / all.length;

  const classify = (item) => {
    const popHi = item.receta.monthlySales >= avgPopularity;
    const marHi = item.m.margin$ >= avgMargin;
    if (popHi && marHi) return 'star';
    if (popHi && !marHi) return 'plowhorse';
    if (!popHi && marHi) return 'puzzle';
    return 'dog';
  };

  const labels = { star: 'Estrellas', plowhorse: 'Caballos de tiro', puzzle: 'Acertijos', dog: 'Perros' };
  const desc = {
    star: 'Alta popularidad + alto margen. Promociona y protege.',
    plowhorse: 'Alta popularidad + bajo margen. Reduce costos o sube precio cuidadosamente.',
    puzzle: 'Baja popularidad + alto margen. Empuja con marketing y posición de menú.',
    dog: 'Baja popularidad + bajo margen. Considera retirar o rediseñar.',
  };

  const maxPop = Math.max(...all.map(x => x.receta.monthlySales)) * 1.1;
  const maxMar = Math.max(...all.map(x => x.m.margin$)) * 1.1;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Análisis de rentabilidad</h1>
          <div className="page-sub">Matriz de menu engineering · popularidad vs. margen contribución</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => window.print()}><Icon name="download" /> Exportar PDF</button>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Matriz de menu engineering</div>
              <div className="card-sub">Popularidad media: {Math.round(avgPopularity)} u/mes · Margen medio: {fmt$(avgMargin)}</div>
            </div>
          </div>
          <div className="card-body" style={{padding: '32px 48px 40px 48px'}}>
            <div className="matrix">
              <div className="matrix-grid">
                <div className="matrix-cell">
                  <div className="matrix-cell-label" style={{color: 'var(--warn)'}}>Acertijos</div>
                  <div className="matrix-cell-desc">Alto margen / baja popularidad</div>
                </div>
                <div className="matrix-cell">
                  <div className="matrix-cell-label" style={{color: 'var(--good)'}}>★ Estrellas</div>
                  <div className="matrix-cell-desc">Promociona y protege</div>
                </div>
                <div className="matrix-cell">
                  <div className="matrix-cell-label" style={{color: 'var(--bad)'}}>Perros</div>
                  <div className="matrix-cell-desc">Considera retirar</div>
                </div>
                <div className="matrix-cell">
                  <div className="matrix-cell-label" style={{color: 'var(--accent-text)'}}>Caballos de tiro</div>
                  <div className="matrix-cell-desc">Reduce costos / sube precio</div>
                </div>
              </div>
              {all.map((item, i) => {
                const cls = classify(item);
                const x = (item.receta.monthlySales / maxPop) * 100;
                const y = 100 - (item.m.margin$ / maxMar) * 100;
                return (
                  <div key={item.receta.id} className={`matrix-dot ${cls}`}
                    style={{ left: x + '%', top: y + '%', cursor: onOpenReceta ? 'pointer' : 'default' }}
                    data-tip={`${item.receta.name} · ${item.receta.monthlySales}u · margen ${fmt$(item.m.margin$)}`}
                    onClick={() => onOpenReceta && onOpenReceta(item.receta.id)}>
                    {i + 1}
                  </div>
                );
              })}
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-3)'}}>
              <span>← menos vendido</span>
              <span style={{fontWeight: 500}}>POPULARIDAD →</span>
              <span>más vendido →</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Por categoría</div></div>
          <div className="card-body">
            {['star', 'plowhorse', 'puzzle', 'dog'].map(cat => {
              const items = all.filter(x => classify(x) === cat);
              return (
                <div key={cat} style={{marginBottom: 14}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
                    <span style={{fontSize: 12, fontWeight: 600}}>{labels[cat]}</span>
                    <Tag kind={cat === 'star' ? 'good' : cat === 'plowhorse' ? 'accent' : cat === 'puzzle' ? 'warn' : 'bad'}>{items.length}</Tag>
                  </div>
                  <div style={{fontSize: 11, color: 'var(--text-3)', marginBottom: 6}}>{desc[cat]}</div>
                  {items.map(it => (
                    <div key={it.receta.id} style={{fontSize: 12, padding: '4px 0', display: 'flex', justifyContent: 'space-between'}}>
                      <span>{it.receta.name}</span>
                      <span className="num" style={{color: 'var(--text-2)'}}>{fmt$(it.m.margin$)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{marginTop: 16}}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Detalle completo</div>
          </div>
          <table className="tbl">
            <thead><tr>
              <th></th>
              <th>Producto</th>
              <th>Clasificación</th>
              <th className="right">Precio</th>
              <th className="right">Costo</th>
              <th className="right">Margen $</th>
              <th className="right">Margen %</th>
              <th className="right">Vendidos</th>
              <th className="right">Ingreso</th>
              <th className="right">Utilidad</th>
            </tr></thead>
            <tbody>
              {all.sort((a,b) => b.m.monthlyMargin - a.m.monthlyMargin).map((item, i) => {
                const cls = classify(item);
                return (
                  <tr key={item.receta.id}>
                    <td><span className="num" style={{color: 'var(--text-3)', fontSize: 11}}>{String(i+1).padStart(2,'0')}</span></td>
                    <td style={{fontWeight: 500}}>{item.receta.name}</td>
                    <td><Tag kind={cls === 'star' ? 'good' : cls === 'plowhorse' ? 'accent' : cls === 'puzzle' ? 'warn' : 'bad'}>{labels[cls]}</Tag></td>
                    <td className="right num">{fmt$(item.receta.sellPrice)}</td>
                    <td className="right num">{fmt$(item.m.ingredientCost)}</td>
                    <td className="right num">{fmt$(item.m.margin$)}</td>
                    <td className="right num">{fmtPct(item.m.marginPct, 0)}</td>
                    <td className="right num">{item.receta.monthlySales}</td>
                    <td className="right num">{fmt$0(item.m.monthlyRevenue)}</td>
                    <td className="right num" style={{fontWeight: 600}}>{fmt$0(item.m.monthlyMargin)}</td>
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

window.Rentabilidad = Rentabilidad;
