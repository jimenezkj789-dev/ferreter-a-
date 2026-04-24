import { collection, addDoc, getDocs, query, limit, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export const INVENTORY_SEED = [
  // Herramientas Manuales
  { sku: 'FER-003', name: 'Martillo Tramontina 16oz', category: 'Herramientas manuales', brand: 'Tramontina', buyPrice: 18.50, sellPrice: 28.00, stock: 25, minStock: 5, description: 'Martillo de uña curva con mango de madera.' },
  { sku: 'FER-004', name: 'Serrucho Stanley 18"', category: 'Herramientas manuales', brand: 'Stanley', buyPrice: 35.00, sellPrice: 52.00, stock: 12, minStock: 3, description: 'Serrucho para madera de corte fino.' },
  { sku: 'FER-005', name: 'Alicate Universal 8"', category: 'Herramientas manuales', brand: 'Stanley', buyPrice: 22.00, sellPrice: 34.50, stock: 18, minStock: 5, description: 'Alicate multiuso aislado.' },
  
  // Herramientas Eléctricas
  { sku: 'FER-006', name: 'Amoladora Bosch 4.5" 750W', category: 'Herramientas eléctricas', brand: 'Bosch', buyPrice: 185.00, sellPrice: 245.00, stock: 3, minStock: 5, description: 'Amoladora angular profesional.' }, // BAJO STOCK
  { sku: 'FER-007', name: 'Taladro Percutor Dewalt 20V', category: 'Herramientas eléctricas', brand: 'Dewalt', buyPrice: 420.00, sellPrice: 580.00, stock: 5, minStock: 2, description: 'Taladro inalámbrico con batería y cargador.' },
  { sku: 'FER-008', name: 'Sierra Circular Skil 1800W', category: 'Herramientas eléctricas', brand: 'Skil', buyPrice: 230.00, sellPrice: 310.00, stock: 2, minStock: 3, description: 'Sierra de alto rendimiento para madera.' }, // BAJO STOCK

  // Materiales de Construcción
  { sku: 'FER-001', name: 'Cemento Sol Tipo I (Bolsa 42.5kg)', category: 'Materiales de construcción', brand: 'Sol', buyPrice: 24.50, sellPrice: 28.50, stock: 80, minStock: 20, description: 'Cemento portland de uso general.' },
  { sku: 'FER-002', name: 'Fierro Corrugado 1/2" (9m)', category: 'Materiales de construcción', brand: 'Aceros Arequipa', buyPrice: 36.00, sellPrice: 42.00, stock: 150, minStock: 30, description: 'Varilla de construcción sismo resistente.' },
  { sku: 'FER-009', name: 'Ladrillo King Kong 18 huecos', category: 'Materiales de construcción', brand: 'Lark', buyPrice: 0.85, sellPrice: 1.20, stock: 500, minStock: 100, description: 'Ladrillo para muros portantes.' },
  
  // Electricidad
  { sku: 'FER-011', name: 'Cable THW 12 AWG (Rollo 100m)', category: 'Electricidad', brand: 'Indeco', buyPrice: 145.00, sellPrice: 185.00, stock: 15, minStock: 5, description: 'Cable de cobre unipolar para instalaciones.' },
  { sku: 'FER-012', name: 'Interruptor Bticino 1 dado', category: 'Electricidad', brand: 'Bticino', buyPrice: 4.50, sellPrice: 8.50, stock: 60, minStock: 10, description: 'Interruptor simple de pared.' },
  { sku: 'FER-013', name: 'Foco LED Philips 9W', category: 'Electricidad', brand: 'Philips', buyPrice: 6.20, sellPrice: 12.00, stock: 100, minStock: 20, description: 'Luz blanca fría de alta eficiencia.' },
  { sku: 'FER-014', name: 'Caja Octogonal PVC', category: 'Electricidad', brand: 'Pavco', buyPrice: 0.60, sellPrice: 1.50, stock: 200, minStock: 50, description: 'Caja para derivación eléctrica.' },

  // Gasfitería
  { sku: 'FER-018', name: 'Tubo PVC Agua 1/2" (5m)', category: 'Gasfitería', brand: 'Pavco', buyPrice: 5.50, sellPrice: 8.50, stock: 4, minStock: 10, description: 'Tubo para conducción de agua a presión.' }, // BAJO STOCK
  { sku: 'FER-019', name: 'Pegamento PVC 1/4 Galón', category: 'Gasfitería', brand: 'Oatey', buyPrice: 22.00, sellPrice: 35.00, stock: 8, minStock: 3, description: 'Adhesivo fuerte para uniones de PVC.' },
  { sku: 'FER-020', name: 'Llave de paso 1/2" Bronce', category: 'Gasfitería', brand: 'Cim', buyPrice: 12.50, sellPrice: 22.00, stock: 15, minStock: 5, description: 'Válvula de compuerta metálica.' },
  { sku: 'FER-021', name: 'Cinta Teflón 1/2" x 12m', category: 'Gasfitería', brand: 'Generic', buyPrice: 0.80, sellPrice: 2.00, stock: 120, minStock: 24, description: 'Sellador para roscas de agua.' },

  // Pinturas
  { sku: 'FER-032', name: 'Pintura Latex Blanco (5 Galones)', category: 'Pinturas y acabados', brand: 'Vencedor', buyPrice: 125.00, sellPrice: 165.00, stock: 12, minStock: 3, description: 'Pintura lavable para interiores.' },
  { sku: 'FER-033', name: 'Esmalte Negro Satinado (1 Galón)', category: 'Pinturas y acabados', brand: 'Tekno', buyPrice: 42.00, sellPrice: 65.00, stock: 10, minStock: 2, description: 'Pintura para metal y madera.' },
  { sku: 'FER-034', name: 'Brocha Cerda Blanca 3"', category: 'Pinturas y acabados', brand: 'Tumi', buyPrice: 3.50, sellPrice: 8.00, stock: 40, minStock: 10, description: 'Brocha profesional para acabados finos.' },
  
  // Tornillería y Fijaciones
  { sku: 'FER-040', name: 'Clavo para madera 2" (kg)', category: 'Tornillería y fijaciones', brand: 'Inca', buyPrice: 4.80, sellPrice: 8.50, stock: 45, minStock: 10, description: 'Clavo con cabeza para carpintería.' },
  { sku: 'FER-041', name: 'Tornillo Drywall 1" x 100u', category: 'Tornillería y fijaciones', brand: 'Generic', buyPrice: 5.50, sellPrice: 12.00, stock: 30, minStock: 5, description: 'Tornillo punta aguja para planchas.' },
  { sku: 'FER-042', name: 'Tarugo de expansión 1/4" (100u)', category: 'Tornillería y fijaciones', brand: 'Sika', buyPrice: 6.00, sellPrice: 15.00, stock: 2, minStock: 5, description: 'Tarugo plástico para pared.' }, // BAJO STOCK

  // Seguridad Industrial
  { sku: 'FER-050', name: 'Casco de Seguridad Blanco', category: 'Seguridad industrial', brand: '3M', buyPrice: 15.00, sellPrice: 28.00, stock: 14, minStock: 5, description: 'Casco con suspensión regulable.' },
  { sku: 'FER-051', name: 'Guantes de Cuero Reforzado', category: 'Seguridad industrial', brand: 'Steelpro', buyPrice: 8.50, sellPrice: 18.00, stock: 4, minStock: 10, description: 'EPI para carga y trabajos pesados.' }, // BAJO STOCK
  { sku: 'FER-052', name: 'Lentes de Seguridad Claros', category: 'Seguridad industrial', brand: 'Steelpro', buyPrice: 5.50, sellPrice: 12.00, stock: 25, minStock: 5, description: 'Lentes con protección UV.' },
  
  // Extension to 40+ products
  { sku: 'FER-060', name: 'Nivel de Burbuja 24"', category: 'Herramientas manuales', brand: 'Stanley', buyPrice: 45.00, sellPrice: 65.00, stock: 8, minStock: 2, description: 'Nivel de aluminio con 3 burbujas.' },
  { sku: 'FER-061', name: 'Wincha de 5m', category: 'Herramientas manuales', brand: 'Stanley', buyPrice: 12.00, sellPrice: 22.00, stock: 30, minStock: 5, description: 'Cinta métrica resistente a impactos.' },
  { sku: 'FER-062', name: 'Escuadra de Combinación 12"', category: 'Herramientas manuales', brand: 'Bahco', buyPrice: 38.00, sellPrice: 55.00, stock: 6, minStock: 2, description: 'Escuadra metálica para carpintería.' },
  
  { sku: 'FER-070', name: 'Taladro de Columna 1/2 HP', category: 'Herramientas eléctricas', brand: 'Indura', buyPrice: 850.00, sellPrice: 1150.00, stock: 2, minStock: 1, description: 'Taladro de banco estacionario profesional.' },
  { sku: 'FER-071', name: 'Soldadora Inverter 200A', category: 'Herramientas eléctricas', brand: 'Soldimax', buyPrice: 450.00, sellPrice: 620.00, stock: 4, minStock: 2, description: 'Máquina de soldar compacta.' },
  
  { sku: 'FER-080', name: 'Arena Fina (m3)', category: 'Materiales de construcción', brand: 'Generic', buyPrice: 45.00, sellPrice: 65.00, stock: 10, minStock: 5, description: 'Material para tarrajeo y acabados.' },
  { sku: 'FER-081', name: 'Piedra Chancada 1/2" (m3)', category: 'Materiales de construcción', brand: 'Generic', buyPrice: 55.00, sellPrice: 85.00, stock: 15, minStock: 5, description: 'Agregado para concreto armado.' },
  
  { sku: 'FER-090', name: 'Codo PVC 90x2" Desagüe', category: 'Gasfitería', brand: 'Pavco', buyPrice: 1.20, sellPrice: 2.80, stock: 45, minStock: 10, description: 'Accesorio para evacuación sanitaria.' },
  { sku: 'FER-091', name: 'Tee PVC 2" Desagüe', category: 'Gasfitería', brand: 'Pavco', buyPrice: 1.80, sellPrice: 4.50, stock: 30, minStock: 10, description: 'Conexión en T para tuberías.' },
  { sku: 'FER-092', name: 'Sumidero de Bronce 2"', category: 'Gasfitería', brand: 'Cim', buyPrice: 18.00, sellPrice: 32.00, stock: 12, minStock: 4, description: 'Rejilla metálica para duchas.' },
  
  { sku: 'FER-100', name: 'Llave Térmica 2x30A', category: 'Electricidad', brand: 'Schneider', buyPrice: 22.00, sellPrice: 45.00, stock: 15, minStock: 5, description: 'Interruptor termomagnético riel din.' },
  { sku: 'FER-101', name: 'Tablero Eléctrico 8 Polos', category: 'Electricidad', brand: 'Bticino', buyPrice: 45.00, sellPrice: 85.00, stock: 8, minStock: 2, description: 'Caja metálica para interruptores.' },
  { sku: 'FER-102', name: 'Canaleta 20x10mm (Tramo 2m)', category: 'Electricidad', brand: 'Dexson', buyPrice: 3.50, sellPrice: 7.50, stock: 40, minStock: 10, description: 'Organizador de cables de PVC blanco.' },
  
  { sku: 'FER-110', name: 'Thinner Acrílico (Galón)', category: 'Pinturas y acabados', brand: 'Tekno', buyPrice: 18.00, sellPrice: 32.00, stock: 20, minStock: 5, description: 'Solvente para pinturas y limpieza.' },
  { sku: 'FER-111', name: 'Rodillo de Felpa 9"', category: 'Pinturas y acabados', brand: 'Generic', buyPrice: 6.50, sellPrice: 14.00, stock: 25, minStock: 6, description: 'Rodillo para paredes rugosas.' },
  { sku: 'FER-112', name: 'Espátula de Acero 4"', category: 'Pinturas y acabados', brand: 'Tramontina', buyPrice: 4.50, sellPrice: 9.50, stock: 15, minStock: 4, description: 'Para raspado y aplicación de masilla.' },
];

export const seedDatabase = async () => {
  const productsSnap = await getDocs(query(collection(db, 'products'), limit(1)));
  if (!productsSnap.empty) {
    return { alreadyCargado: true };
  }

  const results = { success: 0, errors: 0 };

  for (const item of INVENTORY_SEED) {
    try {
      await addDoc(collection(db, 'products'), {
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      results.success++;
    } catch (e) {
      results.errors++;
      console.error(e);
    }
  }

  return results;
};

export const clearAndSeedDatabase = async () => {
  const productsSnap = await getDocs(collection(db, 'products'));
  const batch = writeBatch(db);
  
  productsSnap.docs.forEach((productDoc) => {
    batch.delete(productDoc.ref);
  });
  
  await batch.commit();

  return await seedDatabase();
};

