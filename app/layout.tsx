import React from 'react';
import './globals.css';

export const metadata = {
  title: 'ElioEstudio OS',
  description: 'Sistema Operativo de Agencia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 h-screen w-screen overflow-hidden m-0 p-0">
        {/* Renderizado directo de la app sin wrappers de notificaciones */}
        {children}
      </body>
    </html>
  );
}