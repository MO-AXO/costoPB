// Configuración — tasas de impuesto y comisión
const Configuracion = ({ config, setConfig }) => {
  const tasaImpuesto = config?.tasaImpuesto ?? 13;
  const tasaComision = config?.tasaComision ?? 3;

  const upd = (k, v) => {
    const num = parseFloat(v);
    setConfig({ ...config, [k]: isNaN(num) ? 0 : num });
  };

  const fl = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 14, fontFamily: 'var(--font-mono)' };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Configuración</h1>
          <div className="page-sub">Tasas y parámetros generales del negocio</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <div className="card-head">
          <div>
            <div className="card-title">Tasas para ventas</div>
            <div className="card-sub">Se aplican automáticamente al registrar una venta</div>
          </div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Impuesto */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
              <Icon name="trending" size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              Tasa de Impuesto
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number" min="0" max="100" step="0.1"
                value={tasaImpuesto}
                onChange={e => upd('tasaImpuesto', e.target.value)}
                style={{ ...fl, width: 120, textAlign: 'right' }}
              />
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)' }}>%</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
              Sobre el ingreso total de cada venta. Ej: para $100 de ingreso → ${(100 * tasaImpuesto / 100).toFixed(2)} de impuesto.
            </div>
          </div>

          {/* Comisión */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
              <Icon name="wallet" size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              Tasa de Comisión
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number" min="0" max="100" step="0.1"
                value={tasaComision}
                onChange={e => upd('tasaComision', e.target.value)}
                style={{ ...fl, width: 120, textAlign: 'right' }}
              />
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)' }}>%</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
              Sobre el ingreso total de cada venta. Ej: para $100 de ingreso → ${(100 * tasaComision / 100).toFixed(2)} de comisión.
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: 'var(--surface-sunk)', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
              Ejemplo con $100.00 de ingreso
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-2)' }}>Ingreso Total</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>$100.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--bad)' }}>− Comisión ({tasaComision}%)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--bad)' }}>
                  -${(100 * tasaComision / 100).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--warn)' }}>− Impuesto ({tasaImpuesto}%)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--warn)' }}>
                  -${(100 * tasaImpuesto / 100).toFixed(2)}
                </span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ fontWeight: 600, color: 'var(--good)' }}>Ingreso Neto</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--good)' }}>
                  ${(100 - (100 * tasaComision / 100) - (100 * tasaImpuesto / 100)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="hint">
            <b>Nota:</b> Al registrar una venta, la comisión y el impuesto se calculan automáticamente con estas tasas. Puedes ajustar los montos manualmente en cada registro si es necesario.
          </div>
        </div>
      </div>
    </div>
  );
};

window.Configuracion = Configuracion;
