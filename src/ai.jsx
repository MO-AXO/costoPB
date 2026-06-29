// Pig Brothers — Sistema de Agentes IA Especializados
// Página completa con historial de conversaciones y categorización de estrategias

const AGENTS = {
  menu_engineer: {
    id: 'menu_engineer',
    name: 'Ingeniero de Menú',
    emoji: '🧪',
    color: '#10b981',
    description: 'Diseña productos de alta rentabilidad',
    suggestions: (ctx) => [
      '¿Qué combinación de ingredientes maximiza el margen?',
      '¿Cómo puedo crear un nuevo plato con food cost bajo 25%?',
      'Sugiere 3 nuevos productos usando ingredientes que ya tengo',
      '¿Qué insumos baratos están subutilizados?',
      'Diseña un combo rentable con pulled pork',
    ],
    systemPrompt: (ctx) => `Eres el INGENIERO DE MENÚ de Pig Brothers BBQ. Diseñas productos rentables de forma CLARA y SIMPLE.

ESTILO DE RESPUESTA:
- Habla como un chef consultor amigable, no como un robot
- NUNCA uses tablas markdown (|---|---|)
- Usa listas simples con viñetas (•) o números
- Máximo 200 palabras por respuesta
- Ve al grano: qué hacer, cuánto cuesta, cuánto ganas

FORMATO PARA NUEVOS PRODUCTOS:
📦 [Nombre del producto]

Ingredientes:
• Ingrediente 1 — cantidad — $X.XX
• Ingrediente 2 — cantidad — $X.XX
• Total ingredientes: $X.XX

Números clave:
• Costo total: $X.XX
• Precio sugerido: $X.XX  
• Food cost: XX%
• Ganancia por unidad: $X.XX

Por qué funciona: [1-2 oraciones]

CLASIFICACIÓN MATRIZ:
⭐ STAR = Vende mucho + Buen margen (promocionar)
🐴 PLOWHORSE = Vende mucho + Bajo margen (subir precio)
🧩 PUZZLE = Vende poco + Buen margen (mejorar marketing)
🐕 DOG = Vende poco + Bajo margen (eliminar)

DATOS DE PIG BROTHERS:
${JSON.stringify(ctx, null, 2)}

REGLAS:
- Sé directo y práctico
- Redondea números (no $3.3247, mejor $3.32)
- Si algo está mal en los datos, dilo claro pero sin alarmar
- Siempre termina con UNA acción concreta`,
  },

  sales_analyst: {
    id: 'sales_analyst',
    name: 'Analista de Ventas',
    emoji: '📊',
    color: '#6366f1',
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
    systemPrompt: (ctx) => `Eres el ANALISTA DE VENTAS de Pig Brothers BBQ. Explicas números de forma SIMPLE y CLARA.

ESTILO DE RESPUESTA:
- Habla como un amigo que sabe de negocios
- NUNCA uses tablas markdown (|---|---|)
- Usa listas simples con viñetas (•)
- Máximo 180 palabras por respuesta
- Redondea todo (no $1,234.56, mejor $1,235)

FORMATO ESTÁNDAR:

✅ Lo bueno:
• Punto positivo 1
• Punto positivo 2

⚠️ Ojo con esto:
• Problema o riesgo 1
• Problema o riesgo 2

🎯 Qué hacer:
• Acción concreta 1
• Acción concreta 2 (opcional)

BENCHMARKS (para comparar):
• Food Cost ideal: 28-32%
• Margen bruto normal: 65-72%
• Si está mejor que esto → "vas bien"
• Si está peor → "hay que mejorar"

DATOS DE PIG BROTHERS:
${JSON.stringify(ctx, null, 2)}

REGLAS:
- Sé honesto pero no alarmista
- Da contexto: "esto significa que..."
- Si los datos están incompletos, dilo
- Siempre termina con algo que puedan HACER, no solo saber
- Usa números redondeados y porcentajes claros`,
  },
};

const STRATEGY_CATEGORIES = [
  { id: 'pricing', name: 'Estrategias de Precio', emoji: '💰', color: '#f59e0b' },
  { id: 'menu', name: 'Diseño de Menú', emoji: '📋', color: '#10b981' },
  { id: 'costs', name: 'Reducción de Costos', emoji: '📉', color: '#ef4444' },
  { id: 'sales', name: 'Aumento de Ventas', emoji: '📈', color: '#3b82f6' },
  { id: 'operations', name: 'Operaciones', emoji: '⚙️', color: '#8b5cf6' },
  { id: 'other', name: 'Otras', emoji: '📌', color: '#6b7280' },
];

// ─── Página completa de Asesores IA ─────────────────────────────────────────
const AIPage = ({ insumos, subrecetas, recetas, fixedCosts, conversations, setConversations }) => {
  const C = window.PB_CALC;
  const [activeAgent, setActiveAgent] = React.useState('sales_analyst');
  const [currentConvId, setCurrentConvId] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [saveName, setSaveName] = React.useState('');
  const [saveCategory, setSaveCategory] = React.useState('other');
  const [filterAgent, setFilterAgent] = React.useState('all');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const scrollRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const agent = AGENTS[activeAgent];
  const convList = conversations || [];

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // ── Construye contexto rico ─────────────────────────────────────────────────
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
      },
      recetas: all,
      por_categoria: categorias,
      insumos_disponibles: insumos.filter(i => i.cost > 0).map(i => ({ 
        nombre: i.name, 
        costo_por_unidad: +(i.cost / i.yield).toFixed(4), 
        unidad: i.unit, 
        categoria: i.category,
      })),
      insumos_mas_baratos: insumos
        .filter(i => i.cost > 0)
        .sort((a, b) => (a.cost / a.yield) - (b.cost / b.yield))
        .slice(0, 15)
        .map(i => ({ nombre: i.name, costo_por_unidad: +(i.cost / i.yield).toFixed(4), unidad: i.unit })),
      subrecetas_disponibles: subrecetas.map(s => ({ nombre: s.name, categoria: s.category, yield: s.yield })),
      recetas_bajo_objetivo: all.filter(r => r.sobre_objetivo).map(r => r.nombre),
      top_5_por_utilidad: all.sort((a, b) => b.utilidad_mensual - a.utilidad_mensual).slice(0, 5).map(r => ({ nombre: r.nombre, utilidad: r.utilidad_mensual })),
    };
  };

  // ── Enviar mensaje ──────────────────────────────────────────────────────────
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

  // ── Guardar conversación ────────────────────────────────────────────────────
  const saveConversation = () => {
    if (!saveName.trim() || messages.length === 0) return;
    const newConv = {
      id: Date.now().toString(),
      name: saveName.trim(),
      category: saveCategory,
      agentId: activeAgent,
      messages: messages,
      createdAt: new Date().toISOString(),
    };
    setConversations(prev => [newConv, ...(prev || [])]);
    setShowSaveModal(false);
    setSaveName('');
    setSaveCategory('other');
  };

  // ── Cargar conversación guardada ────────────────────────────────────────────
  const loadConversation = (conv) => {
    setCurrentConvId(conv.id);
    setActiveAgent(conv.agentId);
    setMessages(conv.messages);
  };

  // ── Eliminar conversación ───────────────────────────────────────────────────
  const deleteConversation = (id) => {
    setConversations(prev => (prev || []).filter(c => c.id !== id));
    if (currentConvId === id) {
      setCurrentConvId(null);
      setMessages([]);
    }
  };

  // ── Nueva conversación ──────────────────────────────────────────────────────
  const newConversation = () => {
    setCurrentConvId(null);
    setMessages([]);
    setError('');
  };

  // ── Filtrar conversaciones ──────────────────────────────────────────────────
  const filteredConvs = convList.filter(c => {
    if (filterAgent !== 'all' && c.agentId !== filterAgent) return false;
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    return true;
  });

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Asesores IA</h1>
          <div className="page-sub">Consulta estrategias y guarda las mejores ideas</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* ── Panel izquierdo: Historial ─────────────────────────────────────── */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <div className="card-head">
            <div className="card-title">Conversaciones guardadas</div>
            <button className="btn btn-sm btn-primary" onClick={newConversation}>
              <Icon name="plus" size={12} /> Nueva
            </button>
          </div>
          
          {/* Filtros */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <select 
              value={filterAgent} 
              onChange={e => setFilterAgent(e.target.value)}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: 'var(--surface)' }}
            >
              <option value="all">Todos los agentes</option>
              {Object.values(AGENTS).map(a => (
                <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
              ))}
            </select>
            <select 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: 'var(--surface)' }}
            >
              <option value="all">Todas las categorías</option>
              {STRATEGY_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Lista de conversaciones */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filteredConvs.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                No hay conversaciones guardadas
              </div>
            ) : (
              filteredConvs.map(conv => {
                const cat = STRATEGY_CATEGORIES.find(c => c.id === conv.category) || STRATEGY_CATEGORIES[5];
                const ag = AGENTS[conv.agentId] || AGENTS.sales_analyst;
                return (
                  <div 
                    key={conv.id}
                    onClick={() => loadConversation(conv)}
                    style={{ 
                      padding: '12px 16px', 
                      borderBottom: '1px solid var(--border)', 
                      cursor: 'pointer',
                      background: currentConvId === conv.id ? 'var(--accent-soft)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (currentConvId !== conv.id) e.currentTarget.style.background = 'var(--surface-2)'; }}
                    onMouseLeave={e => { if (currentConvId !== conv.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.name}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                        style={{ background: 'transparent', border: 0, color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-3)' }}>
                      <span style={{ background: ag.color + '20', color: ag.color, padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>
                        {ag.emoji} {ag.name}
                      </span>
                      <span>{formatDate(conv.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Panel derecho: Chat ────────────────────────────────────────────── */}
        <div className="card" style={{ minHeight: 600, display: 'flex', flexDirection: 'column' }}>
          
          {/* Header con selector de agente */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
            {Object.values(AGENTS).map(a => (
              <button
                key={a.id}
                onClick={() => { setActiveAgent(a.id); if (!currentConvId) setMessages([]); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: activeAgent === a.id ? `2px solid ${a.color}` : '1px solid var(--border)',
                  background: activeAgent === a.id ? a.color + '15' : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 20 }}>{a.emoji}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: activeAgent === a.id ? a.color : 'var(--text)' }}>
                    {a.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.description}</div>
                </div>
              </button>
            ))}
            
            <div style={{ flex: 1 }} />
            
            {messages.length > 0 && (
              <button 
                className="btn btn-sm"
                onClick={() => setShowSaveModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Icon name="save" size={13} /> Guardar estrategia
              </button>
            )}
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {messages.length === 0 && (
              <div>
                <div style={{ 
                  background: agent.color + '10', 
                  border: `1px solid ${agent.color}30`,
                  borderRadius: 12, 
                  padding: 20, 
                  marginBottom: 20 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>{agent.emoji}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: agent.color }}>{agent.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{agent.description}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                    {activeAgent === 'menu_engineer' 
                      ? 'Te ayudo a diseñar productos rentables y optimizar tu carta usando los ingredientes que ya tienes. Puedo calcular costos, márgenes y clasificar productos según la matriz de ingeniería de menú.'
                      : 'Te explico cómo va tu negocio de forma clara y te doy recomendaciones accionables. Comparo tus números con benchmarks de la industria y te ayudo a tomar mejores decisiones.'
                    }
                  </div>
                </div>
                
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 12, letterSpacing: '0.04em' }}>
                  PREGUNTAS SUGERIDAS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {agent.suggestions(buildContext()).map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => ask(s)} 
                      style={{
                        textAlign: 'left', 
                        padding: '12px 14px',
                        background: 'var(--surface-2)', 
                        border: '1px solid var(--border)',
                        borderRadius: 8, 
                        fontSize: 13, 
                        color: 'var(--text-2)',
                        cursor: 'pointer', 
                        lineHeight: 1.5,
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = agent.color; e.currentTarget.style.background = 'var(--surface)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{AGENTS[msg.agentId || activeAgent]?.emoji}</span>
                    <span style={{ fontWeight: 500 }}>{AGENTS[msg.agentId || activeAgent]?.name}</span>
                  </div>
                )}
                <div style={{
                  maxWidth: '85%', 
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                  fontSize: 14, 
                  lineHeight: 1.6,
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Dot delay={0} color={agent.color} />
                  <Dot delay={150} color={agent.color} />
                  <Dot delay={300} color={agent.color} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  {activeAgent === 'menu_engineer' ? 'Diseñando estrategia...' : 'Analizando datos...'}
                </span>
              </div>
            )}

            {error && (
              <div style={{
                padding: '12px 16px', 
                borderRadius: 8, 
                marginTop: 10,
                background: 'var(--bad-soft)', 
                border: '1px solid var(--bad)',
                fontSize: 13, 
                color: 'var(--bad)', 
                lineHeight: 1.5,
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
              placeholder={activeAgent === 'menu_engineer' 
                ? '¿Qué producto quieres diseñar o analizar?' 
                : '¿Qué quieres saber sobre tu negocio?'}
              rows={2}
              disabled={loading}
              style={{
                flex: 1, 
                padding: '12px 14px', 
                borderRadius: 10,
                border: '1px solid var(--border)', 
                background: 'var(--surface-2)',
                outline: 0, 
                fontSize: 14, 
                resize: 'none', 
                lineHeight: 1.5,
                fontFamily: 'var(--font-sans)',
              }}
            />
            <button
              className="btn btn-primary"
              onClick={() => ask(input)}
              disabled={loading || !input.trim()}
              style={{ height: 56, paddingLeft: 20, paddingRight: 20, background: agent.color, borderColor: agent.color }}
            >
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal guardar conversación ───────────────────────────────────────── */}
      {showSaveModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} onClick={() => setShowSaveModal(false)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 420, background: 'var(--surface)', borderRadius: 12,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', zIndex: 101, padding: 24,
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Guardar estrategia</div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Nombre</label>
              <input
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="Ej: Nuevo combo rentable con brisket"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
              />
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Categoría</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {STRATEGY_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSaveCategory(cat.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px', borderRadius: 8,
                      border: saveCategory === cat.id ? `2px solid ${cat.color}` : '1px solid var(--border)',
                      background: saveCategory === cat.id ? cat.color + '15' : 'var(--surface)',
                      cursor: 'pointer', fontSize: 13,
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span style={{ fontWeight: saveCategory === cat.id ? 600 : 400 }}>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowSaveModal(false)}>Cancelar</button>
              <button 
                className="btn btn-primary" 
                onClick={saveConversation}
                disabled={!saveName.trim()}
              >
                Guardar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Dot = ({ delay, color }) => (
  <span style={{
    width: 8, height: 8, borderRadius: '50%',
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

window.AIPage = AIPage;
