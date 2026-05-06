// Componentes compartidos: helpers de cálculo, sparkline, KPI, tags

const D = window.PB_DATA;

// ----- HELPERS DE CÁLCULO -----
const fmt$ = (n) => '$' + (n ?? 0).toFixed(2);
const fmt$0 = (n) => '$' + Math.round(n ?? 0).toLocaleString();
const fmtPct = (n, d = 1) => (n ?? 0).toFixed(d) + '%';

// Costo por unidad de un insumo, ajustado por yield (rendimiento)
const insumoCostPerUnit = (insumo) => {
  if (!insumo) return 0;
  return insumo.cost / Math.max(insumo.yield || 1, 0.01);
};

// Conversión entre unidades (peso/volumen/pieza)
// Devuelve cuántas "unidades del insumo" equivalen a 1 "unidad de la receta"
const UNIT_CONV = {
  // peso: lb ↔ oz ↔ g ↔ kg
  'lb->oz': 1/16,       'oz->lb': 16,
  'lb->lb': 1,          'oz->oz': 1,
  'kg->g': 1/1000,      'g->kg': 1000,
  'kg->kg': 1,          'g->g': 1,
  'lb->g': 1/453.592,   'g->lb': 453.592,
  'lb->kg': 1/0.453592, 'kg->lb': 0.453592,
  'oz->g': 1/28.3495,   'g->oz': 28.3495,
  'oz->kg': 1/28349.5,  'kg->oz': 28349.5,
  // volumen: gal ↔ l ↔ ml ↔ oz
  'gal->oz': 1/128,     'oz->gal': 128,
  'gal->gal': 1,
  'l->ml': 1/1000,      'ml->l': 1000,
  'l->l': 1,            'ml->ml': 1,
  'gal->ml': 1/3785.41, 'ml->gal': 3785.41,
  'gal->l': 1/3.78541,  'l->gal': 3.78541,
  'oz->ml': 1/29.5735,  'ml->oz': 29.5735,
  'l->oz': 1/0.029574,  'oz->l': 0.029574,
  // pieza
  'pza->pza': 1,
};
const convertQty = (qty, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return qty;
  const k = `${toUnit}->${fromUnit}`; // cuántas "fromUnit" caben en 1 "toUnit"
  if (UNIT_CONV[k] != null) return qty * UNIT_CONV[k];
  return qty; // fallback: asume mismas unidades
};

// Costo total de una sub-receta
const subRecetaCost = (sub, insumos) => {
  if (!sub) return 0;
  return sub.ingredients.reduce((acc, ing) => {
    const ins = insumos.find(i => i.id === ing.insumoId);
    if (!ins) return acc;
    const qtyInInsumoUnits = convertQty(ing.qty, ing.unit, ins.unit);
    return acc + insumoCostPerUnit(ins) * qtyInInsumoUnits;
  }, 0);
};

// Costo por unidad de yield de la sub-receta
const subRecetaCostPerUnit = (sub, insumos) => {
  return subRecetaCost(sub, insumos) / Math.max(sub.yield, 1);
};

// Costo de ingredientes de una receta
const recetaIngredientCost = (receta, insumos, subrecetas) => {
  return receta.ingredients.reduce((acc, ing) => {
    if (ing.type === 'sub') {
      const sub = subrecetas.find(s => s.id === ing.subId);
      if (!sub) return acc;
      const qtyInSubUnits = convertQty(ing.qty, ing.unit, sub.yieldUnit);
      return acc + subRecetaCostPerUnit(sub, insumos) * qtyInSubUnits;
    } else {
      const ins = insumos.find(i => i.id === ing.insumoId);
      if (!ins) return acc;
      const qtyInInsumoUnits = convertQty(ing.qty, ing.unit, ins.unit);
      return acc + insumoCostPerUnit(ins) * qtyInInsumoUnits;
    }
  }, 0);
};

// Costo de empaque
const recetaPackagingCost = (receta, insumos) => {
  return (receta.packagingItems || []).reduce((acc, id) => {
    const ins = insumos.find(i => i.id === id);
    return acc + (ins?.cost || 0);
  }, 0);
};

// Costo de mano de obra
const recetaLaborCost = (receta, fixedCosts) => {
  return (receta.laborMinutes / 60) * fixedCosts.laborRatePerHour;
};

// Costo fijo prorrateado por plato — suma todos los costos operativos
const fixedCostPerCover = (fixedCosts) => {
  // Salarios desde la tabla de personal (si existe), o campo legacy
  const staffSalary = (fixedCosts.staff || []).reduce((a, m) => a + (m.salary || 0), 0)
                   || (fixedCosts.salaries || 0);
  const total = (fixedCosts.rent        || 0) +
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
                // Compatibilidad con campos anteriores
                (fixedCosts.utilities  || 0) +
                (fixedCosts.insurance  || 0) +
                (fixedCosts.software   || 0);
  return total / Math.max(fixedCosts.monthlyCovers || 1, 1);
};

// Costo total y métricas de una receta
const recetaMetrics = (receta, insumos, subrecetas, fixedCosts) => {
  const ingredientCost = recetaIngredientCost(receta, insumos, subrecetas);
  const packagingCost  = recetaPackagingCost(receta, insumos);
  const laborCost      = recetaLaborCost(receta, fixedCosts);
  const overheadCost   = fixedCostPerCover(fixedCosts);
  const totalVariable  = ingredientCost + packagingCost + laborCost; // costo variable directo
  const totalAll       = totalVariable + overheadCost;                // costo cargado
  const sellPrice      = receta.sellPrice;
  const foodCostPct    = (ingredientCost / sellPrice) * 100;
  const primeCostPct   = ((ingredientCost + laborCost) / sellPrice) * 100;
  const margin$        = sellPrice - totalVariable;
  const marginPct      = (margin$ / sellPrice) * 100;
  const suggestedPrice = ingredientCost / (receta.targetFoodCost / 100);
  return {
    ingredientCost, packagingCost, laborCost, overheadCost,
    totalVariable, totalAll, sellPrice,
    foodCostPct, primeCostPct, margin$, marginPct, suggestedPrice,
    monthlyRevenue: sellPrice * receta.monthlySales,
    monthlyMargin: margin$ * receta.monthlySales,
  };
};

window.PB_CALC = {
  fmt$, fmt$0, fmtPct,
  convertQty,
  insumoCostPerUnit, subRecetaCost, subRecetaCostPerUnit,
  recetaIngredientCost, recetaPackagingCost, recetaLaborCost,
  fixedCostPerCover, recetaMetrics,
};

// ----- COMPONENTES UI -----
const Sparkline = ({ data, color, height = 36, fill = true }) => {
  if (!data || data.length === 0) return null;
  const w = 200, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y];
  });
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const fillPath = `${path} L ${w} ${h} L 0 ${h} Z`;
  const c = color || 'var(--accent)';
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {fill && <path d={fillPath} fill={c} opacity="0.08" />}
      <path d={path} fill="none" stroke={c} strokeWidth="1.5" />
    </svg>
  );
};

const KPI = ({ label, value, delta, deltaDir, target, trend, sub }) => (
  <div className="kpi">
    <div className="kpi-label">{label}</div>
    <div className="kpi-value">{value}</div>
    {trend && <div style={{marginTop: 8, marginBottom: -4}}><Sparkline data={trend} /></div>}
    <div className="kpi-foot">
      {delta != null && (
        <span className={`kpi-delta ${deltaDir || (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat')}`}>
          {delta > 0 ? '↑' : delta < 0 ? '↓' : '–'} {Math.abs(delta).toFixed(1)}%
        </span>
      )}
      {target && <span className="kpi-target">{target}</span>}
      {sub && !target && <span className="kpi-target">{sub}</span>}
    </div>
  </div>
);

const Tag = ({ children, kind }) => <span className={`tag ${kind || ''}`}>{children}</span>;

const Bar = ({ label, value, max, suffix }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="bar-row">
      <span style={{color: 'var(--text-2)'}}>{label}</span>
      <div className="bar-track"><div className="bar-fill" style={{width: pct + '%'}} /></div>
      <span className="num" style={{textAlign: 'right'}}>{suffix === '%' ? value.toFixed(1) + '%' : '$' + value.toFixed(2)}</span>
    </div>
  );
};

// Drawer
const Drawer = ({ open, onClose, title, subtitle, children, footer }) => {
  if (!open) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <div style={{fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em'}}>{title}</div>
            {subtitle && <div style={{fontSize: 12, color: 'var(--text-3)', marginTop: 4}}>{subtitle}</div>}
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </>
  );
};

const FoodCostBadge = ({ pct, target }) => {
  const diff = pct - target;
  let kind = 'good';
  if (diff > 5) kind = 'bad';
  else if (diff > 2) kind = 'warn';
  return <Tag kind={kind}>{pct.toFixed(1)}%</Tag>;
};

Object.assign(window, { Sparkline, KPI, Tag, Bar, Drawer, FoodCostBadge });
