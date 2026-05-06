// Pig Brothers — inventario real con presentación, unidad de compra y precio por unidad
// cost = precio por unidad de la columna "unit" (g, ml, pza, lb)
// yield = rendimiento tras limpieza/cocción (1.00 si no hay merma)

const SEED_INSUMOS = [

  // ===== PROTEÍNAS =====
  // Precio por lb (de la tabla: precio de compra por presentación ÷ lbs por presentación)
  // yield = merma de limpieza según hoja de producción (no incluye pérdida por cocción)
  { id: 'i1',  name: 'Nuca de Cerdo',          category: 'Proteína', unit: 'lb', cost: 2.35,  supplier: 'Local', yield: 0.96, lastChange: '0.0%', stock: 0 }, // 96% limpieza (imagen: 15961/16601)
  { id: 'i2',  name: 'Costillas Spare Ribs',   category: 'Proteína', unit: 'lb', cost: 2.40,  supplier: 'Local', yield: 0.91, lastChange: '0.0%', stock: 0 }, // 91% limpieza (imagen: 5610/6174)
  { id: 'i3',  name: 'Pork Belly',             category: 'Proteína', unit: 'lb', cost: 2.00,  supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 }, // 100% (imagen: sin merma limpieza)
  { id: 'i4',  name: 'Pollo',                  category: 'Proteína', unit: 'lb', cost: 2.42,  supplier: 'Local', yield: 0.95, lastChange: '0.0%', stock: 0 }, // 95% limpieza (imagen: 6472/6810)
  // Tocino: $17.99 / 46 unidades → $0.391/pza
  { id: 'i5',  name: 'Tocino',                 category: 'Proteína', unit: 'pza', cost: 0.391,           supplier: 'Local', yield: 0.85, lastChange: '0.0%', stock: 0 },
  { id: 'i6',  name: 'Carne Molida',           category: 'Proteína', unit: 'lb', cost: 3.15,             supplier: 'Local', yield: 0.85, lastChange: '0.0%', stock: 0 },
  { id: 'i7',  name: 'Pavo',                   category: 'Proteína', unit: 'lb', cost: 2.10,             supplier: 'Local', yield: 0.65, lastChange: '0.0%', stock: 0 },
  { id: 'i8',  name: 'Chompi Pollo',           category: 'Proteína', unit: 'lb', cost: 2.39,             supplier: 'Local', yield: 0.70, lastChange: '0.0%', stock: 0 },

  // ===== PAN =====
  // Pan de Papa: $1.95 / 6 unidades → $0.325/pza; Pan de Pretzel: $0.45/pza
  { id: 'i9',  name: 'Pan de Papa',            category: 'Pan', unit: 'pza', cost: 0.325,                supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  { id: 'i10', name: 'Pan de Pretzel',         category: 'Pan', unit: 'pza', cost: 0.45,                 supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },

  // ===== VEGETALES =====
  // Unidad de compra en la imagen: algunos en Unidad (pza), otros en lb
  // Costo = precio de compra / presentación → costo por pza o por lb
  { id: 'i11', name: 'Cebolla Blanca',         category: 'Vegetal', unit: 'pza', cost: 0.125,            supplier: 'Local', yield: 0.90, lastChange: '0.0%', stock: 0 },
  { id: 'i12', name: 'Cebolla Morada',         category: 'Vegetal', unit: 'pza', cost: 0.20,             supplier: 'Local', yield: 0.90, lastChange: '0.0%', stock: 0 },
  { id: 'i13', name: 'Ajo (lb)',               category: 'Vegetal', unit: 'lb', cost: 3.50,              supplier: 'Local', yield: 0.85, lastChange: '0.0%', stock: 0 },
  { id: 'i14', name: 'Cebollín',               category: 'Vegetal', unit: 'pza', cost: 0.87,             supplier: 'Local', yield: 0.80, lastChange: '0.0%', stock: 0 },
  { id: 'i15', name: 'Remolacha',              category: 'Vegetal', unit: 'pza', cost: 0.25,             supplier: 'Local', yield: 0.85, lastChange: '0.0%', stock: 0 },
  // Chile Verde: $1.00 / 10 unidades → $0.10/pza
  { id: 'i16', name: 'Chile Verde',            category: 'Vegetal', unit: 'pza', cost: 0.10,             supplier: 'Local', yield: 0.90, lastChange: '0.0%', stock: 0 },
  { id: 'i17', name: 'Repollo Blanco',         category: 'Vegetal', unit: 'pza', cost: 1.50,             supplier: 'Local', yield: 0.85, lastChange: '0.0%', stock: 0 },
  { id: 'i18', name: 'Repollo Morado',         category: 'Vegetal', unit: 'pza', cost: 3.75,             supplier: 'Local', yield: 0.85, lastChange: '0.0%', stock: 0 },
  // Camote: $18.00 / 19.7 lb → $0.914/lb
  { id: 'i19', name: 'Camote',                 category: 'Vegetal', unit: 'lb', cost: 0.914,             supplier: 'Local', yield: 0.85, lastChange: '0.0%', stock: 0 },
  // Papas: $1.00 / 3 lb → $0.333/lb
  { id: 'i20', name: 'Papas',                  category: 'Vegetal', unit: 'lb', cost: 0.333,             supplier: 'Local', yield: 0.85, lastChange: '0.0%', stock: 0 },
  // Limones: $1.00 / 12 unidades → $0.083/pza
  { id: 'i21', name: 'Limones',                category: 'Vegetal', unit: 'pza', cost: 0.083,            supplier: 'Local', yield: 0.50, lastChange: '0.0%', stock: 0 },
  { id: 'i22', name: 'Cilantro',               category: 'Vegetal', unit: 'pza', cost: 1.00,             supplier: 'Local', yield: 0.80, lastChange: '0.0%', stock: 0 },
  { id: 'i23', name: 'Jalapeños',              category: 'Vegetal', unit: 'pza', cost: 1.00,             supplier: 'Local', yield: 0.90, lastChange: '0.0%', stock: 0 },
  // Tamarindo: $1.50 / lb
  { id: 'i24', name: 'Tamarindo',              category: 'Vegetal', unit: 'lb', cost: 1.50,              supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Maracuyá: $22.00 / 50 unidades → $0.44/pza
  { id: 'i25', name: 'Maracuyá',               category: 'Vegetal', unit: 'pza', cost: 0.44,             supplier: 'Local', yield: 0.55, lastChange: '0.0%', stock: 0 },
  { id: 'i26', name: 'Romero',                 category: 'Vegetal', unit: 'pza', cost: 1.00,             supplier: 'Local', yield: 0.90, lastChange: '0.0%', stock: 0 },
  // Tomates: $1.00 / 16 unidades → $0.0625/pza
  { id: 'i27', name: 'Tomates',                category: 'Vegetal', unit: 'pza', cost: 0.0625,           supplier: 'Local', yield: 0.90, lastChange: '0.0%', stock: 0 },
  { id: 'i28', name: 'Apio',                   category: 'Vegetal', unit: 'pza', cost: 1.25,             supplier: 'Local', yield: 0.85, lastChange: '0.0%', stock: 0 },
  { id: 'i29', name: 'Ejotes',                 category: 'Vegetal', unit: 'pza', cost: 1.00,             supplier: 'Local', yield: 0.90, lastChange: '0.0%', stock: 0 },
  // Zanahoria: $1.00 / 4 unidades → $0.25/pza
  { id: 'i30', name: 'Zanahoria',              category: 'Vegetal', unit: 'pza', cost: 0.25,             supplier: 'Local', yield: 0.90, lastChange: '0.0%', stock: 0 },
  // Arúgula: $2.65 / 113 g → $0.02345/g
  { id: 'i31', name: 'Arúgula',                category: 'Vegetal', unit: 'g', cost: 0.02345,            supplier: 'Local', yield: 0.90, lastChange: '0.0%', stock: 0 },
  // Rábanos: $2.85 / 2225 g → $0.00128/g
  { id: 'i32', name: 'Rábanos',                category: 'Vegetal', unit: 'g', cost: 0.00128,            supplier: 'Local', yield: 0.90, lastChange: '0.0%', stock: 0 },

  // ===== PRODUCTOS ENLATADOS / EMPAQUETADOS =====
  // cost = precio de compra / cantidad en gramos → precio por gramo
  // Maíz Dulce: $7.91 / 3000 g → $0.00264/g
  { id: 'i33', name: 'Maíz Dulce',             category: 'Enlatado', unit: 'g', cost: 0.00264,           supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Chipotles: $2.75 / 380 g → $0.00724/g
  { id: 'i34', name: 'Chipotles en adobo',     category: 'Enlatado', unit: 'g', cost: 0.00724,           supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Higos: $3.27 / 320 g → $0.01022/g
  { id: 'i35', name: 'Higos',                  category: 'Enlatado', unit: 'g', cost: 0.01022,           supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Coditos: $0.53 / 200 g → $0.00265/g
  { id: 'i36', name: 'Coditos (pasta)',         category: 'Enlatado', unit: 'g', cost: 0.00265,           supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Aceitunas: $1.28 / 185 g → $0.00692/g
  { id: 'i37', name: 'Aceitunas',              category: 'Enlatado', unit: 'g', cost: 0.00692,           supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Alcaparras: $1.25 / 180 g → $0.00694/g
  { id: 'i38', name: 'Alcaparras',             category: 'Enlatado', unit: 'g', cost: 0.00694,           supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },

  // ===== PRODUCTOS LÍQUIDOS =====
  // unit: ml, cost = precio de compra / ml
  // Salsa Inglesa: $6.00 / 3650 ml → $0.001644/ml
  { id: 'i39', name: 'Salsa Inglesa (Worcestershire)', category: 'Líquido', unit: 'ml', cost: 0.001644,  supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Salsa de Soya: $6.25 / 3650 ml → $0.001712/ml
  { id: 'i40', name: 'Salsa de Soya',          category: 'Líquido', unit: 'ml', cost: 0.001712,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Vinagre de Manzana: $2.55 / 3650 ml → $0.000699/ml
  { id: 'i41', name: 'Vinagre de Manzana',     category: 'Líquido', unit: 'ml', cost: 0.000699,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Vinagre Blanco: $2.70 / 3800 ml → $0.000711/ml
  { id: 'i42', name: 'Vinagre Blanco',         category: 'Líquido', unit: 'ml', cost: 0.000711,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Cerveza Stella: $1.50 / 330 ml → $0.004545/ml
  { id: 'i43', name: 'Cerveza Stella',         category: 'Líquido', unit: 'ml', cost: 0.004545,          supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Cerveza Regia: $1.04 / 355 ml → $0.002930/ml
  { id: 'i44', name: 'Cerveza Regia',          category: 'Líquido', unit: 'ml', cost: 0.002930,          supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Ron: $16.79 / 1750 ml → $0.009594/ml
  { id: 'i45', name: 'Ron',                    category: 'Líquido', unit: 'ml', cost: 0.009594,          supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Aceite de Fritura: $28.00 / ml (presentación no especificada, costo referencial)
  { id: 'i46', name: 'Aceite de Fritura',      category: 'Líquido', unit: 'ml', cost: 0.028,             supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Vino de Cocina: $4.96 / 750 ml → $0.006613/ml
  { id: 'i47', name: 'Vino de Cocina',         category: 'Líquido', unit: 'ml', cost: 0.006613,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },

  // ===== SALSAS PRE-FABRICADAS =====
  // unit: g, cost = precio / gramos
  // Ketchup: $6.19 / 4100 g → $0.001510/g
  { id: 'i48', name: 'Ketchup',                category: 'Salsa Pre-fab', unit: 'g', cost: 0.001510,     supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Salsa BBQ: $10.49 / 2300 g → $0.004561/g
  { id: 'i49', name: 'Salsa BBQ comercial',    category: 'Salsa Pre-fab', unit: 'g', cost: 0.004561,     supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Mayonesa: $10.71 / 3000 g → $0.003570/g
  { id: 'i50', name: 'Mayonesa',               category: 'Salsa Pre-fab', unit: 'g', cost: 0.003570,     supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Mostaza: $5.20 / 3500 g → $0.001486/g
  { id: 'i51', name: 'Mostaza',                category: 'Salsa Pre-fab', unit: 'g', cost: 0.001486,     supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Mostaza Dijon: $2.75 / 340 g → $0.008088/g
  { id: 'i52', name: 'Mostaza Dijon',          category: 'Salsa Pre-fab', unit: 'g', cost: 0.008088,     supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Yogurt: $3.20 / 1000 g → $0.003200/g
  { id: 'i53', name: 'Yogurt',                 category: 'Salsa Pre-fab', unit: 'g', cost: 0.003200,     supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },

  // ===== ENDULZANTES LÍQUIDOS =====
  // Miel: $18.00 / 5200 g → $0.003462/g
  { id: 'i54', name: 'Miel',                   category: 'Endulzante', unit: 'g', cost: 0.003462,        supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Panela: $1.50 / pza (750g) → $0.002/g; usamos pza porque así compran
  { id: 'i55', name: 'Panela',                 category: 'Endulzante', unit: 'pza', cost: 1.50,          supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },

  // ===== PRODUCTOS SECOS DE MERCADO (especias) =====
  // unit: g, cost = precio / cantidad en gramos
  // Chile Ancho: $7.00 / 453.6 g → $0.01543/g
  { id: 'i56', name: 'Chile Ancho',            category: 'Especia', unit: 'g', cost: 0.01543,            supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Chile Guaco: $6.00 / 453.6 g → $0.01323/g
  { id: 'i57', name: 'Chile Guaco',            category: 'Especia', unit: 'g', cost: 0.01323,            supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Semilla de mostaza: $6.00 / 907 g → $0.00661/g
  { id: 'i58', name: 'Semilla de Mostaza',     category: 'Especia', unit: 'g', cost: 0.00661,            supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Pimienta Gorda: $6.00 / 385.5 g → $0.01557/g
  { id: 'i59', name: 'Pimienta Gorda',         category: 'Especia', unit: 'g', cost: 0.01557,            supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Clavo de olor: $6.00 / 394.5 g → $0.01520/g
  { id: 'i60', name: 'Clavo de Olor',          category: 'Especia', unit: 'g', cost: 0.01520,            supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Pepitoria: $2.50 / 454 g → $0.00551/g
  { id: 'i61', name: 'Pepitoria',              category: 'Especia', unit: 'g', cost: 0.00551,            supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Comino: $0.81 / 20 g → $0.04050/g
  { id: 'i62', name: 'Comino',                 category: 'Especia', unit: 'g', cost: 0.04050,            supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Orégano: $5.69 / 141 g → $0.04035/g
  { id: 'i63', name: 'Orégano',                category: 'Especia', unit: 'g', cost: 0.04035,            supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Canela: $2.45 / 50 g → $0.04900/g
  { id: 'i64', name: 'Canela',                 category: 'Especia', unit: 'g', cost: 0.04900,            supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Laurel: $1.27 / 5.67 g → $0.22398/g
  { id: 'i65', name: 'Laurel',                 category: 'Especia', unit: 'g', cost: 0.22398,            supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Chicharra: $1.25 / 442 g → $0.00283/g
  { id: 'i66', name: 'Chicharra',              category: 'Especia', unit: 'g', cost: 0.00283,            supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },

  // ===== SAZONADORES / HARINAS =====
  // unit: g, cost = precio / cantidad en gramos
  // Pimienta: $7.69 / 453 g → $0.01698/g
  { id: 'i67', name: 'Pimienta Negra',         category: 'Sazonador', unit: 'g', cost: 0.01698,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Sal: $0.20 / 400 g → $0.00050/g
  { id: 'i68', name: 'Sal',                    category: 'Sazonador', unit: 'g', cost: 0.00050,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Ajo en polvo: $7.89 / 680.4 g → $0.01160/g
  { id: 'i69', name: 'Ajo en Polvo',           category: 'Sazonador', unit: 'g', cost: 0.01160,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Cebolla en polvo: $6.69 / 566.9 g → $0.01180/g
  { id: 'i70', name: 'Cebolla en Polvo',       category: 'Sazonador', unit: 'g', cost: 0.01180,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Paprika: $6.19 / 453 g → $0.01367/g
  { id: 'i71', name: 'Paprika',                category: 'Sazonador', unit: 'g', cost: 0.01367,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Azúcar: $2.68 / 2500 g → $0.00107/g
  { id: 'i72', name: 'Azúcar',                 category: 'Sazonador', unit: 'g', cost: 0.00107,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Pimienta Cayenne: $9.25 / 453.6 g → $0.02040/g
  { id: 'i73', name: 'Pimienta Cayenne',       category: 'Sazonador', unit: 'g', cost: 0.02040,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Chile en hojuelas: $9.99 / 340.2 g → $0.02937/g
  { id: 'i74', name: 'Chile en Hojuelas',      category: 'Sazonador', unit: 'g', cost: 0.02937,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Sazonador Papas Fritas: $9.85 / 1000 g → $0.00985/g
  { id: 'i75', name: 'Sazonador Papas Fritas', category: 'Sazonador', unit: 'g', cost: 0.00985,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Sazonador Pollo: $7.29 / 623.7 g → $0.01169/g
  { id: 'i76', name: 'Sazonador Pollo',        category: 'Sazonador', unit: 'g', cost: 0.01169,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Sazonador Italiano: $8.29 / 177 g → $0.04684/g
  { id: 'i77', name: 'Sazonador Italiano',     category: 'Sazonador', unit: 'g', cost: 0.04684,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Sal para curar: $13.99 / 907 g → $0.01542/g
  { id: 'i78', name: 'Sal para Curar',         category: 'Sazonador', unit: 'g', cost: 0.01542,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Almidón de papa: $3.98 / 1000 g → $0.00398/g
  { id: 'i79', name: 'Almidón de Papa',        category: 'Sazonador', unit: 'g', cost: 0.00398,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Bicarbonato: $1.30 / 227 g → $0.00573/g
  { id: 'i80', name: 'Bicarbonato',            category: 'Sazonador', unit: 'g', cost: 0.00573,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Eritorbato de sodio: $4.65 / 300 g → $0.01550/g
  { id: 'i81', name: 'Eritorbato de Sodio',    category: 'Sazonador', unit: 'g', cost: 0.01550,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Harina de Pancakes: $10.59 / 4530 g → $0.00234/g
  { id: 'i82', name: 'Harina de Pancakes',     category: 'Sazonador', unit: 'g', cost: 0.00234,          supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },

  // ===== LÁCTEOS =====
  // Crema: $2.20 / botella (660 ml) → $0.003333/ml; usamos pza (botella)
  { id: 'i83', name: 'Crema',                  category: 'Lácteo', unit: 'pza', cost: 2.20,              supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Queso Americano: $7.99 / 48 paquetes → $0.1665/pza (lámina)
  { id: 'i84', name: 'Queso Americano',        category: 'Lácteo', unit: 'pza', cost: 0.1665,            supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Queso Cheddar: $8.49 / 907 g → $0.00936/g
  { id: 'i85', name: 'Queso Cheddar',          category: 'Lácteo', unit: 'g', cost: 0.00936,             supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Queso Monterrey: $8.49 / 907 g → $0.00936/g
  { id: 'i86', name: 'Queso Monterrey',        category: 'Lácteo', unit: 'g', cost: 0.00936,             supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Queso Crema: $1.51 / 210 g → $0.00719/g
  { id: 'i87', name: 'Queso Crema',            category: 'Lácteo', unit: 'g', cost: 0.00719,             supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Leche: $1.70 / 1000 ml → $0.00170/ml
  { id: 'i88', name: 'Leche',                  category: 'Lácteo', unit: 'ml', cost: 0.00170,            supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Blue Cheese: $8.60 / 454 g → $0.01894/g
  { id: 'i89', name: 'Blue Cheese',            category: 'Lácteo', unit: 'g', cost: 0.01894,             supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Queso Mozzarella: $3.38 / 32 pza → $0.10563/pza (lámina)
  { id: 'i90', name: 'Queso Mozzarella',       category: 'Lácteo', unit: 'pza', cost: 0.10563,           supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },

  // ===== GRASAS =====
  // Margarina: $1.04 / 400 g → $0.00260/g
  { id: 'i91', name: 'Margarina',              category: 'Grasa', unit: 'g', cost: 0.00260,              supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Aceite de Girasol: $10.79 / 4600 ml → $0.00235/ml
  { id: 'i92', name: 'Aceite de Girasol',      category: 'Grasa', unit: 'ml', cost: 0.00235,             supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },

  // ===== PAPAS FRITAS =====
  // Papas Fritas: $59.00 / 16329.33 g → $0.000361/g
  { id: 'i93', name: 'Papas Fritas (precocidas)', category: 'Vegetal', unit: 'g', cost: 0.003613,        supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },

  // ===== DESECHABLES DELIVERY =====
  { id: 'i94', name: 'Caja Pig Burguer',       category: 'Empaque Delivery', unit: 'pza', cost: 0.20,    supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  { id: 'i95', name: 'Caja Papas Puercas',     category: 'Empaque Delivery', unit: 'pza', cost: 0.20,    supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  { id: 'i96', name: 'Caja BBQ Box',           category: 'Empaque Delivery', unit: 'pza', cost: 0.55,    supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  { id: 'i97', name: 'Contenedor CC/M&C',      category: 'Empaque Delivery', unit: 'pza', cost: 0.21,    supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Papel encerado: $3.50 / 1000 pzas → $0.0035/pza
  { id: 'i98', name: 'Papel Encerado',         category: 'Empaque Delivery', unit: 'pza', cost: 0.0035,  supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Sala de tomate: $23.99 / 1000 → $0.02399/pza
  { id: 'i99', name: 'Salsa de Tomate (sobre)', category: 'Empaque Delivery', unit: 'pza', cost: 0.02399, supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Servilleta: $3.50 / 1000 → $0.0035/pza
  { id: 'i100', name: 'Servilleta',            category: 'Empaque Delivery', unit: 'pza', cost: 0.0035,  supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Cup Aderezo: $18.39 / 500 → $0.03678/pza
  { id: 'i101', name: 'Cup Aderezo',           category: 'Empaque Delivery', unit: 'pza', cost: 0.03678, supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Stickers: $10.00 / 367 → $0.02725/pza
  { id: 'i102', name: 'Sticker',               category: 'Empaque Delivery', unit: 'pza', cost: 0.02725, supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Tenedor pequeño: $1.40 / 100 → $0.014/pza
  { id: 'i103', name: 'Tenedor Pequeño',       category: 'Empaque Delivery', unit: 'pza', cost: 0.014,   supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Cucharas pequeña: $1.65 / 100 → $0.0165/pza
  { id: 'i104', name: 'Cuchara Pequeña',       category: 'Empaque Delivery', unit: 'pza', cost: 0.0165,  supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  { id: 'i105', name: 'Bolsa de Gabacha #1',   category: 'Empaque Delivery', unit: 'pza', cost: 0.00,    supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  { id: 'i106', name: 'Bolsa de Gabacha #2',   category: 'Empaque Delivery', unit: 'pza', cost: 0.00,    supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  { id: 'i107', name: 'Bolsa de Gabacha #3',   category: 'Empaque Delivery', unit: 'pza', cost: 0.00,    supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  { id: 'i108', name: 'Bolsa de Vueltos',      category: 'Empaque Delivery', unit: 'pza', cost: 0.00,    supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Tenedor grande: $1.83 / 100 → $0.0183/pza
  { id: 'i109', name: 'Tenedor Grande',        category: 'Empaque Delivery', unit: 'pza', cost: 0.0183,  supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Cuchillo grande: $2.17 / 100 → $0.0217/pza
  { id: 'i110', name: 'Cuchillo Grande',       category: 'Empaque Delivery', unit: 'pza', cost: 0.0217,  supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },

  // ===== DESECHABLES EVENTOS Y BANQUETES =====
  // Tenedor grande: $1.83 / 100 → $0.0183/pza (igual que delivery)
  { id: 'i111', name: 'Bandeja Craft Regular', category: 'Empaque Evento', unit: 'pza', cost: 0.06,      supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  { id: 'i112', name: 'Bandeja Craft Pequeña', category: 'Empaque Evento', unit: 'pza', cost: 0.06,      supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Bandejas aluminio grandes: $22.49 / 15 → $1.499/pza
  { id: 'i113', name: 'Bandeja Aluminio Grande', category: 'Empaque Evento', unit: 'pza', cost: 1.499,   supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Bandejas aluminio pequeñas: $16.49 / 30 → $0.5497/pza
  { id: 'i114', name: 'Bandeja Aluminio Pequeña', category: 'Empaque Evento', unit: 'pza', cost: 0.5497, supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Depósito 250ml: $4.25 / 25 → $0.17/pza
  { id: 'i115', name: 'Depósito 250ml',        category: 'Empaque Evento', unit: 'pza', cost: 0.17,      supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Depósito 500ml: $5.00 / 25 → $0.20/pza
  { id: 'i116', name: 'Depósito 500ml',        category: 'Empaque Evento', unit: 'pza', cost: 0.20,      supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Bolsas de basura: $5.20 / 25 → $0.208/pza
  { id: 'i117', name: 'Bolsas de Basura',      category: 'Empaque Evento', unit: 'pza', cost: 0.208,     supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  { id: 'i118', name: 'Cuchillo Grande (evento)', category: 'Empaque Evento', unit: 'pza', cost: 0.022,  supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  { id: 'i119', name: 'Tenedor Grande (evento)', category: 'Empaque Evento', unit: 'pza', cost: 0.018,   supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  { id: 'i120', name: 'Cuchillo Grande (delivery)', category: 'Empaque Evento', unit: 'pza', cost: 0.022, supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },

  // ===== INSUMOS DE PROCESO (producción proteínas) =====
  // Carbón: $12.00 / zaco
  { id: 'i121', name: 'Carbón (zaco)',         category: 'Proceso', unit: 'pza', cost: 12.00,  supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Madera: $40.00 / 368 cm → $0.1087/cm
  { id: 'i122', name: 'Madera (cm)',           category: 'Proceso', unit: 'pza', cost: 0.1087, supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Aluminio/foil: $27.99 / 152.4 mts → $0.1836/mt
  { id: 'i123', name: 'Papel Aluminio (mt)',   category: 'Proceso', unit: 'pza', cost: 0.1836, supplier: 'Sysco', yield: 1.00, lastChange: '0.0%', stock: 0 },
  // Pellets: $33.50 / 18,140g → $0.001848/g
  { id: 'i124', name: 'Pellets',               category: 'Proceso', unit: 'g',   cost: 0.001848, supplier: 'Local', yield: 1.00, lastChange: '0.0%', stock: 0 },
];

// Sub-recetas (salsas y rubs reutilizables)
const SEED_SUBRECETAS = [

  // ===== PROTEÍNAS COCIDAS =====
  // yield = gramos (o pzas) netos producidos por batch
  // Los pesos de ingredientes son los que aparecen en las hojas de producción (peso neto)
  // La proteína se ingresa en gramos brutos; el yield del insumo refleja la merma de limpieza

  {
    // ── RUB BBQ ── batch 715g · $2.94 total
    // Imagen: Pimienta 45g · Sal 370g · Ajo polvo 55g · Cebolla polvo 55g · Paprika 40g · Azúcar 150g
    id: 'sp0', name: 'Rub BBQ', category: 'Proteína cocida', yield: 715, yieldUnit: 'g',
    ingredients: [
      { insumoId: 'i67', qty: 45,  unit: 'g' },  // Pimienta Negra   — $7.69/453g
      { insumoId: 'i68', qty: 370, unit: 'g' },  // Sal              — $0.20/400g
      { insumoId: 'i69', qty: 55,  unit: 'g' },  // Ajo en Polvo     — $7.89/680.4g
      { insumoId: 'i70', qty: 55,  unit: 'g' },  // Cebolla en Polvo — $6.69/566.9g
      { insumoId: 'i71', qty: 40,  unit: 'g' },  // Paprika          — $6.19/453g
      { insumoId: 'i72', qty: 150, unit: 'g' },  // Azúcar           — $2.68/2500g
    ],
  },

  {
    // ── PULLED PORK ── batch 36.59 lbs · yield neto 11,424g (25.2 lbs)
    // Imagen: Nuca 16,601g bruto / 15,961g neto (96%) · Rub 488g · Mostaza 155.5g
    //         Carbón 1 zaco · Madera 80 cm · Aluminio 16.8 mts
    // Precio por 1 oz: $0.28 · Porción 4.5 oz (127g): $1.27 · 89.95 porciones
    id: 'sp1', name: 'Pulled Pork (cocido)', category: 'Proteína cocida', yield: 11424, yieldUnit: 'g',
    ingredients: [
      { insumoId: 'i1',   qty: 16601, unit: 'g'   }, // Nuca de Cerdo    — 16,601g bruto ($2.35/lb, yield 0.96)
      { insumoId: 'i67',  qty: 45,    unit: 'g'   }, // Pimienta Negra   — Rub: 488g × proporción
      { insumoId: 'i68',  qty: 253,   unit: 'g'   }, // Sal
      { insumoId: 'i69',  qty: 38,    unit: 'g'   }, // Ajo en Polvo
      { insumoId: 'i70',  qty: 38,    unit: 'g'   }, // Cebolla en Polvo
      { insumoId: 'i71',  qty: 27,    unit: 'g'   }, // Paprika
      { insumoId: 'i72',  qty: 87,    unit: 'g'   }, // Azúcar
      { insumoId: 'i51',  qty: 155.5, unit: 'g'   }, // Mostaza          — $5.20/3500g
      { insumoId: 'i121', qty: 1,     unit: 'pza' }, // Carbón           — 1 zaco ($12.00)
      { insumoId: 'i122', qty: 80,    unit: 'pza' }, // Madera           — 80 cm ($0.1087/cm)
      { insumoId: 'i123', qty: 16.8,  unit: 'pza' }, // Papel Aluminio   — 16.8 mts ($0.1836/mt)
    ],
  },

  {
    // ── RACK DE COSTILLAS ── batch 13.61 lbs · yield neto 3,863.5g (8.5 lbs)
    // Imagen: Costilla 6,174g bruto / 5,610g neto (91%) · Rub 148g · Salsa Inglesa 30ml
    //         Pellets 1.8 kg presentación / 18.14 kg · Aluminio 2 mts
    // Precio por 1 oz: $0.28 · Porción ½ lb (226.7g / 8 oz): $2.22 · 17.03 porciones
    id: 'sp2', name: 'Rack de Costillas (cocido)', category: 'Proteína cocida', yield: 3864, yieldUnit: 'g',
    ingredients: [
      { insumoId: 'i2',   qty: 6174,  unit: 'g'   }, // Costilla Spare Ribs — 6,174g bruto ($2.40/lb, yield 0.91)
      { insumoId: 'i67',  qty: 9,     unit: 'g'   }, // Pimienta Negra   — Rub: 148g × proporción
      { insumoId: 'i68',  qty: 77,    unit: 'g'   }, // Sal
      { insumoId: 'i69',  qty: 11,    unit: 'g'   }, // Ajo en Polvo
      { insumoId: 'i70',  qty: 11,    unit: 'g'   }, // Cebolla en Polvo
      { insumoId: 'i71',  qty: 8,     unit: 'g'   }, // Paprika
      { insumoId: 'i72',  qty: 32,    unit: 'g'   }, // Azúcar
      { insumoId: 'i39',  qty: 30,    unit: 'ml'  }, // Salsa Inglesa    — 30 ml ($6.00/3650ml)
      { insumoId: 'i124', qty: 18140, unit: 'g'   }, // Pellets          — 18.14 kg ($33.50/18140g)
      { insumoId: 'i123', qty: 2,     unit: 'pza' }, // Papel Aluminio   — 2 mts ($0.1836/mt)
    ],
  },

  {
    // ── PORK BELLY ── batch 11.3 lbs · yield neto 3,401.9g (7.5 lbs)
    // Imagen: Pork Belly 5,125g / 5,125g neto (100%) · Rub 250g · Soya 100ml
    //         Pellets 18.14 kg · Salsa BBQ 275g · Azúcar POST 170g
    // Precio por 1 oz: $0.29 · Porción ½ lb (226.7g / 8 oz): $1.99 · 15 porciones
    id: 'sp3', name: 'Pork Belly (cocido)', category: 'Proteína cocida', yield: 3402, yieldUnit: 'g',
    ingredients: [
      { insumoId: 'i3',   qty: 5125,  unit: 'g'   }, // Pork Belly       — 5,125g bruto ($2.00/lb, yield 1.00)
      { insumoId: 'i67',  qty: 16,    unit: 'g'   }, // Pimienta Negra   — Rub: 250g × proporción
      { insumoId: 'i68',  qty: 130,   unit: 'g'   }, // Sal
      { insumoId: 'i69',  qty: 19,    unit: 'g'   }, // Ajo en Polvo
      { insumoId: 'i70',  qty: 19,    unit: 'g'   }, // Cebolla en Polvo
      { insumoId: 'i71',  qty: 14,    unit: 'g'   }, // Paprika
      { insumoId: 'i72',  qty: 52,    unit: 'g'   }, // Azúcar (Rub)
      { insumoId: 'i40',  qty: 100,   unit: 'ml'  }, // Salsa de Soya    — 100 ml ($6.25/3650ml)
      { insumoId: 'i124', qty: 18140, unit: 'g'   }, // Pellets          — 18.14 kg
      { insumoId: 'i49',  qty: 275,   unit: 'g'   }, // Salsa BBQ comercial — 275g ($10.49/2300g)
      { insumoId: 'i72',  qty: 170,   unit: 'g'   }, // Azúcar POST      — 170g adicionales
    ],
  },

  {
    // ── POLLO ── batch 15 lbs · yield neto ~6,364g (14 lbs, 98.35%)
    // Imagen: Pollo 6,810g bruto / 6,472g neto (95%) · Mostaza 100g
    //         Rub de Pollo 80g · Pellets 18.14 kg
    // 15 porciones · Costo por porción: $1.16
    id: 'sp4', name: 'Pollo (cocido)', category: 'Proteína cocida', yield: 6364, yieldUnit: 'g',
    ingredients: [
      { insumoId: 'i4',   qty: 6810,  unit: 'g'   }, // Pollo            — 6,810g bruto ($2.42/lb, yield 0.95)
      { insumoId: 'i51',  qty: 100,   unit: 'g'   }, // Mostaza          — 100g ($5.20/3500g)
      { insumoId: 'i76',  qty: 80,    unit: 'g'   }, // Sazonador Pollo  — 80g ($7.29/623.7g)
      { insumoId: 'i124', qty: 18140, unit: 'g'   }, // Pellets          — 18.14 kg
    ],
  },

  {
    // ── TORTA DE CARNE (Vaca y Cerdito) ── 20 tortitas de 130g c/u
    // Imagen: Nuca de Cerdo 2,600g / 2,600g neto (100%) · Rub 210g
    // 20 tortitas producidas · Costo por tortita: $0.77
    id: 'sp5', name: 'Torta de Carne (130g)', category: 'Proteína cocida', yield: 20, yieldUnit: 'pza',
    ingredients: [
      { insumoId: 'i1',   qty: 2600, unit: 'g'  }, // Nuca de Cerdo    — 2,600g ($2.35/lb)
      { insumoId: 'i67',  qty: 13,   unit: 'g'  }, // Pimienta Negra   — Rub: 210g × proporción
      { insumoId: 'i68',  qty: 108,  unit: 'g'  }, // Sal
      { insumoId: 'i69',  qty: 16,   unit: 'g'  }, // Ajo en Polvo
      { insumoId: 'i70',  qty: 16,   unit: 'g'  }, // Cebolla en Polvo
      { insumoId: 'i71',  qty: 12,   unit: 'g'  }, // Paprika
      { insumoId: 'i72',  qty: 45,   unit: 'g'  }, // Azúcar
    ],
  },

  // ===== SALSAS =====
  {
    id: 's1', name: 'Salsa BBQ Pig Brothers (casera)', category: 'Salsas', yield: 64, yieldUnit: 'oz',
    ingredients: [
      { insumoId: 'i32', qty: 32, unit: 'oz' },
      { insumoId: 'i67', qty: 8,  unit: 'oz' },
      { insumoId: 'i41', qty: 6,  unit: 'oz' },
      { insumoId: 'i38', qty: 4,  unit: 'oz' },
      { insumoId: 'i36', qty: 1,  unit: 'oz' },
      { insumoId: 'i48', qty: 0.5, unit: 'oz' },
      { insumoId: 'i60', qty: 0.5, unit: 'oz' },
    ],
  },
  {
    id: 's5', name: 'Salsa de Higos', category: 'Salsas', yield: 32, yieldUnit: 'oz',
    ingredients: [
      { insumoId: 'i66', qty: 12, unit: 'oz' },
      { insumoId: 'i41', qty: 4,  unit: 'oz' },
      { insumoId: 'i38', qty: 2,  unit: 'oz' },
      { insumoId: 'i71', qty: 1,  unit: 'pza' },
      { insumoId: 'i57', qty: 0.2, unit: 'oz' },
    ],
  },
  {
    id: 's7', name: 'Salsa de Panela', category: 'Salsas', yield: 32, yieldUnit: 'oz',
    ingredients: [
      { insumoId: 'i41', qty: 12, unit: 'oz' },
      { insumoId: 'i38', qty: 4,  unit: 'oz' },
      { insumoId: 'i36', qty: 1,  unit: 'oz' },
      { insumoId: 'i15', qty: 2,  unit: 'oz' },
      { insumoId: 'i22', qty: 0.5, unit: 'pza' },
      { insumoId: 'i46', qty: 0.25, unit: 'oz' },
    ],
  },
  {
    id: 's8', name: 'Salsa de Tamarindo', category: 'Salsas', yield: 32, yieldUnit: 'oz',
    ingredients: [
      { insumoId: 'i67', qty: 10, unit: 'oz' },
      { insumoId: 'i40', qty: 6,  unit: 'oz' },
      { insumoId: 'i19', qty: 0.5, unit: 'oz' },
      { insumoId: 'i38', qty: 2,  unit: 'oz' },
      { insumoId: 'i43', qty: 0.25, unit: 'oz' },
    ],
  },
  {
    id: 's9', name: 'Salsa de Cerveza', category: 'Salsas', yield: 32, yieldUnit: 'oz',
    ingredients: [
      { insumoId: 'i71', qty: 2,  unit: 'pza' },
      { insumoId: 'i41', qty: 4,  unit: 'oz' },
      { insumoId: 'i15', qty: 2,  unit: 'oz' },
      { insumoId: 'i22', qty: 0.5, unit: 'pza' },
      { insumoId: 'i36', qty: 0.5, unit: 'oz' },
      { insumoId: 'i48', qty: 0.25, unit: 'oz' },
    ],
  },
  {
    id: 's10', name: 'White BBQ', category: 'Salsas', yield: 32, yieldUnit: 'oz',
    ingredients: [
      { insumoId: 'i31', qty: 16, unit: 'oz' },
      { insumoId: 'i38', qty: 4,  unit: 'oz' },
      { insumoId: 'i18', qty: 2,  unit: 'oz' },
      { insumoId: 'i33', qty: 2,  unit: 'oz' },
      { insumoId: 'i22', qty: 0.5, unit: 'pza' },
      { insumoId: 'i43', qty: 0.25, unit: 'oz' },
      { insumoId: 'i46', qty: 0.25, unit: 'oz' },
    ],
  },

  // ===== ADEREZOS =====
  {
    id: 's11', name: 'Aderezo Ajo Romero', category: 'Aderezos', yield: 16, yieldUnit: 'oz',
    ingredients: [
      { insumoId: 'i31', qty: 8,  unit: 'oz' },
      { insumoId: 'i22', qty: 1,  unit: 'pza' },
      { insumoId: 'i18', qty: 1,  unit: 'oz' },
      { insumoId: 'i54', qty: 0.5, unit: 'oz' },
      { insumoId: 'i43', qty: 0.25, unit: 'oz' },
      { insumoId: 'i46', qty: 0.25, unit: 'oz' },
    ],
  },
  {
    id: 's12', name: 'Aderezo de Chipotle', category: 'Aderezos', yield: 16, yieldUnit: 'oz',
    ingredients: [
      { insumoId: 'i31', qty: 8,  unit: 'oz' },
      { insumoId: 'i60', qty: 1,  unit: 'oz' },
      { insumoId: 'i18', qty: 1,  unit: 'oz' },
      { insumoId: 'i22', qty: 0.5, unit: 'pza' },
      { insumoId: 'i40', qty: 0.5, unit: 'oz' },
      { insumoId: 'i43', qty: 0.25, unit: 'oz' },
    ],
  },
  {
    id: 's13', name: 'Aderezo de Cilantro', category: 'Aderezos', yield: 16, yieldUnit: 'oz',
    ingredients: [
      { insumoId: 'i31', qty: 8,  unit: 'oz' },
      { insumoId: 'i21', qty: 1,  unit: 'pza' },
      { insumoId: 'i18', qty: 1,  unit: 'oz' },
      { insumoId: 'i22', qty: 0.5, unit: 'pza' },
      { insumoId: 'i19', qty: 0.25, unit: 'oz' },
      { insumoId: 'i43', qty: 0.25, unit: 'oz' },
    ],
  },

  // ===== OTROS =====
  {
    id: 's2', name: 'BBQ Rub seco', category: 'Otros', yield: 16, yieldUnit: 'oz',
    ingredients: [
      { insumoId: 'i41', qty: 5, unit: 'oz' },
      { insumoId: 'i44', qty: 4, unit: 'oz' },
      { insumoId: 'i48', qty: 3, unit: 'oz' },
      { insumoId: 'i46', qty: 2, unit: 'oz' },
      { insumoId: 'i50', qty: 1, unit: 'oz' },
      { insumoId: 'i49', qty: 1, unit: 'oz' },
    ],
  },
  {
    id: 's3', name: 'Coleslaw (ensalada de repollo)', category: 'Otros', yield: 32, yieldUnit: 'oz',
    ingredients: [
      { insumoId: 'i12', qty: 14, unit: 'oz' },
      { insumoId: 'i13', qty: 6,  unit: 'oz' },
      { insumoId: 'i14', qty: 3,  unit: 'oz' },
      { insumoId: 'i31', qty: 6,  unit: 'oz' },
      { insumoId: 'i38', qty: 1,  unit: 'oz' },
      { insumoId: 'i40', qty: 1,  unit: 'oz' },
      { insumoId: 'i43', qty: 0.25, unit: 'oz' },
    ],
  },
  {
    id: 's4', name: 'Mac and Cheese', category: 'Otros', yield: 64, yieldUnit: 'oz',
    ingredients: [
      { insumoId: 'i25', qty: 16, unit: 'oz' },
      { insumoId: 'i26', qty: 12, unit: 'oz' },
      { insumoId: 'i29', qty: 16, unit: 'oz' },
      { insumoId: 'i28', qty: 3,  unit: 'oz' },
      { insumoId: 'i43', qty: 0.25, unit: 'oz' },
      { insumoId: 'i46', qty: 0.1, unit: 'oz' },
    ],
  },
  {
    id: 's6', name: 'Salsa Maracuyá', category: 'Salsas', yield: 32, yieldUnit: 'oz',
    ingredients: [
      { insumoId: 'i68', qty: 14, unit: 'oz' },
      { insumoId: 'i40', qty: 6,  unit: 'oz' },
      { insumoId: 'i19', qty: 0.5, unit: 'oz' },
    ],
  },
];

// Recetas (productos finales del menú real)
const SEED_RECETAS = [
  // ===== HAMBURGUESAS =====
  {
    id: 'r1', name: 'Hamburguesa Pulled Pork', category: 'Hamburguesas',
    sellPrice: 12.00, monthlySales: 420, targetFoodCost: 30,
    laborMinutes: 4, packagingItems: ['i72', 'i77'],
    ingredients: [
      { type: 'insumo', insumoId: 'i1',  qty: 5,    unit: 'oz' },
      { type: 'insumo', insumoId: 'i24', qty: 1,    unit: 'pza' },
      { type: 'sub',    subId: 's1',     qty: 1.5,  unit: 'oz' },
      { type: 'sub',    subId: 's3',     qty: 1.5,  unit: 'oz' },
    ],
  },
  {
    id: 'r2', name: 'Hamburguesa Brisket', category: 'Hamburguesas',
    sellPrice: 15.50, monthlySales: 280, targetFoodCost: 32,
    laborMinutes: 5, packagingItems: ['i72', 'i77'],
    ingredients: [
      { type: 'insumo', insumoId: 'i2',  qty: 5,    unit: 'oz' },
      { type: 'insumo', insumoId: 'i23', qty: 1,    unit: 'pza' },
      { type: 'insumo', insumoId: 'i26', qty: 1,    unit: 'oz' },
      { type: 'sub',    subId: 's1',     qty: 1,    unit: 'oz' },
    ],
  },
  {
    id: 'r3', name: 'Hamburguesa Clásica', category: 'Hamburguesas',
    sellPrice: 10.50, monthlySales: 380, targetFoodCost: 30,
    laborMinutes: 4, packagingItems: ['i72', 'i77'],
    ingredients: [
      { type: 'insumo', insumoId: 'i9',  qty: 1,    unit: 'pza' },
      { type: 'insumo', insumoId: 'i24', qty: 1,    unit: 'pza' },
      { type: 'insumo', insumoId: 'i26', qty: 1,    unit: 'oz' },
      { type: 'insumo', insumoId: 'i15', qty: 0.5,  unit: 'oz' },
    ],
  },

  // ===== PLATOS BBQ =====
  {
    id: 'r4', name: 'Brisket Plate (½ lb)', category: 'Platos BBQ',
    sellPrice: 19.00, monthlySales: 180, targetFoodCost: 35,
    laborMinutes: 3, packagingItems: ['i73', 'i77'],
    ingredients: [
      { type: 'insumo', insumoId: 'i2',  qty: 8, unit: 'oz' },
      { type: 'sub',    subId: 's1',     qty: 2, unit: 'oz' },
      { type: 'sub',    subId: 's3',     qty: 3, unit: 'oz' },
    ],
  },
  {
    id: 'r5', name: 'Costillas (½ rack)', category: 'Platos BBQ',
    sellPrice: 17.00, monthlySales: 240, targetFoodCost: 32,
    laborMinutes: 6, packagingItems: ['i73', 'i77'],
    ingredients: [
      { type: 'insumo', insumoId: 'i3', qty: 12, unit: 'oz' },
      { type: 'sub',    subId: 's2',    qty: 1,  unit: 'oz' },
      { type: 'sub',    subId: 's1',    qty: 2,  unit: 'oz' },
    ],
  },
  {
    id: 'r6', name: 'Pollo Ahumado (¼)', category: 'Platos BBQ',
    sellPrice: 11.50, monthlySales: 150, targetFoodCost: 28,
    laborMinutes: 4, packagingItems: ['i73', 'i77'],
    ingredients: [
      { type: 'insumo', insumoId: 'i5', qty: 12, unit: 'oz' },
      { type: 'sub',    subId: 's2',    qty: 1,  unit: 'oz' },
      { type: 'sub',    subId: 's1',    qty: 1.5, unit: 'oz' },
    ],
  },
  {
    id: 'r7', name: 'Pork Belly Plate', category: 'Platos BBQ',
    sellPrice: 16.00, monthlySales: 130, targetFoodCost: 32,
    laborMinutes: 5, packagingItems: ['i73', 'i77'],
    ingredients: [
      { type: 'insumo', insumoId: 'i4', qty: 8, unit: 'oz' },
      { type: 'sub',    subId: 's5',    qty: 2, unit: 'oz' },
      { type: 'sub',    subId: 's3',    qty: 3, unit: 'oz' },
    ],
  },
  {
    id: 'r8', name: 'Puyaso Plate', category: 'Platos BBQ',
    sellPrice: 18.00, monthlySales: 90, targetFoodCost: 33,
    laborMinutes: 5, packagingItems: ['i73', 'i77'],
    ingredients: [
      { type: 'insumo', insumoId: 'i6', qty: 8, unit: 'oz' },
      { type: 'sub',    subId: 's2',    qty: 0.5, unit: 'oz' },
      { type: 'sub',    subId: 's1',    qty: 2, unit: 'oz' },
    ],
  },

  // ===== ENTRADAS =====
  {
    id: 'r9', name: 'Texas Twinkies', category: 'Entradas',
    sellPrice: 10.00, monthlySales: 280, targetFoodCost: 30,
    laborMinutes: 8, packagingItems: ['i72', 'i77'],
    ingredients: [
      { type: 'insumo', insumoId: 'i19', qty: 4, unit: 'pza' },
      { type: 'insumo', insumoId: 'i2',  qty: 3, unit: 'oz' },
      { type: 'insumo', insumoId: 'i27', qty: 2, unit: 'oz' },
      { type: 'insumo', insumoId: 'i8',  qty: 4, unit: 'oz' },
      { type: 'sub',    subId: 's1',     qty: 1, unit: 'oz' },
    ],
  },
  {
    id: 'r10', name: 'Papas con Pulled Pork', category: 'Entradas',
    sellPrice: 9.50, monthlySales: 360, targetFoodCost: 28,
    laborMinutes: 3, packagingItems: ['i72', 'i77'],
    ingredients: [
      { type: 'insumo', insumoId: 'i10', qty: 8, unit: 'oz' },
      { type: 'insumo', insumoId: 'i1',  qty: 3, unit: 'oz' },
      { type: 'insumo', insumoId: 'i26', qty: 1, unit: 'oz' },
      { type: 'sub',    subId: 's1',     qty: 1, unit: 'oz' },
    ],
  },

  // ===== GUARNICIONES =====
  {
    id: 'r11', name: 'Mac and Cheese (porción)', category: 'Guarniciones',
    sellPrice: 5.50, monthlySales: 320, targetFoodCost: 28,
    laborMinutes: 2, packagingItems: ['i75', 'i77'],
    ingredients: [
      { type: 'sub',    subId: 's4',     qty: 8, unit: 'oz' },
    ],
  },
  {
    id: 'r12', name: 'Coleslaw (porción)', category: 'Guarniciones',
    sellPrice: 4.00, monthlySales: 260, targetFoodCost: 25,
    laborMinutes: 1, packagingItems: ['i75'],
    ingredients: [
      { type: 'sub',    subId: 's3',     qty: 6, unit: 'oz' },
    ],
  },
  {
    id: 'r13', name: 'Camote frito', category: 'Guarniciones',
    sellPrice: 4.50, monthlySales: 200, targetFoodCost: 26,
    laborMinutes: 2, packagingItems: ['i75'],
    ingredients: [
      { type: 'insumo', insumoId: 'i11', qty: 6, unit: 'oz' },
    ],
  },
];

// Histórico de cambios de precio (273 eventos, últimos 6 meses)
const SEED_PRICE_HISTORY = [
  { date: '2026-04-27', insumoId: 'i5', from: 1.93, to: 1.95, change: +1.04, reason: 'Tyson' },
  { date: '2026-04-25', insumoId: 'i2', from: 6.99, to: 7.04, change: +0.72, reason: 'Sysco — escasez' },
  { date: '2026-04-24', insumoId: 'i5', from: 1.95, to: 1.97, change: +1.03, reason: 'Sysco — alza mensual' },
  { date: '2026-04-21', insumoId: 'i8', from: 4.44, to: 4.43, change: -0.23, reason: 'Sysco' },
  { date: '2026-04-19', insumoId: 'i17', from: 1.37, to: 1.38, change: +0.73, reason: 'Cosecha local abundante' },
  { date: '2026-04-06', insumoId: 'i2', from: 7.04, to: 7.08, change: +0.57, reason: 'Sysco' },
  { date: '2026-04-01', insumoId: 'i15', from: 0.8277, to: 0.824, change: -0.45, reason: 'Temporada' },
  { date: '2026-03-31', insumoId: 'i74', from: 0.174, to: 0.176, change: +1.15, reason: 'Webstaurant' },
  { date: '2026-03-24', insumoId: 'i6', from: 6.12, to: 6.23, change: +1.8, reason: 'Sysco' },
  { date: '2026-03-23', insumoId: 'i2', from: 7.08, to: 7.13, change: +0.71, reason: 'Sysco — escasez' },
  { date: '2026-03-22', insumoId: 'i4', from: 4.67, to: 4.7, change: +0.64, reason: 'US Foods' },
  { date: '2026-03-20', insumoId: 'i16', from: 0.9944, to: 0.987, change: -0.74, reason: 'Local — escasez' },
  { date: '2026-03-19', insumoId: 'i9', from: 1.14, to: 1.16, change: +1.75, reason: 'Sysco — escasez' },
  { date: '2026-03-14', insumoId: 'i7', from: 3.96, to: 4.01, change: +1.26, reason: 'Sysco — alza mensual' },
  { date: '2026-03-12', insumoId: 'i8', from: 4.43, to: 4.42, change: -0.23, reason: 'US Foods' },
  { date: '2026-03-11', insumoId: 'i28', from: 2.35, to: 2.36, change: +0.43, reason: 'Sysco' },
  { date: '2026-03-09', insumoId: 'i18', from: 0.9289, to: 0.923, change: -0.64, reason: 'Cosecha local abundante' },
  { date: '2026-03-09', insumoId: 'i44', from: 2.3, to: 2.32, change: +0.87, reason: 'Local' },
  { date: '2026-03-09', insumoId: 'i63', from: 5.48, to: 5.54, change: +1.09, reason: 'Sysco' },
  { date: '2026-03-08', insumoId: 'i16', from: 0.987, to: 0.978, change: -0.91, reason: 'Temporada' },
  { date: '2026-03-06', insumoId: 'i5', from: 1.97, to: 1.96, change: -0.51, reason: 'Sysco — escasez' },
  { date: '2026-03-06', insumoId: 'i11', from: 0.97, to: 0.99, change: +2.06, reason: 'Cosecha local abundante' },
  { date: '2026-03-04', insumoId: 'i19', from: 1.12, to: 1.14, change: +1.79, reason: 'Local — escasez' },
  { date: '2026-03-04', insumoId: 'i65', from: 12.27, to: 12.31, change: +0.33, reason: 'Local' },
  { date: '2026-03-03', insumoId: 'i17', from: 1.38, to: 1.39, change: +0.72, reason: 'Temporada' },
  { date: '2026-03-02', insumoId: 'i3', from: 5.21, to: 5.3, change: +1.73, reason: 'US Foods' },
  { date: '2026-03-02', insumoId: 'i51', from: 6.08, to: 6.11, change: +0.49, reason: 'Especias — importación' },
  { date: '2026-03-01', insumoId: 'i80', from: 0.0289, to: 0.0293, change: +1.38, reason: 'Local' },
  { date: '2026-02-28', insumoId: 'i15', from: 0.824, to: 0.816, change: -0.97, reason: 'Temporada' },
  { date: '2026-02-28', insumoId: 'i20', from: 3.83, to: 3.82, change: -0.26, reason: 'Temporada' },
  { date: '2026-02-28', insumoId: 'i77', from: 0.0189, to: 0.0192, change: +1.59, reason: 'Local' },
  { date: '2026-02-26', insumoId: 'i71', from: 1.38, to: 1.39, change: +0.72, reason: 'Sysco — promoción' },
  { date: '2026-02-24', insumoId: 'i10', from: 0.8882, to: 0.874, change: -1.6, reason: 'Temporada' },
  { date: '2026-02-24', insumoId: 'i13', from: 0.6907, to: 0.702, change: +1.64, reason: 'Cosecha local abundante' },
  { date: '2026-02-24', insumoId: 'i29', from: 4.89, to: 4.87, change: -0.41, reason: 'Sysco' },
  { date: '2026-02-24', insumoId: 'i73', from: 0.2624, to: 0.271, change: +3.28, reason: 'Webstaurant' },
  { date: '2026-02-23', insumoId: 'i2', from: 7.13, to: 7.15, change: +0.28, reason: 'Tyson' },
  { date: '2026-02-23', insumoId: 'i6', from: 6.23, to: 6.28, change: +0.8, reason: 'Sysco — alza mensual' },
  { date: '2026-02-23', insumoId: 'i12', from: 0.6731, to: 0.666, change: -1.05, reason: 'Cosecha local abundante' },
  { date: '2026-02-23', insumoId: 'i15', from: 0.816, to: 0.808, change: -0.98, reason: 'Local — escasez' },
  { date: '2026-02-23', insumoId: 'i44', from: 2.32, to: 2.35, change: +1.29, reason: 'Local' },
  { date: '2026-02-23', insumoId: 'i55', from: 9.02, to: 9.09, change: +0.78, reason: 'Especias — importación' },
  { date: '2026-02-23', insumoId: 'i65', from: 12.31, to: 12.34, change: +0.24, reason: 'Sysco — promoción' },
  { date: '2026-02-21', insumoId: 'i46', from: 9.75, to: 9.76, change: +0.1, reason: 'Especias — importación' },
  { date: '2026-02-19', insumoId: 'i51', from: 6.11, to: 6.15, change: +0.65, reason: 'Especias — importación' },
  { date: '2026-02-19', insumoId: 'i74', from: 0.176, to: 0.178, change: +1.14, reason: 'Local' },
  { date: '2026-02-18', insumoId: 'i24', from: 0.4016, to: 0.409, change: +1.84, reason: 'La Brea' },
  { date: '2026-02-18', insumoId: 'i39', from: 3.64, to: 3.72, change: +2.2, reason: 'Sysco' },
  { date: '2026-02-16', insumoId: 'i19', from: 1.14, to: 1.15, change: +0.88, reason: 'Temporada' },
  { date: '2026-02-15', insumoId: 'i13', from: 0.702, to: 0.716, change: +1.99, reason: 'Local' },
  { date: '2026-02-15', insumoId: 'i21', from: 0.3899, to: 0.392, change: +0.54, reason: 'Local — escasez' },
  { date: '2026-02-15', insumoId: 'i28', from: 2.36, to: 2.38, change: +0.85, reason: 'Sysco' },
  { date: '2026-02-14', insumoId: 'i4', from: 4.7, to: 4.73, change: +0.64, reason: 'US Foods' },
  { date: '2026-02-14', insumoId: 'i50', from: 7.01, to: 7.13, change: +1.71, reason: 'Especias — importación' },
  { date: '2026-02-13', insumoId: 'i1', from: 3.94, to: 3.92, change: -0.51, reason: 'US Foods' },
  { date: '2026-02-13', insumoId: 'i7', from: 4.01, to: 4.06, change: +1.25, reason: 'Tyson' },
  { date: '2026-02-13', insumoId: 'i30', from: 8.29, to: 8.25, change: -0.48, reason: 'Sysco' },
  { date: '2026-02-12', insumoId: 'i47', from: 7.95, to: 8.05, change: +1.26, reason: 'Sysco' },
  { date: '2026-02-12', insumoId: 'i52', from: 8.13, to: 8.14, change: +0.12, reason: 'Local' },
  { date: '2026-02-11', insumoId: 'i26', from: 4.04, to: 4.05, change: +0.25, reason: 'Sysco' },
  { date: '2026-02-11', insumoId: 'i46', from: 9.76, to: 9.77, change: +0.1, reason: 'Local' },
  { date: '2026-02-10', insumoId: 'i3', from: 5.3, to: 5.37, change: +1.32, reason: 'Sysco' },
  { date: '2026-02-10', insumoId: 'i9', from: 1.16, to: 1.17, change: +0.86, reason: 'Tyson' },
  { date: '2026-02-10', insumoId: 'i21', from: 0.392, to: 0.395, change: +0.77, reason: 'Local' },
  { date: '2026-02-08', insumoId: 'i45', from: 1.17, to: 1.18, change: +0.85, reason: 'Sysco' },
  { date: '2026-02-08', insumoId: 'i55', from: 9.09, to: 9.14, change: +0.55, reason: 'Local' },
  { date: '2026-02-06', insumoId: 'i12', from: 0.666, to: 0.662, change: -0.6, reason: 'Local — escasez' },
  { date: '2026-02-06', insumoId: 'i35', from: 27.44, to: 27.65, change: +0.77, reason: 'Sysco' },
  { date: '2026-02-05', insumoId: 'i8', from: 4.42, to: 4.46, change: +0.9, reason: 'Sysco — alza mensual' },
  { date: '2026-02-04', insumoId: 'i62', from: 4.04, to: 4.1, change: +1.49, reason: 'Especias — importación' },
  { date: '2026-02-02', insumoId: 'i19', from: 1.15, to: 1.16, change: +0.87, reason: 'Local' },
  { date: '2026-02-01', insumoId: 'i60', from: 7.73, to: 7.78, change: +0.65, reason: 'Local' },
  { date: '2026-01-30', insumoId: 'i18', from: 0.923, to: 0.916, change: -0.76, reason: 'Local — escasez' },
  { date: '2026-01-30', insumoId: 'i21', from: 0.395, to: 0.397, change: +0.51, reason: 'Local' },
  { date: '2026-01-30', insumoId: 'i45', from: 1.18, to: 1.19, change: +0.85, reason: 'Especias — importación' },
  { date: '2026-01-30', insumoId: 'i77', from: 0.0192, to: 0.0194, change: +1.04, reason: 'Webstaurant — papel' },
  { date: '2026-01-29', insumoId: 'i57', from: 8.25, to: 8.33, change: +0.97, reason: 'Sysco' },
  { date: '2026-01-28', insumoId: 'i6', from: 6.28, to: 6.36, change: +1.27, reason: 'US Foods' },
  { date: '2026-01-28', insumoId: 'i66', from: 4.61, to: 4.76, change: +3.25, reason: 'Sysco' },
  { date: '2026-01-27', insumoId: 'i11', from: 0.99, to: 1.01, change: +2.02, reason: 'Local' },
  { date: '2026-01-27', insumoId: 'i14', from: 0.6528, to: 0.669, change: +2.48, reason: 'Local' },
  { date: '2026-01-27', insumoId: 'i15', from: 0.808, to: 0.802, change: -0.74, reason: 'Local' },
  { date: '2026-01-27', insumoId: 'i44', from: 2.35, to: 2.38, change: +1.28, reason: 'Especias — importación' },
  { date: '2026-01-27', insumoId: 'i56', from: 4.38, to: 4.46, change: +1.83, reason: 'Sysco' },
  { date: '2026-01-27', insumoId: 'i63', from: 5.54, to: 5.6, change: +1.08, reason: 'Local' },
  { date: '2026-01-26', insumoId: 'i68', from: 3.7, to: 3.74, change: +1.08, reason: 'Local' },
  { date: '2026-01-25', insumoId: 'i10', from: 0.874, to: 0.862, change: -1.37, reason: 'Local' },
  { date: '2026-01-25', insumoId: 'i17', from: 1.39, to: 1.4, change: +0.72, reason: 'Local — escasez' },
  { date: '2026-01-25', insumoId: 'i26', from: 4.05, to: 4.07, change: +0.49, reason: 'Sysco' },
  { date: '2026-01-24', insumoId: 'i22', from: 1.61, to: 1.64, change: +1.86, reason: 'Local — escasez' },
  { date: '2026-01-23', insumoId: 'i4', from: 4.73, to: 4.77, change: +0.85, reason: 'Sysco — escasez' },
  { date: '2026-01-23', insumoId: 'i71', from: 1.39, to: 1.4, change: +0.72, reason: 'Local' },
  { date: '2026-01-22', insumoId: 'i58', from: 10.87, to: 11, change: +1.2, reason: 'Local' },
  { date: '2026-01-22', insumoId: 'i61', from: 2.31, to: 2.33, change: +0.87, reason: 'Local' },
  { date: '2026-01-21', insumoId: 'i1', from: 3.92, to: 3.9, change: -0.51, reason: 'Sysco — alza mensual' },
  { date: '2026-01-20', insumoId: 'i7', from: 4.06, to: 4.1, change: +0.99, reason: 'Tyson' },
  { date: '2026-01-20', insumoId: 'i30', from: 8.25, to: 8.23, change: -0.24, reason: 'Sysco' },
  { date: '2026-01-20', insumoId: 'i32', from: 6.86, to: 6.82, change: -0.58, reason: 'Local' },
  { date: '2026-01-20', insumoId: 'i50', from: 7.13, to: 7.33, change: +2.81, reason: 'Sysco' },
  { date: '2026-01-19', insumoId: 'i65', from: 12.34, to: 12.37, change: +0.24, reason: 'Local' },
  { date: '2026-01-19', insumoId: 'i76', from: 0.134, to: 0.138, change: +2.99, reason: 'Webstaurant — papel' },
  { date: '2026-01-18', insumoId: 'i2', from: 7.15, to: 7.17, change: +0.28, reason: 'Sysco — alza mensual' },
  { date: '2026-01-18', insumoId: 'i14', from: 0.669, to: 0.68, change: +1.64, reason: 'Cosecha local abundante' },
  { date: '2026-01-18', insumoId: 'i26', from: 4.07, to: 4.09, change: +0.49, reason: 'Sysco' },
  { date: '2026-01-18', insumoId: 'i79', from: 0.0145, to: 0.0148, change: +2.07, reason: 'Local' },
  { date: '2026-01-17', insumoId: 'i16', from: 0.978, to: 0.961, change: -1.74, reason: 'Local' },
  { date: '2026-01-17', insumoId: 'i20', from: 3.82, to: 3.81, change: -0.26, reason: 'Local — escasez' },
  { date: '2026-01-17', insumoId: 'i43', from: 0.7619, to: 0.774, change: +1.59, reason: 'Sysco' },
  { date: '2026-01-16', insumoId: 'i4', from: 4.77, to: 4.79, change: +0.42, reason: 'Sysco — alza mensual' },
  { date: '2026-01-16', insumoId: 'i35', from: 27.65, to: 27.83, change: +0.65, reason: 'Sysco — promoción' },
  { date: '2026-01-15', insumoId: 'i5', from: 1.96, to: 1.95, change: -0.51, reason: 'Sysco' },
  { date: '2026-01-15', insumoId: 'i8', from: 4.46, to: 4.44, change: -0.45, reason: 'Sysco — alza mensual' },
  { date: '2026-01-15', insumoId: 'i77', from: 0.0194, to: 0.0198, change: +2.06, reason: 'Webstaurant' },
  { date: '2026-01-15', insumoId: 'i80', from: 0.0293, to: 0.0297, change: +1.37, reason: 'Local' },
  { date: '2026-01-14', insumoId: 'i19', from: 1.16, to: 1.17, change: +0.86, reason: 'Local' },
  { date: '2026-01-13', insumoId: 'i13', from: 0.716, to: 0.73, change: +1.96, reason: 'Temporada' },
  { date: '2026-01-13', insumoId: 'i59', from: 6.13, to: 6.19, change: +0.98, reason: 'Sysco' },
  { date: '2026-01-12', insumoId: 'i25', from: 1.09, to: 1.1, change: +0.92, reason: 'Sysco' },
  { date: '2026-01-11', insumoId: 'i7', from: 4.1, to: 4.12, change: +0.49, reason: 'US Foods' },
  { date: '2026-01-11', insumoId: 'i62', from: 4.1, to: 4.15, change: +1.22, reason: 'Local' },
  { date: '2026-01-10', insumoId: 'i38', from: 4.01, to: 4.09, change: +2, reason: 'Sysco — promoción' },
  { date: '2026-01-10', insumoId: 'i73', from: 0.271, to: 0.275, change: +1.48, reason: 'Webstaurant' },
  { date: '2026-01-09', insumoId: 'i27', from: 2.93, to: 2.94, change: +0.34, reason: 'Sysco' },
  { date: '2026-01-09', insumoId: 'i39', from: 3.72, to: 3.77, change: +1.34, reason: 'Sysco — promoción' },
  { date: '2026-01-09', insumoId: 'i43', from: 0.774, to: 0.793, change: +2.45, reason: 'Especias — importación' },
  { date: '2026-01-09', insumoId: 'i61', from: 2.33, to: 2.37, change: +1.72, reason: 'Local — escasez' },
  { date: '2026-01-08', insumoId: 'i11', from: 1.01, to: 1.03, change: +1.98, reason: 'Cosecha local abundante' },
  { date: '2026-01-08', insumoId: 'i17', from: 1.4, to: 1.41, change: +0.71, reason: 'Temporada' },
  { date: '2026-01-08', insumoId: 'i74', from: 0.178, to: 0.18, change: +1.12, reason: 'Webstaurant — papel' },
  { date: '2026-01-07', insumoId: 'i13', from: 0.73, to: 0.739, change: +1.23, reason: 'Local — escasez' },
  { date: '2026-01-07', insumoId: 'i51', from: 6.15, to: 6.17, change: +0.33, reason: 'Especias — importación' },
  { date: '2026-01-06', insumoId: 'i24', from: 0.409, to: 0.413, change: +0.98, reason: 'La Brea' },
  { date: '2026-01-06', insumoId: 'i28', from: 2.38, to: 2.39, change: +0.42, reason: 'Sysco' },
  { date: '2026-01-06', insumoId: 'i34', from: 10.94, to: 10.95, change: +0.09, reason: 'Sysco' },
  { date: '2026-01-06', insumoId: 'i48', from: 12.34, to: 12.38, change: +0.32, reason: 'Sysco' },
  { date: '2026-01-05', insumoId: 'i20', from: 3.81, to: 3.8, change: -0.26, reason: 'Local — escasez' },
  { date: '2026-01-05', insumoId: 'i29', from: 4.87, to: 4.84, change: -0.62, reason: 'Sysco' },
  { date: '2026-01-04', insumoId: 'i1', from: 3.9, to: 3.88, change: -0.51, reason: 'Tyson' },
  { date: '2026-01-04', insumoId: 'i58', from: 11, to: 11.16, change: +1.45, reason: 'Sysco' },
  { date: '2026-01-01', insumoId: 'i31', from: 9.42, to: 9.48, change: +0.64, reason: 'Local' },
  { date: '2026-01-01', insumoId: 'i35', from: 27.83, to: 27.92, change: +0.32, reason: 'Local' },
  { date: '2026-01-01', insumoId: 'i40', from: 0.6224, to: 0.641, change: +2.99, reason: 'Sysco' },
  { date: '2025-12-31', insumoId: 'i45', from: 1.19, to: 1.2, change: +0.84, reason: 'Especias — importación' },
  { date: '2025-12-31', insumoId: 'i47', from: 8.05, to: 8.2, change: +1.86, reason: 'Sysco' },
  { date: '2025-12-31', insumoId: 'i49', from: 6.44, to: 6.61, change: +2.64, reason: 'Sysco' },
  { date: '2025-12-30', insumoId: 'i3', from: 5.37, to: 5.49, change: +2.23, reason: 'US Foods' },
  { date: '2025-12-30', insumoId: 'i46', from: 9.77, to: 9.79, change: +0.2, reason: 'Sysco' },
  { date: '2025-12-30', insumoId: 'i53', from: 5.27, to: 5.32, change: +0.95, reason: 'Especias — importación' },
  { date: '2025-12-30', insumoId: 'i56', from: 4.46, to: 4.49, change: +0.67, reason: 'Local' },
  { date: '2025-12-30', insumoId: 'i59', from: 6.19, to: 6.31, change: +1.94, reason: 'Sysco' },
  { date: '2025-12-29', insumoId: 'i7', from: 4.12, to: 4.17, change: +1.21, reason: 'Sysco — escasez' },
  { date: '2025-12-29', insumoId: 'i12', from: 0.662, to: 0.654, change: -1.21, reason: 'Local' },
  { date: '2025-12-28', insumoId: 'i6', from: 6.36, to: 6.41, change: +0.79, reason: 'Sysco' },
  { date: '2025-12-28', insumoId: 'i41', from: 1.21, to: 1.2, change: -0.83, reason: 'Sysco — promoción' },
  { date: '2025-12-28', insumoId: 'i42', from: 1.37, to: 1.38, change: +0.73, reason: 'Sysco' },
  { date: '2025-12-27', insumoId: 'i9', from: 1.17, to: 1.18, change: +0.85, reason: 'Sysco — escasez' },
  { date: '2025-12-27', insumoId: 'i78', from: 0.0397, to: 0.0399, change: +0.5, reason: 'Local' },
  { date: '2025-12-26', insumoId: 'i33', from: 6.89, to: 7.02, change: +1.89, reason: 'Sysco' },
  { date: '2025-12-26', insumoId: 'i34', from: 10.95, to: 10.96, change: +0.09, reason: 'Sysco — promoción' },
  { date: '2025-12-26', insumoId: 'i52', from: 8.14, to: 8.16, change: +0.25, reason: 'Local' },
  { date: '2025-12-26', insumoId: 'i64', from: 6.59, to: 6.65, change: +0.91, reason: 'Local' },
  { date: '2025-12-26', insumoId: 'i80', from: 0.0297, to: 0.03, change: +1.01, reason: 'Webstaurant' },
  { date: '2025-12-25', insumoId: 'i3', from: 5.49, to: 5.6, change: +2, reason: 'Tyson' },
  { date: '2025-12-25', insumoId: 'i54', from: 7.64, to: 7.69, change: +0.65, reason: 'Local' },
  { date: '2025-12-25', insumoId: 'i79', from: 0.0148, to: 0.0149, change: +0.68, reason: 'Webstaurant — papel' },
  { date: '2025-12-24', insumoId: 'i27', from: 2.94, to: 2.95, change: +0.34, reason: 'Sysco' },
  { date: '2025-12-24', insumoId: 'i36', from: 14.04, to: 14.28, change: +1.71, reason: 'Sysco — promoción' },
  { date: '2025-12-24', insumoId: 'i47', from: 8.2, to: 8.29, change: +1.1, reason: 'Local' },
  { date: '2025-12-24', insumoId: 'i74', from: 0.18, to: 0.182, change: +1.11, reason: 'Local' },
  { date: '2025-12-23', insumoId: 'i42', from: 1.38, to: 1.39, change: +0.72, reason: 'Sysco — promoción' },
  { date: '2025-12-23', insumoId: 'i46', from: 9.79, to: 9.8, change: +0.1, reason: 'Local' },
  { date: '2025-12-23', insumoId: 'i55', from: 9.14, to: 9.2, change: +0.66, reason: 'Local' },
  { date: '2025-12-23', insumoId: 'i66', from: 4.76, to: 4.8, change: +0.84, reason: 'Sysco' },
  { date: '2025-12-23', insumoId: 'i67', from: 3.31, to: 3.35, change: +1.21, reason: 'Sysco' },
  { date: '2025-12-22', insumoId: 'i19', from: 1.17, to: 1.2, change: +2.56, reason: 'Cosecha local abundante' },
  { date: '2025-12-22', insumoId: 'i20', from: 3.8, to: 3.84, change: +1.05, reason: 'Local — escasez' },
  { date: '2025-12-22', insumoId: 'i23', from: 0.5212, to: 0.529, change: +1.5, reason: 'La Brea — ajuste' },
  { date: '2025-12-21', insumoId: 'i62', from: 4.15, to: 4.2, change: +1.2, reason: 'Especias — importación' },
  { date: '2025-12-20', insumoId: 'i22', from: 1.64, to: 1.72, change: +4.88, reason: 'Local' },
  { date: '2025-12-20', insumoId: 'i44', from: 2.38, to: 2.4, change: +0.84, reason: 'Especias — importación' },
  { date: '2025-12-20', insumoId: 'i61', from: 2.37, to: 2.4, change: +1.27, reason: 'Cosecha local abundante' },
  { date: '2025-12-20', insumoId: 'i63', from: 5.6, to: 5.76, change: +2.86, reason: 'Sysco' },
  { date: '2025-12-19', insumoId: 'i2', from: 7.17, to: 7.2, change: +0.42, reason: 'US Foods' },
  { date: '2025-12-19', insumoId: 'i10', from: 0.862, to: 0.85, change: -1.39, reason: 'Temporada' },
  { date: '2025-12-19', insumoId: 'i36', from: 14.28, to: 14.5, change: +1.54, reason: 'Sysco — promoción' },
  { date: '2025-12-19', insumoId: 'i64', from: 6.65, to: 6.8, change: +2.26, reason: 'Local' },
  { date: '2025-12-18', insumoId: 'i5', from: 1.95, to: 1.97, change: +1.03, reason: 'Sysco' },
  { date: '2025-12-18', insumoId: 'i18', from: 0.916, to: 0.91, change: -0.66, reason: 'Local' },
  { date: '2025-12-18', insumoId: 'i71', from: 1.4, to: 1.41, change: +0.71, reason: 'Sysco — promoción' },
  { date: '2025-12-17', insumoId: 'i54', from: 7.69, to: 7.8, change: +1.43, reason: 'Local' },
  { date: '2025-12-17', insumoId: 'i68', from: 3.74, to: 3.78, change: +1.07, reason: 'Local' },
  { date: '2025-12-16', insumoId: 'i8', from: 4.44, to: 4.41, change: -0.68, reason: 'Tyson' },
  { date: '2025-12-16', insumoId: 'i32', from: 6.82, to: 6.8, change: -0.29, reason: 'Sysco — promoción' },
  { date: '2025-12-16', insumoId: 'i60', from: 7.78, to: 7.8, change: +0.26, reason: 'Local' },
  { date: '2025-12-15', insumoId: 'i21', from: 0.397, to: 0.399, change: +0.5, reason: 'Temporada' },
  { date: '2025-12-15', insumoId: 'i22', from: 1.72, to: 1.75, change: +1.74, reason: 'Local' },
  { date: '2025-12-15', insumoId: 'i31', from: 9.48, to: 9.5, change: +0.21, reason: 'Sysco' },
  { date: '2025-12-15', insumoId: 'i75', from: 0.0871, to: 0.0884, change: +1.49, reason: 'Local' },
  { date: '2025-12-14', insumoId: 'i14', from: 0.68, to: 0.7, change: +2.94, reason: 'Local — escasez' },
  { date: '2025-12-13', insumoId: 'i24', from: 0.413, to: 0.42, change: +1.69, reason: 'La Brea — ajuste' },
  { date: '2025-12-13', insumoId: 'i37', from: 8.25, to: 8.35, change: +1.21, reason: 'Sysco — promoción' },
  { date: '2025-12-13', insumoId: 'i49', from: 6.61, to: 6.8, change: +2.87, reason: 'Sysco' },
  { date: '2025-12-13', insumoId: 'i51', from: 6.17, to: 6.2, change: +0.49, reason: 'Especias — importación' },
  { date: '2025-12-13', insumoId: 'i57', from: 8.33, to: 8.38, change: +0.6, reason: 'Especias — importación' },
  { date: '2025-12-13', insumoId: 'i72', from: 0.3465, to: 0.348, change: +0.43, reason: 'Local' },
  { date: '2025-12-12', insumoId: 'i56', from: 4.49, to: 4.57, change: +1.78, reason: 'Local' },
  { date: '2025-12-11', insumoId: 'i15', from: 0.802, to: 0.8, change: -0.25, reason: 'Local — escasez' },
  { date: '2025-12-11', insumoId: 'i52', from: 8.16, to: 8.18, change: +0.25, reason: 'Sysco' },
  { date: '2025-12-11', insumoId: 'i76', from: 0.138, to: 0.14, change: +1.45, reason: 'Webstaurant — papel' },
  { date: '2025-12-10', insumoId: 'i1', from: 3.88, to: 3.86, change: -0.52, reason: 'Tyson' },
  { date: '2025-12-10', insumoId: 'i26', from: 4.09, to: 4.1, change: +0.24, reason: 'Sysco' },
  { date: '2025-12-10', insumoId: 'i39', from: 3.77, to: 3.8, change: +0.8, reason: 'Local' },
  { date: '2025-12-09', insumoId: 'i28', from: 2.39, to: 2.4, change: +0.42, reason: 'Sysco' },
  { date: '2025-12-09', insumoId: 'i29', from: 4.84, to: 4.82, change: -0.41, reason: 'Sysco' },
  { date: '2025-12-09', insumoId: 'i33', from: 7.02, to: 7.2, change: +2.56, reason: 'Sysco' },
  { date: '2025-12-09', insumoId: 'i38', from: 4.09, to: 4.2, change: +2.69, reason: 'Sysco — promoción' },
  { date: '2025-12-07', insumoId: 'i34', from: 10.96, to: 10.98, change: +0.18, reason: 'Sysco' },
  { date: '2025-12-07', insumoId: 'i37', from: 8.35, to: 8.4, change: +0.6, reason: 'Sysco' },
  { date: '2025-12-07', insumoId: 'i59', from: 6.31, to: 6.4, change: +1.43, reason: 'Especias — importación' },
  { date: '2025-12-07', insumoId: 'i65', from: 12.37, to: 12.4, change: +0.24, reason: 'Local' },
  { date: '2025-12-06', insumoId: 'i57', from: 8.38, to: 8.4, change: +0.24, reason: 'Especias — importación' },
  { date: '2025-12-06', insumoId: 'i72', from: 0.348, to: 0.35, change: +0.57, reason: 'Webstaurant — papel' },
  { date: '2025-12-05', insumoId: 'i9', from: 1.18, to: 1.19, change: +0.85, reason: 'US Foods' },
  { date: '2025-12-04', insumoId: 'i4', from: 4.79, to: 4.8, change: +0.21, reason: 'US Foods' },
  { date: '2025-12-04', insumoId: 'i7', from: 4.17, to: 4.2, change: +0.72, reason: 'Sysco — alza mensual' },
  { date: '2025-12-04', insumoId: 'i18', from: 0.91, to: 0.9, change: -1.1, reason: 'Cosecha local abundante' },
  { date: '2025-12-04', insumoId: 'i29', from: 4.82, to: 4.8, change: -0.41, reason: 'Sysco' },
  { date: '2025-12-04', insumoId: 'i30', from: 8.23, to: 8.2, change: -0.36, reason: 'Sysco' },
  { date: '2025-12-04', insumoId: 'i43', from: 0.793, to: 0.8, change: +0.88, reason: 'Local' },
  { date: '2025-12-03', insumoId: 'i11', from: 1.03, to: 1.06, change: +2.91, reason: 'Local — escasez' },
  { date: '2025-12-03', insumoId: 'i16', from: 0.961, to: 0.95, change: -1.14, reason: 'Local' },
  { date: '2025-12-02', insumoId: 'i27', from: 2.95, to: 2.98, change: +1.02, reason: 'Sysco' },
  { date: '2025-12-02', insumoId: 'i50', from: 7.33, to: 7.4, change: +0.95, reason: 'Sysco' },
  { date: '2025-12-02', insumoId: 'i69', from: 2.45, to: 2.41, change: -1.63, reason: 'Local' },
  { date: '2025-12-02', insumoId: 'i79', from: 0.0149, to: 0.015, change: +0.67, reason: 'Webstaurant' },
  { date: '2025-12-01', insumoId: 'i8', from: 4.41, to: 4.4, change: -0.23, reason: 'Sysco' },
  { date: '2025-12-01', insumoId: 'i77', from: 0.0198, to: 0.02, change: +1.01, reason: 'Webstaurant — papel' },
  { date: '2025-11-30', insumoId: 'i48', from: 12.38, to: 12.4, change: +0.16, reason: 'Especias — importación' },
  { date: '2025-11-30', insumoId: 'i70', from: 1.85, to: 1.82, change: -1.62, reason: 'Local' },
  { date: '2025-11-29', insumoId: 'i73', from: 0.275, to: 0.28, change: +1.82, reason: 'Webstaurant — papel' },
  { date: '2025-11-28', insumoId: 'i21', from: 0.399, to: 0.4, change: +0.25, reason: 'Temporada' },
  { date: '2025-11-28', insumoId: 'i53', from: 5.32, to: 5.4, change: +1.5, reason: 'Local' },
  { date: '2025-11-28', insumoId: 'i67', from: 3.35, to: 3.4, change: +1.49, reason: 'Sysco' },
  { date: '2025-11-27', insumoId: 'i71', from: 1.41, to: 1.4, change: -0.71, reason: 'Local' },
  { date: '2025-11-26', insumoId: 'i9', from: 1.19, to: 1.2, change: +0.84, reason: 'Sysco' },
  { date: '2025-11-26', insumoId: 'i22', from: 1.75, to: 1.8, change: +2.86, reason: 'Cosecha local abundante' },
  { date: '2025-11-25', insumoId: 'i1', from: 3.86, to: 3.9, change: +1.04, reason: 'Sysco' },
  { date: '2025-11-25', insumoId: 'i78', from: 0.0399, to: 0.04, change: +0.25, reason: 'Webstaurant' },
  { date: '2025-11-24', insumoId: 'i40', from: 0.641, to: 0.65, change: +1.4, reason: 'Sysco' },
  { date: '2025-11-23', insumoId: 'i23', from: 0.529, to: 0.539, change: +1.89, reason: 'La Brea' },
  { date: '2025-11-23', insumoId: 'i25', from: 1.1, to: 1.11, change: +0.91, reason: 'Sysco' },
  { date: '2025-11-22', insumoId: 'i17', from: 1.41, to: 1.4, change: -0.71, reason: 'Local' },
  { date: '2025-11-22', insumoId: 'i68', from: 3.78, to: 3.8, change: +0.53, reason: 'Local' },
  { date: '2025-11-22', insumoId: 'i70', from: 1.82, to: 1.8, change: -1.1, reason: 'Local' },
  { date: '2025-11-21', insumoId: 'i6', from: 6.41, to: 6.5, change: +1.4, reason: 'Sysco' },
  { date: '2025-11-21', insumoId: 'i35', from: 27.92, to: 28, change: +0.29, reason: 'Sysco' },
  { date: '2025-11-21', insumoId: 'i58', from: 11.16, to: 11.2, change: +0.36, reason: 'Especias — importación' },
  { date: '2025-11-20', insumoId: 'i11', from: 1.06, to: 1.1, change: +3.77, reason: 'Local — escasez' },
  { date: '2025-11-20', insumoId: 'i13', from: 0.739, to: 0.75, change: +1.49, reason: 'Temporada' },
  { date: '2025-11-20', insumoId: 'i52', from: 8.18, to: 8.2, change: +0.24, reason: 'Especias — importación' },
  { date: '2025-11-19', insumoId: 'i1', from: 3.9, to: 3.85, change: -1.28, reason: 'US Foods' },
  { date: '2025-11-19', insumoId: 'i69', from: 2.41, to: 2.4, change: -0.41, reason: 'Sysco' },
  { date: '2025-11-18', insumoId: 'i12', from: 0.654, to: 0.65, change: -0.61, reason: 'Cosecha local abundante' },
  { date: '2025-11-18', insumoId: 'i56', from: 4.57, to: 4.6, change: +0.66, reason: 'Sysco' },
  { date: '2025-11-17', insumoId: 'i45', from: 1.2, to: 1.21, change: +0.83, reason: 'Especias — importación' },
  { date: '2025-11-16', insumoId: 'i41', from: 1.2, to: 1.21, change: +0.83, reason: 'Sysco — promoción' },
  { date: '2025-11-16', insumoId: 'i42', from: 1.39, to: 1.4, change: +0.72, reason: 'Sysco' },
  { date: '2025-11-14', insumoId: 'i25', from: 1.11, to: 1.1, change: -0.9, reason: 'Sysco' },
  { date: '2025-11-13', insumoId: 'i63', from: 5.76, to: 5.8, change: +0.69, reason: 'Sysco' },
  { date: '2025-11-13', insumoId: 'i75', from: 0.0884, to: 0.09, change: +1.81, reason: 'Webstaurant' },
  { date: '2025-11-12', insumoId: 'i34', from: 10.98, to: 11, change: +0.18, reason: 'Sysco — promoción' },
  { date: '2025-11-11', insumoId: 'i23', from: 0.539, to: 0.55, change: +2.04, reason: 'La Brea — ajuste' },
  { date: '2025-11-11', insumoId: 'i47', from: 8.29, to: 8.4, change: +1.33, reason: 'Especias — importación' },
];

const SEED_FIXED_COSTS = {
  rent: 6800,
  utilities: 2200,
  insurance: 850,
  software: 320,
  monthlyCovers: 4500,
  laborRatePerHour: 18,
  taxRate: 8.5,
};

const SEED_FOODCOST_TREND = [33.2, 32.1, 31.8, 32.5, 31.4, 30.9, 31.2, 32.0, 32.8, 33.4, 32.6, 31.8];
const SEED_REVENUE_TREND  = [62, 64, 68, 71, 69, 73, 78, 76, 79, 82, 84, 88];

window.PB_DATA = {
  SEED_INSUMOS, SEED_SUBRECETAS, SEED_RECETAS, SEED_PRICE_HISTORY,
  SEED_FIXED_COSTS, SEED_FOODCOST_TREND, SEED_REVENUE_TREND,
};
