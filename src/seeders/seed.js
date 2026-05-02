require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { User, Comercio, Categoria, Producto } = require('../models');

const hash = (p) => bcrypt.hash(p, 10);

const seed = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  console.log('Limpiando datos anteriores...');
  await sequelize.query('TRUNCATE TABLE mensajes, detalles_pedido, pedidos, transacciones, productos, categorias, comercios, direcciones, users RESTART IDENTITY CASCADE');

  console.log('Hasheando contraseñas...');
  const [passAdmin, passUser] = await Promise.all([hash('admin123'), hash('123456')]);

  // ─── Primer bulkCreate (sin hooks) para generar IDs ──────────────────────────
  await User.bulkCreate([{ email: 'tmp@tmp.com', password: passAdmin, nombre: 'tmp', telefono: '0000000000', rol: 'admin' }], { hooks: false });
  await sequelize.query('TRUNCATE TABLE mensajes, detalles_pedido, pedidos, transacciones, productos, categorias, comercios, direcciones, users RESTART IDENTITY CASCADE');

  console.log('Creando usuarios...');
  const usersData = [
    // Admin
    { email: 'admin@deliverycs.com',       password: passAdmin, nombre: 'Admin Principal',         telefono: '2390000001', rol: 'admin' },
    // Comerciantes
    { email: 'pizzamaster@deliverycs.com',  password: passUser,  nombre: 'Roberto Silva',           telefono: '2390111001', rol: 'comerciante' },
    { email: 'burger@deliverycs.com',       password: passUser,  nombre: 'Maria Gonzalez',          telefono: '2390111002', rol: 'comerciante' },
    { email: 'farmacia@deliverycs.com',     password: passUser,  nombre: 'Carlos Fernandez',        telefono: '2390111003', rol: 'comerciante' },
    { email: 'empanadas@deliverycs.com',    password: passUser,  nombre: 'Ana Rios',                telefono: '2390111004', rol: 'comerciante' },
    { email: 'sushi@deliverycs.com',        password: passUser,  nombre: 'Hiroshi Yamamoto',        telefono: '2390111005', rol: 'comerciante' },
    { email: 'parrilla@deliverycs.com',     password: passUser,  nombre: 'Miguel Torrez',           telefono: '2390111006', rol: 'comerciante' },
    { email: 'polloexpress@deliverycs.com', password: passUser,  nombre: 'Sandra Leiva',            telefono: '2390111007', rol: 'comerciante' },
    { email: 'licorera@deliverycs.com',     password: passUser,  nombre: 'Pablo Ruiz',              telefono: '2390111008', rol: 'comerciante' },
    { email: 'cerveceria@deliverycs.com',   password: passUser,  nombre: 'Diego Campos',            telefono: '2390111009', rol: 'comerciante' },
    { email: 'farmaciasm@deliverycs.com',   password: passUser,  nombre: 'Elena Moran',             telefono: '2390111010', rol: 'comerciante' },
    { email: 'superdia@deliverycs.com',     password: passUser,  nombre: 'Jorge Blanco',            telefono: '2390111011', rol: 'comerciante' },
    { email: 'almacen@deliverycs.com',      password: passUser,  nombre: 'Rosa Pereyra',            telefono: '2390111012', rol: 'comerciante' },
    { email: 'ferreteria@deliverycs.com',   password: passUser,  nombre: 'Oscar Vidal',             telefono: '2390111013', rol: 'comerciante' },
    { email: 'heladeria@deliverycs.com',    password: passUser,  nombre: 'Silvia Castro',           telefono: '2390111014', rol: 'comerciante' },
    { email: 'libreria@deliverycs.com',     password: passUser,  nombre: 'Nora Ibanez',             telefono: '2390111015', rol: 'comerciante' },
    // Deliverys
    { email: 'carlos.del@deliverycs.com',   password: passUser,  nombre: 'Carlos Repartidor',       telefono: '2390222001', rol: 'delivery', rating: 4.8, numCalificaciones: 32 },
    { email: 'lucia.del@deliverycs.com',    password: passUser,  nombre: 'Lucia Ramirez',           telefono: '2390222002', rol: 'delivery', rating: 4.6, numCalificaciones: 18 },
    { email: 'martin.del@deliverycs.com',   password: passUser,  nombre: 'Martin Suarez',           telefono: '2390222003', rol: 'delivery', rating: 4.9, numCalificaciones: 54 },
    // Clientes
    { email: 'juan@deliverycs.com',         password: passUser,  nombre: 'Juan Garcia',             telefono: '2390333001', rol: 'cliente' },
    { email: 'ana@deliverycs.com',          password: passUser,  nombre: 'Ana Lopez',               telefono: '2390333002', rol: 'cliente' },
    { email: 'pedro@deliverycs.com',        password: passUser,  nombre: 'Pedro Martinez',          telefono: '2390333003', rol: 'cliente' },
    { email: 'sofia@deliverycs.com',        password: passUser,  nombre: 'Sofia Romero',            telefono: '2390333004', rol: 'cliente' },
    { email: 'diego@deliverycs.com',        password: passUser,  nombre: 'Diego Herrera',           telefono: '2390333005', rol: 'cliente' },
  ];

  const users = await User.bulkCreate(usersData);

  const [
    ,            // admin
    pizza, burger, farmacia, empanadas, sushi, parrilla, pollo, licorera, cerveceria,
    farmaciaSM, superdia, almacen, ferreteria, heladeria, libreria,
  ] = users;

  console.log('Creando comercios...');
  const comerciosData = await Comercio.bulkCreate([
    // ── COMIDA ────────────────────────────────────────────────────────────────
    {
      nombre: 'Pizza Master',
      descripcion: 'Las mejores pizzas artesanales de Carlos Casares. Masa de fermentación lenta y productos frescos.',
      direccion: 'Av San Martín 450', latitud: -35.619, longitud: -61.365,
      telefono: '2390333444', usuarioId: pizza.id, estado: 'abierto', tipo: 'Comida',
      rating: 4.8, numCalificaciones: 45, costoEnvio: 250,
      horarioApertura: '11:00', horarioCierre: '23:00', comisionPorcentaje: 20, zonaCobertura: 5000,
      colorFondo: '#7F1D1D', colorTexto: '#FFFFFF', colorAccento: '#FB923C', // Fuego
    },
    {
      nombre: 'Burger House',
      descripcion: 'Hamburguesas gourmet a domicilio. Ingredientes premium y salsas caseras.',
      direccion: 'Calle 25 de Mayo 820', latitud: -35.621, longitud: -61.368,
      telefono: '2390444555', usuarioId: burger.id, estado: 'abierto', tipo: 'Comida',
      rating: 4.6, numCalificaciones: 28, costoEnvio: 300,
      horarioApertura: '12:00', horarioCierre: '00:00', comisionPorcentaje: 20, zonaCobertura: 5000,
      colorFondo: '#1A1F36', colorTexto: '#FFFFFF', colorAccento: '#7C83FD', // Noche
    },
    {
      nombre: 'El Rincón de las Empanadas',
      descripcion: 'Empanadas artesanales al horno y fritas. Rellenos de estación y sabores únicos.',
      direccion: 'Hipólito Yrigoyen 215', latitud: -35.618, longitud: -61.370,
      telefono: '2390112233', usuarioId: empanadas.id, estado: 'abierto', tipo: 'Comida',
      rating: 4.7, numCalificaciones: 62, costoEnvio: 200,
      horarioApertura: '11:00', horarioCierre: '22:00', comisionPorcentaje: 20, zonaCobertura: 5000,
      colorFondo: '#78350F', colorTexto: '#FFFFFF', colorAccento: '#FCD34D', // Dorado
    },
    {
      nombre: 'Sushi Carlos Casares',
      descripcion: 'Rolls, nigiri y sashimi. El único sushi delivery de la ciudad.',
      direccion: 'Rivadavia 640', latitud: -35.622, longitud: -61.363,
      telefono: '2390223344', usuarioId: sushi.id, estado: 'abierto', tipo: 'Comida',
      rating: 4.5, numCalificaciones: 19, costoEnvio: 400,
      horarioApertura: '19:00', horarioCierre: '23:30', comisionPorcentaje: 20, zonaCobertura: 5000,
      colorFondo: '#0C0A09', colorTexto: '#FAFAF9', colorAccento: '#EF4444', // Japón
    },
    {
      nombre: 'La Parrilla del Centro',
      descripcion: 'Carnes a la parrilla, achuras y choripanes. Sabor casero garantizado.',
      direccion: 'Mitre 380', latitud: -35.616, longitud: -61.366,
      telefono: '2390334455', usuarioId: parrilla.id, estado: 'abierto', tipo: 'Comida',
      rating: 4.9, numCalificaciones: 81, costoEnvio: 350,
      horarioApertura: '12:00', horarioCierre: '15:00', comisionPorcentaje: 20, zonaCobertura: 5000,
      colorFondo: '#1A0800', colorTexto: '#FFF8F0', colorAccento: '#F97316', // Brasa
    },
    {
      nombre: 'Pollo Express',
      descripcion: 'Pollos al spiedo, milanesas y papas fritas. Rápido, rico y económico.',
      direccion: 'Sarmiento 770', latitud: -35.620, longitud: -61.371,
      telefono: '2390445566', usuarioId: pollo.id, estado: 'cerrado', tipo: 'Comida',
      rating: 4.4, numCalificaciones: 37, costoEnvio: 200,
      horarioApertura: '11:30', horarioCierre: '14:30', comisionPorcentaje: 20, zonaCobertura: 5000,
      colorFondo: '#292524', colorTexto: '#FAFAF9', colorAccento: '#D97706', // Café
    },
    // ── BEBIDAS ───────────────────────────────────────────────────────────────
    {
      nombre: 'La Licorera',
      descripcion: 'Vinos, espumantes, whiskys, ginebras y más. Surtido completo con delivery rápido.',
      direccion: 'Belgrano 112', latitud: -35.617, longitud: -61.360,
      telefono: '2390556677', usuarioId: licorera.id, estado: 'abierto', tipo: 'Bebidas',
      rating: 4.6, numCalificaciones: 44, costoEnvio: 150,
      horarioApertura: '10:00', horarioCierre: '23:00', comisionPorcentaje: 15, zonaCobertura: 5000,
      colorFondo: '#4A0522', colorTexto: '#FFF1F2', colorAccento: '#F43F5E', // Vino
    },
    {
      nombre: 'Cervecería Artesanal CC',
      descripcion: 'Cervezas artesanales propias y nacionales. Rubia, Roja, Stout y ediciones especiales.',
      direccion: 'Av. Roca 550', latitud: -35.624, longitud: -61.367,
      telefono: '2390667788', usuarioId: cerveceria.id, estado: 'abierto', tipo: 'Bebidas',
      rating: 4.8, numCalificaciones: 23, costoEnvio: 200,
      horarioApertura: '16:00', horarioCierre: '01:00', comisionPorcentaje: 15, zonaCobertura: 5000,
      colorFondo: '#431407', colorTexto: '#FFF7ED', colorAccento: '#EA580C', // Cerveza
    },
    // ── FARMACIA ──────────────────────────────────────────────────────────────
    {
      nombre: 'Farmacia Central',
      descripcion: 'Medicamentos, dermocosmética y cuidado personal. Delivery express.',
      direccion: 'Belgrano 350', latitud: -35.617, longitud: -61.362,
      telefono: '2390555666', usuarioId: farmacia.id, estado: 'abierto', tipo: 'Farmacia',
      rating: 4.9, numCalificaciones: 67, costoEnvio: 150,
      horarioApertura: '08:00', horarioCierre: '22:00', comisionPorcentaje: 15, zonaCobertura: 5000,
      colorFondo: '#F0FDF4', colorTexto: '#14532D', colorAccento: '#16A34A', // Fresco
    },
    {
      nombre: 'Farmacia San Martín',
      descripcion: 'Farmacia de turno permanente. Medicamentos, perfumería y ortopedia.',
      direccion: 'Av San Martín 180', latitud: -35.615, longitud: -61.364,
      telefono: '2390778899', usuarioId: farmaciaSM.id, estado: 'abierto', tipo: 'Farmacia',
      rating: 4.7, numCalificaciones: 51, costoEnvio: 150,
      horarioApertura: '00:00', horarioCierre: '23:59', comisionPorcentaje: 15, zonaCobertura: 5000,
      colorFondo: '#F0FDFA', colorTexto: '#134E4A', colorAccento: '#14B8A6', // Menta
    },
    // ── SUPERMERCADO ──────────────────────────────────────────────────────────
    {
      nombre: 'Super Día Express',
      descripcion: 'Almacén y verdulería completa. Todo lo que necesitás sin salir de casa.',
      direccion: 'Pellegrini 430', latitud: -35.619, longitud: -61.373,
      telefono: '2390889900', usuarioId: superdia.id, estado: 'abierto', tipo: 'Supermercado',
      rating: 4.3, numCalificaciones: 29, costoEnvio: 300,
      horarioApertura: '08:00', horarioCierre: '21:00', comisionPorcentaje: 15, zonaCobertura: 5000,
      colorFondo: '#1B4332', colorTexto: '#FFFFFF', colorAccento: '#52B788', // Naturaleza
    },
    {
      nombre: 'Almacén El Progreso',
      descripcion: 'Almacén familiar con más de 30 años en Carlos Casares. Fiambres, lácteos y despensa.',
      direccion: 'Moreno 290', latitud: -35.623, longitud: -61.369,
      telefono: '2390990011', usuarioId: almacen.id, estado: 'cerrado', tipo: 'Supermercado',
      rating: 4.5, numCalificaciones: 38, costoEnvio: 250,
      horarioApertura: '07:30', horarioCierre: '13:00', comisionPorcentaje: 15, zonaCobertura: 5000,
      colorFondo: '#FFFBEB', colorTexto: '#713F12', colorAccento: '#D97706', // Miel
    },
    // ── OTROS ─────────────────────────────────────────────────────────────────
    {
      nombre: 'Ferretería El Tornillo',
      descripcion: 'Herramientas, materiales de construcción, pinturas y artículos del hogar.',
      direccion: 'Colón 650', latitud: -35.621, longitud: -61.375,
      telefono: '2390001122', usuarioId: ferreteria.id, estado: 'abierto', tipo: 'Otros',
      rating: 4.4, numCalificaciones: 16, costoEnvio: 350,
      horarioApertura: '08:00', horarioCierre: '12:30', comisionPorcentaje: 15, zonaCobertura: 5000,
      colorFondo: '#1C1917', colorTexto: '#F5F5F4', colorAccento: '#F59E0B', // Acero
    },
    {
      nombre: 'Heladería El Pibe',
      descripcion: 'Helados artesanales, paletas y tortas heladas. Más de 30 sabores rotativos.',
      direccion: 'Reconquista 120', latitud: -35.618, longitud: -61.358,
      telefono: '2390112244', usuarioId: heladeria.id, estado: 'abierto', tipo: 'Otros',
      rating: 4.9, numCalificaciones: 93, costoEnvio: 200,
      horarioApertura: '14:00', horarioCierre: '23:00', comisionPorcentaje: 15, zonaCobertura: 5000,
      colorFondo: '#FDF4FF', colorTexto: '#701A75', colorAccento: '#E879F9', // Pastel
    },
    {
      nombre: 'Librería y Papelería Estudio',
      descripcion: 'Útiles escolares, libros, artículos de oficina y regalería.',
      direccion: 'Av San Martín 680', latitud: -35.620, longitud: -61.361,
      telefono: '2390223355', usuarioId: libreria.id, estado: 'cerrado', tipo: 'Otros',
      rating: 4.2, numCalificaciones: 11, costoEnvio: 150,
      horarioApertura: '08:30', horarioCierre: '13:00', comisionPorcentaje: 15, zonaCobertura: 5000,
      colorFondo: '#FAF5FF', colorTexto: '#4A1D96', colorAccento: '#8B5CF6', // Aurora
    },
  ]);

  const [
    pizzaC, burgerC, empanadasC, sushiC, parrillaC, polloC,
    licoreraC, cerveceriaC,
    farmaciaC, farmaciaSMC,
    superdiaC, almacenC,
    ferreteriaC, heladeriaC, libreriaC,
  ] = comerciosData;

  console.log('Creando categorías y productos...');

  // ─── PIZZA MASTER ─────────────────────────────────────────────────────────
  const [catPizzas, catEmpanadasP, catBebP] = await Categoria.bulkCreate([
    { comercioId: pizzaC.id, nombre: 'Pizzas',    orden: 1 },
    { comercioId: pizzaC.id, nombre: 'Empanadas', orden: 2 },
    { comercioId: pizzaC.id, nombre: 'Bebidas',   orden: 3 },
  ]);
  await Producto.bulkCreate([
    { comercioId: pizzaC.id, categoriaId: catPizzas.id,    nombre: 'Pizza Mozzarella',    descripcion: 'Salsa, mozzarella y orégano',                         precio: 2800, orden: 1 },
    { comercioId: pizzaC.id, categoriaId: catPizzas.id,    nombre: 'Pizza Napolitana',    descripcion: 'Mozzarella, tomate fresco y albahaca',                precio: 3200, orden: 2 },
    { comercioId: pizzaC.id, categoriaId: catPizzas.id,    nombre: 'Pizza Especial',      descripcion: 'Jamón, morrones, aceitunas y mozzarella',             precio: 3600, orden: 3 },
    { comercioId: pizzaC.id, categoriaId: catPizzas.id,    nombre: 'Pizza 4 Quesos',      descripcion: 'Mozzarella, provolone, roquefort y parmesano',        precio: 4000, orden: 4 },
    { comercioId: pizzaC.id, categoriaId: catPizzas.id,    nombre: 'Pizza Fugazzeta',     descripcion: 'Cebolla caramelizada y mozzarella',                   precio: 3400, orden: 5 },
    { comercioId: pizzaC.id, categoriaId: catEmpanadasP.id, nombre: 'Empanadas x12',      descripcion: 'Docena de empanadas de carne al horno',              precio: 4500, orden: 1 },
    { comercioId: pizzaC.id, categoriaId: catEmpanadasP.id, nombre: 'Empanadas x6',       descripcion: 'Media docena de empanadas surtidas',                 precio: 2400, orden: 2 },
    { comercioId: pizzaC.id, categoriaId: catBebP.id,      nombre: 'Coca-Cola 1.5L',      descripcion: 'Gaseosa fría',                                       precio: 1200, orden: 1 },
    { comercioId: pizzaC.id, categoriaId: catBebP.id,      nombre: 'Agua mineral 500ml',  descripcion: 'Agua sin gas',                                       precio: 600,  orden: 2 },
  ]);

  // ─── BURGER HOUSE ─────────────────────────────────────────────────────────
  const [catBurgers, catCombos, catBebB] = await Categoria.bulkCreate([
    { comercioId: burgerC.id, nombre: 'Hamburguesas', orden: 1 },
    { comercioId: burgerC.id, nombre: 'Combos',       orden: 2 },
    { comercioId: burgerC.id, nombre: 'Extras',       orden: 3 },
    { comercioId: burgerC.id, nombre: 'Bebidas',      orden: 4 },
  ]);
  await Producto.bulkCreate([
    { comercioId: burgerC.id, categoriaId: catBurgers.id, nombre: 'Classic Burger',    descripcion: 'Carne, lechuga, tomate y cheddar',                   precio: 3500, orden: 1 },
    { comercioId: burgerC.id, categoriaId: catBurgers.id, nombre: 'BBQ Burger',        descripcion: 'Carne, bacon crujiente, cheddar y salsa BBQ',        precio: 4200, orden: 2 },
    { comercioId: burgerC.id, categoriaId: catBurgers.id, nombre: 'Double Smash',      descripcion: 'Doble medallón aplastado, queso americano y pickle', precio: 5000, orden: 3 },
    { comercioId: burgerC.id, categoriaId: catBurgers.id, nombre: 'Crispy Chicken',    descripcion: 'Pollo crispy, coleslaw y mostaza miel',              precio: 3800, orden: 4 },
    { comercioId: burgerC.id, categoriaId: catCombos.id,  nombre: 'Combo Classic',     descripcion: 'Classic Burger + papas fritas + gaseosa',            precio: 5200, orden: 1 },
    { comercioId: burgerC.id, categoriaId: catCombos.id,  nombre: 'Combo BBQ',         descripcion: 'BBQ Burger + papas fritas + gaseosa',                precio: 5900, orden: 2 },
    { comercioId: burgerC.id, categoriaId: catCombos.id,  nombre: 'Combo Double',      descripcion: 'Double Smash + papas fritas + gaseosa',              precio: 6800, orden: 3 },
    { comercioId: burgerC.id, categoriaId: catBebB.id,    nombre: 'Gaseosa 500ml',     descripcion: 'Coca, Sprite o Fanta',                               precio: 900,  orden: 1 },
    { comercioId: burgerC.id, categoriaId: catBebB.id,    nombre: 'Agua mineral',      descripcion: 'Sin gas 500ml',                                      precio: 600,  orden: 2 },
  ]);

  // ─── EL RINCÓN DE LAS EMPANADAS ────────────────────────────────────────────
  const [catEmpHorno, catEmpFritas, catBebE] = await Categoria.bulkCreate([
    { comercioId: empanadasC.id, nombre: 'Al Horno',  orden: 1 },
    { comercioId: empanadasC.id, nombre: 'Fritas',    orden: 2 },
    { comercioId: empanadasC.id, nombre: 'Bebidas',   orden: 3 },
  ]);
  await Producto.bulkCreate([
    { comercioId: empanadasC.id, categoriaId: catEmpHorno.id,  nombre: 'Carne x12',          descripcion: 'Docena de carne cortada a cuchillo',           precio: 4800, orden: 1 },
    { comercioId: empanadasC.id, categoriaId: catEmpHorno.id,  nombre: 'Carne x6',           descripcion: 'Media docena de carne',                        precio: 2600, orden: 2 },
    { comercioId: empanadasC.id, categoriaId: catEmpHorno.id,  nombre: 'Pollo x12',          descripcion: 'Docena de pollo con morrones y aceitunas',     precio: 4600, orden: 3 },
    { comercioId: empanadasC.id, categoriaId: catEmpHorno.id,  nombre: 'Jamón y queso x12',  descripcion: 'Docena de jamón, queso y huevo duro',          precio: 4400, orden: 4 },
    { comercioId: empanadasC.id, categoriaId: catEmpHorno.id,  nombre: 'Caprese x12',        descripcion: 'Mozzarella, tomate y albahaca',                precio: 4200, orden: 5 },
    { comercioId: empanadasC.id, categoriaId: catEmpFritas.id, nombre: 'Humita x12',         descripcion: 'Empanadas fritas de choclo',                   precio: 4000, orden: 1 },
    { comercioId: empanadasC.id, categoriaId: catEmpFritas.id, nombre: 'Carne picante x12',  descripcion: 'Carne con ají molido, bien picante',           precio: 4800, orden: 2 },
    { comercioId: empanadasC.id, categoriaId: catBebE.id,      nombre: 'Coca-Cola 1.5L',     descripcion: 'Gaseosa',                                      precio: 1200, orden: 1 },
  ]);

  // ─── SUSHI CARLOS CASARES ──────────────────────────────────────────────────
  const [catRolls, catNigiri, catEspeciales] = await Categoria.bulkCreate([
    { comercioId: sushiC.id, nombre: 'Rolls',      orden: 1 },
    { comercioId: sushiC.id, nombre: 'Nigiri',     orden: 2 },
    { comercioId: sushiC.id, nombre: 'Especiales', orden: 3 },
  ]);
  await Producto.bulkCreate([
    { comercioId: sushiC.id, categoriaId: catRolls.id,     nombre: 'California Roll x8',   descripcion: 'Kani, palta y pepino',                          precio: 2800, orden: 1 },
    { comercioId: sushiC.id, categoriaId: catRolls.id,     nombre: 'Spicy Tuna x8',        descripcion: 'Atún, mayonesa picante y pepino',               precio: 3200, orden: 2 },
    { comercioId: sushiC.id, categoriaId: catRolls.id,     nombre: 'Dragon Roll x8',       descripcion: 'Langostino tempura, palta y anguila',           precio: 4500, orden: 3 },
    { comercioId: sushiC.id, categoriaId: catRolls.id,     nombre: 'Philadelphia x8',      descripcion: 'Salmón, queso crema y pepino',                  precio: 3400, orden: 4 },
    { comercioId: sushiC.id, categoriaId: catNigiri.id,    nombre: 'Nigiri Salmón x4',     descripcion: 'Arroz con lámina de salmón fresco',             precio: 2400, orden: 1 },
    { comercioId: sushiC.id, categoriaId: catNigiri.id,    nombre: 'Nigiri Kani x4',       descripcion: 'Arroz con kani',                                precio: 1800, orden: 2 },
    { comercioId: sushiC.id, categoriaId: catEspeciales.id, nombre: 'Combo 30 piezas',     descripcion: 'Selección del chef: rolls y nigiris variados',  precio: 9800, orden: 1 },
    { comercioId: sushiC.id, categoriaId: catEspeciales.id, nombre: 'Combo 16 piezas',     descripcion: 'California, Spicy Tuna y Nigiri Salmón',        precio: 5500, orden: 2 },
  ]);

  // ─── LA PARRILLA DEL CENTRO ────────────────────────────────────────────────
  const [catCarnes, catAchuras, catAcomp] = await Categoria.bulkCreate([
    { comercioId: parrillaC.id, nombre: 'Carnes',       orden: 1 },
    { comercioId: parrillaC.id, nombre: 'Achuras',      orden: 2 },
    { comercioId: parrillaC.id, nombre: 'Acompañamientos', orden: 3 },
  ]);
  await Producto.bulkCreate([
    { comercioId: parrillaC.id, categoriaId: catCarnes.id,  nombre: 'Asado 1kg',           descripcion: 'Asado de tira a la parrilla',                   precio: 6500, orden: 1 },
    { comercioId: parrillaC.id, categoriaId: catCarnes.id,  nombre: 'Vacío 1kg',           descripcion: 'Vacío jugoso a la leña',                        precio: 7000, orden: 2 },
    { comercioId: parrillaC.id, categoriaId: catCarnes.id,  nombre: 'Entrecot 400g',       descripcion: 'Corte grueso a la parrilla',                    precio: 5500, orden: 3 },
    { comercioId: parrillaC.id, categoriaId: catCarnes.id,  nombre: 'Choripán',            descripcion: 'Chorizo parrillero en pan lactal con chimichurri', precio: 1800, orden: 4 },
    { comercioId: parrillaC.id, categoriaId: catAchuras.id, nombre: 'Mollejas 500g',       descripcion: 'Mollejas tiernas a la parrilla',                precio: 4200, orden: 1 },
    { comercioId: parrillaC.id, categoriaId: catAchuras.id, nombre: 'Chinchulines 500g',   descripcion: 'Chinchulines crocantes',                        precio: 3800, orden: 2 },
    { comercioId: parrillaC.id, categoriaId: catAcomp.id,   nombre: 'Ensalada mixta',      descripcion: 'Lechuga, tomate, zanahoria y oliva',            precio: 1500, orden: 1 },
    { comercioId: parrillaC.id, categoriaId: catAcomp.id,   nombre: 'Papas fritas',        descripcion: 'Porción grande de papas',                       precio: 1800, orden: 2 },
    { comercioId: parrillaC.id, categoriaId: catAcomp.id,   nombre: 'Pan de campo x4',     descripcion: 'Pan artesanal para acompañar',                  precio: 800,  orden: 3 },
  ]);

  // ─── POLLO EXPRESS ────────────────────────────────────────────────────────
  const [catPollos, catMilas, catBebPo] = await Categoria.bulkCreate([
    { comercioId: polloC.id, nombre: 'Pollos',     orden: 1 },
    { comercioId: polloC.id, nombre: 'Milanesas',  orden: 2 },
    { comercioId: polloC.id, nombre: 'Bebidas',    orden: 3 },
  ]);
  await Producto.bulkCreate([
    { comercioId: polloC.id, categoriaId: catPollos.id, nombre: 'Pollo entero al spiedo',  descripcion: 'Pollo completo con papas al horno',            precio: 5800, orden: 1 },
    { comercioId: polloC.id, categoriaId: catPollos.id, nombre: 'Medio pollo',             descripcion: 'Medio pollo con papas',                        precio: 3200, orden: 2 },
    { comercioId: polloC.id, categoriaId: catPollos.id, nombre: 'Cuarto de pollo',         descripcion: 'Cuarto de pollo con papas fritas',             precio: 2000, orden: 3 },
    { comercioId: polloC.id, categoriaId: catMilas.id,  nombre: 'Milanesa de pollo',       descripcion: 'Milanesa napolitana con papas',                precio: 2800, orden: 1 },
    { comercioId: polloC.id, categoriaId: catMilas.id,  nombre: 'Milanesa de ternera',     descripcion: 'Milanesa grande con ensalada',                 precio: 3200, orden: 2 },
    { comercioId: polloC.id, categoriaId: catBebPo.id,  nombre: 'Coca-Cola 1.5L',          descripcion: 'Gaseosa',                                      precio: 1200, orden: 1 },
  ]);

  // ─── LA LICORERA ──────────────────────────────────────────────────────────
  const [catVinos, catCervezas, catEspirituosos] = await Categoria.bulkCreate([
    { comercioId: licoreraC.id, nombre: 'Vinos',        orden: 1 },
    { comercioId: licoreraC.id, nombre: 'Cervezas',     orden: 2 },
    { comercioId: licoreraC.id, nombre: 'Espirituosos', orden: 3 },
  ]);
  await Producto.bulkCreate([
    { comercioId: licoreraC.id, categoriaId: catVinos.id,       nombre: 'Malbec Trapiche 750ml',   descripcion: 'Vino tinto reserva',                  precio: 2800, orden: 1 },
    { comercioId: licoreraC.id, categoriaId: catVinos.id,       nombre: 'Chardonnay Santa Julia',  descripcion: 'Vino blanco fresco y afrutado',        precio: 2400, orden: 2 },
    { comercioId: licoreraC.id, categoriaId: catVinos.id,       nombre: 'Espumante Chandon',       descripcion: 'Brut natural 750ml',                   precio: 4200, orden: 3 },
    { comercioId: licoreraC.id, categoriaId: catCervezas.id,    nombre: 'Corona x6',               descripcion: 'Six pack lata 473ml',                  precio: 3600, orden: 1 },
    { comercioId: licoreraC.id, categoriaId: catCervezas.id,    nombre: 'Quilmes 1L',              descripcion: 'Cerveza rubia retornable',             precio: 1600, orden: 2 },
    { comercioId: licoreraC.id, categoriaId: catCervezas.id,    nombre: 'Stella Artois 710ml x6',  descripcion: 'Six pack botella',                     precio: 4800, orden: 3 },
    { comercioId: licoreraC.id, categoriaId: catEspirituosos.id, nombre: 'Fernet Branca 750ml',   descripcion: 'El clásico amargo argentino',          precio: 4500, orden: 1 },
    { comercioId: licoreraC.id, categoriaId: catEspirituosos.id, nombre: 'Gin Beefeater 750ml',   descripcion: 'Gin London Dry',                       precio: 6200, orden: 2 },
    { comercioId: licoreraC.id, categoriaId: catEspirituosos.id, nombre: 'Whisky Jameson 700ml',  descripcion: 'Irish Whiskey suave',                  precio: 7800, orden: 3 },
  ]);

  // ─── CERVECERÍA ARTESANAL CC ───────────────────────────────────────────────
  const [catArte, catComboCerv] = await Categoria.bulkCreate([
    { comercioId: cerveceriaC.id, nombre: 'Cervezas Artesanales', orden: 1 },
    { comercioId: cerveceriaC.id, nombre: 'Combos',               orden: 2 },
  ]);
  await Producto.bulkCreate([
    { comercioId: cerveceriaC.id, categoriaId: catArte.id,     nombre: 'Rubia 1L',          descripcion: 'Lager artesanal, suave y refrescante',              precio: 2200, orden: 1 },
    { comercioId: cerveceriaC.id, categoriaId: catArte.id,     nombre: 'Roja 1L',           descripcion: 'Cerveza roja con notas carameladas',                precio: 2400, orden: 2 },
    { comercioId: cerveceriaC.id, categoriaId: catArte.id,     nombre: 'Stout 1L',          descripcion: 'Cerveza negra cremosa, notas a café y chocolate',   precio: 2600, orden: 3 },
    { comercioId: cerveceriaC.id, categoriaId: catArte.id,     nombre: 'IPA 1L',            descripcion: 'India Pale Ale, lupulada y aromática',              precio: 2600, orden: 4 },
    { comercioId: cerveceriaC.id, categoriaId: catComboCerv.id, nombre: 'Combo 4L Variado', descripcion: '4 litros a elección de estilos',                   precio: 8400, orden: 1 },
    { comercioId: cerveceriaC.id, categoriaId: catComboCerv.id, nombre: 'Growler 2L',       descripcion: 'Bidón reutilizable de 2L a elección',               precio: 4200, orden: 2 },
  ]);

  // ─── FARMACIA CENTRAL ─────────────────────────────────────────────────────
  const [catMeds, catCuidado, catOrtopedia] = await Categoria.bulkCreate([
    { comercioId: farmaciaC.id, nombre: 'Medicamentos',     orden: 1 },
    { comercioId: farmaciaC.id, nombre: 'Cuidado Personal', orden: 2 },
    { comercioId: farmaciaC.id, nombre: 'Ortopedia',        orden: 3 },
  ]);
  await Producto.bulkCreate([
    { comercioId: farmaciaC.id, categoriaId: catMeds.id,       nombre: 'Ibuprofeno 400mg x20',    descripcion: 'Analgésico y antiinflamatorio',              precio: 1800, orden: 1 },
    { comercioId: farmaciaC.id, categoriaId: catMeds.id,       nombre: 'Paracetamol 500mg x20',   descripcion: 'Analgésico y antipirético',                  precio: 1400, orden: 2 },
    { comercioId: farmaciaC.id, categoriaId: catMeds.id,       nombre: 'Amoxicilina 500mg x21',   descripcion: 'Antibiótico de amplio espectro (receta)',    precio: 3200, orden: 3 },
    { comercioId: farmaciaC.id, categoriaId: catMeds.id,       nombre: 'Antiácido Calcital x20',  descripcion: 'Para el malestar estomacal',                 precio: 1600, orden: 4 },
    { comercioId: farmaciaC.id, categoriaId: catMeds.id,       nombre: 'Loratadina x10',          descripcion: 'Antihistamínico para alergias',              precio: 1200, orden: 5 },
    { comercioId: farmaciaC.id, categoriaId: catCuidado.id,    nombre: 'Protector Solar FPS50',   descripcion: 'Protección solar alta 100ml',                precio: 3800, orden: 1 },
    { comercioId: farmaciaC.id, categoriaId: catCuidado.id,    nombre: 'Alcohol en gel 500ml',    descripcion: 'Higiene y desinfección',                     precio: 1200, orden: 2 },
    { comercioId: farmaciaC.id, categoriaId: catCuidado.id,    nombre: 'Pañales Pampers talle M', descripcion: 'Pack x30 unidades',                          precio: 7500, orden: 3 },
    { comercioId: farmaciaC.id, categoriaId: catOrtopedia.id,  nombre: 'Termómetro digital',      descripcion: 'Medición rápida en 10 segundos',             precio: 4500, orden: 1 },
    { comercioId: farmaciaC.id, categoriaId: catOrtopedia.id,  nombre: 'Tensiómetro digital',     descripcion: 'Para control de presión arterial',           precio: 12000, orden: 2 },
  ]);

  // ─── FARMACIA SAN MARTÍN ──────────────────────────────────────────────────
  const [catMedsSM, catCosm] = await Categoria.bulkCreate([
    { comercioId: farmaciaSMC.id, nombre: 'Medicamentos',  orden: 1 },
    { comercioId: farmaciaSMC.id, nombre: 'Cosmética',     orden: 2 },
  ]);
  await Producto.bulkCreate([
    { comercioId: farmaciaSMC.id, categoriaId: catMedsSM.id, nombre: 'Ibuprofeno 600mg x20',  descripcion: 'Analgésico fuerte',                          precio: 2200, orden: 1 },
    { comercioId: farmaciaSMC.id, categoriaId: catMedsSM.id, nombre: 'Aspirina 500mg x20',    descripcion: 'Ácido acetilsalicílico',                      precio: 1200, orden: 2 },
    { comercioId: farmaciaSMC.id, categoriaId: catMedsSM.id, nombre: 'Omeprazol 20mg x14',    descripcion: 'Inhibidor de la bomba de protones',           precio: 2800, orden: 3 },
    { comercioId: farmaciaSMC.id, categoriaId: catMedsSM.id, nombre: 'Vitamina C 1g x10',     descripcion: 'Suplemento vitamínico efervescente',          precio: 1600, orden: 4 },
    { comercioId: farmaciaSMC.id, categoriaId: catCosm.id,   nombre: 'Crema hidratante Nivea', descripcion: 'Hidratación profunda 200ml',                 precio: 2400, orden: 1 },
    { comercioId: farmaciaSMC.id, categoriaId: catCosm.id,   nombre: 'Shampoo Pantene 400ml',  descripcion: 'Para cabello dañado',                        precio: 2800, orden: 2 },
    { comercioId: farmaciaSMC.id, categoriaId: catCosm.id,   nombre: 'Desodorante Rexona',     descripcion: 'Roll-on 50ml',                               precio: 1400, orden: 3 },
  ]);

  // ─── SUPER DÍA EXPRESS ────────────────────────────────────────────────────
  const [catVerd, catLact, catDesp] = await Categoria.bulkCreate([
    { comercioId: superdiaC.id, nombre: 'Verdulería',  orden: 1 },
    { comercioId: superdiaC.id, nombre: 'Lácteos',     orden: 2 },
    { comercioId: superdiaC.id, nombre: 'Despensa',    orden: 3 },
  ]);
  await Producto.bulkCreate([
    { comercioId: superdiaC.id, categoriaId: catVerd.id, nombre: 'Tomates x1kg',         descripcion: 'Tomates frescos',                              precio: 900,  orden: 1 },
    { comercioId: superdiaC.id, categoriaId: catVerd.id, nombre: 'Papas x2kg',           descripcion: 'Papas para freír o hervir',                    precio: 1200, orden: 2 },
    { comercioId: superdiaC.id, categoriaId: catVerd.id, nombre: 'Lechuga criolla',      descripcion: 'Unidad fresca',                                precio: 600,  orden: 3 },
    { comercioId: superdiaC.id, categoriaId: catVerd.id, nombre: 'Cebolla x1kg',         descripcion: 'Cebollas blancas',                             precio: 700,  orden: 4 },
    { comercioId: superdiaC.id, categoriaId: catLact.id, nombre: 'Leche entera 1L',      descripcion: 'La Serenísima larga vida',                     precio: 1100, orden: 1 },
    { comercioId: superdiaC.id, categoriaId: catLact.id, nombre: 'Yogur entero x4',      descripcion: 'Yogur La Serenísima sabores',                  precio: 2200, orden: 2 },
    { comercioId: superdiaC.id, categoriaId: catLact.id, nombre: 'Queso cremoso 400g',   descripcion: 'Queso para untar La Paulina',                  precio: 2800, orden: 3 },
    { comercioId: superdiaC.id, categoriaId: catDesp.id, nombre: 'Arroz largo fino 1kg', descripcion: 'Marca Gallo',                                  precio: 1400, orden: 1 },
    { comercioId: superdiaC.id, categoriaId: catDesp.id, nombre: 'Fideos tallarín 500g', descripcion: 'Lucchetti o similar',                          precio: 900,  orden: 2 },
    { comercioId: superdiaC.id, categoriaId: catDesp.id, nombre: 'Aceite girasol 1.5L',  descripcion: 'Cocinero o Natura',                            precio: 2200, orden: 3 },
    { comercioId: superdiaC.id, categoriaId: catDesp.id, nombre: 'Azúcar 1kg',           descripcion: 'Azúcar blanca refinada',                       precio: 800,  orden: 4 },
  ]);

  // ─── ALMACÉN EL PROGRESO ──────────────────────────────────────────────────
  const [catFiamb, catConservas] = await Categoria.bulkCreate([
    { comercioId: almacenC.id, nombre: 'Fiambres y Quesos', orden: 1 },
    { comercioId: almacenC.id, nombre: 'Conservas',         orden: 2 },
  ]);
  await Producto.bulkCreate([
    { comercioId: almacenC.id, categoriaId: catFiamb.id,    nombre: 'Jamón cocido x200g',      descripcion: 'Feteado al momento',                       precio: 2200, orden: 1 },
    { comercioId: almacenC.id, categoriaId: catFiamb.id,    nombre: 'Salame x200g',            descripcion: 'Salame casalingo',                         precio: 2600, orden: 2 },
    { comercioId: almacenC.id, categoriaId: catFiamb.id,    nombre: 'Queso pategrás x200g',    descripcion: 'Queso feteado fresco',                     precio: 3000, orden: 3 },
    { comercioId: almacenC.id, categoriaId: catConservas.id, nombre: 'Atún al natural x170g',  descripcion: 'Lata Cormoran o similar',                  precio: 1200, orden: 1 },
    { comercioId: almacenC.id, categoriaId: catConservas.id, nombre: 'Tomates perita x400g',   descripcion: 'Tomates al natural en lata',               precio: 900,  orden: 2 },
    { comercioId: almacenC.id, categoriaId: catConservas.id, nombre: 'Aceitunas verdes x200g', descripcion: 'Con carozo en salmuera',                   precio: 1400, orden: 3 },
  ]);

  // ─── FERRETERÍA EL TORNILLO ───────────────────────────────────────────────
  const [catHerr, catPintura, catHogar] = await Categoria.bulkCreate([
    { comercioId: ferreteriaC.id, nombre: 'Herramientas', orden: 1 },
    { comercioId: ferreteriaC.id, nombre: 'Pintura',      orden: 2 },
    { comercioId: ferreteriaC.id, nombre: 'Hogar',        orden: 3 },
  ]);
  await Producto.bulkCreate([
    { comercioId: ferreteriaC.id, categoriaId: catHerr.id,    nombre: 'Cinta de aislar',        descripcion: 'Rollo negro 10m',                          precio: 600,  orden: 1 },
    { comercioId: ferreteriaC.id, categoriaId: catHerr.id,    nombre: 'Taladro Gamma 500W',     descripcion: 'Con maletín y accesorios',                 precio: 18000, orden: 2 },
    { comercioId: ferreteriaC.id, categoriaId: catHerr.id,    nombre: 'Juego destornilladores', descripcion: 'Set x8 piezas Stanley',                    precio: 3500, orden: 3 },
    { comercioId: ferreteriaC.id, categoriaId: catPintura.id, nombre: 'Látex interior 4L',      descripcion: 'Sherwin Williams blanco mate',             precio: 8500, orden: 1 },
    { comercioId: ferreteriaC.id, categoriaId: catPintura.id, nombre: 'Pintura esmalte 1L',     descripcion: 'Alba o similar, variedad de colores',     precio: 3200, orden: 2 },
    { comercioId: ferreteriaC.id, categoriaId: catPintura.id, nombre: 'Rodillo + bandeja',      descripcion: 'Set para pintar paredes',                  precio: 2200, orden: 3 },
    { comercioId: ferreteriaC.id, categoriaId: catHogar.id,   nombre: 'Lamparita LED 9W',       descripcion: 'Cálida E27, larga duración',               precio: 900,  orden: 1 },
    { comercioId: ferreteriaC.id, categoriaId: catHogar.id,   nombre: 'Cinta doble faz 3M',     descripcion: 'Rollo 5m, resistente',                     precio: 1200, orden: 2 },
  ]);

  // ─── HELADERÍA EL PIBE ─────────────────────────────────────────────────────
  const [catHel, catTortas] = await Categoria.bulkCreate([
    { comercioId: heladeriaC.id, nombre: 'Helados',        orden: 1 },
    { comercioId: heladeriaC.id, nombre: 'Tortas Heladas', orden: 2 },
  ]);
  await Producto.bulkCreate([
    { comercioId: heladeriaC.id, categoriaId: catHel.id,   nombre: '1/4 kg de helado',    descripcion: '1 sabor a elección',                           precio: 1200, orden: 1 },
    { comercioId: heladeriaC.id, categoriaId: catHel.id,   nombre: '1/2 kg de helado',    descripcion: 'Hasta 2 sabores',                              precio: 2200, orden: 2 },
    { comercioId: heladeriaC.id, categoriaId: catHel.id,   nombre: '1 kg de helado',      descripcion: 'Hasta 3 sabores',                              precio: 4000, orden: 3 },
    { comercioId: heladeriaC.id, categoriaId: catHel.id,   nombre: '2 kg de helado',      descripcion: 'Hasta 4 sabores, ideal para fiestas',          precio: 7500, orden: 4 },
    { comercioId: heladeriaC.id, categoriaId: catTortas.id, nombre: 'Torta helada chica', descripcion: '6 porciones, 2 sabores + bizcochuelo',         precio: 6500, orden: 1 },
    { comercioId: heladeriaC.id, categoriaId: catTortas.id, nombre: 'Torta helada grande', descripcion: '12 porciones, personalizable',                precio: 12000, orden: 2 },
    { comercioId: heladeriaC.id, categoriaId: catTortas.id, nombre: 'Paletas x6',          descripcion: 'Paletas de fruta o chocolate',                precio: 2400, orden: 3 },
  ]);

  // ─── LIBRERÍA Y PAPELERÍA ESTUDIO ──────────────────────────────────────────
  const [catUtil, catLibros] = await Categoria.bulkCreate([
    { comercioId: libreriaC.id, nombre: 'Útiles y Oficina', orden: 1 },
    { comercioId: libreriaC.id, nombre: 'Libros',           orden: 2 },
  ]);
  await Producto.bulkCreate([
    { comercioId: libreriaC.id, categoriaId: catUtil.id,   nombre: 'Resma A4 500 hojas',     descripcion: 'Papel 75g marca Navigator',                  precio: 3800, orden: 1 },
    { comercioId: libreriaC.id, categoriaId: catUtil.id,   nombre: 'Bolígrafos Bic x12',     descripcion: 'Caja de lapiceras azules',                   precio: 900,  orden: 2 },
    { comercioId: libreriaC.id, categoriaId: catUtil.id,   nombre: 'Carpeta A4 con ganchos', descripcion: 'Carpeta escolar o universitaria',            precio: 1400, orden: 3 },
    { comercioId: libreriaC.id, categoriaId: catUtil.id,   nombre: 'Tijera escolar',         descripcion: 'Mango plástico, hoja de acero',              precio: 600,  orden: 4 },
    { comercioId: libreriaC.id, categoriaId: catUtil.id,   nombre: 'Marcadores x12',         descripcion: 'Fibras de colores surtidos',                 precio: 1200, orden: 5 },
    { comercioId: libreriaC.id, categoriaId: catLibros.id, nombre: 'Cuaderno espiral 84h',   descripcion: 'Cuaderno universitario rayado',              precio: 1800, orden: 1 },
    { comercioId: libreriaC.id, categoriaId: catLibros.id, nombre: 'Agenda 2026',            descripcion: 'Agenda semanal con tapas duras',             precio: 2800, orden: 2 },
  ]);

  console.log('\n=== SEED COMPLETADO ===');
  console.log('Usuarios:');
  console.log('  admin@deliverycs.com         / admin123  (admin)');
  console.log('  pizzamaster@deliverycs.com   / 123456    (comerciante)');
  console.log('  burger@deliverycs.com        / 123456    (comerciante)');
  console.log('  farmacia@deliverycs.com      / 123456    (comerciante)');
  console.log('  empanadas@deliverycs.com     / 123456    (comerciante)');
  console.log('  sushi@deliverycs.com         / 123456    (comerciante)');
  console.log('  parrilla@deliverycs.com      / 123456    (comerciante)');
  console.log('  polloexpress@deliverycs.com  / 123456    (comerciante)');
  console.log('  licorera@deliverycs.com      / 123456    (comerciante)');
  console.log('  cerveceria@deliverycs.com    / 123456    (comerciante)');
  console.log('  farmaciasm@deliverycs.com    / 123456    (comerciante)');
  console.log('  superdia@deliverycs.com      / 123456    (comerciante)');
  console.log('  almacen@deliverycs.com       / 123456    (comerciante)');
  console.log('  ferreteria@deliverycs.com    / 123456    (comerciante)');
  console.log('  heladeria@deliverycs.com     / 123456    (comerciante)');
  console.log('  libreria@deliverycs.com      / 123456    (comerciante)');
  console.log('  carlos.del@deliverycs.com    / 123456    (delivery)');
  console.log('  lucia.del@deliverycs.com     / 123456    (delivery)');
  console.log('  martin.del@deliverycs.com    / 123456    (delivery)');
  console.log('  juan@deliverycs.com          / 123456    (cliente)');
  console.log('  ana@deliverycs.com           / 123456    (cliente)');
  console.log('  pedro@deliverycs.com         / 123456    (cliente)');
  console.log('  sofia@deliverycs.com         / 123456    (cliente)');
  console.log('  diego@deliverycs.com         / 123456    (cliente)');
  console.log('\nComercios (15 total):');
  console.log('  Comida (6):       Pizza Master, Burger House, Empanadas, Sushi, Parrilla, Pollo Express');
  console.log('  Bebidas (2):      La Licorera, Cervecería Artesanal CC');
  console.log('  Farmacia (2):     Farmacia Central, Farmacia San Martín');
  console.log('  Supermercado (2): Super Día Express, Almacén El Progreso');
  console.log('  Otros (3):        Ferretería El Tornillo, Heladería El Pibe, Librería Estudio');

  await sequelize.close();
};

seed().catch((err) => {
  console.error('Error en seed:', err.message);
  process.exit(1);
});
