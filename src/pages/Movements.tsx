import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  Plus, 
  Search,
  Calendar,
  User as UserIcon,
  Package
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  runTransaction, 
  doc, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Movement, Product } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function Movements() {
  const { user, userProfile } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    productId: '',
    type: 'entry' as 'entry' | 'exit' | 'adjustment',
    quantity: 0,
    reason: ''
  });

  useEffect(() => {
    // Listen to movements
    const q = query(collection(db, 'movements'), orderBy('date', 'desc'));
    const unsubMovements = onSnapshot(q, (snap) => {
      setMovements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Movement));
      setLoading(false);
    });

    // Fetch products for select
    const fetchProducts = async () => {
      const snap = await getDocs(collection(db, 'products'));
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product));
    };

    fetchProducts();
    return () => unsubMovements();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', formData.productId);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) {
          throw new Error("Producto no encontrado");
        }

        const productData = productDoc.data() as Product;
        let newStock = productData.stock;

        if (formData.type === 'entry') newStock += formData.quantity;
        else if (formData.type === 'exit') newStock -= formData.quantity;
        else if (formData.type === 'adjustment') newStock = formData.quantity; // If adjust, set to quantity

        if (newStock < 0) {
          throw new Error("El stock no puede ser negativo");
        }

        // Update product stock
        transaction.update(productRef, { 
          stock: newStock,
          updatedAt: new Date().toISOString()
        });

        // Add movement record
        const movementData = {
          productId: formData.productId,
          productName: productData.name,
          type: formData.type,
          quantity: formData.quantity,
          userId: user.uid,
          userName: userProfile?.displayName || user.email,
          date: new Date().toISOString(),
          reason: formData.reason
        };

        const movementRef = doc(collection(db, 'movements'));
        transaction.set(movementRef, movementData);
      });

      setShowModal(false);
      setFormData({ productId: '', type: 'entry', quantity: 0, reason: '' });
    } catch (error: any) {
      alert(error.message || "Error al procesar movimiento");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Movimientos</h2>
          <p className="text-slate-500">Historial completo de entradas y salidas.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus className="w-5 h-5" />
          Nuevo Movimiento
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-center">Cantidad</th>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Razón</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(m.date).toLocaleDateString()} {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-900">{m.productName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      m.type === 'entry' ? 'bg-green-50 text-green-600' : 
                      m.type === 'exit' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {m.type === 'entry' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {m.type === 'entry' ? 'Entrada' : m.type === 'exit' ? 'Salida' : 'Ajuste'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-bold ${m.type === 'entry' ? 'text-green-600' : m.type === 'exit' ? 'text-red-600' : 'text-blue-600'}`}>
                      {m.type === 'entry' ? '+' : m.type === 'exit' ? '-' : ''}{m.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <UserIcon className="w-3 h-3" />
                      {m.userName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500 italic max-w-[200px] truncate" title={m.reason}>
                      {m.reason || 'Sin observación'}
                    </p>
                  </td>
                </tr>
              ))}
              {movements.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No hay registros de movimientos aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <History className="w-6 h-6 text-blue-600" />
              Nuevo Movimiento
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Producto</label>
                <select 
                  required 
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50"
                  value={formData.productId}
                  onChange={e => setFormData({...formData, productId: e.target.value})}
                >
                  <option value="">Seleccione un producto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tipo de Movimiento</label>
                  <select 
                    required 
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="entry">Entrada</option>
                    <option value="exit">Salida</option>
                    <option value="adjustment">Ajuste de Stock</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Cantidad</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    className="w-full p-3 border border-slate-200 rounded-xl" 
                    value={formData.quantity} 
                    onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Observación / Razón</label>
                <textarea 
                  className="w-full p-3 border border-slate-200 rounded-xl h-24" 
                  placeholder="Ej: Compra a proveedor, Venta mostrador, Ajuste por merma..."
                  value={formData.reason} 
                  onChange={e => setFormData({...formData, reason: e.target.value})} 
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100"
                >
                  Procesar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
