const FROM = 'Elio Studio OS <notificaciones@elioestudio.com>';

async function sendEmail(payload: { from: string; to: string; subject: string; html: string }) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send(payload);
}

// ── Plantillas ──────────────────────────────────────────────────────────────

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f4f4f5; margin:0; padding:0; }
    .wrapper { max-width:560px; margin:32px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    .header { background:#18181b; padding:24px 32px; }
    .header img { height:28px; }
    .header-title { color:#fff; font-size:13px; font-weight:500; margin-top:4px; letter-spacing:.04em; opacity:.6; }
    .body { padding:32px; color:#18181b; }
    .body h1 { font-size:20px; font-weight:700; margin:0 0 8px; }
    .body p { font-size:14px; line-height:1.6; color:#52525b; margin:0 0 16px; }
    .chip { display:inline-block; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:600; }
    .chip-red { background:#fee2e2; color:#b91c1c; }
    .chip-yellow { background:#fef9c3; color:#92400e; }
    .chip-blue { background:#dbeafe; color:#1e40af; }
    .detail-box { background:#f4f4f5; border-radius:8px; padding:16px; margin:16px 0; font-size:13px; color:#3f3f46; }
    .detail-box strong { display:block; margin-bottom:4px; color:#18181b; font-size:14px; }
    .footer { padding:16px 32px; border-top:1px solid #f4f4f5; font-size:11px; color:#a1a1aa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-.01em;">Elio Studio OS</div>
      <div class="header-title">Sistema de gestión</div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">Este es un mensaje automático. No responder a este correo.</div>
  </div>
</body>
</html>`;
}

function tareaAsignadaHtml(opts: { nombre: string; tarea: string; proyecto: string; prioridad: string; descripcion?: string; fecha?: string }): string {
  const prioridadChip: Record<string, string> = { HIGH: '<span class="chip chip-red">Alta</span>', MEDIUM: '<span class="chip chip-yellow">Media</span>', LOW: '<span class="chip chip-blue">Baja</span>' };
  const chip = prioridadChip[opts.prioridad] ?? '';
  return baseLayout(`
    <h1>Se te ha asignado una tarea</h1>
    <p>Hola <strong>${opts.nombre}</strong>, tienes una nueva tarea asignada en el proyecto <strong>${opts.proyecto}</strong>.</p>
    <div class="detail-box">
      <strong>${opts.tarea}</strong>
      ${opts.descripcion ? `<p style="margin:4px 0 8px;">${opts.descripcion}</p>` : ''}
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px;">
        Prioridad: ${chip}
        ${opts.fecha ? `&nbsp;·&nbsp; Vence: <strong>${opts.fecha}</strong>` : ''}
      </div>
    </div>
    <p>Accede a la aplicación para ver los detalles completos.</p>
  `);
}

function tareaUrgenteHtml(opts: { nombre: string; tarea: string; proyecto: string; descripcion?: string }): string {
  return baseLayout(`
    <h1>⚠️ Tarea urgente asignada</h1>
    <p>Hola <strong>${opts.nombre}</strong>, se ha marcado una tarea como <strong>urgente</strong> en el proyecto <strong>${opts.proyecto}</strong> y requiere tu atención inmediata.</p>
    <div class="detail-box">
      <strong>${opts.tarea}</strong>
      ${opts.descripcion ? `<p style="margin:4px 0 0;">${opts.descripcion}</p>` : ''}
    </div>
    <p>Por favor, revisa la tarea lo antes posible en la aplicación.</p>
  `);
}

function registroHorarioHtml(opts: { nombre: string; fecha: string }): string {
  return baseLayout(`
    <h1>Registro horario pendiente</h1>
    <p>Hola <strong>${opts.nombre}</strong>, no hemos registrado tu entrada del día <strong>${opts.fecha}</strong>.</p>
    <p>Recuerda registrar tu jornada diariamente desde el control horario de la aplicación. Si crees que es un error, contacta con administración.</p>
  `);
}

// ── Funciones públicas ───────────────────────────────────────────────────────

export async function enviarEmailTareaAsignada(opts: {
  email: string;
  nombre: string;
  tarea: string;
  proyecto: string;
  prioridad: string;
  descripcion?: string;
  fecha?: string;
}) {
  return sendEmail({
    from: FROM,
    to: opts.email,
    subject: `Nueva tarea asignada: ${opts.tarea}`,
    html: tareaAsignadaHtml(opts),
  });
}

export async function enviarEmailTareaUrgente(opts: {
  email: string;
  nombre: string;
  tarea: string;
  proyecto: string;
  descripcion?: string;
}) {
  return sendEmail({
    from: FROM,
    to: opts.email,
    subject: `⚠️ Tarea urgente: ${opts.tarea}`,
    html: tareaUrgenteHtml(opts),
  });
}

export async function enviarEmailRegistroFaltante(opts: {
  email: string;
  nombre: string;
  fecha: string;
}) {
  return sendEmail({
    from: FROM,
    to: opts.email,
    subject: `Registro horario pendiente — ${opts.fecha}`,
    html: registroHorarioHtml(opts),
  });
}
