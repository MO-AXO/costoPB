// Insumos — tabla editable con búsqueda + filtro por categoría
const Insumos = ({ insumos, setInsumos }) => {
  const C = window.PB_CALC;
  const [search, setSearch] = React.useState('');
  const [cat, setCat] = React.useState('all');
  const [showNew, setShowNew] = React.useState(false);
  const [editId, setEditId] = React.useState(null);

  const categories = ['all', ...Array.from(new Set(insumos.map(i => i.category)))];
  const filtered = insumos.filter(i =>
    (cat === 'all' || i.category === cat) &&
    (search === '' || i.name.toLowerCase().includes(search.toLowerCase()))
  );

  const update = (id, patch) => setInsumos(insumos.map(i => i.id === id ? { ...i, ...patch } : i));
  const addInsumo = (ins) => setInsumos(prev => [...prev, ins]);
  const deleteInsumo = (id) => setInsumos(prev => prev.filter(i => i.id !== id));

  const editItem = editId ? insumos.find(i => i.id === editId) : null;

  const exportCSV = () => {
    const headers = ['Nombre', 'Categoría', 'Unidad', 'Precio compra', 'Cant. presentación', 'Costo/u', 'Yield', 'Costo real/u', 'Proveedor'];
    const rows = insumos.map(i => {
      const baseCost = (i.purchasePrice > 0 && i.purchaseQty > 0) ? i.purchasePrice / i.purchaseQty : (i.cost || 0);
      const real = baseCost / Math.max(i.yield, 0.01);
      return [
        i.name, i.category, i.unit,
        (i.purchasePrice || '').toString(), (i.purchaseQty || '').toString(),
        baseCost.toFixed(4), i.yield.toFixed(2), real.toFixed(4),
        i.supplier,
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'insumos_pig_brothers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Insumos</h1>
          <div className="page-sub">{insumos.length} ingredientes activos</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={exportCSV}><Icon name="download" /> Exportar CSV</button>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}><Icon name="plus" /> Nuevo insumo</button>
        </div>
      </div>

      <div className="card" style={{marginBottom: 12}}>
        <div className="card-body" style={{padding: 12, display: 'flex', gap: 8, alignItems: 'center'}}>
          <div className="search" style={{flex: 1, maxWidth: 360}}>
            <Icon name="search" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar insumo..." />
          </div>
          <div style={{display: 'flex', gap: 4, flexWrap: 'wrap'}}>
            {categories.map(c => (
              <button key={c} className={`btn btn-sm ${cat === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCat(c)}>
                {c === 'all' ? 'Todas' : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="hint" style={{margin: 16, marginBottom: 0}}>
          <b>Costo real / unidad</b> = (precio de compra ÷ cantidad presentación) ÷ yield. Ejemplo: $18 por 6 pzas con yield 0.90 = <b>$3.33/pza real</b>.
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Insumo</th>
            <th>Categoría</th>
            <th>Unidad</th>
            <th className="right">Precio compra</th>
            <th className="right">Cant. presentación</th>
            <th className="right" data-tip="Porcentaje aprovechable después de pérdida/cocción">Yield</th>
            <th className="right">Costo real/u</th>
            <th>Proveedor</th>
            <th className="right">Δ último</th>
            <th></th>
          </tr></thead>
          <tbody>
            {filtered.map(ins => {
              const real = C.insumoCostPerUnit(ins);
              const isUp = ins.lastChange.startsWith('+');
              const isDown = ins.lastChange.startsWith('-');
              return (
                <tr key={ins.id}>
                  <td>
                    <input type="text" value={ins.name} onChange={e => update(ins.id, { name: e.target.value })} style={{textAlign: 'left'}} />
                  </td>
                  <td><Tag>{ins.category}</Tag></td>
                  <td className="num" style={{color: 'var(--text-2)'}}>{ins.unit}</td>
                  <td className="right">
                    <input type="number" step="0.01" value={ins.purchasePrice ?? ''} placeholder="—" onChange={e => update(ins.id, { purchasePrice: parseFloat(e.target.value) || 0 })} />
                  </td>
                  <td className="right">
                    <input type="number" step="0.01" value={ins.purchaseQty ?? ''} placeholder="—" onChange={e => update(ins.id, { purchaseQty: parseFloat(e.target.value) || 0 })} />
                  </td>
                  <td className="right">
                    <input type="number" step="0.01" min="0" max="1" value={ins.yield} onChange={e => update(ins.id, { yield: parseFloat(e.target.value) || 1 })} />
                  </td>
                  <td className="right num" style={{fontWeight: 500}}>{fmt$(real)}</td>
                  <td style={{color: 'var(--text-2)', fontSize: 12}}>{ins.supplier}</td>
                  <td className="right">
                    <span className="num" style={{color: isUp ? 'var(--bad)' : isDown ? 'var(--good)' : 'var(--text-3)', fontSize: 12, fontWeight: 500}}>
                      {ins.lastChange}
                    </span>
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => setEditId(ins.id)}><Icon name="edit" size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNew && (
        <NewInsumoDrawer
          open
          onClose={() => setShowNew(false)}
          onAdd={addInsumo}
          existingCategories={[...new Set(insumos.map(i => i.category))]}
        />
      )}
      {editItem && (
        <EditInsumoDrawer
          open
          item={editItem}
          onClose={() => setEditId(null)}
          onSave={(patch) => { update(editId, patch); setEditId(null); }}
          onDelete={() => { deleteInsumo(editId); setEditId(null); }}
        />
      )}
    </div>
  );
};

// ─── Drawer: Nuevo insumo ─────────────────────────────────────────────────────
const NewInsumoDrawer = ({ open, onClose, onAdd, existingCategories }) => {
  const [f, setF] = React.useState({
    name: '', category: existingCategories[0] || 'Carne cruda',
    unit: 'lb', purchasePrice: '', purchaseQty: '', yield: 1, supplier: '',
  });
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));
  const canSave = f.name.trim().length > 0;
  const fl = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 13 };
  const lbl = (t) => <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>{t}</label>;

  const pp = parseFloat(f.purchasePrice) || 0;
  const pq = parseFloat(f.purchaseQty) || 0;
  const baseCost = (pp > 0 && pq > 0) ? pp / pq : 0;
  const realCost = baseCost / Math.max(parseFloat(f.yield) || 1, 0.01);

  return (
    <Drawer open={open} title="Nuevo insumo" subtitle="Agrega un ingrediente al catálogo" onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={() => {
            onAdd({
              id: 'ins_' + Date.now(),
              ...f,
              purchasePrice: parseFloat(f.purchasePrice) || 0,
              purchaseQty: parseFloat(f.purchaseQty) || 0,
              cost: baseCost,
              yield: parseFloat(f.yield) || 1,
              lastChange: '–',
            });
            onClose();
          }}>
            Agregar insumo
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          {lbl('Nombre')}
          <input style={fl} value={f.name} onChange={e => upd('name', e.target.value)} placeholder="Ej: Brisket de res" autoFocus />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            {lbl('Categoría')}
            <select style={fl} value={f.category} onChange={e => upd('category', e.target.value)}>
              {existingCategories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            {lbl('Unidad')}
            <select style={fl} value={f.unit} onChange={e => upd('unit', e.target.value)}>
              {['lb', 'oz', 'kg', 'g', 'gal', 'l', 'ml', 'pza'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Presentación de compra
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {lbl('Precio de compra (USD)')}
              <input type="number" step="0.01" min="0" style={{ ...fl, fontFamily: 'var(--font-mono)' }}
                value={f.purchasePrice} placeholder="Ej: 18.00"
                onChange={e => upd('purchasePrice', e.target.value)} />
            </div>
            <div>
              {lbl('Cantidad en presentación')}
              <input type="number" step="0.01" min="0" style={{ ...fl, fontFamily: 'var(--font-mono)' }}
                value={f.purchaseQty} placeholder={`Ej: 6 ${f.unit}`}
                onChange={e => upd('purchaseQty', e.target.value)} />
            </div>
          </div>
          {pp > 0 && pq > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
              Costo base: <b>${baseCost.toFixed(4)}</b> / {f.unit}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            {lbl('Yield (0.01 – 1.00)')}
            <input type="number" step="0.01" min="0.01" max="1" style={{ ...fl, fontFamily: 'var(--font-mono)' }} value={f.yield} onChange={e => upd('yield', e.target.value)} />
          </div>
          <div>
            {lbl('Proveedor')}
            <input style={fl} value={f.supplier} onChange={e => upd('supplier', e.target.value)} placeholder="Ej: Distribuidora XYZ" />
          </div>
        </div>
        <div className="hint">
          <b>Costo real</b> = ${realCost.toFixed(4)} / {f.unit || 'u'}
        </div>
      </div>
    </Drawer>
  );
};

// ─── Drawer: Editar insumo ────────────────────────────────────────────────────
const EditInsumoDrawer = ({ open, item, onClose, onSave, onDelete }) => {
  const [f, setF] = React.useState({ ...item });
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));
  const fl = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 13 };
  const lbl = (t) => <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>{t}</label>;

  const pp = parseFloat(f.purchasePrice) || 0;
  const pq = parseFloat(f.purchaseQty) || 0;
  const baseCost = (pp > 0 && pq > 0) ? pp / pq : (parseFloat(f.cost) || 0);
  const realCost = baseCost / Math.max(parseFloat(f.yield) || 1, 0.01);

  return (
    <Drawer open={open} title="Editar insumo" subtitle={item.name} onClose={onClose}
      footer={
        <>
          <button className="btn" style={{ color: 'var(--bad)', marginRight: 'auto' }}
            onClick={() => { if (confirm(`¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`)) onDelete(); }}>
            Eliminar
          </button>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onSave({
            ...f,
            purchasePrice: parseFloat(f.purchasePrice) || 0,
            purchaseQty: parseFloat(f.purchaseQty) || 0,
            cost: baseCost,
            yield: parseFloat(f.yield) || 1,
          })}>
            Guardar
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          {lbl('Nombre')}
          <input style={fl} value={f.name} onChange={e => upd('name', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            {lbl('Unidad')}
            <select style={fl} value={f.unit} onChange={e => upd('unit', e.target.value)}>
              {['lb', 'oz', 'kg', 'g', 'gal', 'l', 'ml', 'pza'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            {lbl('Proveedor')}
            <input style={fl} value={f.supplier} onChange={e => upd('supplier', e.target.value)} />
          </div>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Presentación de compra
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {lbl('Precio de compra (USD)')}
              <input type="number" step="0.01" min="0" style={{ ...fl, fontFamily: 'var(--font-mono)' }}
                value={f.purchasePrice ?? ''} placeholder="Ej: 18.00"
                onChange={e => upd('purchasePrice', e.target.value)} />
            </div>
            <div>
              {lbl('Cantidad en presentación')}
              <input type="number" step="0.01" min="0" style={{ ...fl, fontFamily: 'var(--font-mono)' }}
                value={f.purchaseQty ?? ''} placeholder={`Ej: 6 ${f.unit}`}
                onChange={e => upd('purchaseQty', e.target.value)} />
            </div>
          </div>
          {pp > 0 && pq > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
              Costo base: <b>${baseCost.toFixed(4)}</b> / {f.unit}
            </div>
          )}
        </div>

        <div>
          {lbl('Yield (0.01 – 1.00)')}
          <input type="number" step="0.01" min="0.01" max="1" style={{ ...fl, fontFamily: 'var(--font-mono)' }} value={f.yield} onChange={e => upd('yield', e.target.value)} />
        </div>
        <div className="hint">
          <b>Costo real</b> = ${realCost.toFixed(4)} / {f.unit}
        </div>
      </div>
    </Drawer>
  );
};

window.Insumos = Insumos;
