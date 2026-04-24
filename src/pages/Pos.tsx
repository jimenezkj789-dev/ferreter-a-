import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  User as UserIcon, 
  FileText, 
  Trash2, 
  Plus, 
  Minus,
  ArrowRight,
  Printer,
  CheckCircle2,
  AlertCircle,
  Download
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Customer, InvoiceItem, Invoice, BusinessSettings, InvoiceType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { calculateTotals, getBusinessSettings, createElectronicInvoice } from '../lib/billingService';
import { generateInvoicePDF } from '../lib/documentService';
import { PrintableInvoice } from '../components/PrintableInvoice';

export function Pos() {
  const { user, userProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('boleta');
  const [customer, setCustomer] = useState<{ docType: 'DNI' | 'RUC', docNum: string, name: string }>({
    docType: 'DNI',
    docNum: '',
    name: ''
  });
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<Invoice | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const pSnap = await getDocs(collection(db, 'products'));
        setProducts(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product));
        const s = await getBusinessSettings();
        setSettings(s);
      } catch (error) {
        console.error("Error al cargar datos del POS:", error);
        alert("Error al cargar productos o configuración. Por favor, recarga la página.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return;
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice } 
          : item
      ));
    } else {
      if (product.stock <= 0) return;
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.sellPrice,
        total: product.sellPrice
      }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        if (delta > 0 && newQty > product.stock) return item;
        return { ...item, quantity: newQty, total: newQty * item.unitPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const totals = calculateTotals(cart);

  const handleProcessSale = async () => {
    if (!user) {
      alert("No hay una sesión de usuario activa.");
      return;
    }
    if (cart.length === 0) {
      alert("El carrito está vacío.");
      return;
    }
    if (!settings) {
      alert("No se pudo cargar la configuración de facturación.");
      return;
    }

    if (invoiceType === 'factura') {
      if (customer.docType !== 'RUC' || customer.docNum.length !== 11) {
         alert("Las FACTURAS requieren obligatoriamente un RUC válido de 11 dígitos.");
         return;
      }
      if (!customer.name) {
        alert("Debe ingresar la Razón Social para la Factura.");
        return;
      }
    }

    setLoading(true);
    console.log("Iniciando emisión de comprobante...");
    try {
      const invoiceData: Omit<Invoice, 'id' | 'series' | 'number' | 'status'> = {
        type: invoiceType,
        date: new Date().toISOString(),
        customerName: customer.name || "CLIENTES VARIOS",
        customerDocument: customer.docNum || "00000000",
        items: cart,
        ...totals,
        userId: user.uid
      };

      console.log("Datos del comprobante listos:", invoiceData);
      console.log("Configuración utilizada:", settings);
      
      const invoiceId = await createElectronicInvoice(invoiceData, settings);
      console.log("ID de comprobante generado:", invoiceId);
      
      const completeInvoice: Invoice = {
        ...invoiceData,
        id: invoiceId,
        series: invoiceType === 'boleta' ? settings.boletaSeries : 
                invoiceType === 'factura' ? settings.facturaSeries : settings.guiaSeries,
        number: invoiceType === 'boleta' ? settings.nextBoletaNumber : 
                invoiceType === 'factura' ? settings.nextFacturaNumber : settings.nextGuiaNumber,
        status: 'accepted'
      };

      console.log("Comprobante finalizado:", completeInvoice);
      setSuccess(completeInvoice);
      setCart([]);
      setCustomer({ docType: 'DNI', docNum: '', name: '' });
      console.log("Estado reiniciado. Proceso completado.");
      alert("Comprobante emitido correctamente");
      
      setProducts(products => products.map(p => {
        const cartItem = cart.find(item => item.productId === p.id);
        if (cartItem) return { ...p, stock: p.stock - cartItem.quantity };
        return p;
      }));
    } catch (error: any) {
      console.error("Error en handleProcessSale:", error);
      alert(error.message || "Error inesperado al procesar la venta. Ver consola.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (success && settings) {
    return (
      <>
        <div className="hidden print:block">
          <PrintableInvoice invoice={success} settings={settings} />
        </div>
        <div className="min-h-full flex items-center justify-center p-6 bg-slate-50">
          <div className="bg-white p-12 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">Venta Exitosa</h3>
              <p className="text-slate-500 text-sm">Documento electrónico generado correctamente.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Número:</span>
              <span className="text-lg font-black text-slate-900">{success.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  console.log("Triggering print...");
                  window.focus();
                  window.print();
                }}
                className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" /> Imprimir
              </button>
              <button 
                onClick={() => {
                  console.log("Generating PDF for:", success.id);
                  try {
                    generateInvoicePDF(success, settings);
                  } catch (err) {
                    console.error("PDF Generation failed:", err);
                    alert("Error al generar PDF. Ver consola.");
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
            <button 
              onClick={() => setSuccess(null)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              Nueva Venta
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-slate-50">
      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden min-h-0">
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              Punto de Venta
            </h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Escribe nombre o SKU del producto..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
          {filteredProducts.map((p) => (
            <div 
              key={p.id}
              onClick={() => addToCart(p)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col h-full bg-white ${
                p.stock <= 0 
                  ? 'opacity-50 grayscale border-slate-100' 
                  : 'hover:border-blue-500 hover:shadow-lg border-slate-100'
              }`}
            >
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sku}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.stock <= p.minStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {p.stock} pz
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">{p.name}</h4>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-black text-slate-900">S/ {p.sellPrice}</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Cart & Customer Info */}
      <aside className="w-full md:w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">Detalle del Comprobante</h3>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
            <button 
              onClick={() => setInvoiceType('boleta')}
              className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                invoiceType === 'boleta' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              BOLETA
            </button>
            <button 
              onClick={() => setInvoiceType('factura')}
              className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                invoiceType === 'factura' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              FACTURA
            </button>
            <button 
              onClick={() => setInvoiceType('guia')}
              className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                invoiceType === 'guia' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              GUÍA
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-400 uppercase tracking-widest">
              <UserIcon className="w-3 h-3" />
              Datos del Cliente
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <select 
                  className="w-24 p-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-0"
                  value={customer.docType}
                  onChange={(e) => setCustomer({...customer, docType: e.target.value as any})}
                >
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Número de documento..."
                  className="flex-1 p-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-0"
                  value={customer.docNum}
                  onChange={(e) => setCustomer({...customer, docNum: e.target.value})}
                />
              </div>
              <input 
                type="text" 
                placeholder="Nombre o Razón Social..."
                className="w-full p-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-0"
                value={customer.name}
                onChange={(e) => setCustomer({...customer, name: e.target.value})}
              />
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Cart Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between font-bold text-xs text-slate-400 uppercase tracking-widest">
              <span>Productos ({cart.length})</span>
              <button onClick={() => setCart([])} className="text-red-500 hover:text-red-600">Limpiar</button>
            </div>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.productId} className="flex gap-3 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">S/ {item.unitPrice} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-50 rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 text-slate-400 hover:text-slate-600">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 text-slate-400 hover:text-slate-600">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center py-12 space-y-2">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-400 italic">El carrito está vacío</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal (Neto)</span>
              <span className="font-medium">S/ {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">IGV (18%)</span>
              <span className="font-medium">S/ {totals.igv.toFixed(2)}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-lg font-bold text-slate-900">Total</span>
              <span className="text-2xl font-black text-blue-600">S/ {totals.total.toFixed(2)}</span>
            </div>
          </div>

          <button 
            disabled={cart.length === 0 || loading}
            onClick={handleProcessSale}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
              cart.length === 0 || loading 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Emitir {invoiceType.toUpperCase()}
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
            <AlertCircle className="w-3 h-3" />
            Válido como comprobante electrónico SUNAT
          </div>
        </div>
      </aside>
    </div>
  );
}
