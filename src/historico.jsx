// Histórico de cambios de precio — selector de insumo + gráfica de evolución
const Historico = ({ insumos, recetas, subrecetas }) => {
  const D = window.PB_DATA;
  const C = window.PB_CALC;
  const [selectedId, setSelectedId] = React.useState(null);
  const [search, setSearch] = React.useState('');

  const history = D.SEED_PRICE_HISTORY;

  // Insumos que tienen al menos un cambio
  const insumosConHistorial = React.useMemo(() => {
    const ids = new Set(history.map(h => h.insumoId));
    return insumos
      .filter(i => ids.has(i.id))
      .map(i => {
        const events = history.filter(h => h.insumoId === i.id).sort((a, b) => a.date.localeCompare(b.date));
        const first = events[0];
        const last = events[events.length - 1];
        const totalChange = last && first ? ((last.to - first.from) / first.from) * 100 : 0;
        return { ...i, events, totalChange, lastEvent: last };
      })
      .sort((a, b) => Math.abs(b.totalChange) - Math.abs(a.totalChange));
  }, [insumos]);

  const filtered = insumosConHistorial.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

  // Auto-seleccionar el primero
  React.useEffect(() => {
    if (!selectedId && insumosConHistorial.length) {
      setSelectedId(insumosConHistorial[0].id);
    }
  }, []);

  const selected = insumosConHistorial.find(i => i.id === selectedId);

  // Recetas afectadas por el insumo seleccionado
  const usedIn = selected ? recetas.filter(r =>
    r.ingredients.some(ing => ing.type === 'insumo' && ing.insumoId === selected.id) ||
    r.ingredients.some(ing => ing.type === 'sub' && subrecetas.find(s => s.id === ing.subId)?.ingredients.some(si => si.insumoId === selected.id))
  ) : [];

  // KPIs globales
  const upCount = history.filter(h => h.change > 0).length;
  const downCount = history.filter(h => h.change < 0).length;
  const avgChange = history.reduce((a, h) => a + h.change, 0) / history.length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Histórico de precios</h1>
          <div className="page-sub">{insumosConHistorial.length} insumos con cambios · {history.length} eventos registrados</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => window.print()}><Icon name="download" /> Exportar</button>
        </div>
      </div>

      <div className="kpi-grid" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
        <KPI label="Cambios al alza" value={upCount} sub={`+${history.filter(h=>h.change>0).reduce((a,h)=>a+h.change,0).toFixed(1)}% acumulado`} />
        <KPI label="Cambios a la baja" value={downCount} sub={`${history.filter(h=>h.change<0).reduce((a,h)=>a+h.change,0).toFixed(1)}% acumulado`} />
        <KPI label="Cambio promedio" value={`${avgChange > 0 ? '+' : ''}${avgChange.toFixed(2)}%`} sub="Por evento de precio" />
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, marginTop: 16}}>
        {/* LISTA DE INSUMOS */}
        <div className="card" style={{padding: 0}}>
          <div className="card-head" style={{padding: '14px 16px 8px'}}>
            <div className="card-title">Insumos</div>
            <span style={{fontSize: 11, color: 'var(--text-3)'}}>{filtered.length}</span>
          </div>
          <div style={{padding: '0 12px 8px'}}>
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px', fontSize: 12,
                border: '1px solid var(--border)', borderRadius: 6,
                background: 'var(--surface-sunk)', color: 'var(--text)', outline: 'none',
              }}
            />
          </div>
          <div style={{maxHeight: 540, overflowY: 'auto', padding: '0 6px 8px'}}>
            {filtered.map(i => {
              const isSel = i.id === selectedId;
              const isUp = i.totalChange > 0;
              const isDown = i.totalChange < 0;
              return (
                <button
                  key={i.id}
                  onClick={() => setSelectedId(i.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px',
                    background: isSel ? 'var(--accent-soft)' : 'transparent',
                    border: 'none', borderRadius: 6, marginBottom: 2,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 8,
                    color: 'var(--text)',
                    borderLeft: isSel ? '3px solid var(--accent)' : '3px solid transparent',
                  }}
                >
                  <div style={{minWidth: 0, flex: 1}}>
                    <div style={{fontSize: 12.5, fontWeight: isSel ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {i.name}
                    </div>
                    <div style={{fontSize: 10.5, color: 'var(--text-3)', marginTop: 2}}>
                      {i.events.length} cambio{i.events.length !== 1 ? 's' : ''} · {C.fmt$(i.cost)}/{i.unit}
                    </div>
                  </div>
                  <span className="num" style={{
                    fontSize: 11, fontWeight: 600,
                    color: isUp ? 'var(--bad)' : isDown ? 'var(--good)' : 'var(--text-3)',
                    whiteSpace: 'nowrap',
                  }}>
                    {isUp ? '↑' : isDown ? '↓' : '·'} {Math.abs(i.totalChange).toFixed(1)}%
                  </span>
                </button>
              );
            })}
            {!filtered.length && (
              <div style={{padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 12}}>
                Sin resultados
              </div>
            )}
          </div>
        </div>

        {/* DETALLE + GRÁFICA */}
        <div>
          {selected ? (
            <PriceDetail
              insumo={selected}
              usedIn={usedIn}
              C={C}
            />
          ) : (
            <div className="card" style={{padding: 60, textAlign: 'center', color: 'var(--text-3)'}}>
              Selecciona un insumo para ver su evolución
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- DETALLE CON GRÁFICA ----------
const PriceDetail = ({ insumo, usedIn, C }) => {
  // Construir serie: punto inicial (from del primer evento) + cada "to"
  const events = insumo.events;
  const series = [
    { date: events[0].date, value: events[0].from, label: 'Inicial' },
    ...events.map(e => ({ date: e.date, value: e.to, change: e.change, reason: e.reason })),
  ];

  const minV = Math.min(...series.map(p => p.value));
  const maxV = Math.max(...series.map(p => p.value));
  const range = maxV - minV || 1;
  const padTop = range * 0.15;
  const padBot = range * 0.15;

  const W = 720, H = 280;
  const padL = 56, padR = 24, padTopPx = 20, padBotPx = 40;
  const innerW = W - padL - padR;
  const innerH = H - padTopPx - padBotPx;

  const xFor = (i) => padL + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const yFor = (v) => padTopPx + innerH - ((v - (minV - padBot)) / (range + padTop + padBot)) * innerH;

  const linePath = series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.value)}`).join(' ');
  const areaPath = `${linePath} L ${xFor(series.length - 1)} ${padTopPx + innerH} L ${xFor(0)} ${padTopPx + innerH} Z`;

  // Y ticks
  const ticks = 4;
  const yTicks = Array.from({length: ticks + 1}, (_, i) => minV - padBot + ((range + padTop + padBot) / ticks) * (ticks - i));

  const isUp = insumo.totalChange > 0;
  const lastEvent = events[events.length - 1];
  const firstEvent = events[0];
  const trendColor = isUp ? 'var(--bad)' : 'var(--good)';

  // Tooltip
  const [hoverIdx, setHoverIdx] = React.useState(null);

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      {/* HEADER */}
      <div className="card">
        <div style={{padding: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap'}}>
          <div>
            <div style={{fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5}}>{insumo.category} · {insumo.supplier}</div>
            <div style={{fontSize: 22, fontWeight: 600, marginTop: 4}}>{insumo.name}</div>
            <div style={{fontSize: 12, color: 'var(--text-3)', marginTop: 4}}>
              {events.length} cambio{events.length !== 1 ? 's' : ''} en los últimos {Math.round((new Date(lastEvent.date) - new Date(firstEvent.date)) / 86400000)} días
            </div>
          </div>
          <div style={{display: 'flex', gap: 24}}>
            <div>
              <div style={{fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase'}}>Inicial</div>
              <div className="num" style={{fontSize: 18, fontWeight: 600}}>{C.fmt$(firstEvent.from)}</div>
            </div>
            <div>
              <div style={{fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase'}}>Actual</div>
              <div className="num" style={{fontSize: 18, fontWeight: 600}}>{C.fmt$(lastEvent.to)}</div>
            </div>
            <div>
              <div style={{fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase'}}>Variación</div>
              <div className="num" style={{fontSize: 18, fontWeight: 600, color: trendColor}}>
                {isUp ? '+' : ''}{insumo.totalChange.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICA */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Evolución de precio · {insumo.unit}</div>
          <div style={{fontSize: 11, color: 'var(--text-3)'}}>
            Min {C.fmt$(minV)} · Max {C.fmt$(maxV)}
          </div>
        </div>
        <div className="card-body" style={{padding: '8px 8px 0'}}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{width: '100%', height: 'auto', display: 'block'}}>
            {/* grid lines */}
            {yTicks.map((t, i) => (
              <g key={i}>
                <line x1={padL} x2={W - padR} y1={yFor(t)} y2={yFor(t)} stroke="var(--border)" strokeWidth="0.5" strokeDasharray={i === ticks ? '0' : '2 3'} />
                <text x={padL - 8} y={yFor(t) + 3} textAnchor="end" fontSize="10" fill="var(--text-3)" fontFamily="ui-monospace, monospace">
                  ${t.toFixed(t < 1 ? 3 : 2)}
                </text>
              </g>
            ))}

            {/* area gradient */}
            <defs>
              <linearGradient id="hist-grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity="0.18" />
                <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#hist-grad)" />
            <path d={linePath} fill="none" stroke={trendColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {/* points */}
            {series.map((p, i) => (
              <g key={i}
                 onMouseEnter={() => setHoverIdx(i)}
                 onMouseLeave={() => setHoverIdx(null)}
                 style={{cursor: 'pointer'}}>
                <circle cx={xFor(i)} cy={yFor(p.value)} r="14" fill="transparent" />
                <circle cx={xFor(i)} cy={yFor(p.value)} r={hoverIdx === i ? 5 : 3.5} fill="var(--surface)" stroke={trendColor} strokeWidth="2" />
              </g>
            ))}

            {/* x labels — primera, última e intermedias */}
            {series.map((p, i) => {
              const showLabel = i === 0 || i === series.length - 1 || (series.length > 4 && i === Math.floor(series.length / 2));
              if (!showLabel) return null;
              return (
                <text key={i} x={xFor(i)} y={H - padBotPx + 18} textAnchor="middle" fontSize="10" fill="var(--text-3)" fontFamily="ui-monospace, monospace">
                  {p.date.slice(5)}
                </text>
              );
            })}

            {/* tooltip */}
            {hoverIdx !== null && (() => {
              const p = series[hoverIdx];
              const tx = xFor(hoverIdx);
              const ty = yFor(p.value);
              const tipW = 150;
              const tipH = p.change != null ? 56 : 36;
              const flipX = tx + tipW / 2 + 8 > W;
              const tipX = flipX ? tx - tipW - 10 : tx + 10;
              const tipY = Math.max(padTopPx, ty - tipH / 2);
              return (
                <g pointerEvents="none">
                  <line x1={tx} x2={tx} y1={padTopPx} y2={padTopPx + innerH} stroke="var(--text-3)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
                  <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="6" fill="var(--surface)" stroke="var(--border)" />
                  <text x={tipX + 10} y={tipY + 16} fontSize="10" fill="var(--text-3)" fontFamily="ui-monospace, monospace">{p.date}</text>
                  <text x={tipX + 10} y={tipY + 32} fontSize="13" fontWeight="600" fill="var(--text)" fontFamily="ui-monospace, monospace">
                    ${p.value.toFixed(p.value < 1 ? 3 : 2)}
                  </text>
                  {p.change != null && (
                    <text x={tipX + 10} y={tipY + 48} fontSize="10" fontWeight="600"
                          fill={p.change > 0 ? 'var(--bad)' : 'var(--good)'} fontFamily="ui-monospace, monospace">
                      {p.change > 0 ? '+' : ''}{p.change.toFixed(2)}%
                    </text>
                  )}
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* TIMELINE + RECETAS AFECTADAS */}
      <div className="two-col">
        <div className="card">
          <div className="card-head"><div className="card-title">Línea de tiempo</div></div>
          <div className="card-body" style={{maxHeight: 280, overflowY: 'auto'}}>
            {events.slice().reverse().map((h, i) => (
              <div key={i} className="timeline-item">
                <span className="timeline-date">{h.date}</span>
                <span className={`timeline-dot ${h.change > 0 ? 'up' : 'down'}`}></span>
                <div>
                  <div style={{fontSize: 12.5, fontWeight: 500}}>
                    {C.fmt$(h.from)} → {C.fmt$(h.to)}
                  </div>
                  <div style={{fontSize: 11, color: 'var(--text-3)', marginTop: 2}}>{h.reason}</div>
                </div>
                <span className={`timeline-change ${h.change > 0 ? 'up' : 'down'}`}>
                  {h.change > 0 ? '+' : ''}{h.change.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Recetas afectadas</div>
            <span style={{fontSize: 11, color: 'var(--text-3)'}}>{usedIn.length}</span>
          </div>
          <div className="card-body" style={{maxHeight: 280, overflowY: 'auto'}}>
            {usedIn.length ? usedIn.map((r, i) => (
              <div key={r.id} style={{padding: '10px 0', borderBottom: i < usedIn.length - 1 ? '1px solid var(--border)' : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <div style={{fontSize: 13, fontWeight: 500}}>{r.name}</div>
                  <div style={{fontSize: 11, color: 'var(--text-3)', marginTop: 2}}>{r.category} · {r.monthlySales}/mes</div>
                </div>
                <span className="num" style={{fontSize: 12, color: 'var(--text-2)'}}>{C.fmt$(r.sellPrice)}</span>
              </div>
            )) : (
              <div style={{padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: 12}}>
                Este insumo no está en uso en ninguna receta.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

window.Historico = Historico;
