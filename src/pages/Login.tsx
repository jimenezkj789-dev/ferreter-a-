import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Chrome, Package, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onBack: () => void;
}

export function Login({ onBack }: LoginProps) {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200 overflow-hidden"
      >
        <div className="p-8 pb-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </button>

          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 mb-2">
              <Package className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Bienvenido de nuevo</h2>
            <p className="text-slate-500 text-sm">
              Inicia sesión para gestionar el inventario de tu ferretería
            </p>
          </div>
        </div>

        <div className="p-8 pt-4 space-y-6">
          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-6 py-3.5 rounded-2xl font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Chrome className="w-5 h-5 text-red-500" />
            Continuar con Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold tracking-widest">Aviso Security</span>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 px-4">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad. Solo personal autorizado.
          </p>
        </div>
        
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium tracking-wide flex items-center justify-center gap-2">
            FerroStock Secure Core v1.0
          </p>
        </div>
      </motion.div>
    </div>
  );
}
