// utils/exportUtils.ts
// Utilidades para exportar registro horario a PDF y Excel

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Jornada {
  id: string;
  fecha: string;
  horaInicio: string;
  horaPausaAlmuerzo?: string;
  horaReinicioAlmuerzo?: string;
  horaFin?: string;
  totalMinutos?: number;
  estado: string;
}

interface Usuario {
  id: string;
  name: string;
  email: string;
  position?: string;
  tipoContrato: string;
}

interface ExportData {
  jornadas: Jornada[];
  usuario: Usuario;
  periodo: {
    inicio: string;
    fin: string;
  };
  resumen: {
    totalHoras: number;
    horasObjetivo: number;
    diasTrabajados: number;
    promedioDiario: number;
  };
}

// Formatear minutos a HH:MM
const formatMinutosToHHMM = (minutos: number): string => {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${horas}h ${mins.toString().padStart(2, '0')}m`;
};

// Formatear fecha
const formatFecha = (fecha: string): string => {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Formatear hora
const formatHora = (hora?: string): string => {
  if (!hora) return '--:--';
  const date = new Date(hora);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

// Estado badge
const getEstadoTexto = (estado: string): string => {
  const estados: Record<string, string> = {
    'EN_CURSO': 'En curso',
    'PAUSADA': 'En pausa',
    'FINALIZADA': 'Finalizada'
  };
  return estados[estado] || estado;
};

// ============================================
// EXPORTAR A PDF
// ============================================
export const exportToPDF = async (data: ExportData): Promise<void> => {
  const doc = new jsPDF();
  const { jornadas, usuario, periodo, resumen } = data;

  // Colores de marca
  const elioYellow: [number, number, number] = [255, 199, 44];
  const elioBlack: [number, number, number] = [18, 18, 18];

  // Header con logo (simulado con texto)
  doc.setFillColor(elioBlack[0], elioBlack[1], elioBlack[2]);
  doc.rect(0, 0, 220, 35, 'F');
  
  doc.setTextColor(elioYellow[0], elioYellow[1], elioYellow[2]);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ELIOESTUDIO', 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Registro Horario', 15, 28);

  // Información del empleado
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Empleado:', 15, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(usuario.name, 45, 45);

  doc.setFont('helvetica', 'bold');
  doc.text('Puesto:', 120, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(usuario.position || 'Sin especificar', 145, 45);

  doc.setFont('helvetica', 'bold');
  doc.text('Período:', 15, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`${periodo.inicio} - ${periodo.fin}`, 45, 52);

  doc.setFont('helvetica', 'bold');
  doc.text('Contrato:', 120, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(usuario.tipoContrato === 'COMPLETA' ? 'Jornada Completa (37.5h/sem)' : 'Media Jornada (20h/sem)', 145, 52);

  // Resumen
  doc.setFillColor(245, 245, 245);
  doc.rect(15, 58, 180, 25, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DEL PERÍODO', 20, 66);

  doc.setFont('helvetica', 'normal');
  const col1X = 20;
  const col2X = 70;
  const col3X = 120;
  const col4X = 160;

  doc.text(`Días trabajados: ${resumen.diasTrabajados}`, col1X, 76);
  doc.text(`Total horas: ${formatMinutosToHHMM(resumen.totalHoras * 60)}`, col2X, 76);
  doc.text(`Objetivo: ${resumen.horasObjetivo}h`, col3X, 76);
  
  const balance = resumen.totalHoras - resumen.horasObjetivo;
  const balanceText = balance >= 0 ? `+${balance.toFixed(1)}h` : `${balance.toFixed(1)}h`;
  doc.setTextColor(balance >= 0 ? 0 : 200, balance >= 0 ? 128 : 0, 0);
  doc.text(`Balance: ${balanceText}`, col4X, 76);
  doc.setTextColor(0, 0, 0);

  // Tabla de jornadas
  const tableData = jornadas.map(j => [
    formatFecha(j.fecha),
    formatHora(j.horaInicio),
    formatHora(j.horaPausaAlmuerzo),
    formatHora(j.horaReinicioAlmuerzo),
    formatHora(j.horaFin),
    j.totalMinutos ? formatMinutosToHHMM(j.totalMinutos) : '--',
    getEstadoTexto(j.estado)
  ]);

  autoTable(doc, {
    startY: 90,
    head: [['Fecha', 'Entrada', 'Pausa', 'Regreso', 'Salida', 'Total', 'Estado']],
    body: tableData,
    headStyles: {
      fillColor: [elioBlack[0], elioBlack[1], elioBlack[2]],
      textColor: [elioYellow[0], elioYellow[1], elioYellow[2]],
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      halign: 'center',
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 35 },
      6: { cellWidth: 25 }
    }
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 15, pageHeight - 10);
  doc.text('ElioEstudio OS v2.0', 180, pageHeight - 10);

  // Guardar
  const fileName = `registro_horario_${usuario.name.replace(/\s+/g, '_')}_${periodo.inicio}_${periodo.fin}.pdf`;
  doc.save(fileName);
};


// ============================================
// EXPORTAR A EXCEL
// ============================================
export const exportToExcel = async (data: ExportData): Promise<void> => {
  const { jornadas, usuario, periodo, resumen } = data;

  // Crear workbook
  const wb = XLSX.utils.book_new();

  // Hoja 1: Registro Detallado
  const wsData: (string | number)[][] = [
    ['ELIOESTUDIO - REGISTRO HORARIO'],
    [],
    ['Empleado:', usuario.name, '', 'Puesto:', usuario.position || 'Sin especificar'],
    ['Email:', usuario.email, '', 'Contrato:', usuario.tipoContrato === 'COMPLETA' ? 'Jornada Completa (37.5h/sem)' : 'Media Jornada (20h/sem)'],
    ['Período:', `${periodo.inicio} - ${periodo.fin}`],
    [],
    ['RESUMEN'],
    ['Días trabajados', 'Total Horas', 'Objetivo', 'Balance', 'Promedio diario'],
    [
      resumen.diasTrabajados,
      resumen.totalHoras.toFixed(2),
      resumen.horasObjetivo,
      (resumen.totalHoras - resumen.horasObjetivo).toFixed(2),
      resumen.promedioDiario.toFixed(2)
    ],
    [],
    ['DETALLE DE JORNADAS'],
    ['Fecha', 'Día', 'Entrada', 'Pausa Almuerzo', 'Regreso', 'Salida', 'Total (min)', 'Total (horas)', 'Estado']
  ];

  // Agregar jornadas
  jornadas.forEach(j => {
    const fecha = new Date(j.fecha);
    const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
    
    wsData.push([
      formatFecha(j.fecha),
      diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
      formatHora(j.horaInicio),
      formatHora(j.horaPausaAlmuerzo),
      formatHora(j.horaReinicioAlmuerzo),
      formatHora(j.horaFin),
      j.totalMinutos || 0,
      j.totalMinutos ? (j.totalMinutos / 60).toFixed(2) : 0,
      getEstadoTexto(j.estado)
    ]);
  });

  // Crear hoja
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ajustar anchos de columna
  ws['!cols'] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 }
  ];

  // Agregar hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, 'Registro Horario');

  // Hoja 2: Resumen Semanal
  const weeklyData = calcularResumenSemanal(jornadas);
  const ws2Data: (string | number)[][] = [
    ['RESUMEN SEMANAL'],
    [],
    ['Semana', 'Inicio', 'Fin', 'Días', 'Horas Trabajadas', 'Objetivo', 'Balance']
  ];

  weeklyData.forEach(week => {
    ws2Data.push([
      week.semana,
      week.inicio,
      week.fin,
      week.dias,
      week.horasTrabajadas.toFixed(2),
      week.objetivo,
      (week.horasTrabajadas - week.objetivo).toFixed(2)
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
  ws2['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumen Semanal');

  // Guardar
  const fileName = `registro_horario_${usuario.name.replace(/\s+/g, '_')}_${periodo.inicio}_${periodo.fin}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// Función auxiliar para calcular resumen semanal
function calcularResumenSemanal(jornadas: Jornada[]): Array<{
  semana: string;
  inicio: string;
  fin: string;
  dias: number;
  horasTrabajadas: number;
  objetivo: number;
}> {
  const semanas: Map<string, {
    inicio: Date;
    fin: Date;
    minutos: number;
    dias: number;
  }> = new Map();

  jornadas.forEach(j => {
    const fecha = new Date(j.fecha);
    const lunes = new Date(fecha);
    const dayOfWeek = fecha.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    lunes.setDate(fecha.getDate() + diff);
    
    const semanaKey = lunes.toISOString().split('T')[0];
    
    if (!semanas.has(semanaKey)) {
      const viernes = new Date(lunes);
      viernes.setDate(lunes.getDate() + 4);
      semanas.set(semanaKey, {
        inicio: lunes,
        fin: viernes,
        minutos: 0,
        dias: 0
      });
    }
    
    const semana = semanas.get(semanaKey)!;
    semana.minutos += j.totalMinutos || 0;
    if (j.estado === 'FINALIZADA') {
      semana.dias += 1;
    }
  });

  return Array.from(semanas.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, data], index) => ({
      semana: `Semana ${index + 1}`,
      inicio: data.inicio.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      fin: data.fin.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      dias: data.dias,
      horasTrabajadas: data.minutos / 60,
      objetivo: 37.5
    }));
}