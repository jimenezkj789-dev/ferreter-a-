import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Download, 
  AlertTriangle, 
  TrendingUp, 
  Package,
  Calendar
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Movement } from '../types';

export function Reports() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const pSnap = await getDocs(collection(db, 'products'));
      const mSnap = await getDocs(query(collection(db, 'movements'), orderBy('date', 'desc')));
      
      setProducts(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product));
      setMovements(mSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Movement));
      setLoading(false);
    }
    fetchData();
  }, []);

  const lowStock = products.filter(p => p.stock <= p.minStock);
  const totalValueComp = products.reduce((acc, p) => acc + (p.buyPrice * p.stock), 0);
  const totalValueVent = products.reduce((acc, p) => acc + (p.sellPrice * p.stock), 0);

  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
  };

  if (loading) return <div className="p-8">Generando reportes...</div>;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Centro de Reportes</h2>
        <p className="text-slate-500">Analiza el estado de tu ferretería y exporta datos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory Value Report */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Valor del Inventario
            </h3>
            <button 
              onClick={() => exportToCSV(products, 'inventario_valor.csv')}
              className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Costo Total</p>
              <p className="text-xl font-black text-slate-900">${totalValueComp.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="text-xs text-blue-500 mb-1 uppercase font-bold tracking-wider">Valor Venta</p>
              <p className="text-xl font-black text-blue-900">${totalValueVent.toLocaleString()}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50">
            <p className="text-sm text-slate-600">Margen potencial estimado: <span className="font-bold text-green-600">${(totalValueVent - totalValueComp).toLocaleString()}</span></p>
          </div>
        </div>

        {/* Low Stock Alert Report */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Productos Críticos ({lowStock.length})
            </h3>
            <button 
              onClick={() => exportToCSV(lowStock, 'stock_bajo.csv')}
              className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50 border border-orange-100">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-orange-600">{p.stock} en existencia</p>
                  <p className="text-[8px] text-slate-400">Min: {p.minStock}</p>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No hay productos con stock bajo actualmente.
              </div>
            )}
          </div>
        </div>

        {/* Movement Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Resumen de Actividad Reciente
            </h3>
            <button 
              onClick={() => exportToCSV(movements, 'historial_movimientos.csv')}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-3 h-3" />
              Exportar Todo el Historial
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Total SKUs</p>
                <p className="text-lg font-black text-slate-900">{products.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Movimientos (Total)</p>
                <p className="text-lg font-black text-slate-900">{movements.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Usuarios Activos</p>
                <p className="text-lg font-black text-slate-900">{new Set(movements.map(m => m.userId)).size || 1}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-using icon from Lucide
import { Users } from 'lucide-react';
