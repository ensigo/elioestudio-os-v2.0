// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categorias = [
  { codigo: 'SEO', nombre: 'Posicionamiento Web', descripcion: 'Optimización para buscadores, auditorías, palabras clave', color: '#22C55E', icono: 'Search', orden: 1 },
  { codigo: 'SEM', nombre: 'Publicidad Digital', descripcion: 'Campañas de pago en Google, Meta, etc.', color: '#F59E0B', icono: 'Target', orden: 2 },
  { codigo: 'RRSS', nombre: 'Redes Sociales', descripcion: 'Gestión de perfiles, publicaciones, comunidad', color: '#3B82F6', icono: 'Share2', orden: 3 },
  { codigo: 'WEB', nombre: 'Desarrollo Web', descripcion: 'Diseño y programación de sitios web', color: '#8B5CF6', icono: 'Code', orden: 4 },
  { codigo: 'CONT', nombre: 'Contenidos', descripcion: 'Redacción de textos, artículos, copys', color: '#EC4899', icono: 'FileText', orden: 5 },
  { codigo: 'DIS', nombre: 'Diseño Gráfico', descripcion: 'Identidad visual, cartelería, materiales', color: '#F97316', icono: 'Palette', orden: 6 },
  { codigo: 'AV', nombre: 'Audiovisual', descripcion: 'Edición de video, reels, fotografía', color: '#EF4444', icono: 'Video', orden: 7 },
  { codigo: 'MNT', nombre: 'Mantenimiento', descripcion: 'Soporte técnico, actualizaciones, backups', color: '#6B7280', icono: 'Settings', orden: 8 },
  { codigo: 'EST', nombre: 'Estrategia', descripcion: 'Planificación, reuniones, informes', color: '#14B8A6', icono: 'Compass', orden: 9 },
];

const plantillas = [
  // SEO
  { codigo: 'SEO-001', nombre: 'Auditoría SEO Completa', descripcion: 'Análisis técnico, contenido y enlaces del sitio', categoria: 'SEO', rolTipo: 'SEO', tiempo: 8 },
  { codigo: 'SEO-002', nombre: 'Investigación de Palabras Clave', descripcion: 'Búsqueda y análisis de términos de búsqueda', categoria: 'SEO', rolTipo: 'SEO', tiempo: 4 },
  { codigo: 'SEO-003', nombre: 'Optimización de Página', descripcion: 'Mejora de títulos, descripciones, encabezados, imágenes', categoria: 'SEO', rolTipo: 'SEO', tiempo: 3 },
  { codigo: 'SEO-004', nombre: 'Optimización Técnica', descripcion: 'Velocidad, rendimiento, datos estructurados', categoria: 'SEO', rolTipo: 'SEO', tiempo: 6 },
  { codigo: 'SEO-005', nombre: 'Construcción de Enlaces', descripcion: 'Estrategia para conseguir enlaces de calidad', categoria: 'SEO', rolTipo: 'SEO', tiempo: 4 },
  { codigo: 'SEO-006', nombre: 'Informe Mensual SEO', descripcion: 'Reporte de posiciones, tráfico y conversiones', categoria: 'SEO', rolTipo: 'SEO', tiempo: 2, recurrente: true, frecuencia: 'MENSUAL' },
  { codigo: 'SEO-007', nombre: 'Análisis de Competencia', descripcion: 'Estudio de estrategias de competidores', categoria: 'SEO', rolTipo: 'SEO', tiempo: 3 },
  { codigo: 'SEO-008', nombre: 'SEO Local', descripcion: 'Optimización de ficha de Google y citas locales', categoria: 'SEO', rolTipo: 'SEO', tiempo: 3 },
  { codigo: 'SEO-009', nombre: 'Migración SEO', descripcion: 'Planificación de cambios de dominio o estructura', categoria: 'SEO', rolTipo: 'SEO', tiempo: 8 },
  { codigo: 'SEO-010', nombre: 'Recuperación de Penalización', descripcion: 'Diagnóstico y corrección de penalizaciones', categoria: 'SEO', rolTipo: 'SEO', tiempo: 6 },

  // SEM
  { codigo: 'SEM-001', nombre: 'Configuración Cuenta Google Ads', descripcion: 'Creación y configuración inicial de cuenta', categoria: 'SEM', rolTipo: 'SEO', tiempo: 4 },
  { codigo: 'SEM-002', nombre: 'Campaña de Búsqueda', descripcion: 'Creación de campaña en red de búsqueda', categoria: 'SEM', rolTipo: 'SEO', tiempo: 4 },
  { codigo: 'SEM-003', nombre: 'Campaña de Display', descripcion: 'Campaña con banners en sitios web', categoria: 'SEM', rolTipo: 'SEO', tiempo: 5 },
  { codigo: 'SEM-004', nombre: 'Campaña de Shopping', descripcion: 'Configuración de campañas de productos', categoria: 'SEM', rolTipo: 'SEO', tiempo: 6 },
  { codigo: 'SEM-005', nombre: 'Campaña de Video', descripcion: 'Anuncios en YouTube y red de video', categoria: 'SEM', rolTipo: 'SEO', tiempo: 5 },
  { codigo: 'SEM-006', nombre: 'Optimización Semanal', descripcion: 'Ajuste de pujas, palabras negativas, tests', categoria: 'SEM', rolTipo: 'SEO', tiempo: 2, recurrente: true, frecuencia: 'SEMANAL' },
  { codigo: 'SEM-007', nombre: 'Informe Mensual SEM', descripcion: 'Reporte de rendimiento y retorno de inversión', categoria: 'SEM', rolTipo: 'SEO', tiempo: 2, recurrente: true, frecuencia: 'MENSUAL' },
  { codigo: 'SEM-008', nombre: 'Auditoría de Cuenta', descripcion: 'Revisión de estructura y oportunidades', categoria: 'SEM', rolTipo: 'SEO', tiempo: 4 },
  { codigo: 'SEM-009', nombre: 'Configuración Meta Ads', descripcion: 'Creación de Business Manager y píxel', categoria: 'SEM', rolTipo: 'SEO', tiempo: 3 },
  { codigo: 'SEM-010', nombre: 'Campaña en Meta', descripcion: 'Campañas en Facebook e Instagram', categoria: 'SEM', rolTipo: 'SEO', tiempo: 4 },

  // RRSS
  { codigo: 'RRSS-001', nombre: 'Estrategia de Redes Sociales', descripcion: 'Plan anual con objetivos e indicadores', categoria: 'RRSS', rolTipo: 'MANAGER', tiempo: 6 },
  { codigo: 'RRSS-002', nombre: 'Calendario Editorial', descripcion: 'Planificación mensual de publicaciones', categoria: 'RRSS', rolTipo: 'COPY', tiempo: 3, recurrente: true, frecuencia: 'MENSUAL' },
  { codigo: 'RRSS-003', nombre: 'Publicación Estática', descripcion: 'Diseño y texto para post de imagen', categoria: 'RRSS', rolTipo: 'DESIGNER', tiempo: 1 },
  { codigo: 'RRSS-004', nombre: 'Publicación Carrusel', descripcion: 'Diseño multipágina con texto', categoria: 'RRSS', rolTipo: 'DESIGNER', tiempo: 2 },
  { codigo: 'RRSS-005', nombre: 'Creación de Reel', descripcion: 'Grabación y edición de video corto', categoria: 'RRSS', rolTipo: 'AV', tiempo: 3 },
  { codigo: 'RRSS-006', nombre: 'Pack de Stories', descripcion: 'Conjunto de 5-10 stories', categoria: 'RRSS', rolTipo: 'DESIGNER', tiempo: 1.5 },
  { codigo: 'RRSS-007', nombre: 'Gestión de Comunidad', descripcion: 'Respuestas, moderación, interacción diaria', categoria: 'RRSS', rolTipo: 'COPY', tiempo: 1, recurrente: true, frecuencia: 'DIARIO' },
  { codigo: 'RRSS-008', nombre: 'Informe Mensual RRSS', descripcion: 'Métricas de alcance, interacción, crecimiento', categoria: 'RRSS', rolTipo: 'COPY', tiempo: 2, recurrente: true, frecuencia: 'MENSUAL' },
  { codigo: 'RRSS-009', nombre: 'Configuración de Perfil', descripcion: 'Creación o renovación de perfiles', categoria: 'RRSS', rolTipo: 'COPY', tiempo: 2 },
  { codigo: 'RRSS-010', nombre: 'Gestión de Crisis', descripcion: 'Protocolo y respuesta ante problemas', categoria: 'RRSS', rolTipo: 'MANAGER', tiempo: 4 },
  { codigo: 'RRSS-011', nombre: 'Contacto con Influencers', descripcion: 'Búsqueda y negociación con creadores', categoria: 'RRSS', rolTipo: 'COPY', tiempo: 4 },
  { codigo: 'RRSS-012', nombre: 'Gestión de Contenido Externo', descripcion: 'Administración de contenido de usuarios', categoria: 'RRSS', rolTipo: 'COPY', tiempo: 2 },

  // WEB
  { codigo: 'WEB-001', nombre: 'Diseño de Página Web', descripcion: 'Diseño visual completo de una página', categoria: 'WEB', rolTipo: 'DESIGNER', tiempo: 4 },
  { codigo: 'WEB-002', nombre: 'Maquetación Web', descripcion: 'Desarrollo del diseño en código', categoria: 'WEB', rolTipo: 'DEV', tiempo: 6 },
  { codigo: 'WEB-003', nombre: 'Página de Aterrizaje Completa', descripcion: 'Diseño + Desarrollo + Textos', categoria: 'WEB', rolTipo: 'DEV', tiempo: 12 },
  { codigo: 'WEB-004', nombre: 'Tienda Online', descripcion: 'Configuración completa de e-commerce', categoria: 'WEB', rolTipo: 'DEV', tiempo: 30 },
  { codigo: 'WEB-005', nombre: 'Integración de Pagos', descripcion: 'Conexión con pasarelas de pago', categoria: 'WEB', rolTipo: 'DEV', tiempo: 4 },
  { codigo: 'WEB-006', nombre: 'Publicación de Artículo', descripcion: 'Subida y maquetación de contenido', categoria: 'WEB', rolTipo: 'DEV', tiempo: 1 },
  { codigo: 'WEB-007', nombre: 'Formulario Avanzado', descripcion: 'Formularios con lógica y validaciones', categoria: 'WEB', rolTipo: 'DEV', tiempo: 3 },
  { codigo: 'WEB-008', nombre: 'Integración con CRM', descripcion: 'Conexión con sistemas de gestión', categoria: 'WEB', rolTipo: 'DEV', tiempo: 6 },
  { codigo: 'WEB-009', nombre: 'Optimización de Velocidad', descripcion: 'Mejora de tiempos de carga', categoria: 'WEB', rolTipo: 'DEV', tiempo: 4 },
  { codigo: 'WEB-010', nombre: 'Certificado de Seguridad', descripcion: 'Instalación y configuración HTTPS', categoria: 'WEB', rolTipo: 'DEV', tiempo: 1 },
  { codigo: 'WEB-011', nombre: 'Copias de Seguridad', descripcion: 'Configuración de backups automáticos', categoria: 'WEB', rolTipo: 'DEV', tiempo: 2 },
  { codigo: 'WEB-012', nombre: 'Migración de Sitio', descripcion: 'Cambio de servidor o dominio', categoria: 'WEB', rolTipo: 'DEV', tiempo: 6 },
  { codigo: 'WEB-013', nombre: 'Desarrollo a Medida', descripcion: 'Funcionalidad personalizada', categoria: 'WEB', rolTipo: 'DEV', tiempo: 8 },
  { codigo: 'WEB-014', nombre: 'Corrección Móvil', descripcion: 'Arreglos de visualización responsive', categoria: 'WEB', rolTipo: 'DEV', tiempo: 2 },
  { codigo: 'WEB-015', nombre: 'Actualización de Sistema', descripcion: 'Actualización de WordPress, plugins, etc.', categoria: 'WEB', rolTipo: 'DEV', tiempo: 1 },

  // CONT
  { codigo: 'CONT-001', nombre: 'Artículo de Blog Estándar', descripcion: 'Redacción SEO de 1000-1500 palabras', categoria: 'CONT', rolTipo: 'COPY', tiempo: 3 },
  { codigo: 'CONT-002', nombre: 'Artículo de Blog Premium', descripcion: 'Redacción extensa de 2000+ palabras', categoria: 'CONT', rolTipo: 'COPY', tiempo: 5 },
  { codigo: 'CONT-003', nombre: 'Textos de Página Web', descripcion: 'Contenido para página de servicio/producto', categoria: 'CONT', rolTipo: 'COPY', tiempo: 2 },
  { codigo: 'CONT-004', nombre: 'Textos de Landing', descripcion: 'Textos persuasivos para página de aterrizaje', categoria: 'CONT', rolTipo: 'COPY', tiempo: 3 },
  { codigo: 'CONT-005', nombre: 'Ficha de Producto', descripcion: 'Descripción para tienda online', categoria: 'CONT', rolTipo: 'COPY', tiempo: 0.5 },
  { codigo: 'CONT-006', nombre: 'Guión de Video', descripcion: 'Texto para video corporativo o promocional', categoria: 'CONT', rolTipo: 'COPY', tiempo: 2 },
  { codigo: 'CONT-007', nombre: 'Boletín de Email', descripcion: 'Redacción de newsletter', categoria: 'CONT', rolTipo: 'COPY', tiempo: 1.5 },
  { codigo: 'CONT-008', nombre: 'Nota de Prensa', descripcion: 'Comunicado para medios', categoria: 'CONT', rolTipo: 'COPY', tiempo: 2 },
  { codigo: 'CONT-009', nombre: 'Caso de Éxito', descripcion: 'Redacción de historia de cliente', categoria: 'CONT', rolTipo: 'COPY', tiempo: 4 },
  { codigo: 'CONT-010', nombre: 'Guía Descargable', descripcion: 'Ebook o documento extenso', categoria: 'CONT', rolTipo: 'COPY', tiempo: 12 },
  { codigo: 'CONT-011', nombre: 'Transcripción', descripcion: 'Convertir audio/video a texto', categoria: 'CONT', rolTipo: 'COPY', tiempo: 1 },
  { codigo: 'CONT-012', nombre: 'Adaptación de Idioma', descripcion: 'Traducción o localización', categoria: 'CONT', rolTipo: 'COPY', tiempo: 2 },

  // DIS
  { codigo: 'DIS-001', nombre: 'Diseño de Logotipo', descripcion: 'Creación de marca desde cero', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 12 },
  { codigo: 'DIS-002', nombre: 'Manual de Identidad', descripcion: 'Guía completa de marca', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 16 },
  { codigo: 'DIS-003', nombre: 'Tarjeta de Visita', descripcion: 'Diseño de tarjetas corporativas', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 2 },
  { codigo: 'DIS-004', nombre: 'Papelería Corporativa', descripcion: 'Carta, sobre, carpeta, etc.', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 6 },
  { codigo: 'DIS-005', nombre: 'Folleto Publicitario', descripcion: 'Diseño de flyer o díptico', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 3 },
  { codigo: 'DIS-006', nombre: 'Cartel o Póster', descripcion: 'Diseño de gran formato', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 4 },
  { codigo: 'DIS-007', nombre: 'Catálogo de Productos', descripcion: 'Diseño de documento multipágina', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 2 },
  { codigo: 'DIS-008', nombre: 'Plantilla de Presentación', descripcion: 'Diseño para PowerPoint/Keynote', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 4 },
  { codigo: 'DIS-009', nombre: 'Infografía', descripcion: 'Representación visual de datos', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 4 },
  { codigo: 'DIS-010', nombre: 'Banner Publicitario', descripcion: 'Diseño para anuncios web', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 1 },
  { codigo: 'DIS-011', nombre: 'Plantilla de Email', descripcion: 'Diseño de newsletter', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 3 },
  { codigo: 'DIS-012', nombre: 'Diseño de Packaging', descripcion: 'Diseño de envases y embalajes', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 8 },
  { codigo: 'DIS-013', nombre: 'Montaje de Producto', descripcion: 'Visualización en contexto', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 2 },
  { codigo: 'DIS-014', nombre: 'Retoque Fotográfico', descripcion: 'Edición y mejora de imágenes', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 1 },
  { codigo: 'DIS-015', nombre: 'Set de Iconos', descripcion: 'Iconografía personalizada', categoria: 'DIS', rolTipo: 'DESIGNER', tiempo: 4 },

  // AV - Audiovisual
  { codigo: 'AV-001', nombre: 'Edición de Video Corto', descripcion: 'Video de hasta 1 minuto', categoria: 'AV', rolTipo: 'AV', tiempo: 2 },
  { codigo: 'AV-002', nombre: 'Edición de Video Medio', descripcion: 'Video de 1-5 minutos', categoria: 'AV', rolTipo: 'AV', tiempo: 4 },
  { codigo: 'AV-003', nombre: 'Edición de Video Largo', descripcion: 'Video de más de 5 minutos', categoria: 'AV', rolTipo: 'AV', tiempo: 8 },
  { codigo: 'AV-004', nombre: 'Creación de Reel Instagram', descripcion: 'Video vertical optimizado para IG', categoria: 'AV', rolTipo: 'AV', tiempo: 2 },
  { codigo: 'AV-005', nombre: 'Creación de Reel TikTok', descripcion: 'Video vertical optimizado para TikTok', categoria: 'AV', rolTipo: 'AV', tiempo: 2 },
  { codigo: 'AV-006', nombre: 'Creación de Short YouTube', descripcion: 'Video corto para YouTube Shorts', categoria: 'AV', rolTipo: 'AV', tiempo: 2 },
  { codigo: 'AV-007', nombre: 'Edición de Clip Promocional', descripcion: 'Corte para anuncios o promos', categoria: 'AV', rolTipo: 'AV', tiempo: 1.5 },
  { codigo: 'AV-008', nombre: 'Montaje de Evento', descripcion: 'Resumen de evento o jornada', categoria: 'AV', rolTipo: 'AV', tiempo: 6 },
  { codigo: 'AV-009', nombre: 'Video Testimonio', descripcion: 'Edición de entrevista a cliente', categoria: 'AV', rolTipo: 'AV', tiempo: 3 },
  { codigo: 'AV-010', nombre: 'Video Tutorial', descripcion: 'Edición de contenido educativo', categoria: 'AV', rolTipo: 'AV', tiempo: 4 },
  { codigo: 'AV-011', nombre: 'Animación de Logo', descripcion: 'Logo animado para videos', categoria: 'AV', rolTipo: 'AV', tiempo: 3 },
  { codigo: 'AV-012', nombre: 'Intro/Outro de Video', descripcion: 'Cabecera y cierre para canal', categoria: 'AV', rolTipo: 'AV', tiempo: 2 },
  { codigo: 'AV-013', nombre: 'Subtitulado de Video', descripcion: 'Añadir subtítulos a video', categoria: 'AV', rolTipo: 'AV', tiempo: 1 },
  { codigo: 'AV-014', nombre: 'Corrección de Color', descripcion: 'Etalonaje y ajuste de imagen', categoria: 'AV', rolTipo: 'AV', tiempo: 2 },
  { codigo: 'AV-015', nombre: 'Edición de Podcast', descripcion: 'Producción de audio con intro/outro', categoria: 'AV', rolTipo: 'AV', tiempo: 2 },
  { codigo: 'AV-016', nombre: 'Sesión Fotográfica', descripcion: 'Dirección y realización de fotos', categoria: 'AV', rolTipo: 'AV', tiempo: 4 },
  { codigo: 'AV-017', nombre: 'Edición Fotográfica Básica', descripcion: 'Retoque de 10-20 fotos', categoria: 'AV', rolTipo: 'AV', tiempo: 2 },
  { codigo: 'AV-018', nombre: 'Edición Fotográfica Avanzada', descripcion: 'Retoque profesional por foto', categoria: 'AV', rolTipo: 'AV', tiempo: 0.5 },
  { codigo: 'AV-019', nombre: 'Banco de Imágenes', descripcion: 'Selección y edición de stock', categoria: 'AV', rolTipo: 'AV', tiempo: 1 },
  { codigo: 'AV-020', nombre: 'Grabación de Video', descripcion: 'Rodaje de contenido', categoria: 'AV', rolTipo: 'AV', tiempo: 4 },

  // MNT
  { codigo: 'MNT-001', nombre: 'Actualización de Contenido', descripcion: 'Cambios de textos o imágenes', categoria: 'MNT', rolTipo: 'DEV', tiempo: 0.5 },
  { codigo: 'MNT-002', nombre: 'Actualización de Sistema', descripcion: 'Mantenimiento técnico mensual', categoria: 'MNT', rolTipo: 'DEV', tiempo: 1, recurrente: true, frecuencia: 'MENSUAL' },
  { codigo: 'MNT-003', nombre: 'Copia de Seguridad Manual', descripcion: 'Backup bajo demanda', categoria: 'MNT', rolTipo: 'DEV', tiempo: 0.5 },
  { codigo: 'MNT-004', nombre: 'Monitorización', descripcion: 'Revisión de funcionamiento', categoria: 'MNT', rolTipo: 'DEV', tiempo: 0.5, recurrente: true, frecuencia: 'SEMANAL' },
  { codigo: 'MNT-005', nombre: 'Corrección de Errores', descripcion: 'Solución de fallos reportados', categoria: 'MNT', rolTipo: 'DEV', tiempo: 2 },
  { codigo: 'MNT-006', nombre: 'Soporte al Cliente', descripcion: 'Atención de consultas técnicas', categoria: 'MNT', rolTipo: 'DEV', tiempo: 1 },
  { codigo: 'MNT-007', nombre: 'Renovación de Dominio', descripcion: 'Gestión de renovación anual', categoria: 'MNT', rolTipo: 'ADMIN', tiempo: 0.5 },
  { codigo: 'MNT-008', nombre: 'Renovación de Alojamiento', descripcion: 'Gestión de renovación anual', categoria: 'MNT', rolTipo: 'ADMIN', tiempo: 0.5 },
  { codigo: 'MNT-009', nombre: 'Limpieza de Base de Datos', descripcion: 'Optimización y mantenimiento', categoria: 'MNT', rolTipo: 'DEV', tiempo: 1 },
  { codigo: 'MNT-010', nombre: 'Análisis de Seguridad', descripcion: 'Escaneo de vulnerabilidades', categoria: 'MNT', rolTipo: 'DEV', tiempo: 2 },

  // EST
  { codigo: 'EST-001', nombre: 'Reunión Inicial', descripcion: 'Primera toma de contacto con cliente', categoria: 'EST', rolTipo: 'MANAGER', tiempo: 2 },
  { codigo: 'EST-002', nombre: 'Propuesta Comercial', descripcion: 'Elaboración de presupuesto', categoria: 'EST', rolTipo: 'MANAGER', tiempo: 3 },
  { codigo: 'EST-003', nombre: 'Plan de Marketing', descripcion: 'Estrategia anual completa', categoria: 'EST', rolTipo: 'MANAGER', tiempo: 12 },
  { codigo: 'EST-004', nombre: 'Reunión de Seguimiento', descripcion: 'Encuentro mensual con cliente', categoria: 'EST', rolTipo: 'MANAGER', tiempo: 1, recurrente: true, frecuencia: 'MENSUAL' },
  { codigo: 'EST-005', nombre: 'Informe Mensual Global', descripcion: 'Reporte integrado de todos los servicios', categoria: 'EST', rolTipo: 'MANAGER', tiempo: 4, recurrente: true, frecuencia: 'MENSUAL' },
  { codigo: 'EST-006', nombre: 'Análisis de Mercado', descripcion: 'Estudio de sector y competencia', categoria: 'EST', rolTipo: 'MANAGER', tiempo: 8 },
  { codigo: 'EST-007', nombre: 'Consultoría', descripcion: 'Sesión de asesoramiento', categoria: 'EST', rolTipo: 'MANAGER', tiempo: 2 },
  { codigo: 'EST-008', nombre: 'Formación al Cliente', descripcion: 'Capacitación en herramientas', categoria: 'EST', rolTipo: 'MANAGER', tiempo: 2 },
  { codigo: 'EST-009', nombre: 'Presentación de Resultados', descripcion: 'Preparación y exposición', categoria: 'EST', rolTipo: 'MANAGER', tiempo: 3 },
  { codigo: 'EST-010', nombre: 'Alta de Cliente Nuevo', descripcion: 'Proceso completo de incorporación', categoria: 'EST', rolTipo: 'MANAGER', tiempo: 4 },
];

async function main() {
  console.log('🌱 Iniciando seed del catálogo de servicios...\n');

  // Crear categorías
  console.log('📁 Creando categorías de servicio...');
  for (const cat of categorias) {
    await prisma.categorias_servicio.upsert({
      where: { codigo: cat.codigo },
      update: cat,
      create: cat,
    });
    console.log(`   ✓ ${cat.codigo}: ${cat.nombre}`);
  }

  // Obtener IDs de categorías
  const categoriasDB = await prisma.categorias_servicio.findMany();
  const categoriaMap = new Map(categoriasDB.map(c => [c.codigo, c.id]));

  // Crear plantillas de tareas
  console.log('\n📋 Creando plantillas de tareas...');
  for (const tarea of plantillas) {
    const categoriaId = categoriaMap.get(tarea.categoria);
    if (!categoriaId) {
      console.log(`   ⚠ Categoría no encontrada: ${tarea.categoria}`);
      continue;
    }

    await prisma.plantillas_tarea.upsert({
      where: { codigo: tarea.codigo },
      update: {
        nombre: tarea.nombre,
        descripcion: tarea.descripcion,
        categoriaId,
        rolSugeridoTipo: tarea.rolTipo,
        tiempoEstimado: tarea.tiempo,
        esRecurrente: tarea.recurrente || false,
        frecuencia: tarea.frecuencia || null,
      },
      create: {
        codigo: tarea.codigo,
        nombre: tarea.nombre,
        descripcion: tarea.descripcion,
        categoriaId,
        rolSugeridoTipo: tarea.rolTipo,
        tiempoEstimado: tarea.tiempo,
        esRecurrente: tarea.recurrente || false,
        frecuencia: tarea.frecuencia || null,
      },
    });
  }
  console.log(`   ✓ ${plantillas.length} plantillas creadas`);

  console.log('\n✅ Seed completado exitosamente!');
  console.log(`   - ${categorias.length} categorías`);
  console.log(`   - ${plantillas.length} plantillas de tareas`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });