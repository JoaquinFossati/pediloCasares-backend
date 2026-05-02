require('dotenv').config();
const sequelize = require('../config/database');
const { Comercio, Producto } = require('../models');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const U = (f) => `${BASE}/uploads/${f}`;

const seed = async () => {
  await sequelize.authenticate();
  console.log('Actualizando fotos y temas de comercios y productos...\n');

  // ─── COMERCIOS ────────────────────────────────────────────────────────────
  const comerciosFotos = [
    { nombre: 'Pizza Master',               foto: U('PizzeriaLOGO.png'),          colorFondo: '#7F1D1D', colorTexto: '#FFFFFF', colorAccento: '#FB923C' },
    { nombre: 'Burger House',               foto: U('HamburgueseriaLOGO.jpg'),    colorFondo: '#1A1F36', colorTexto: '#FFFFFF', colorAccento: '#7C83FD' },
    { nombre: 'El Rincón de las Empanadas', foto: U('CasaDeEMPANADAS-LOGO.jpg'), colorFondo: '#78350F', colorTexto: '#FFFFFF', colorAccento: '#FCD34D' },
    { nombre: 'Sushi Carlos Casares',       foto: U('SushiLOGO.jpg'),             colorFondo: '#0C0A09', colorTexto: '#FAFAF9', colorAccento: '#EF4444' },
    { nombre: 'La Parrilla del Centro',     foto: U('ParrillaLOGO.jpg'),          colorFondo: '#1A0800', colorTexto: '#FFF8F0', colorAccento: '#F97316' },
    { nombre: 'Pollo Express',              foto: null,                           colorFondo: '#292524', colorTexto: '#FAFAF9', colorAccento: '#D97706' },
    { nombre: 'La Licorera',               foto: U('LicoreriaLOGO.jpg'),         colorFondo: '#4A0522', colorTexto: '#FFF1F2', colorAccento: '#F43F5E' },
    { nombre: 'Cervecería Artesanal CC',    foto: U('CerveceriaLOGO.jpg'),        colorFondo: '#431407', colorTexto: '#FFF7ED', colorAccento: '#EA580C' },
    { nombre: 'Farmacia Central',           foto: U('FarmaciaLOGO1.jpg'),         colorFondo: '#F0FDF4', colorTexto: '#14532D', colorAccento: '#16A34A' },
    { nombre: 'Farmacia San Martín',        foto: U('FarmaciaLOGO2.jpg'),         colorFondo: '#F0FDFA', colorTexto: '#134E4A', colorAccento: '#14B8A6' },
    { nombre: 'Super Día Express',          foto: U('SupermercadoLOGO.jpg'),      colorFondo: '#1B4332', colorTexto: '#FFFFFF', colorAccento: '#52B788' },
    { nombre: 'Almacén El Progreso',        foto: U('SupermercadoLOGO.jpg'),      colorFondo: '#FFFBEB', colorTexto: '#713F12', colorAccento: '#D97706' },
    { nombre: 'Ferretería El Tornillo',     foto: U('FerreteriaLOGO.jpg'),        colorFondo: '#1C1917', colorTexto: '#F5F5F4', colorAccento: '#F59E0B' },
    { nombre: 'Heladería El Pibe',          foto: U('HeladireaLOGO.jpg'),         colorFondo: '#FDF4FF', colorTexto: '#701A75', colorAccento: '#E879F9' },
    { nombre: 'Librería y Papelería Estudio', foto: null,                         colorFondo: '#FAF5FF', colorTexto: '#4A1D96', colorAccento: '#8B5CF6' },
  ];

  for (const { nombre, foto, colorFondo, colorTexto, colorAccento } of comerciosFotos) {
    const update = { colorFondo, colorTexto, colorAccento };
    if (foto !== null) update.foto = foto;
    const [count] = await Comercio.update(update, { where: { nombre } });
    console.log(`  Comercio "${nombre}" → ${count ? '✅' : '⚠️ no encontrado'}`);
  }

  // ─── PRODUCTOS ────────────────────────────────────────────────────────────
  console.log('\nActualizando fotos de productos...\n');

  const productosFotos = [
    // ── Pizza Master ──────────────────────────────────────────────────────
    { nombre: 'Pizza Mozzarella',    foto: U('pizzaMOZZARELLA.jpg') },
    { nombre: 'Pizza Napolitana',    foto: U('pizza-napolitana.png') },
    { nombre: 'Pizza Especial',      foto: U('pizzaESPECIAL.jpg') },
    { nombre: 'Pizza 4 Quesos',      foto: U('pizza-cuatro-quesos.jpg') },
    { nombre: 'Pizza Fugazzeta',     foto: U('pizzaFUGAZZETA.jpg') },
    { nombre: 'Empanadas x12',       foto: U('EMPANADAS.png') },
    { nombre: 'Empanadas x6',        foto: U('EMPANADAS.png') },
    // ── Empanadas (El Rincón) ─────────────────────────────────────────────
    { nombre: 'Carne x12',           foto: U('EMPANADAS.png') },
    { nombre: 'Carne x6',            foto: U('EMPANADAS.png') },
    { nombre: 'Pollo x12',           foto: U('EMPANADAS.png') },
    { nombre: 'Jamón y queso x12',   foto: U('EMPANADAS.png') },
    { nombre: 'Caprese x12',         foto: U('EMPANADAS.png') },
    { nombre: 'Humita x12',          foto: U('EMPANADAS.png') },
    { nombre: 'Carne picante x12',   foto: U('EMPANADAS.png') },
    // ── Burger House ──────────────────────────────────────────────────────
    { nombre: 'Classic Burger',      foto: U('hamburguesa-clasica.jpg') },
    { nombre: 'BBQ Burger',          foto: U('HamburguesaBBQburger.jpg') },
    { nombre: 'Double Smash',        foto: U('Hamburguesa-DOBLE-smash.jpg') },
    { nombre: 'Crispy Chicken',      foto: U('HamburguesaPOLLO.jpg') },
    // ── Sushi ─────────────────────────────────────────────────────────────
    { nombre: 'California Roll x8',  foto: U('sushi.jpg') },
    { nombre: 'Spicy Tuna x8',       foto: U('sushi.jpg') },
    { nombre: 'Dragon Roll x8',      foto: U('sushi.jpg') },
    { nombre: 'Philadelphia x8',     foto: U('sushi.jpg') },
    { nombre: 'Nigiri Salmón x4',    foto: U('sushi.jpg') },
    { nombre: 'Nigiri Kani x4',      foto: U('sushi.jpg') },
    { nombre: 'Combo 30 piezas',     foto: U('sushi.jpg') },
    { nombre: 'Combo 16 piezas',     foto: U('sushi.jpg') },
    // ── La Parrilla ───────────────────────────────────────────────────────
    { nombre: 'Asado 1kg',           foto: U('AsadoDeTIRA.jpg') },
    { nombre: 'Vacío 1kg',           foto: U('VACIO.jpg') },
    { nombre: 'Entrecot 400g',       foto: U('ENTRECOT.jpg') },
    { nombre: 'Choripán',            foto: U('Coripan.jpg') },
    { nombre: 'Mollejas 500g',       foto: U('AsadoDeTIRA.jpg') },
    { nombre: 'Chinchulines 500g',   foto: U('AsadoDeTIRA.jpg') },
    { nombre: 'Ensalada mixta',      foto: U('EnsaladaMIXTA.jpg') },
    { nombre: 'Papas fritas',        foto: U('PapasFritas.jpg') },
    // ── La Licorera ───────────────────────────────────────────────────────
    { nombre: 'Malbec Trapiche 750ml',   foto: U('Licores.jpg') },
    { nombre: 'Chardonnay Santa Julia',  foto: U('Licores.jpg') },
    { nombre: 'Espumante Chandon',       foto: U('Licores.jpg') },
    { nombre: 'Corona x6',              foto: U('Cervezas.jpg') },
    { nombre: 'Quilmes 1L',             foto: U('Cervezas.jpg') },
    { nombre: 'Stella Artois 710ml x6', foto: U('Cervezas.jpg') },
    { nombre: 'Fernet Branca 750ml',    foto: U('Licores.jpg') },
    { nombre: 'Gin Beefeater 750ml',    foto: U('Licores.jpg') },
    { nombre: 'Whisky Jameson 700ml',   foto: U('Licores.jpg') },
    // ── Cervecería Artesanal CC ───────────────────────────────────────────
    { nombre: 'Rubia 1L',            foto: U('Cervezas.jpg') },
    { nombre: 'Roja 1L',             foto: U('Cervezas.jpg') },
    { nombre: 'Stout 1L',            foto: U('Cervezas.jpg') },
    { nombre: 'IPA 1L',              foto: U('Cervezas.jpg') },
    { nombre: 'Combo 4L Variado',    foto: U('Cervezas.jpg') },
    { nombre: 'Growler 2L',          foto: U('Cervezas.jpg') },
    // ── Farmacias ─────────────────────────────────────────────────────────
    { nombre: 'Ibuprofeno 400mg x20',    foto: U('Medicina.jpg') },
    { nombre: 'Paracetamol 500mg x20',   foto: U('Medicina.jpg') },
    { nombre: 'Amoxicilina 500mg x21',   foto: U('Medicina.jpg') },
    { nombre: 'Antiácido Calcital x20',  foto: U('Medicina.jpg') },
    { nombre: 'Loratadina x10',          foto: U('Medicina.jpg') },
    { nombre: 'Protector Solar FPS50',   foto: U('Medicina.jpg') },
    { nombre: 'Alcohol en gel 500ml',    foto: U('Medicina.jpg') },
    { nombre: 'Pañales Pampers talle M', foto: U('Medicina.jpg') },
    { nombre: 'Termómetro digital',      foto: U('Medicina.jpg') },
    { nombre: 'Tensiómetro digital',     foto: U('Medicina.jpg') },
    { nombre: 'Ibuprofeno 600mg x20',    foto: U('Medicina.jpg') },
    { nombre: 'Aspirina 500mg x20',      foto: U('Medicina.jpg') },
    { nombre: 'Omeprazol 20mg x14',      foto: U('Medicina.jpg') },
    { nombre: 'Vitamina C 1g x10',       foto: U('Medicina.jpg') },
    { nombre: 'Crema hidratante Nivea',  foto: U('Medicina.jpg') },
    { nombre: 'Shampoo Pantene 400ml',   foto: U('Medicina.jpg') },
    { nombre: 'Desodorante Rexona',      foto: U('Medicina.jpg') },
    // ── Heladería ─────────────────────────────────────────────────────────
    { nombre: '1/4 kg de helado',        foto: U('HELADO.jpg') },
    { nombre: '1/2 kg de helado',        foto: U('HELADO.jpg') },
    { nombre: '1 kg de helado',          foto: U('HELADO.jpg') },
    { nombre: '2 kg de helado',          foto: U('HELADO.jpg') },
    { nombre: 'Torta helada chica',      foto: U('HELADO.jpg') },
    { nombre: 'Torta helada grande',     foto: U('HELADO.jpg') },
    { nombre: 'Paletas x6',             foto: U('HELADO.jpg') },
    // ── Ferretería ────────────────────────────────────────────────────────
    { nombre: 'Cinta de aislar',         foto: U('Herramientas.jpg') },
    { nombre: 'Taladro Gamma 500W',      foto: U('Herramientas.jpg') },
    { nombre: 'Juego destornilladores',  foto: U('Herramientas.jpg') },
    { nombre: 'Látex interior 4L',       foto: U('Herramientas.jpg') },
    { nombre: 'Pintura esmalte 1L',      foto: U('Herramientas.jpg') },
    { nombre: 'Rodillo + bandeja',       foto: U('Herramientas.jpg') },
    { nombre: 'Lamparita LED 9W',        foto: U('Herramientas.jpg') },
    { nombre: 'Cinta doble faz 3M',      foto: U('Herramientas.jpg') },
    // ── Bebidas compartidas ───────────────────────────────────────────────
    { nombre: 'Coca-Cola 1.5L',          foto: U('COCA-COLA.jpg') },
    { nombre: 'Agua mineral 500ml',      foto: U('AGUA.jpg') },
    { nombre: 'Agua mineral',            foto: U('AGUA.jpg') },
    { nombre: 'Gaseosa 500ml',           foto: U('Gaseosas500ml.png') },
  ];

  for (const { nombre, foto } of productosFotos) {
    const [count] = await Producto.update({ foto }, { where: { nombre } });
    console.log(`  Producto "${nombre}" → ${count ? `✅ (${count} filas)` : '⚠️ no encontrado'}`);
  }

  console.log('\n=== FOTOS ACTUALIZADAS ===');
  await sequelize.close();
};

seed().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
