import React from 'react';
import { Invoice, BusinessSettings } from '../types';

interface PrintableInvoiceProps {
  invoice: Invoice;
  settings: BusinessSettings;
}

export function PrintableInvoice({ invoice, settings }: PrintableInvoiceProps) {
  return (
    <div id="printable-content" className="p-4 text-black bg-white w-[80mm] font-mono text-[11px] leading-tight">
      {/* Header */}
      <div className="text-center space-y-1 mb-4">
        <h1 className="text-sm font-bold uppercase">{settings.razonSocial}</h1>
        <p className="font-bold">RUC: {settings.ruc}</p>
        <p className="text-[9px] px-2">{settings.direccion}</p>
        <div className="border-y border-dashed border-black py-2 my-2">
          <h2 className="text-xs font-bold uppercase">{invoice.type === 'guia' ? 'GUÍA DE REMISIÓN' : invoice.type} ELECTRÓNICA</h2>
          <p className="text-sm font-bold">{invoice.id}</p>
        </div>
      </div>

      {/* Date and Customer */}
      <div className="space-y-1 mb-4 border-b border-dashed border-black pb-2">
        <div className="flex justify-between">
          <span>FECHA:</span>
          <span className="font-bold">{new Date(invoice.date).toLocaleDateString()} {new Date(invoice.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex flex-col">
          <span>CLIENTE:</span>
          <span className="font-bold truncate">{invoice.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span>DOC:</span>
          <span className="font-bold">{invoice.customerDocument}</span>
        </div>
        <div className="flex justify-between">
          <span>MONEDA:</span>
          <span className="font-bold">SOLES (S/)</span>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4">
        <div className="grid grid-cols-6 border-b border-dashed border-black pb-1 mb-1 font-bold text-[9px]">
          <span className="col-span-1">CANT</span>
          <span className="col-span-3">DESCRIPCIÓN</span>
          <span className="col-span-2 text-right">TOTAL</span>
        </div>
        <div className="space-y-2">
          {invoice.items.map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="grid grid-cols-6 items-start">
                <span className="col-span-1">{item.quantity}</span>
                <span className="col-span-3 text-[10px] leading-none">{item.name}</span>
                <span className="col-span-2 text-right">S/ {item.total.toFixed(2)}</span>
              </div>
              <div className="text-[9px] text-right text-black italic">
                P.U. S/ {item.unitPrice.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t border-dashed border-black pt-2 space-y-1 text-right mb-6">
        <div className="flex justify-between">
          <span>OP. GRAVADA:</span>
          <span>S/ {invoice.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>I.G.V. (18%):</span>
          <span>S/ {invoice.igv.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs font-bold pt-1 border-t border-black">
          <span>TOTAL:</span>
          <span>S/ {invoice.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Footer / QR Placeholders */}
      <div className="text-center space-y-2 text-[9px]">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 border border-black flex items-center justify-center mb-1">
            <span className="text-[8px] opacity-30">CÓDIGO QR</span>
          </div>
          <p className="font-bold">Hash: {Math.random().toString(36).substring(7).toUpperCase()}</p>
        </div>
        
        <div className="space-y-1 pt-2 border-t border-dashed border-black">
          <p>Representación impresa de la {invoice.type === 'boleta' ? 'Boleta' : 'Factura'} Electrónica.</p>
          <p>Esta factura/boleta puede ser consultada en nuestro portal web.</p>
          <h4 className="font-bold pt-1">¡GRACIAS POR SU COMPRA!</h4>
        </div>
      </div>
    </div>
  );
}
