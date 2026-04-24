import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Printer,
  Eye,
  FileDigit
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Invoice, BusinessSettings } from '../types';
import { getBusinessSettings } from '../lib/billingService';
import { generateInvoicePDF, exportToExcel } from '../lib/documentService';
import { PrintableInvoice } from '../components/PrintableInvoice';

export function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'invoices'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setInvoices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Invoice));
      setLoading(false);
    });

    getBusinessSettings().then(setSettings);

    return () => unsubscribe();
  }, []);

  const handlePrint = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setTimeout(() => {
      window.focus();
      window.print();
    }, 150);
  };

  const handleDownloadPDF = (inv: Invoice) => {
    if (settings) {
      generateInvoicePDF(inv, settings);
    }
  };

  const handleExport = () => {
    const data = invoices.map(inv => ({
      ID: inv.id,
      Fecha: new Date(inv.date).toLocaleString(),
      Tipo: inv.type === 'boleta' ? 'Boleta' : 'Factura',
      Cliente: inv.customerName,
      Documento: inv.customerDocument,
      Subtotal: inv.subtotal,
      IGV: inv.igv,
      Total: inv.total,
      Estado: inv.status
    }));
    exportToExcel(data, `Ventas_${new Date().toISOString().split('T')[0]}`);
  };

  const filtered = invoices.filter(inv => 
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerDocument.includes(searchTerm)
  );

  return (
    <>
      {selectedInvoice && settings && (
        <div className="hidden print:block">
          <PrintableInvoice invoice={selectedInvoice} settings={settings} />
        </div>
      )}
      <div className="p-6 space-y-6 max-w-7xl mx-auto h-full flex flex-col no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Documentos Electrónicos</h2>
            <p className="text-slate-500">Historial y estado de comprobantes enviados a SUNAT.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExport}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" /> Exportar reporte
            </button>
          </div>
        </div>

        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por número o cliente..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto min-h-0 flex-1">
            <table className="w-full text-left font-sans">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Fecha / Hora</th>
                  <th className="px-6 py-4">Número</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Importe Total</th>
                  <th className="px-6 py-4">Estado SUNAT</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{new Date(inv.date).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400">{new Date(inv.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-300" />
                        <span className="text-sm font-black text-slate-700">{inv.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{inv.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{inv.customerDocument}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-blue-600">S/ {inv.total.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === 'accepted' ? 'bg-green-50 text-green-600' :
                        inv.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {inv.status === 'accepted' ? <CheckCircle2 className="w-3 h-3" /> : 
                         inv.status === 'pending' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {inv.status === 'accepted' ? 'Aceptado' : inv.status === 'pending' ? 'Enviando' : 'Rechazado'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handlePrint(inv)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Imprimir Comprobante"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDownloadPDF(inv)}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all" title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Ver XML">
                          <FileDigit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="space-y-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                          <FileText className="w-10 h-10" />
                        </div>
                        <p className="text-slate-400 italic text-sm">No se encontraron comprobantes emitidos.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shadow-blue-100/50">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Integración SUNAT Activa</h4>
              <p className="text-xs text-blue-600">Certificado digital vigente hasta: <span className="font-bold">24 de Abril 2027</span></p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Consumo de Folios</p>
              <p className="text-lg font-black text-slate-900">124 / 1000 <span className="text-[10px] text-slate-400 font-normal ml-1">Gratis</span></p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
