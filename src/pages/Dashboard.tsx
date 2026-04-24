import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  ClipboardList
} from 'lucide-react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Movement } from '../types';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    monthMovements: 0,
    recentMovements: [] as Movement[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const products = productsSnap.docs.map(doc => doc.data() as Product);
        
        const lowStock = products.filter(p => p.stock <= p.minStock);
        
        const movementsSnap = await getDocs(
          query(collection(db, 'movements'), orderBy('date', 'desc'), limit(5))
        );
        const movements = movementsSnap.docs.map(doc => doc.data() as Movement);

        setStats({
          totalProducts: products.length,
          lowStockCount: lowStock.length,
          monthMovements: 0, // Placeholder for simplicity
          recentMovements: movements
        });
      } catch (error) {
        console.error("Dashboard data fetch failed:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const data = [
    { name: 'Herramientas', value: 45 },
    { name: 'Pinturas', value: 32 },
    { name: 'Eléctrico', value: 24 },
    { name: 'Plomería', value: 38 },
  ];

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500">Resumen general de tu ferretería.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Descargar Reporte
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Productos', value: stats.totalProducts, icon: Package, color: 'blue', change: '+3%' },
          { label: 'Stock Bajo', value: stats.lowStockCount, icon: AlertTriangle, color: 'orange', change: '-2%' },
          { label: 'Ventas (Mes)', value: '$12,450', icon: TrendingUp, color: 'green', change: '+12%' },
          { label: 'Movimientos', value: '156', icon: ClipboardList, color: 'purple', change: '+5%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Distribución por Categoría</h3>
            <select className="text-xs font-semibold bg-slate-50 border-none rounded-lg p-2 focus:ring-0">
              <option>Esta semana</option>
              <option>Este mes</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Movimientos Recientes</h3>
          <div className="space-y-4">
            {stats.recentMovements.length > 0 ? stats.recentMovements.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.type === 'entry' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {m.type === 'entry' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{m.productName || 'Producto'}</p>
                  <p className="text-[10px] text-slate-500">{new Date(m.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${m.type === 'entry' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'entry' ? '+' : '-'}{m.quantity}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-slate-400 italic text-sm">
                Sin movimientos recientes
              </div>
            )}
          </div>
          {stats.recentMovements.length > 0 && (
            <button className="w-full mt-4 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Ver todo el historial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
