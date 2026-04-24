import { doc, getDoc, setDoc, updateDoc, increment, collection, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { BusinessSettings, Invoice, InvoiceItem, Customer } from '../types';

export const DEFAULT_SETTINGS: BusinessSettings = {
  ruc: '20123456789',
  razonSocial: 'Ferretería El Tornillo S.A.C.',
  direccion: 'Av. Las Gardenias 123, Lima, Perú',
  boletaSeries: 'B001',
  facturaSeries: 'F001',
  guiaSeries: 'T001',
  nextBoletaNumber: 1,
  nextFacturaNumber: 1,
  nextGuiaNumber: 1,
};

export const getBusinessSettings = async (): Promise<BusinessSettings> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'business'));
    if (settingsDoc.exists()) {
      return { ...DEFAULT_SETTINGS, ...settingsDoc.data() } as BusinessSettings;
    }
    // Try to initialize if possible, but don't fail if we can't
    try {
      await setDoc(doc(db, 'settings', 'business'), DEFAULT_SETTINGS);
    } catch (e) {
      console.warn("Could not save default settings (likely permissions), using in-memory defaults.");
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Error fetching business settings:", error);
    return DEFAULT_SETTINGS;
  }
};

export const calculateTotals = (items: InvoiceItem[]) => {
  const total = items.reduce((acc, item) => acc + item.total, 0);
  const igv = total * 0.18 / 1.18; // Included IGV
  const subtotal = total - igv;
  return { subtotal, igv, total };
};

export const createElectronicInvoice = async (
  invoiceData: Omit<Invoice, 'id' | 'series' | 'number' | 'status'>,
  settings: BusinessSettings
): Promise<string> => {
  const { type } = invoiceData;
  const series = type === 'boleta' ? settings.boletaSeries : 
                 type === 'factura' ? settings.facturaSeries : settings.guiaSeries;
  
  return await runTransaction(db, async (transaction) => {
    // 1. Get and increment sequence number
    const settingsRef = doc(db, 'settings', 'business');
    const settingsSnap = await transaction.get(settingsRef);
    const currentSettings = settingsSnap.exists() ? settingsSnap.data() as BusinessSettings : settings;
    const nextNumber = type === 'boleta' ? currentSettings.nextBoletaNumber : 
                       type === 'factura' ? currentSettings.nextFacturaNumber : currentSettings.nextGuiaNumber;

    // 2. Get all products first (READS)
    const productUpdates = [];
    for (const item of invoiceData.items) {
      const productRef = doc(db, 'products', item.productId);
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) throw new Error(`Producto ${item.name} no existe`);
      const productData = productSnap.data();
      if (productData.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${item.name}`);
      }
      productUpdates.push({ ref: productRef, quantity: item.quantity });
    }

    // 3. Now perform all WRITES
    for (const update of productUpdates) {
      transaction.update(update.ref, {
        stock: increment(-update.quantity),
        updatedAt: new Date().toISOString()
      });
    }

    // 4. Create invoice document
    const invoiceId = `${series}-${String(nextNumber).padStart(6, '0')}`;
    const invoiceRef = doc(collection(db, 'invoices'), invoiceId);
    
    const finalInvoice: Invoice = {
      ...invoiceData,
      id: invoiceId,
      series: series,
      number: nextNumber,
      status: 'accepted', // Simulating successful SUNAT submission
      pdfUrl: '#', // Mock URL
      xmlUrl: '#', // Mock URL
      cdrUrl: '#', // Mock URL
    };

    transaction.set(invoiceRef, finalInvoice);

    // 5. Update the next number in settings
    const numberKey = type === 'boleta' ? 'nextBoletaNumber' : 
                      type === 'factura' ? 'nextFacturaNumber' : 'nextGuiaNumber';
    transaction.update(settingsRef, {
      [numberKey]: increment(1)
    });

    // 6. Add movement records
    for (const item of invoiceData.items) {
      const movementRef = doc(collection(db, 'movements'));
      transaction.set(movementRef, {
        productId: item.productId,
        productName: item.name,
        type: 'exit',
        quantity: item.quantity,
        userId: invoiceData.userId,
        userName: invoiceData.customerName, // Simplified
        date: invoiceData.date,
        reason: `Venta electrónica ${invoiceId}`
      });
    }

    return invoiceId;
  });
};
