// Pig Brothers — Sistema de Agentes IA Especializados
// Agente 1: Ingeniero de Menú (diseño de productos rentables)
// Agente 2: Analista de Ventas (interpretación clara de datos)

const AGENTS = {
  menu_engineer: {
    id: 'menu_engineer',
    name: 'Ingeniero de Menú',
    emoji: '🧪',
    color: '#10b981', // green
    description: 'Diseña productos de alta rentabilidad',
    suggestions: (ctx) => [
      '¿Qué combinación de ingredientes maximiza el margen?',
      '¿Cómo puedo crear un nuevo plato con food cost bajo 25%?',
      'Sugiere 3 nuevos productos usando ingredientes que ya tengo',
      '¿Qué insumos baratos están subutilizados?',
      'Diseña un combo rentable con pulled pork',
    ],
    systemPrompt: (ctx) => `Eres el INGENIERO DE MENÚ de Pig Brothers BBQ. Tu especialidad es diseñar productos de ALTA RENTABILIDAD.

PERSONALIDAD:
- Creativo pero orientado a números
- Siempre calculas márgenes y food cost de tus sugerencias
- Propones combinaciones innovadoras usando ingredientes existentes
- Piensas en la matriz de ingeniería de menú (Stars, Plowhorses, Puzzles, Dogs)

TU MISIÓN:
1. Analizar insumos disponibles y sus costos
2. Identificar ingredientes subutilizados con buen margen
3. Diseñar nuevos productos con food cost objetivo <30%
4. Sugerir modificaciones a recetas existentes para mejorar márgenes
5. Crear combos estratégicos que maximicen ticket promedio

MATRIZ DE INGENIERÍA DE MENÚ:
- STARS (⭐): Alta popularidad + Alto margen → Promocionar agresivamente
- PLOWHORSES (🐴): Alta popularidad + Bajo margen → Subir precio o reducir porción
- PUZZLES (🧩): Baja popularidad + Alto margen → Mejorar presentación/marketing
- DOGS (🐕): Baja popularidad + Bajo margen → Eliminar o reformular

DATOS ACTUALES DE PIG BROTHERS:
${JSON.stringify(ctx, null, 2)}

REGLAS:
- Responde en español, máximo 300 palabras
- SIEMPRE incluye números: costo estimado, food cost %, margen esperado
- Cuando sugieras nuevos productos, detalla los ingredientes y cantidades
- Clasifica cada sugerencia según la matriz (Star, Plowhorse, Puzzle, Dog)
- Si no tienes datos suficientes para calcular, indícalo claramente`,
  },

  sales_analyst: {
    id: 'sales_analyst',
    name: 'Analista de Ventas',
    emoji: '📊',
    color: '#6366f1', // indigo
    description: 'Interpreta datos de forma clara y accionable',
    suggestions: (ctx) => {
      const sugs = [
        '¿Cómo está el negocio este mes? Explícamelo simple',
        '¿Cuáles son mis 3 productos más rentables y por qué?',
        '¿Qué debería hacer para mejorar mi utilidad?',
        'Dame un resumen ejecutivo de mi operación',
      ];
      if (ctx.kpis_mes?.utilidad_operativa_estimada < 0)
        sugs.push('Mi utilidad es negativa — ¿qué está pasando?');
      if (ctx.recetas_bajo_objetivo?.length > 0)
        sugs.push(`Tengo ${ctx.recetas_bajo_objetivo.length} platos sobre el food cost objetivo`);
      return sugs.slice(0, 5);
    },
    systemPrompt: (ctx) => `Eres el ANALISTA DE VENTAS de Pig Brothers BBQ. Tu especialidad es traducir números en INSIGHTS CLAROS.

PERSONALIDAD:
- Hablas como un amigo que entiende de negocios
- Evitas jerga técnica, usas lenguaje simple
- Das contexto: "esto es bueno porque..." o "esto es preocupante porque..."
- Priorizas lo importante: qué está funcionando y qué no

TU MISIÓN:
1. Explicar el estado del negocio de forma clara y entendible
2. Identificar tendencias y patrones en ventas
3. Señalar productos estrella y productos problemáticos
4. Dar recomendaciones accionables y específicas
5. Comparar con benchmarks de la industria (food cost ~28-32%, labor ~25-30%)

FORMATO DE RESPUESTA:
- Usa analogías simples cuando sea útil
- Incluye emojis para hacer la información más digerible
- Separa claramente: Lo Bueno ✅, Lo Preocupante ⚠️, Acción Recomendada 🎯
- Si hay números, redondéalos y dales contexto

BENCHMARKS DE REFERENCIA:
- Food Cost ideal: 28-32%
- Prime Cost (food + labor): 55-65%
- Margen bruto: 65-72%
- Utilidad operativa: 10-15%

DATOS ACTUALES DE PIG BROTHERS:
${JSON.stringify(ctx, null, 2)}

REGLAS:
- Responde en español, máximo 250 palabras
- NO uses tablas complejas, prefiere listas simples
- Siempre termina con 1-2 acciones concretas
- Si algo está bien, celébralo; si algo está mal, sé honesto pero constructivo
- Usa comparaciones: "mejor que el promedio", "por debajo de lo ideal"`,
  },
};

const AIAssistant = ({ insumos, subrecetas, recetas, fixedCosts }) => {
  const C = window.PB_CALC;
  const [open, setOpen] = React.useState(false);
  const [activeAgent, setActiveAgent] = React.useState('sales_analyst');
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const scrollRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const agent = AGENTS[activeAgent];

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

    // Análisis de matriz de ingeniería de menú
    const avgMargin = all.reduce((a, x) => a + x.margen_pct, 0) / Math.max(all.length, 1);
    const avgSales = all.reduce((a, x) => a + x.ventas_mensuales, 0) / Math.max(all.length, 1);
    
    const menuMatrix = all.map(r => {
      const highMargin = r.margen_pct >= avgMargin;
      const highSales = r.ventas_mensuales >= avgSales;
      let classification;
      if (highMargin && highSales) classification = 'STAR';
      else if (!highMargin && highSales) classification = 'PLOWHORSE';
      else if (highMargin && !highSales) classification = 'PUZZLE';
      else classification = 'DOG';
      return { nombre: r.nombre, clasificacion: classification, margen_pct: r.margen_pct, ventas: r.ventas_mensuales };
    });

    return {
      negocio: 'Pig Brothers BBQ — restaurante BBQ, moneda USD',
      kpis_mes: {
        ingreso_total: +safeRev.toFixed(0),
        food_cost_blended_pct: +((totalIng / safeRev) * 100).toFixed(1),
        utilidad_total_variable: +totalMar.toFixed(0),
        costos_fijos_mes: +totalFijos.toFixed(0),
        utilidad_operativa_estimada: +(totalMar - totalFijos).toFixed(0),
        platos_vendidos_total: all.reduce((a, x) => a + x.ventas_mensuales, 0),
        ticket_promedio: +(safeRev / Math.max(all.reduce((a, x) => a + x.ventas_mensuales, 0), 1)).toFixed(2),
      },
      matriz_menu: {
        stars: menuMatrix.filter(m => m.clasificacion === 'STAR').map(m => m.nombre),
        plowhorses: menuMatrix.filter(m => m.clasificacion === 'PLOWHORSE').map(m => m.nombre),
        puzzles: menuMatrix.filter(m => m.clasificacion === 'PUZZLE').map(m => m.nombre),
        dogs: menuMatrix.filter(m => m.clasificacion === 'DOG').map(m => m.nombre),
        margen_promedio: +avgMargin.toFixed(1),
        ventas_promedio: +avgSales.toFixed(0),
      },
      personal: (fixedCosts.staff || []).map(s => ({
        puesto: s.role,
        salario: s.salary,
        horas_mes: s.dailyHours * 6 * 4,
        costo_hora: +(s.salary / Math.max(s.dailyHours * 6 * 4, 1)).toFixed(2),
      })),
      recetas: all,
      por_categoria: categorias,
      insumos_disponibles: insumos
        .filter(i => i.cost > 0)
        .map(i => ({ 
          nombre: i.name, 
          costo_por_unidad: +(i.cost / i.yield).toFixed(4), 
          unidad: i.unit, 
          categoria: i.category,
          yield: i.yield,
        })),
      insumos_mas_caros: insumos
        .filter(i => i.cost > 0)
        .sort((a, b) => (b.cost / b.yield) - (a.cost / a.yield))
        .slice(0, 10)
        .map(i => ({ nombre: i.name, costo_por_unidad: +(i.cost / i.yield).toFixed(4), unidad: i.unit, categoria: i.category })),
      insumos_mas_baratos: insumos
        .filter(i => i.cost > 0)
        .sort((a, b) => (a.cost / a.yield) - (b.cost / b.yield))
        .slice(0, 15)
        .map(i => ({ nombre: i.name, costo_por_unidad: +(i.cost / i.yield).toFixed(4), unidad: i.unit, categoria: i.category })),
      subrecetas_disponibles: subrecetas.map(s => ({
        nombre: s.name,
        categoria: s.category,
        yield: s.yield,
        yield_unit: s.yieldUnit,
      })),
      recetas_bajo_objetivo: all.filter(r => r.sobre_objetivo).map(r => r.nombre),
      recetas_sin_ventas: all.filter(r => r.ventas_mensuales === 0).map(r => r.nombre),
      top_5_por_utilidad: all.sort((a, b) => b.utilidad_mensual - a.utilidad_mensual).slice(0, 5).map(r => ({ nombre: r.nombre, utilidad: r.utilidad_mensual })),
      top_5_por_margen: all.sort((a, b) => b.margen_pct - a.margen_pct).slice(0, 5).map(r => ({ nombre: r.nombre, margen_pct: r.margen_pct })),
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
      const system = agent.systemPrompt(ctx);

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
      setMessages(prev => [...prev, { role: 'assistant', content: data.content, agentId: activeAgent }]);
    } catch (e) {
      setError(e.message.includes('ANTHROPIC_API_KEY')
        ? 'Falta configurar ANTHROPIC_API_KEY en Railway → Variables'
        : 'Error conectando con el asistente: ' + e.message);
    }
    setLoading(false);
  };

  const switchAgent = (agentId) => {
    if (agentId !== activeAgent) {
      setActiveAgent(agentId);
      setMessages([]);
      setError('');
    }
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
        background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)', color: '#fff', border: 0,
        boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
        display: 'grid', placeItems: 'center', cursor: 'pointer',
        transition: 'transform 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      data-tip="Asesores IA"
    >
      <Icon name="sparkles" size={22} />
    </button>
  );

  // ── Panel ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      width: 440, height: 620,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, boxShadow: '0 20px 60px rgba(15,20,25,0.22)',
      zIndex: 90, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* Header con selector de agente */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        background: agent.color, color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center', fontSize: 18}}>
            {agent.emoji}
          </div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 13, fontWeight: 600}}>{agent.name}</div>
            <div style={{fontSize: 11, opacity: 0.75}}>{agent.description}</div>
          </div>
          <div style={{display: 'flex', gap: 4}}>
            {messages.length > 0 && (
              <button onClick={clearChat} style={{background: 'rgba(255,255,255,0.15)', border: 0, borderRadius: 6, color: '#fff', padding: '4px 8px', fontSize: 11, cursor: 'pointer'}}>
                Nueva
              </button>
            )}
            <button onClick={() => setOpen(false)} style={{background: 'rgba(255,255,255,0.15)', border: 0, borderRadius: 6, color: '#fff', width: 28, height: 28, display: 'grid', placeItems: 'center', cursor: 'pointer'}}>
              <Icon name="close" size={14} />
            </button>
          </div>
        </div>

        {/* Tabs de agentes */}
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.values(AGENTS).map(a => (
            <button
              key={a.id}
              onClick={() => switchAgent(a.id)}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 6,
                border: 0,
                background: activeAgent === a.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 11,
                fontWeight: activeAgent === a.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'background 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <span>{a.emoji}</span>
              <span>{a.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} style={{flex: 1, overflowY: 'auto', padding: '16px'}}>
        {messages.length === 0 && (
          <div>
            <div style={{fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6}}>
              {activeAgent === 'menu_engineer' 
                ? 'Soy tu ingeniero de menú. Te ayudo a diseñar productos rentables y optimizar tu carta usando los ingredientes que ya tienes.'
                : 'Soy tu analista de ventas. Te explico cómo va tu negocio de forma clara y te doy recomendaciones accionables.'
              }
            </div>
            <div style={{fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8, fontWeight: 600}}>
              Preguntas sugeridas
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              {agent.suggestions(buildContext()).map((s, i) => (
                <button key={i} onClick={() => ask(s)} style={{
                  textAlign: 'left', padding: '9px 12px',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 8, fontSize: 12, color: 'var(--text-2)',
                  cursor: 'pointer', lineHeight: 1.4,
                  transition: 'border-color 0.12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = agent.color}
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
              <div style={{fontSize: 10, color: 'var(--text-3)', marginBottom: 4, paddingLeft: 2, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4}}>
                <span>{AGENTS[msg.agentId || activeAgent]?.emoji}</span>
                <span>{AGENTS[msg.agentId || activeAgent]?.name}</span>
              </div>
            )}
            <div style={{
              maxWidth: '88%', padding: '9px 13px',
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
              fontSize: 13, lineHeight: 1.55,
              background: msg.role === 'user' ? agent.color : 'var(--surface-2)',
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
              <Dot delay={0} color={agent.color} /><Dot delay={150} color={agent.color} /><Dot delay={300} color={agent.color} />
            </div>
            <span style={{fontSize: 11, color: 'var(--text-3)'}}>
              {activeAgent === 'menu_engineer' ? 'Diseñando...' : 'Analizando...'}
            </span>
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
          placeholder={activeAgent === 'menu_engineer' 
            ? 'Pregunta sobre diseño de productos...' 
            : 'Pregunta sobre ventas y costos...'}
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
          style={{height: 52, paddingLeft: 14, paddingRight: 14, flexShrink: 0, background: agent.color, borderColor: agent.color}}
        >
          <Icon name="arrow-right" size={15} />
        </button>
      </div>
    </div>
  );
};

const Dot = ({ delay, color }) => (
  <span style={{
    width: 7, height: 7, borderRadius: '50%',
    background: color || 'var(--accent)', opacity: 0.4,
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
