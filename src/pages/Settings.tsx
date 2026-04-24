import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Calendar, LogOut, Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { seedDatabase, clearAndSeedDatabase } from '../lib/seed';

export function Settings() {
  const { userProfile, logout } = useAuth();
  const [seeding, setSeeding] = React.useState(false);
  const [seedResult, setSeedResult] = React.useState<any>(null);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedDatabase();
      if (res.alreadyCargado) {
        alert('El inventario ya está cargado.');
      } else {
        setSeedResult(res);
        alert(`¡Éxito! Se cargaron ${res.success} productos de ferretería.`);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleReset = async () => {
    const confirm = window.confirm('¿Estás seguro de que quieres REINICIAR el inventario? Se eliminarán todos los productos actuales y se cargarán los 40 productos iniciales.');
    if (!confirm) return;

    setSeeding(true);
    try {
      const res = await clearAndSeedDatabase();
      setSeedResult(res);
      alert(`¡Éxito! El inventario ha sido reiniciado. Se cargaron ${res.success} productos.`);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Configuración</h2>
        <p className="text-slate-500">Administra tu perfil y utilidades de la base de datos.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-900 h-32 relative">
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-8">
            <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-lg">
              <div className="w-full h-full rounded-2xl bg-blue-600 overflow-hidden flex items-center justify-center text-white text-3xl font-black">
                {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-16 p-8 space-y-8">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-slate-900">{userProfile?.displayName}</h3>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{userProfile?.role || 'Empleado'} del Sistema</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm transition-transform hover:scale-110">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Correo</p>
                <p className="text-sm font-bold text-slate-900 truncate max-w-[180px]">{userProfile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Acceso</p>
                <p className="text-sm font-bold text-slate-900 capitalize">{userProfile?.role || 'Básico'}</p>
              </div>
            </div>
          </div>

          {/* Admin Database Tools */}
          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">Herramientas de Inventario</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button 
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-50 active:scale-95"
              >
                <Database className="w-4 h-4" />
                {seeding ? 'Cargando...' : 'Cargar Inventario (Pe)'}
              </button>

              <button 
                onClick={handleReset}
                disabled={seeding}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-red-200 hover:text-red-600 transition-all disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
                Reiniciar Datos
              </button>
            </div>
            <p className="text-[10px] text-center text-blue-500 italic">Precios en Soles (S/) y stock para demo de 40+ productos.</p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors active:scale-[0.98]"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión Segura
            </button>
            <p className="text-center text-[10px] text-slate-400 font-mono">
              ID: {userProfile?.uid}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
