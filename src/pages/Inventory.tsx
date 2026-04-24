import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Package,
  Layers,
  Tag,
  Download
} from 'lucide-react';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel } from '../lib/documentService';

export function Inventory() {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    brand: '',
    category: '',
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 5,
    description: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(prods);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleExportStock = () => {
    const data = products.map(p => ({
      SKU: p.sku,
      Producto: p.name,
      Marca: p.brand,
      Categoría: p.category,
      Stock: p.stock,
      'Stock Mínimo': p.minStock,
      'Precio Compra': p.buyPrice,
      'Precio Venta': p.sellPrice,
      Valorización: p.stock * p.sellPrice
    }));
    exportToExcel(data, `Inventario_FerroStock_${new Date().toISOString().split('T')[0]}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ sku: '', name: '', brand: '', category: '', buyPrice: 0, sellPrice: 0, stock: 0, minStock: 5, description: '' });
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      category: product.category,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      minStock: product.minStock,
      description: product.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventario</h2>
          <p className="text-slate-500">Gestiona tus productos y existencias.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportStock}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm bg-white hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar Stock
          </button>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setFormData({ sku: '', name: '', brand: '', category: '', buyPrice: 0, sellPrice: 0, stock: 0, minStock: 5, description: '' });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
          >
            <Plus className="w-5 h-5" />
            Añadir Producto
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, SKU o marca..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
            Exportar
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Cargando inventario...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-4">
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${p.stock <= p.minStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {p.stock <= p.minStock ? 'Stock Bajo' : 'En Stock'}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 truncate">{p.name}</h4>
                  <p className="text-xs text-slate-400 font-medium">SKU: {p.sku}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-slate-400 mb-0.5">Precio Venta</p>
                    <p className="font-bold text-slate-900">S/ {p.sellPrice}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${p.stock <= p.minStock ? 'bg-red-50' : 'bg-blue-50'}`}>
                    <p className={`${p.stock <= p.minStock ? 'text-red-400' : 'text-blue-400'} mb-0.5`}>Stock Actual</p>
                    <p className={`font-bold ${p.stock <= p.minStock ? 'text-red-600' : 'text-blue-600'}`}>{p.stock} pz</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-2 border-t border-slate-50">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {p.brand}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {p.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Simplified for brevity in this response */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingProduct ? 'Editar Producto' : 'Añadir Producto'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">Cerrar</button>
            </div>
            
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nombre</label>
                <input required type="text" className="w-full p-2.5 border rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">SKU</label>
                <input required type="text" className="w-full p-2.5 border rounded-xl" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Marca</label>
                <input type="text" className="w-full p-2.5 border rounded-xl" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Categoría</label>
                <input type="text" className="w-full p-2.5 border rounded-xl" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Precio Compra</label>
                <input required type="number" className="w-full p-2.5 border rounded-xl" value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Precio Venta</label>
                <input required type="number" className="w-full p-2.5 border rounded-xl" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Stock Inicial</label>
                <input required type="number" className="w-full p-2.5 border rounded-xl" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Stock Mínimo</label>
                <input required type="number" className="w-full p-2.5 border rounded-xl" value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Descripción</label>
                <textarea className="w-full p-2.5 border rounded-xl h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              
              <div className="md:col-span-2 pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
