// Asistente IA — conectado a Claude via /api/ai
const AIAssistant = ({ insumos, subrecetas, recetas, fixedCosts }) => {
  const C = window.PB_CALC;
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const scrollRef = React.useRef(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  React.useEffect(() => {
    if (open && messages.length === 0) inputRef.current?.focus();
  }, [open]);

  // ── Construye contexto rico con los datos reales ──────────────────────────
  const buildContext = () => {
    const all = recetas.map(r => {
      const m = C.recetaMetrics(r, insumos, subrecetas, fixedCosts);
      return {
        nombre: r.name,
        categoria: r.category,
        precio: +r.sellPrice.toFixed(2),
        costo_ingredientes: +m.ingredientCost.toFixed(2),
        costo_total: +m.totalAll.toFixed(2),
        food_cost_pct: +m.foodCostPct.toFixed(1),
        food_cost_objetivo: r.targetFoodCost,
        margen_por_plato: +m.margin$.toFixed(2),
        margen_pct: +m.marginPct.toFixed(1),
        prime_cost_pct: +m.primeCostPct.toFixed(1),
        ventas_mensuales: r.monthlySales,
        utilidad_mensual: +m.monthlyMargin.toFixed(0),
        precio_sugerido: +m.suggestedPrice.toFixed(2),
        sobre_objetivo: m.foodCostPct > r.targetFoodCost,
      };
    });

    const safeRev = Math.max(all.reduce((a, x) => a + x.precio * x.ventas_mensuales, 0), 0.01);
    const totalIng = all.reduce((a, x) => a + x.costo_ingredientes * x.ventas_mensuales, 0);
    const totalMar = all.reduce((a, x) => a + x.utilidad_mensual, 0);
    const staffSalary = (fixedCosts.staff || []).reduce((a, m) => a + (m.salary || 0), 0) || (fixedCosts.salaries || 0);
    const totalFijos = (fixedCosts.rent || 0) + staffSalary + (fixedCosts.electricity || 0) +
      (fixedCosts.gas || 0) + (fixedCosts.water || 0) + (fixedCosts.internet || 0) +
      (fixedCosts.gasoline || 0) + (fixedCosts.charcoal || 0) + (fixedCosts.wood || 0) +
      (fixedCosts.aluminum || 0) + (fixedCosts.accountant || 0) + (fixedCosts.cleaning || 0);

    const categorias = {};
    all.forEach(r => {
      if (!categorias[r.categoria]) categorias[r.categoria] = { ingresos: 0, utilidad: 0, unidades: 0 };
      categorias[r.categoria].ingresos  += r.precio * r.ventas_mensuales;
      categorias[r.categoria].utilidad  += r.utilidad_mensual;
      categorias[r.categoria].unidades  += r.ventas_mensuales;
    });

    return {
      negocio: 'Pig Brothers BBQ — restaurante, moneda USD',
      kpis_mes: {
        ingreso_total: +safeRev.toFixed(0),
        food_cost_blended_pct: +((totalIng / safeRev) * 100).toFixed(1),
        utilidad_total_variable: +totalMar.toFixed(0),
        costos_fijos_mes: +totalFijos.toFixed(0),
        utilidad_operativa_estimada: +(totalMar - totalFijos).toFixed(0),
        platos_vendidos_total: all.reduce((a, x) => a + x.ventas_mensuales, 0),
      },
      personal: (fixedCosts.staff || []).map(s => ({
        puesto: s.role,
        salario: s.salary,
        horas_mes: s.dailyHours * 6 * 4,
        costo_hora: +(s.salary / Math.max(s.dailyHours * 6 * 4, 1)).toFixed(2),
      })),
      recetas: all,
      por_categoria: categorias,
      insumos_mas_caros: insumos
        .filter(i => i.cost > 0)
        .sort((a, b) => (b.cost / b.yield) - (a.cost / a.yield))
        .slice(0, 10)
        .map(i => ({ nombre: i.name, costo_por_unidad: +(i.cost / i.yield).toFixed(4), unidad: i.unit, categoria: i.category })),
      recetas_bajo_objetivo: all.filter(r => r.sobre_objetivo).map(r => r.nombre),
      recetas_sin_ventas: all.filter(r => r.ventas_mensuales === 0).map(r => r.nombre),
    };
  };

  // ── Llama al endpoint /api/ai ─────────────────────────────────────────────
  const ask = async (question) => {
    if (!question.trim() || loading) return;
    const userMsg = { role: 'user', content: question };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const ctx = buildContext();
      const system = `Eres el asesor de costos de Pig Brothers BBQ. Respondes en español, de forma concisa y directa (máximo 200 palabras por respuesta). Usas los datos numéricos del contexto. Cuando sugieras acciones las ordenas por impacto en USD/mes. Nunca inventas datos que no estén en el contexto. Si algo no está en el contexto, lo dices claramente.

DATOS EN TIEMPO REAL DE PIG BROTHERS:
${JSON.stringify(ctx, null, 2)}

REGLAS:
- Responde siempre en español
- Usa números concretos del contexto
- Sé directo, sin introducciones largas
- Si el usuario pregunta algo que no está en los datos, indícalo`;

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (e) {
      setError(e.message.includes('ANTHROPIC_API_KEY')
        ? 'Falta configurar ANTHROPIC_API_KEY en Railway → Variables'
        : 'Error conectando con el asistente: ' + e.message);
    }
    setLoading(false);
  };

  // Sugerencias dinámicas basadas en los datos reales
  const getSuggestions = () => {
    const ctx = buildContext();
    const sugs = [
      '¿Cuál es mi plato más rentable y cuál el menos?',
      `Tengo ${ctx.recetas_bajo_objetivo.length} platos sobre el food cost objetivo — ¿qué hago?`,
      '¿Cuántas unidades necesito vender para cubrir los costos fijos?',
      '¿Qué impacto tendría subir todos los precios $0.50?',
    ];
    if (ctx.recetas_sin_ventas.length > 0)
      sugs.push(`Tengo ${ctx.recetas_sin_ventas.length} platos sin ventas registradas — ¿qué recomiendas?`);
    if (ctx.kpis_mes.utilidad_operativa_estimada < 0)
      sugs.push('Mi utilidad operativa es negativa — ¿cómo lo corrijo?');
    return sugs.slice(0, 4);
  };

  const clearChat = () => { setMessages([]); setError(''); };

  // ── Botón flotante ────────────────────────────────────────────────────────
  if (!open) return (
    <button
      id="pb-ai-btn"
      onClick={() => setOpen(true)}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 90,
        width: 52, height: 52, borderRadius: '50%',
        background: 'var(--accent)', color: '#fff', border: 0,
        boxShadow: '0 4px 16px rgba(59,76,202,0.4)',
        display: 'grid', placeItems: 'center', cursor: 'pointer',
        transition: 'transform 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      data-tip="Asesor IA"
    >
      <Icon name="sparkles" size={22} />
    </button>
  );

  // ── Panel ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      width: 420, height: 580,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, boxShadow: '0 20px 60px rgba(15,20,25,0.22)',
      zIndex: 90, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--accent)', color: '#fff',
      }}>
        <div style={{width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center'}}>
          <Icon name="sparkles" size={17} />
        </div>
        <div style={{flex: 1}}>
          <div style={{fontSize: 13, fontWeight: 600}}>Asesor de costos IA</div>
          <div style={{fontSize: 11, opacity: 0.75}}>Conectado a tus datos en tiempo real</div>
        </div>
        <div style={{display: 'flex', gap: 4}}>
          {messages.length > 0 && (
            <button onClick={clearChat} style={{background: 'rgba(255,255,255,0.15)', border: 0, borderRadius: 6, color: '#fff', padding: '4px 8px', fontSize: 11, cursor: 'pointer'}}>
              Nueva conversación
            </button>
          )}
          <button onClick={() => setOpen(false)} style={{background: 'rgba(255,255,255,0.15)', border: 0, borderRadius: 6, color: '#fff', width: 28, height: 28, display: 'grid', placeItems: 'center', cursor: 'pointer'}}>
            <Icon name="close" size={14} />
          </button>
        </div>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} style={{flex: 1, overflowY: 'auto', padding: '16px'}}>
        {messages.length === 0 && (
          <div>
            <div style={{fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6}}>
              Tengo acceso completo a tus recetas, costos, márgenes y KPIs del mes. Pregúntame cualquier cosa sobre tu negocio.
            </div>
            <div style={{fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8, fontWeight: 600}}>
              Preguntas sugeridas
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              {getSuggestions().map((s, i) => (
                <button key={i} onClick={() => ask(s)} style={{
                  textAlign: 'left', padding: '9px 12px',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 8, fontSize: 12, color: 'var(--text-2)',
                  cursor: 'pointer', lineHeight: 1.4,
                  transition: 'border-color 0.12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'}}>
            {msg.role === 'assistant' && (
              <div style={{fontSize: 10, color: 'var(--text-3)', marginBottom: 4, paddingLeft: 2, letterSpacing: '0.04em', textTransform: 'uppercase'}}>
                Asesor IA
              </div>
            )}
            <div style={{
              maxWidth: '88%', padding: '9px 13px',
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
              fontSize: 13, lineHeight: 1.55,
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface-2)',
              color: msg.role === 'user' ? '#fff' : 'var(--text)',
              border: msg.role === 'user' ? 0 : '1px solid var(--border)',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0'}}>
            <div style={{display: 'flex', gap: 4}}>
              <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
            </div>
            <span style={{fontSize: 11, color: 'var(--text-3)'}}>Analizando tus datos…</span>
          </div>
        )}

        {error && (
          <div style={{
            padding: '10px 12px', borderRadius: 8, marginTop: 8,
            background: 'var(--bad-soft)', border: '1px solid var(--bad)',
            fontSize: 12, color: 'var(--bad)', lineHeight: 1.5,
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'flex-end'}}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
          placeholder="Pregunta sobre tus costos… (Enter para enviar)"
          rows={2}
          disabled={loading}
          style={{
            flex: 1, padding: '8px 10px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            outline: 0, fontSize: 13, resize: 'none', lineHeight: 1.45,
            fontFamily: 'var(--font-sans)',
          }}
        />
        <button
          className="btn btn-primary"
          onClick={() => ask(input)}
          disabled={loading || !input.trim()}
          style={{height: 52, paddingLeft: 14, paddingRight: 14, flexShrink: 0}}
        >
          <Icon name="arrow-right" size={15} />
        </button>
      </div>
    </div>
  );
};

const Dot = ({ delay }) => (
  <span style={{
    width: 7, height: 7, borderRadius: '50%',
    background: 'var(--accent)', opacity: 0.4,
    display: 'inline-block',
    animation: 'pbDotPulse 1.2s infinite',
    animationDelay: delay + 'ms',
  }} />
);

if (!document.getElementById('pb-ai-kf')) {
  const s = document.createElement('style'); s.id = 'pb-ai-kf';
  s.textContent = '@keyframes pbDotPulse { 0%,60%,100%{opacity:0.2;transform:translateY(0)} 30%{opacity:1;transform:translateY(-3px)} }';
  document.head.appendChild(s);
}

window.AIAssistant = AIAssistant;
