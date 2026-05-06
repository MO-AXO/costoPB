// Asistente IA — análisis contextual con window.claude.complete
const AIAssistant = ({ insumos, subrecetas, recetas, fixedCosts }) => {
  const C = window.PB_CALC;
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const buildContext = () => {
    const all = recetas.map(r => {
      const m = C.recetaMetrics(r, insumos, subrecetas, fixedCosts);
      return {
        nombre: r.name, categoria: r.category,
        precio: +r.sellPrice.toFixed(2),
        costo_ingredientes: +m.ingredientCost.toFixed(2),
        food_cost_pct: +m.foodCostPct.toFixed(1),
        objetivo: r.targetFoodCost,
        margen: +m.margin$.toFixed(2),
        margen_pct: +m.marginPct.toFixed(1),
        ventas_mensuales: r.monthlySales,
        utilidad_mensual: +m.monthlyMargin.toFixed(0),
        precio_sugerido: +m.suggestedPrice.toFixed(2),
      };
    });
    const totalRev = all.reduce((a, x) => a + x.precio * x.ventas_mensuales, 0);
    const totalIng = all.reduce((a, x) => a + x.costo_ingredientes * x.ventas_mensuales, 0);
    return {
      negocio: 'Pig Brothers — restaurante BBQ, menú fijo, USD',
      mes_actual: 'Abril 2026',
      kpis: {
        ingreso_mensual: +totalRev.toFixed(0),
        food_cost_blended_pct: +((totalIng/totalRev)*100).toFixed(1),
        platos_vendidos: all.reduce((a, x) => a + x.ventas_mensuales, 0),
        costos_fijos_mes: fixedCosts.rent + fixedCosts.utilities + fixedCosts.insurance + fixedCosts.software,
      },
      recetas: all,
      insumos_top: insumos.slice().sort((a,b) => b.cost - a.cost).slice(0, 8).map(i => ({
        nombre: i.name, costo: i.cost, unidad: i.unit, yield: i.yield, ultimo_cambio: i.lastChange
      })),
    };
  };

  const ask = async (question) => {
    if (!question.trim()) return;
    const userMsg = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const ctx = buildContext();
      const systemPrompt = `Eres un asesor experto de costos para restaurantes BBQ, ayudando al dueño de Pig Brothers. Respondes en español, conciso y directo (max 150 palabras). Usas datos numéricos específicos del contexto. Cuando sugieras acciones, ordena por impacto en USD/mes. No inventes datos que no estén en el contexto.

CONTEXTO ACTUAL:
${JSON.stringify(ctx, null, 2)}`;
      const response = await window.claude.complete({
        messages: [
          { role: 'user', content: systemPrompt + '\n\nPregunta: ' + question }
        ],
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error: ' + e.message }]);
    }
    setLoading(false);
  };

  const suggestions = [
    '¿Qué platillo me da más utilidad y cuál menos?',
    '¿Dónde puedo recortar costos sin afectar calidad?',
    'Resúmeme el mes en 3 puntos',
    '¿Qué pasa si el brisket sube 10%?',
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 90,
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--accent)', color: '#fff', border: 0,
          boxShadow: '0 6px 20px rgba(15,20,25,0.2), 0 0 0 4px var(--accent-soft)',
          display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}
        data-tip="Asistente IA"
      >
        <Icon name="sparkles" size={22} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, width: 400, height: 560,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, boxShadow: '0 20px 60px rgba(15,20,25,0.22)',
      zIndex: 90, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10}}>
        <div style={{width: 30, height: 30, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center'}}>
          <Icon name="sparkles" size={16} />
        </div>
        <div style={{flex: 1}}>
          <div style={{fontSize: 13, fontWeight: 600}}>Asesor de costos</div>
          <div style={{fontSize: 11, color: 'var(--text-3)'}}>Conectado a tus datos en vivo</div>
        </div>
        <button className="icon-btn" onClick={() => setOpen(false)}><Icon name="close" size={14} /></button>
      </div>

      <div ref={scrollRef} style={{flex: 1, overflowY: 'auto', padding: '14px 16px'}}>
        {messages.length === 0 && (
          <div>
            <div style={{fontSize: 12, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5}}>
              Soy tu asesor de costos. Tengo acceso a todas tus recetas, insumos y KPIs. Pregúntame lo que sea sobre tu menú.
            </div>
            <div style={{fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6}}>Sugerencias</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => ask(s)} style={{
                  textAlign: 'left', padding: '8px 10px',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 6, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'}}>
            <div style={{
              maxWidth: '85%', padding: '8px 12px', borderRadius: 10, fontSize: 13, lineHeight: 1.5,
              background: m.role === 'user' ? 'var(--accent)' : 'var(--surface-2)',
              color: m.role === 'user' ? '#fff' : 'var(--text)',
              border: m.role === 'user' ? 0 : '1px solid var(--border)',
              whiteSpace: 'pre-wrap',
            }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{display: 'flex', gap: 4, padding: '8px 12px'}}>
            <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
          </div>
        )}
      </div>

      <div style={{padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 6}}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && ask(input)}
          placeholder="Pregunta sobre tus costos..."
          style={{
            flex: 1, padding: '8px 10px', borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            outline: 0, fontSize: 13,
          }}
          disabled={loading}
        />
        <button className="btn btn-primary btn-sm" onClick={() => ask(input)} disabled={loading || !input.trim()}>
          <Icon name="arrow-right" size={13} />
        </button>
      </div>
    </div>
  );
};

const Dot = ({ delay }) => (
  <span style={{
    width: 6, height: 6, borderRadius: '50%', background: 'var(--text-3)',
    animation: 'pbDotPulse 1.2s infinite', animationDelay: delay + 'ms'
  }}></span>
);

// inject keyframes once
if (!document.getElementById('pb-ai-kf')) {
  const s = document.createElement('style'); s.id = 'pb-ai-kf';
  s.textContent = '@keyframes pbDotPulse { 0%, 60%, 100% { opacity: 0.3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-2px); } }';
  document.head.appendChild(s);
}

window.AIAssistant = AIAssistant;
