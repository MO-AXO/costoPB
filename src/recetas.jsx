// Recetas — fichas técnicas con cálculo en vivo
const Recetas = ({ insumos, subrecetas, setSubrecetas, recetas, setRecetas, fixedCosts, openId }) => {
  const C = window.PB_CALC;
  const [tab, setTab] = React.useState('finales');
  const [selected, setSelected] = React.useState(openId || recetas[0]?.id);
  const [listSearch, setListSearch] = React.useState('');
  const [showNew, setShowNew] = React.useState(false);
  const [showNewSub, setShowNewSub] = React.useState(false);

  React.useEffect(() => { if (openId) { setSelected(openId); setTab('finales'); } }, [openId]);

  const baseList = tab === 'finales' ? recetas : subrecetas;
  const list = baseList.filter(r => !listSearch || r.name.toLowerCase().includes(listSearch.toLowerCase()));
  const item = baseList.find(x => x.id === selected) || baseList[0];

  const existingCategories = [...new Set(recetas.map(r => r.category))];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Recetas y fichas técnicas</h1>
          <div className="page-sub">Cálculo de costos en vivo · ingredientes + sub-recetas + mano de obra + empaque</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => window.print()}><Icon name="download" /> Imprimir ficha</button>
          {tab === 'sub'
            ? <button className="btn btn-primary" onClick={() => setShowNewSub(true)}><Icon name="plus" /> Nueva sub-receta</button>
            : <button className="btn btn-primary" onClick={() => setShowNew(true)}><Icon name="plus" /> Nueva receta</button>
          }
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'finales' ? 'active' : ''}`} onClick={() => { setTab('finales'); setSelected(recetas[0]?.id); setListSearch(''); }}>
          Productos finales <span className="num" style={{color: 'var(--text-3)', marginLeft: 6}}>{recetas.length}</span>
        </button>
        <button className={`tab ${tab === 'sub' ? 'active' : ''}`} onClick={() => { setTab('sub'); setSelected(subrecetas[0]?.id); setListSearch(''); }}>
          Sub-recetas <span className="num" style={{color: 'var(--text-3)', marginLeft: 6}}>{subrecetas.length}</span>
        </button>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'flex-start'}}>
        <div className="card">
          <div style={{padding: 8, borderBottom: '1px solid var(--border)'}}>
            <div className="search">
              <Icon name="search" size={14} />
              <input
                value={listSearch}
                onChange={e => setListSearch(e.target.value)}
                placeholder={tab === 'finales' ? 'Buscar producto...' : 'Buscar sub-receta...'}
              />
            </div>
          </div>
          <div style={{maxHeight: 600, overflowY: 'auto'}}>
            {tab === 'finales' ? (
              <>
                {list.map(r => {
                  const m = C.recetaMetrics(r, insumos, subrecetas, fixedCosts);
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r.id)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '12px 14px',
                        background: selected === r.id ? 'var(--accent-soft)' : 'transparent',
                        border: 0, borderLeft: selected === r.id ? '3px solid var(--accent)' : '3px solid transparent',
                        borderBottom: '1px solid var(--border)',
                        color: selected === r.id ? 'var(--accent-text)' : 'var(--text)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{fontSize: 13, fontWeight: 500}}>{r.name}</div>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--text-3)'}}>
                        <span>{r.category}</span>
                        <span className="num">{fmt$(m.ingredientCost)}</span>
                      </div>
                    </button>
                  );
                })}
                {list.length === 0 && (
                  <div style={{padding: 16, fontSize: 13, color: 'var(--text-3)', textAlign: 'center'}}>Sin resultados</div>
                )}
              </>
            ) : (() => {
              const categoryOrder = ['Proteína cocida', 'Aderezos', 'Salsas', 'Otros'];
              const grouped = list.reduce((acc, r) => {
                const cat = r.category || 'Otros';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(r);
                return acc;
              }, {});
              const sortedCats = Object.keys(grouped).sort((a, b) => {
                const ia = categoryOrder.indexOf(a);
                const ib = categoryOrder.indexOf(b);
                return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
              });
              if (sortedCats.length === 0) return (
                <div style={{padding: 16, fontSize: 13, color: 'var(--text-3)', textAlign: 'center'}}>Sin resultados</div>
              );
              return sortedCats.map(cat => (
                <div key={cat}>
                  <div style={{
                    padding: '8px 14px 4px',
                    fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: cat === 'Proteína cocida' ? 'var(--warn)' : 'var(--text-3)',
                    background: cat === 'Proteína cocida' ? 'var(--warn-soft)' : 'var(--surface-2)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {cat === 'Proteína cocida' ? '🔥 ' : ''}{cat} <span style={{fontWeight: 400}}>({grouped[cat].length})</span>
                  </div>
                  {grouped[cat].map(r => {
                    const cost = C.subRecetaCost(r, insumos);
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelected(r.id)}
                        style={{
                          width: '100%', textAlign: 'left',
                          padding: '12px 14px',
                          background: selected === r.id ? 'var(--accent-soft)' : 'transparent',
                          border: 0, borderLeft: selected === r.id ? '3px solid var(--accent)' : '3px solid transparent',
                          borderBottom: '1px solid var(--border)',
                          color: selected === r.id ? 'var(--accent-text)' : 'var(--text)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{fontSize: 13, fontWeight: 500}}>{r.name}</div>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--text-3)'}}>
                          <span>{cat}</span>
                          <span className="num">{fmt$(cost)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>

        {item && tab === 'finales' && (
          <RecetaDetail
            receta={item}
            insumos={insumos}
            subrecetas={subrecetas}
            fixedCosts={fixedCosts}
            onUpdate={(patch) => setRecetas(recetas.map(x => x.id === item.id ? { ...x, ...patch } : x))}
          />
        )}
        {item && tab === 'sub' && (
          <SubRecetaDetail
            sub={item}
            insumos={insumos}
            onUpdate={(patch) => setSubrecetas(subrecetas.map(x => x.id === item.id ? { ...x, ...patch } : x))}
            onDelete={() => {
              const next = subrecetas.filter(x => x.id !== item.id);
              setSubrecetas(next);
              setSelected(next[0]?.id || null);
            }}
          />
        )}
      </div>

      {showNew && (
        <NewRecetaDrawer
          open
          onClose={() => setShowNew(false)}
          existingCategories={existingCategories}
          onAdd={(r) => {
            setRecetas(prev => [...prev, r]);
            setSelected(r.id);
            setTab('finales');
            setShowNew(false);
          }}
        />
      )}
      {showNewSub && (
        <NewSubRecetaDrawer
          open
          onClose={() => setShowNewSub(false)}
          onAdd={(s) => {
            setSubrecetas(prev => [...prev, s]);
            setSelected(s.id);
            setTab('sub');
            setShowNewSub(false);
          }}
        />
      )}
    </div>
  );
};

// ─── Drawer: Nueva receta ─────────────────────────────────────────────────────
const NewRecetaDrawer = ({ open, onClose, onAdd, existingCategories }) => {
  const [f, setF] = React.useState({
    name: '', category: existingCategories[0] || '',
    sellPrice: 15, targetFoodCost: 30, monthlySales: 100, laborMinutes: 8,
  });
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));
  const canSave = f.name.trim().length > 0;
  const fl = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 13 };
  const lbl = (t) => <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>{t}</label>;
  return (
    <Drawer open={open} title="Nueva receta" subtitle="Completa los datos básicos; agrega ingredientes después desde la ficha" onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={() => onAdd({
            id: 'r_' + Date.now(),
            ...f,
            sellPrice: parseFloat(f.sellPrice) || 15,
            targetFoodCost: parseFloat(f.targetFoodCost) || 30,
            monthlySales: parseInt(f.monthlySales) || 100,
            laborMinutes: parseFloat(f.laborMinutes) || 8,
            ingredients: [],
            packagingItems: [],
          })}>
            Crear receta
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          {lbl('Nombre del producto')}
          <input style={fl} value={f.name} onChange={e => upd('name', e.target.value)} placeholder="Ej: Brisket Plate" autoFocus />
        </div>
        <div>
          {lbl('Categoría')}
          <select style={fl} value={f.category} onChange={e => upd('category', e.target.value)}>
            {existingCategories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            {lbl('Precio de venta (USD)')}
            <input type="number" step="0.25" min="0" style={{ ...fl, fontFamily: 'var(--font-mono)' }} value={f.sellPrice} onChange={e => upd('sellPrice', e.target.value)} />
          </div>
          <div>
            {lbl('Food cost objetivo (%)')}
            <input type="number" step="1" min="1" max="100" style={{ ...fl, fontFamily: 'var(--font-mono)' }} value={f.targetFoodCost} onChange={e => upd('targetFoodCost', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            {lbl('Ventas mensuales (u)')}
            <input type="number" step="10" min="0" style={{ ...fl, fontFamily: 'var(--font-mono)' }} value={f.monthlySales} onChange={e => upd('monthlySales', e.target.value)} />
          </div>
          <div>
            {lbl('Mano de obra (minutos)')}
            <input type="number" step="1" min="0" style={{ ...fl, fontFamily: 'var(--font-mono)' }} value={f.laborMinutes} onChange={e => upd('laborMinutes', e.target.value)} />
          </div>
        </div>
      </div>
    </Drawer>
  );
};

// ─── Drawer: Nueva sub-receta ─────────────────────────────────────────────────
const NewSubRecetaDrawer = ({ open, onClose, onAdd }) => {
  const SUB_CATS = ['Salsas', 'Aderezos', 'Otros'];
  const [f, setF] = React.useState({ name: '', category: 'Salsas', yield: 32, yieldUnit: 'oz' });
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));
  const canSave = f.name.trim().length > 0 && parseFloat(f.yield) > 0;
  const fl = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 13 };
  const lbl = (t) => <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>{t}</label>;
  return (
    <Drawer open={open} title="Nueva sub-receta" subtitle="Crea una salsa, aderezo u otro preparado reutilizable" onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={() => onAdd({
            id: 's_' + Date.now(),
            name: f.name.trim(),
            category: f.category,
            yield: parseFloat(f.yield) || 32,
            yieldUnit: f.yieldUnit,
            ingredients: [],
          })}>
            Crear sub-receta
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          {lbl('Nombre')}
          <input style={fl} value={f.name} onChange={e => upd('name', e.target.value)} placeholder="Ej: Salsa de Mango" autoFocus />
        </div>
        <div>
          {lbl('Categoría')}
          <select style={fl} value={f.category} onChange={e => upd('category', e.target.value)}>
            {SUB_CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            {lbl('Rendimiento (yield)')}
            <input type="number" step="1" min="1" style={{ ...fl, fontFamily: 'var(--font-mono)' }} value={f.yield} onChange={e => upd('yield', e.target.value)} />
          </div>
          <div>
            {lbl('Unidad de yield')}
            <select style={fl} value={f.yieldUnit} onChange={e => upd('yieldUnit', e.target.value)}>
              {['oz', 'lb', 'kg', 'g', 'gal', 'l', 'ml', 'pza'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

// ─── Drawer: Agregar ingrediente ──────────────────────────────────────────────
const AddIngredienteDrawer = ({ open, onClose, onAdd, insumos, subrecetas, onlyInsumos }) => {
  const [type, setType] = React.useState('insumo');
  const [itemId, setItemId] = React.useState(insumos[0]?.id || '');
  const [qty, setQty] = React.useState(1);
  const [unit, setUnit] = React.useState(insumos[0]?.unit || 'lb');

  const units = ['lb', 'oz', 'kg', 'g', 'gal', 'l', 'ml', 'pza'];

  const handleTypeChange = (t) => {
    setType(t);
    const first = t === 'insumo' ? insumos[0] : (subrecetas || [])[0];
    if (first) { setItemId(first.id); setUnit(t === 'insumo' ? first.unit : first.yieldUnit); }
  };

  const handleItemChange = (id) => {
    setItemId(id);
    if (type === 'insumo') {
      const ins = insumos.find(i => i.id === id);
      if (ins) setUnit(ins.unit);
    } else {
      const sub = (subrecetas || []).find(s => s.id === id);
      if (sub) setUnit(sub.yieldUnit);
    }
  };

  const fl = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 13 };
  const lbl = (t) => <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>{t}</label>;
  const canSave = itemId && qty > 0;

  return (
    <Drawer open={open} title="Agregar ingrediente" subtitle="Selecciona insumo o sub-receta y especifica la cantidad" onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={() => {
            onAdd(type === 'insumo'
              ? { type: 'insumo', insumoId: itemId, qty: parseFloat(qty) || 1, unit }
              : { type: 'sub', subId: itemId, qty: parseFloat(qty) || 1, unit }
            );
            onClose();
          }}>
            Agregar
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!onlyInsumos && (
          <div>
            {lbl('Tipo')}
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              <button style={{ flex: 1, padding: '8px 0', border: 0, fontSize: 13, cursor: 'pointer', background: type === 'insumo' ? 'var(--accent)' : 'transparent', color: type === 'insumo' ? '#fff' : 'var(--text-2)' }} onClick={() => handleTypeChange('insumo')}>Insumo</button>
              <button style={{ flex: 1, padding: '8px 0', border: 0, fontSize: 13, cursor: 'pointer', background: type === 'sub' ? 'var(--accent)' : 'transparent', color: type === 'sub' ? '#fff' : 'var(--text-2)', borderLeft: '1px solid var(--border)' }} onClick={() => handleTypeChange('sub')}>Sub-receta</button>
            </div>
          </div>
        )}
        <div>
          {lbl(type === 'insumo' ? 'Insumo' : 'Sub-receta')}
          <select style={fl} value={itemId} onChange={e => handleItemChange(e.target.value)}>
            {type === 'insumo' ? (
              insumos.map(x => <option key={x.id} value={x.id}>{x.name}</option>)
            ) : (() => {
              const catOrder = ['Proteína cocida', 'Aderezos', 'Salsas', 'Otros'];
              const grouped = (subrecetas || []).reduce((acc, s) => {
                const cat = s.category || 'Otros';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(s);
                return acc;
              }, {});
              const sortedCats = Object.keys(grouped).sort((a, b) => {
                const ia = catOrder.indexOf(a);
                const ib = catOrder.indexOf(b);
                return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
              });
              return sortedCats.map(cat => (
                <optgroup key={cat} label={cat}>
                  {grouped[cat].map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                </optgroup>
              ));
            })()}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            {lbl('Cantidad')}
            <input type="number" step="0.01" min="0.01" style={{ ...fl, fontFamily: 'var(--font-mono)' }} value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div>
            {lbl('Unidad')}
            <select style={fl} value={unit} onChange={e => setUnit(e.target.value)}>
              {units.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

// ─── Detalle de receta final ──────────────────────────────────────────────────
const RecetaDetail = ({ receta, insumos, subrecetas, fixedCosts, onUpdate }) => {
  const C = window.PB_CALC;
  const m = C.recetaMetrics(receta, insumos, subrecetas, fixedCosts);
  const diff = m.suggestedPrice - receta.sellPrice;
  const [showAddIng, setShowAddIng] = React.useState(false);

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      <div className="card">
        <div className="card-body">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16}}>
            <div>
              <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                <Tag kind="accent">{receta.category}</Tag>
                <FoodCostBadge pct={m.foodCostPct} target={receta.targetFoodCost} />
              </div>
              <div style={{fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginTop: 8, letterSpacing: '-0.01em'}}>{receta.name}</div>
              <div style={{fontSize: 12, color: 'var(--text-3)', marginTop: 4}}>SKU PB-{receta.id.toUpperCase()} · {receta.monthlySales} unidades/mes · objetivo food cost {receta.targetFoodCost}%</div>
            </div>
            <div style={{display: 'flex', gap: 16, alignItems: 'flex-start'}}>
              <PriceField label="Precio venta" value={receta.sellPrice} onChange={(v) => onUpdate({ sellPrice: v })} />
              <div style={{textAlign: 'right'}}>
                <div style={{fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)'}}>Sugerido</div>
                <div className="num" style={{fontSize: 22, fontWeight: 600, marginTop: 4}}>{fmt$(m.suggestedPrice)}</div>
                <div style={{fontSize: 11, color: diff > 0.5 ? 'var(--warn)' : 'var(--text-3)', marginTop: 2}}>
                  {diff > 0.5 ? `Subir +${fmt$(Math.abs(diff))}` : diff < -0.5 ? `Margen extra ${fmt$(Math.abs(diff))}` : 'En objetivo'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Ingredientes y sub-recetas</div>
            <div className="card-sub">El costo se actualiza automáticamente al cambiar precios o cantidades</div>
          </div>
          <button className="btn btn-sm" onClick={() => setShowAddIng(true)}><Icon name="plus" size={12} /> Agregar</button>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Ingrediente</th>
            <th className="right">Cantidad</th>
            <th>Unidad</th>
            <th className="right">Costo unit.</th>
            <th className="right">Subtotal</th>
            <th></th>
          </tr></thead>
          <tbody>
            {receta.ingredients.map((ing, i) => {
              let name, costUnit, lineCost;
              if (ing.type === 'sub') {
                const sub = subrecetas.find(s => s.id === ing.subId);
                name = sub?.name + ' (sub-receta)';
                costUnit = C.subRecetaCostPerUnit(sub, insumos);
                lineCost = costUnit * ing.qty;
              } else {
                const ins = insumos.find(x => x.id === ing.insumoId);
                name = ins?.name;
                costUnit = C.insumoCostPerUnit(ins);
                const qtyConv = ins ? C.convertQty(ing.qty, ing.unit, ins.unit) : ing.qty;
                lineCost = costUnit * qtyConv;
              }
              return (
                <tr key={i}>
                  <td>
                    <div style={{fontWeight: 500, fontSize: 13}}>{name}</div>
                    {ing.type === 'sub' && <div style={{fontSize: 11, color: 'var(--accent-text)', marginTop: 2}}>↳ Vinculada</div>}
                  </td>
                  <td className="right num">{ing.qty.toFixed(2)}</td>
                  <td className="num" style={{color: 'var(--text-2)'}}>{ing.unit}</td>
                  <td className="right num">{fmt$(costUnit)}</td>
                  <td className="right num" style={{fontWeight: 600}}>{fmt$(lineCost)}</td>
                  <td>
                    <button className="icon-btn" onClick={() => onUpdate({ ingredients: receta.ingredients.filter((_, j) => j !== i) })}>
                      <Icon name="trash" size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {receta.ingredients.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center', color: 'var(--text-3)', fontSize: 13, padding: 16}}>Sin ingredientes · Usa "Agregar" para empezar</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="three-col">
        <div className="card">
          <div className="card-head"><div className="card-title">Desglose de costo</div></div>
          <div className="card-body">
            <div className="cost-row">
              <span className="lbl">Ingredientes</span>
              <span className="pct">{m.totalAll > 0 ? ((m.ingredientCost / m.totalAll) * 100).toFixed(0) : 0}%</span>
              <span className="val">{fmt$(m.ingredientCost)}</span>
            </div>
            <div className="cost-row">
              <span className="lbl">Mano de obra</span>
              <span className="pct">{m.totalAll > 0 ? ((m.laborCost / m.totalAll) * 100).toFixed(0) : 0}%</span>
              <span className="val">{fmt$(m.laborCost)}</span>
            </div>
            <div className="cost-row">
              <span className="lbl">Empaque</span>
              <span className="pct">{m.totalAll > 0 ? ((m.packagingCost / m.totalAll) * 100).toFixed(0) : 0}%</span>
              <span className="val">{fmt$(m.packagingCost)}</span>
            </div>
            <div className="cost-row">
              <span className="lbl">Costos fijos prorrateados</span>
              <span className="pct">{m.totalAll > 0 ? ((m.overheadCost / m.totalAll) * 100).toFixed(0) : 0}%</span>
              <span className="val">{fmt$(m.overheadCost)}</span>
            </div>
            <div className="cost-row total">
              <span className="lbl">Costo total cargado</span>
              <span className="pct"></span>
              <span className="val">{fmt$(m.totalAll)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Parámetros</div></div>
          <div className="card-body" style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            <ParamField label="Mano de obra (min)" value={receta.laborMinutes} onChange={(v) => onUpdate({ laborMinutes: v })} suffix="min" />
            <ParamField label="Food cost objetivo" value={receta.targetFoodCost} onChange={(v) => onUpdate({ targetFoodCost: v })} suffix="%" />
            <div className="hint" style={{marginTop: 4}}>
              <b>Precio sugerido</b> = costo ingredientes ÷ food&nbsp;cost objetivo
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Performance</div></div>
          <div className="card-body" style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            <Stat label="Food Cost" value={fmtPct(m.foodCostPct)} hint={`Objetivo ${receta.targetFoodCost}%`} good={m.foodCostPct <= receta.targetFoodCost} />
            <Stat label="Margen contribución" value={fmt$(m.margin$)} hint={`${fmtPct(m.marginPct, 0)} del precio`} good={m.marginPct >= 60} />
            <Stat label="Utilidad mensual" value={fmt$0(m.monthlyMargin)} hint={`${receta.monthlySales} u × ${fmt$(m.margin$)}`} good />
            <Stat label="Prime cost" value={fmtPct(m.primeCostPct)} hint="Food + labor" good={m.primeCostPct <= 60} />
          </div>
        </div>
      </div>

      {showAddIng && (
        <AddIngredienteDrawer
          open
          onClose={() => setShowAddIng(false)}
          insumos={insumos}
          subrecetas={subrecetas}
          onAdd={(ing) => onUpdate({ ingredients: [...receta.ingredients, ing] })}
        />
      )}
    </div>
  );
};

// ─── Detalle de sub-receta ────────────────────────────────────────────────────
const SubRecetaDetail = ({ sub, insumos, onUpdate, onDelete }) => {
  const C = window.PB_CALC;
  const total = C.subRecetaCost(sub, insumos);
  const perUnit = C.subRecetaCostPerUnit(sub, insumos);
  const [showAddIng, setShowAddIng] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      <div className="card">
        <div className="card-body">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <div style={{display: 'flex', gap: 6, alignItems: 'center'}}>
                <Tag kind="accent">Sub-receta</Tag>
                {sub.category && <Tag>{sub.category}</Tag>}
              </div>
              <div style={{fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginTop: 8, letterSpacing: '-0.01em'}}>{sub.name}</div>
              <div style={{fontSize: 12, color: 'var(--text-3)', marginTop: 4}}>
                Rinde {sub.yield} {sub.yieldUnit} · <span className="num" style={{fontWeight: 600}}>{fmt$(perUnit)}/{sub.yieldUnit}</span> · Batch total: <span className="num" style={{fontWeight: 600}}>{fmt$(total)}</span>
              </div>
            </div>
            <div style={{display: 'flex', gap: 8}}>
              {!confirmDelete ? (
                <button className="btn btn-sm" style={{color: 'var(--bad)', borderColor: 'var(--bad-soft)', background: 'var(--bad-soft)'}}
                  onClick={() => setConfirmDelete(true)}>
                  <Icon name="trash" size={12} /> Borrar sub-receta
                </button>
              ) : (
                <>
                  <button className="btn btn-sm" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                  <button className="btn btn-sm" style={{background: 'var(--bad)', color: '#fff', borderColor: 'var(--bad)'}}
                    onClick={onDelete}>
                    Confirmar borrado
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Ingredientes</div>
            <div className="card-sub">El costo se recalcula automáticamente al editar precios</div>
          </div>
          <button className="btn btn-sm" onClick={() => setShowAddIng(true)}><Icon name="plus" size={12} /> Agregar</button>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Ingrediente</th>
            <th className="right">Cantidad</th>
            <th>Unidad</th>
            <th className="right">Costo unit</th>
            <th className="right">Subtotal</th>
            <th></th>
          </tr></thead>
          <tbody>
            {sub.ingredients.map((ing, i) => {
              const ins = insumos.find(x => x.id === ing.insumoId);
              const cu = C.insumoCostPerUnit(ins);
              const qtyConv = ins ? C.convertQty(ing.qty, ing.unit, ins.unit) : ing.qty;
              return (
                <tr key={i}>
                  <td style={{fontWeight: 500}}>{ins?.name || <span style={{color:'var(--text-3)'}}>Insumo no encontrado</span>}</td>
                  <td className="right num">{ing.qty}</td>
                  <td className="num" style={{color: 'var(--text-2)'}}>{ing.unit}</td>
                  <td className="right num">{fmt$(cu)}</td>
                  <td className="right num" style={{fontWeight: 600}}>{fmt$(cu * qtyConv)}</td>
                  <td>
                    <button className="icon-btn" onClick={() => onUpdate({ ingredients: sub.ingredients.filter((_, j) => j !== i) })}>
                      <Icon name="trash" size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {sub.ingredients.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center', color: 'var(--text-3)', fontSize: 13, padding: 16}}>Sin ingredientes · Usa "Agregar" para empezar</td></tr>
            )}
            {sub.ingredients.length > 0 && (
              <tr style={{background: 'var(--surface-2)'}}>
                <td colSpan="4" className="right" style={{fontWeight: 600, fontSize: 13}}>Total batch</td>
                <td className="right num" style={{fontWeight: 700}}>{fmt$(total)}</td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddIng && (
        <AddIngredienteDrawer
          open
          onlyInsumos
          onClose={() => setShowAddIng(false)}
          insumos={insumos}
          onAdd={(ing) => {
            onUpdate({ ingredients: [...sub.ingredients, ing] });
            setShowAddIng(false);
          }}
        />
      )}
    </div>
  );
};

// ─── Helpers de formulario ────────────────────────────────────────────────────
const PriceField = ({ label, value, onChange }) => (
  <div style={{textAlign: 'right'}}>
    <div style={{fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)'}}>{label}</div>
    <div style={{display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'flex-end', marginTop: 4}}>
      <span className="num" style={{fontSize: 22, fontWeight: 600, color: 'var(--text-3)'}}>$</span>
      <input type="number" step="0.25" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, width: 80, textAlign: 'right', border: 0, background: 'transparent', outline: 0 }} />
    </div>
  </div>
);

const ParamField = ({ label, value, onChange, suffix }) => (
  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
    <span style={{fontSize: 12, color: 'var(--text-2)'}}>{label}</span>
    <div style={{display: 'flex', alignItems: 'baseline', gap: 4}}>
      <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 14, width: 70, textAlign: 'right', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 6px', background: 'var(--surface)' }} />
      <span style={{fontSize: 11, color: 'var(--text-3)'}}>{suffix}</span>
    </div>
  </div>
);

const Stat = ({ label, value, hint, good }) => (
  <div>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
      <span style={{fontSize: 12, color: 'var(--text-2)'}}>{label}</span>
      <span className="num" style={{fontSize: 16, fontWeight: 600, color: good ? 'var(--good)' : 'var(--warn)'}}>{value}</span>
    </div>
    <div style={{fontSize: 11, color: 'var(--text-3)', marginTop: 2}}>{hint}</div>
  </div>
);

window.Recetas = Recetas;
