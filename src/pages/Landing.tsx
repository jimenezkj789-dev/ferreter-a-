import React from 'react';
import { Package, ArrowRight, ShieldCheck, Zap, BarChart } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingProps {
  onStart: () => void;
}

export function Landing({ onStart }: LandingProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-4xl w-full space-y-8"
      >
        <motion.div variants={item} className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Package className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        <motion.div variants={item} className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
            Ferro<span className="text-blue-600">Stock</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            El sistema de gestión de inventario inteligente diseñado precisamente para tu ferretería.
          </p>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800">Control en Tiempo Real</h3>
            <p className="text-sm text-slate-500">Monitorea tus entradas y salidas al instante desde cualquier lugar.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800">Alertas Inteligentes</h3>
            <p className="text-sm text-slate-500">Nunca te quedes sin stock. Notificaciones automáticas de stock bajo.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              <BarChart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800">Reportes Detallados</h3>
            <p className="text-sm text-slate-500">Analiza tus ventas y movimientos para tomar mejores decisiones.</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="flex justify-center pt-4">
          <button 
            onClick={onStart}
            className="group flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-600 transition-all hover:scale-105 shadow-xl shadow-slate-200"
          >
            Ingresar al Sistema
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </motion.div>

      <footer className="mt-16 text-slate-400 text-sm font-medium">
        © 2026 FerroStock Software solutions. All rights reserved.
      </footer>
    </div>
  );
}
