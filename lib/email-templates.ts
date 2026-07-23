const wrapper = (body: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;background-color:#ffffff;">
              <svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" style="width:80px;height:106px;">
                <polygon points="30,100 150,30 270,100 270,120 150,50 30,120" fill="#f48221"/>
                <polygon points="210,115 235,95 255,115 230,135" fill="#1d1d1b"/>
                <circle cx="150" cy="180" r="65" fill="none" stroke="#1d1d1b" stroke-width="18"/>
                <text x="150" y="228" font-family="Arial,sans-serif" font-weight="900" font-size="130" text-anchor="middle" fill="#1d1d1b">S</text>
                <g fill="#f48221">
                  <text x="150" y="325" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="95" text-anchor="middle" letter-spacing="1">ONE</text>
                  <rect x="73" y="240" width="6" height="90" fill="#ffffff"/>
                  <rect x="135" y="240" width="6" height="90" fill="#ffffff" transform="skewX(-25)"/>
                  <rect x="228" y="240" width="8" height="90" fill="#ffffff"/>
                </g>
                <text x="150" y="375" font-family="Arial,sans-serif" font-weight="900" font-size="36" text-anchor="middle" fill="#000000" letter-spacing="2">SOLUTIONS</text>
              </svg>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#1d1d1b;text-align:center;">
              <p style="margin:0;color:#aaaaaa;font-size:11px;line-height:1.5;">
                &copy; ${new Date().getFullYear()} One Solutions Companies. Todos los derechos reservados.<br>
                Este es un correo autom&aacute;tico, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const buttonStyle = `
  display:inline-block;
  padding:14px 36px;
  background-color:#f48221;
  color:#ffffff;
  text-decoration:none;
  border-radius:8px;
  font-weight:bold;
  font-size:16px;
  text-align:center;
`;

const headingStyle = 'style="margin:0 0 8px;color:#1d1d1b;font-size:22px;font-weight:700;"';
const textStyle = 'style="margin:0 0 20px;color:#555555;font-size:15px;line-height:1.6;"';
const subtitleStyle = 'style="margin:0 0 16px;color:#777777;font-size:14px;line-height:1.5;"';

export const emailTemplates = {
  onboarding: (name: string, setupLink: string) =>
    wrapper(`
      <h2 ${headingStyle}>¡Bienvenido a One Solutions, ${name}!</h2>
      <p ${textStyle}>Tu cuenta ha sido creada. Para comenzar, configura tu contrase&ntilde;a haciendo clic en el bot&oacute;n de abajo.</p>
      <p ${subtitleStyle}>Este enlace es v&aacute;lido por 7 d&iacute;as. Si no lo usas dentro de ese plazo, deber&aacute;s solicitar uno nuevo a tu administrador.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${setupLink}" style="${buttonStyle}">Configurar mi cuenta</a>
      </div>
      <p ${subtitleStyle}>O copia y pega este enlace en tu navegador:</p>
      <p style="margin:0 0 20px;color:#888888;font-size:12px;word-break:break-all;">${setupLink}</p>
    `),

  contractToClient: (clientName: string, contractName: string) =>
    wrapper(`
      <h2 ${headingStyle}>Hola, ${clientName}</h2>
      <p ${textStyle}>Adjunto encontrar&aacute;s el contrato <strong>"${contractName}"</strong> generado por One Solutions.</p>
      <p ${subtitleStyle}>Por favor, revisa los detalles y no dudes en contactarnos si tienes alguna pregunta. Puedes firmar digitalmente o imprimir y enviar una copia firmada.</p>
    `),

  invoice: (clientName: string, invoiceNum: string) =>
    wrapper(`
      <h2 ${headingStyle}>Factura #${invoiceNum}</h2>
      <p ${textStyle}>Hola, ${clientName}. Adjuntamos tu factura correspondiente. Puedes revisar los detalles en el documento adjunto.</p>
      <p ${subtitleStyle}>Para cualquier consulta sobre esta factura, responde a este correo o contacta a tu representante de ventas.</p>
      <div style="text-align:center;margin:28px 0;">
        <span style="display:inline-block;padding:12px 28px;background-color:#f4f4f6;color:#1d1d1b;border-radius:8px;font-weight:bold;font-size:14px;">${invoiceNum}</span>
      </div>
    `),

  reminderVisit: (repName: string, clientName: string, date: string, time?: string) =>
    wrapper(`
      <h2 ${headingStyle}>Recordatorio de visita</h2>
      <p ${textStyle}>Hola, ${clientName}. Te recordamos que <strong>${repName}</strong> tiene una visita agendada contigo.</p>
      <table cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 16px;background-color:#f9f9f9;border-radius:8px 8px 0 0;color:#555555;font-size:14px;"><strong>Fecha:</strong> ${date}</td></tr>
        ${time ? `<tr><td style="padding:10px 16px;background-color:#f4f4f6;border-radius:0 0 8px 8px;color:#555555;font-size:14px;"><strong>Hora:</strong> ${time}</td></tr>` : ''}
      </table>
      <p ${subtitleStyle}>Si necesitas reagendar, por favor contacta a tu representante.</p>
    `),

  projectProgress: (repName: string, clientName: string, stage: string) =>
    wrapper(`
      <h2 ${headingStyle}>Actualizaci&oacute;n de proyecto</h2>
      <p ${textStyle}>Hola, ${clientName}. Tu proyecto asignado a <strong>${repName}</strong> ha avanzado a una nueva etapa.</p>
      <div style="text-align:center;margin:28px 0;">
        <span style="display:inline-block;padding:12px 28px;background-color:#f48221;color:#ffffff;border-radius:8px;font-weight:bold;font-size:16px;">${stage}</span>
      </div>
      <p ${subtitleStyle}>Tu representante te mantendr&aacute; informado sobre los pr&oacute;ximos pasos.</p>
    `),

  leadExpiring: (repName: string, leadAddress: string, daysLeft: number) =>
    wrapper(`
      <h2 ${headingStyle}>Aviso de lead pr&oacute;ximo a expirar</h2>
      <p ${textStyle}>Hola, <strong>${repName}</strong>. El lead en la direcci&oacute;n <strong>${leadAddress}</strong> expirar&aacute; en <strong>${daysLeft} d&iacute;a${daysLeft !== 1 ? 's' : ''}</strong>.</p>
      <p ${subtitleStyle}>Te recomendamos realizar el seguimiento cuanto antes para no perder la oportunidad.</p>
      <div style="text-align:center;margin:28px 0;">
        <span style="display:inline-block;padding:10px 24px;background-color:#fff3e8;color:#f48221;border:1px solid #f48221;border-radius:8px;font-weight:bold;font-size:14px;">${daysLeft} d&iacute;a${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}</span>
      </div>
    `),

  projectClosed: (repName: string, clientName: string, amount: string) =>
    wrapper(`
      <h2 ${headingStyle}>¡Proyecto cerrado!</h2>
      <p ${textStyle}>Felicitaciones, <strong>${repName}</strong>. Has cerrado exitosamente un proyecto para el cliente <strong>${clientName}</strong>.</p>
      <div style="text-align:center;margin:28px 0;">
        <span style="display:inline-block;padding:12px 28px;background-color:#006e00;color:#ffffff;border-radius:8px;font-weight:bold;font-size:18px;">${amount}</span>
      </div>
      <p ${subtitleStyle}>Sigue as&iacute;. El equipo de One Solutions reconoce tu esfuerzo y dedicaci&oacute;n.</p>
    `),

  welcomeRep: (repName: string, loginLink: string) =>
    wrapper(`
      <h2 ${headingStyle}>¡Bienvenido al equipo, ${repName}!</h2>
      <p ${textStyle}>Tu cuenta en One Solutions est&aacute; lista. Accede a la plataforma para comenzar a gestionar tus leads, visitas y proyectos.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${loginLink}" style="${buttonStyle}">Ir a One Solutions</a>
      </div>
      <p ${subtitleStyle}>Si tienes alguna duda sobre el uso de la plataforma, consulta con tu administrador o gerente.</p>
    `),
};
