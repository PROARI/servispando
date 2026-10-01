/**
 * SERVIS PANDO - Lógica Interactiva de la Aplicación
 * Asesor Autorizado de Pagos de Servicios Básicos en Cobija: Ariel Saavedra
 * Contacto Oficial WhatsApp: +591 74758244
 * Tecnología MultiRed by Síntesis
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. CONFIGURACIÓN Y ESTADO DE LA APLICACIÓN
  // =========================================================================
  const CONFIG = {
    advisorName: 'Ariel Saavedra',
    advisorRole: 'Asesor Autorizado en Cobija',
    fixedFee: '5 Bs',
    whatsappNumber: '59174758244', // +591 74758244
    whatsappFormatted: '+591 74758244',
    soundEnabled: true
  };

  const STATE = {
    chatStep: 0, // 0: Nombre, 1: Servicio, 2: Código, 3: Meses, 4: Confirmado
    userData: {
      fullName: '',
      service: '',
      serviceKey: '',
      userCode: '',
      months: ''
    }
  };

  // =========================================================================
  // 2. ELEMENTOS DEL DOM
  // =========================================================================
  const dom = {
    chatMessagesArea: document.getElementById('chat-messages-area'),
    chatForm: document.getElementById('chat-form'),
    chatUserInput: document.getElementById('chat-user-input'),
    chatSendBtn: document.getElementById('chat-send-btn'),
    chatQuickActions: document.getElementById('chat-quick-actions'),
    typingIndicator: document.getElementById('typing-indicator'),
    chatResetBtn: document.getElementById('chat-reset-btn'),
    chatSoundToggle: document.getElementById('chat-sound-toggle'),
    soundIcon: document.getElementById('sound-icon'),
    openChatBtn: document.getElementById('open-chat-btn'),
    floatingChatToggle: document.getElementById('floating-chat-toggle'),
    floatingBubble: document.getElementById('floating-bubble'),
    bubbleCloseBtn: document.getElementById('bubble-close-btn'),
    bubbleTrigger: document.getElementById('bubble-trigger'),
    mobileToggle: document.getElementById('mobile-toggle'),
    navMenu: document.getElementById('nav-menu'),
    helperTabs: document.querySelectorAll('.helper-tab'),
    helperPanels: document.querySelectorAll('.tab-panel'),
    ticketModal: document.getElementById('ticket-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    ticketModalBody: document.getElementById('ticket-modal-body'),
    ticketModalFooter: document.getElementById('ticket-modal-footer')
  };

  // =========================================================================
  // 3. GENERADOR DE SONIDOS SINTÉTICOS (Web Audio API)
  // Sin dependencias de archivos de audio externos para máxima fiabilidad
  // =========================================================================
  let audioCtx = null;

  function initAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
  }

  function playTone(type) {
    if (!CONFIG.soundEnabled) return;
    try {
      initAudioContext();
      if (!audioCtx) return;

      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'receive') {
        // Sonido suave de mensaje entrante (dos tonos armónicos)
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'send') {
        // Sonido de clic/envío del usuario
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.08);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'success') {
        // Tono festivo de confirmación / ticket generado
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch (e) {
      // Ignorar errores silenciosamente si el navegador bloquea audio automático
    }
  }

  // =========================================================================
  // 4. CHAT ENGINE & FLUJO CONVERSACIONAL
  // =========================================================================

  /** Formatea la hora actual */
  function getCurrentTimeString() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /** Muestra u oculta el indicador de escritura */
  function setTyping(isTyping) {
    if (dom.typingIndicator) {
      dom.typingIndicator.style.display = isTyping ? 'flex' : 'none';
      if (isTyping) {
        scrollToBottom();
      }
    }
  }

  /** Hace scroll al final del chat */
  function scrollToBottom() {
    if (dom.chatMessagesArea) {
      dom.chatMessagesArea.scrollTop = dom.chatMessagesArea.scrollHeight;
    }
  }

  /** Agrega un mensaje al chat */
  function appendMessage(sender, textHtml) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${sender}`;

    let avatarHtml = '';
    if (sender === 'bot') {
      avatarHtml = `
        <div class="msg-avatar">
          <img src="ASESOR AUTORIZADO.jpg" alt="Ariel Saavedra">
        </div>
      `;
    } else {
      avatarHtml = `
        <div class="msg-avatar user-avatar-box" style="background:#0056D2; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem;">
          👤
        </div>
      `;
    }

    msgDiv.innerHTML = `
      ${avatarHtml}
      <div class="msg-bubble">
        <div class="msg-text">${textHtml}</div>
        <span class="msg-time">${getCurrentTimeString()}</span>
      </div>
    `;

    dom.chatMessagesArea.appendChild(msgDiv);
    scrollToBottom();

    if (sender === 'bot') {
      playTone('receive');
    } else {
      playTone('send');
    }
  }

  /** Limpia las opciones rápidas */
  function clearQuickActions() {
    if (dom.chatQuickActions) {
      dom.chatQuickActions.innerHTML = '';
    }
  }

  /** Inyecta opciones rápidas con botones interactivos */
  function setQuickActions(actions) {
    clearQuickActions();
    if (!dom.chatQuickActions) return;

    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `action-chip ${action.className || ''}`;
      btn.innerHTML = `${action.icon ? action.icon + ' ' : ''}${action.label}`;
      btn.addEventListener('click', () => {
        action.onClick();
      });
      dom.chatQuickActions.appendChild(btn);
    });
  }

  /**
   * INICIO DEL CHAT (Paso 0)
   */
  function startChat() {
    dom.chatMessagesArea.innerHTML = '';
    clearQuickActions();
    STATE.chatStep = 0;
    STATE.userData = {
      fullName: '',
      service: '',
      serviceKey: '',
      userCode: '',
      months: ''
    };

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      appendMessage('bot', `
        <strong>¡Hola! Te doy la más cordial bienvenida a SERVIS PANDO.</strong><br>
        Soy <strong>Ariel Saavedra</strong>, tu Asesor Autorizado en Cobija.<br><br>
        
        <div style="background: rgba(16, 185, 129, 0.15); border-left: 3px solid #10B981; padding: 10px 14px; border-radius: 6px; margin: 8px 0; font-size: 0.88rem; color: #FFF;">
          <strong style="color: #34D399;">🔍 INFORMACIÓN DE DEUDAS TOTALMENTE GRATIS</strong><br>
          <span style="font-size: 0.82rem; color: #E2E8F0;">
            Averigua cuánto debes en ENDE Cobija, EPSA o ENTEL sin pagar un solo centavo.
          </span>
        </div>

        <div style="background: rgba(0, 86, 210, 0.15); border-left: 3px solid #60A5FA; padding: 10px 14px; border-radius: 6px; margin: 8px 0; font-size: 0.88rem; color: #FFF;">
          <strong style="color: #93C5FD;">🛡️ PAGOS 100% SEGURO - ATENCIÓN PERSONAL (NO BOT)</strong><br>
          <span style="font-size: 0.82rem; color: #E2E8F0;">
            Tu trámite lo atiendo y ejecuto yo personalmente con la tecnología oficial <strong>MultiRed</strong>, garantizando tu comprobante legal y cero errores.
          </span>
        </div>

        Para comenzar tu atención personalizada, por favor indícame tu <strong>Nombre Completo</strong>:
      `);

      dom.chatUserInput.placeholder = 'Escribe aquí tu nombre y apellido...';
      dom.chatUserInput.focus();

      // Opciones sugeridas rápidas para demostración fácil
      setQuickActions([
        {
          label: 'Carlos Mendoza',
          icon: '✍️',
          onClick: () => handleUserNameSubmit('Carlos Mendoza')
        },
        {
          label: 'Verónica Flores',
          icon: '✍️',
          onClick: () => handleUserNameSubmit('Verónica Flores')
        }
      ]);
    }, 600);
  }

  /**
   * PASO 1: Recibe Nombre y Pide Servicio
   */
  function handleUserNameSubmit(name) {
    const trimmed = name.trim();
    if (!trimmed) {
      dom.chatUserInput.focus();
      return;
    }

    STATE.userData.fullName = trimmed;
    appendMessage('user', trimmed);
    dom.chatUserInput.value = '';
    clearQuickActions();

    STATE.chatStep = 1;
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      appendMessage('bot', `
        Mucho gusto, <strong>${STATE.userData.fullName}</strong>. 👋<br>
        ¿Qué servicio básico deseas consultar o pagar hoy en Cobija? Recuerda que la <strong>información de deuda es TOTALMENTE GRATIS</strong>:
      `);

      setQuickActions([
        {
          label: 'Luz ENDE Cobija',
          icon: '⚡',
          onClick: () => handleServiceSelect('ende', 'Luz ENDE Cobija')
        },
        {
          label: 'Agua EPSA Cobija',
          icon: '💧',
          onClick: () => handleServiceSelect('epsa', 'Agua EPSA Municipal de Cobija')
        },
        {
          label: 'WiFi ENTEL',
          icon: '📶',
          onClick: () => handleServiceSelect('entel', 'WiFi / Fibra ENTEL')
        },
        {
          label: 'Otros Servicios MultiRed',
          icon: '🔄',
          onClick: () => handleServiceSelect('otros', 'Otros Servicios MultiRed')
        }
      ]);

      dom.chatUserInput.placeholder = 'Escribe o selecciona tu servicio...';
    }, 700);
  }

  /**
   * PASO 2: Recibe Servicio y Pide Código de Usuario
   */
  function handleServiceSelect(serviceKey, serviceLabel) {
    STATE.userData.serviceKey = serviceKey;
    STATE.userData.service = serviceLabel;

    appendMessage('user', `Deseo consultar/pagar: ${serviceLabel}`);
    clearQuickActions();
    STATE.chatStep = 2;
    setTyping(true);

    setTimeout(() => {
      setTyping(false);

      let serviceHint = '';
      if (serviceKey === 'ende') {
        serviceHint = 'Tu <strong>Código de Abonado</strong> de ENDE Cobija suele tener entre 6 y 8 dígitos (ej: 7482910).';
      } else if (serviceKey === 'epsa') {
        serviceHint = 'Tu <strong>Código de Usuario / Cuenta</strong> de EPSA Cobija figura en tu papeleta de agua potable (ej: 038419).';
      } else if (serviceKey === 'entel') {
        serviceHint = 'Tu <strong>N° de Enlace</strong> o <strong>Carnet de Identidad</strong> del titular del servicio de WiFi ENTEL (ej: 7294812).';
      } else {
        serviceHint = 'El número de trámite, carnet o cuenta del servicio.';
      }

      appendMessage('bot', `
        Perfecto, revisaremos tu servicio de <strong>${serviceLabel}</strong>. 📋<br><br>
        Por favor ingresa tu <strong>Código de Usuario / Abonado</strong>:<br>
        <small style="color:#94A3B8;">${serviceHint}</small><br><br>
        💡 <em>¿No estás seguro de dónde encontrarlo en tu factura? Puedes ver la guía con ejemplos aquí abajo.</em>
      `);

      dom.chatUserInput.placeholder = 'Ingresa aquí tu código de usuario...';
      dom.chatUserInput.focus();

      setQuickActions([
        {
          label: '¿Dónde está mi código en la factura?',
          icon: '🔍',
          className: 'chip-gold',
          onClick: () => {
            const guide = document.getElementById('guia-codigo');
            if (guide) {
              guide.scrollIntoView({ behavior: 'smooth' });
            }
          }
        },
        {
          label: serviceKey === 'ende' ? '7482910' : (serviceKey === 'epsa' ? '038419' : '7294812'),
          icon: '🔢',
          onClick: () => {
            const demoCode = serviceKey === 'ende' ? '7482910' : (serviceKey === 'epsa' ? '038419' : '7294812');
            handleCodeSubmit(demoCode);
          }
        }
      ]);
    }, 700);
  }

  /**
   * PASO 3: Recibe Código y Pregunta Cuántos Meses Desea Pagar
   */
  function handleCodeSubmit(codeText) {
    const trimmed = codeText.trim();
    if (!trimmed) {
      dom.chatUserInput.focus();
      return;
    }
    STATE.userData.userCode = trimmed;
    appendMessage('user', `Código de usuario: ${trimmed}`);
    dom.chatUserInput.value = '';

    clearQuickActions();
    STATE.chatStep = 3;
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      appendMessage('bot', `
        ¡Excelente! Código de usuario <strong>${STATE.userData.userCode}</strong> registrado correctamente.<br><br>
        Ahora indícame: <strong>¿Cuántos meses deseas pagar o consultar?</strong>
      `);

      setQuickActions([
        {
          label: '1 Mes',
          icon: '📅',
          onClick: () => handleMonthsSubmit('1 Mes')
        },
        {
          label: '2 Meses',
          icon: '📅',
          onClick: () => handleMonthsSubmit('2 Meses')
        },
        {
          label: '3 Meses',
          icon: '📅',
          onClick: () => handleMonthsSubmit('3 Meses')
        },
        {
          label: 'Varios Meses en Uno Solo (Todos los pendientes)',
          icon: '📚',
          className: 'chip-gold',
          onClick: () => handleMonthsSubmit('Varios meses acumulados')
        }
      ]);

      dom.chatUserInput.placeholder = 'Ej: 1 mes, 2 meses o varios meses...';
    }, 750);
  }

  /**
   * PASO 4: Recibe Meses, Explica la Tarifa Fija de 5 Bs y Presenta Resumen / Ticket
   */
  function handleMonthsSubmit(months) {
    STATE.userData.months = months;
    appendMessage('user', `Deseo pagar: ${months}`);
    dom.chatUserInput.value = '';
    clearQuickActions();

    STATE.chatStep = 4;
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      playTone('success');

      const folio = 'SP-' + Math.floor(1000 + Math.random() * 9000);

      appendMessage('bot', `
        ¡Perfecto, <strong>${STATE.userData.fullName}</strong>! Tu solicitud para <strong>${STATE.userData.service}</strong> ha sido estructurada con éxito.<br><br>
        
        <div style="background: rgba(16, 185, 129, 0.12); border-left: 3px solid #10B981; padding: 10px 14px; border-radius: 6px; margin: 8px 0; font-size: 0.86rem; color: #FFF;">
          <strong style="color: #34D399;">💡 Información de Deudas: TOTALMENTE GRATIS</strong><br>
          <span style="color: #E2E8F0; font-size: 0.82rem; display: block; margin-top: 2px;">
            Te diré exactamente el monto que debes sin cobrarte nada por la consulta.
          </span>
        </div>

        <div style="background: rgba(255, 183, 3, 0.12); border-left: 3px solid #FFB703; padding: 10px 14px; border-radius: 6px; margin: 8px 0; font-size: 0.86rem; color: #FFF;">
          <strong style="color: #FFB703;">📌 Tarifa de Servicio Personal al Pagar:</strong><br>
          <small style="color: #E2E8F0; font-size: 0.82rem; line-height: 1.4; display: block; margin-top: 4px;">
            El servicio personal tiene un pequeño costo de <strong>5 Bs extra</strong> por servicio del día. Puedes pagar <strong>varios meses en uno solo</strong> y el costo de gestión sigue siendo de <strong>únicamente 5 Bs</strong>.
          </small>
        </div>

        <div style="background: rgba(0, 86, 210, 0.15); border-left: 3px solid #60A5FA; padding: 10px 14px; border-radius: 6px; margin: 8px 0; font-size: 0.86rem; color: #FFF;">
          <strong style="color: #93C5FD;">🛡️ PAGO 100% SEGURO Y PERSONAL:</strong><br>
          <span style="color: #E2E8F0; font-size: 0.82rem; display: block; margin-top: 2px;">
            Tu transacción es realizada directamente por Ariel Saavedra ante MultiRed (<strong>NO ES CON BOT</strong>). Toda la información se remitirá al <strong>${CONFIG.whatsappFormatted}</strong>.
          </span>
        </div>

        <div style="background: #0B1628; border: 1px solid rgba(0, 86, 210, 0.4); border-radius: 12px; padding: 16px; margin-top: 14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 10px;">
            <span style="font-weight:800; color:#60A5FA;">TICKET DIGITAL SERVIS PANDO</span>
            <span style="font-size:0.75rem; background:rgba(0,86,210,0.3); padding:2px 8px; border-radius:4px; color:#93C5FD;">Folio: ${folio}</span>
          </div>
          <div style="font-size:0.84rem; display:flex; flex-direction:column; gap:6px; color:#E2E8F0;">
            <div><strong>Cliente:</strong> ${STATE.userData.fullName}</div>
            <div><strong>Servicio:</strong> ${STATE.userData.service}</div>
            <div><strong>Código de Usuario:</strong> ${STATE.userData.userCode}</div>
            <div><strong>Meses a Pagar/Consultar:</strong> ${STATE.userData.months}</div>
            <div><strong>Consulta de Deuda:</strong> <span style="color:#34D399; font-weight:bold;">TOTALMENTE GRATIS</span></div>
            <div><strong>Costo de Asesoría al Pagar:</strong> <span style="color:#FCD34D; font-weight:bold;">5.00 Bs</span></div>
            <div><strong>Destino Oficial:</strong> Ariel Saavedra (${CONFIG.whatsappFormatted})</div>
          </div>
        </div>
      `);

      // Opciones de acción final: WhatsApp directo (+59174758244), modal de ticket, reiniciar
      setTimeout(() => {
        setQuickActions([
          {
            label: '📲 Enviar Información al +591 74758244 (Ariel Saavedra)',
            icon: '💬',
            className: 'chip-gold',
            onClick: () => sendToWhatsApp(folio)
          },
          {
            label: 'Ver Ticket en Pantalla Completa',
            icon: '📄',
            onClick: () => showTicketModal(folio)
          },
          {
            label: 'Pagar Otro Servicio',
            icon: '🔄',
            onClick: () => startChat()
          }
        ]);
      }, 500);

    }, 900);
  }

  /**
   * Prepara y abre el enlace de WhatsApp con el mensaje estructurado enviado directamente al +59174758244
   */
  function sendToWhatsApp(folio) {
    const text = 
      `*¡Hola Ariel Saavedra! Solicito atención personal en SERVIS PANDO.*\n` +
      `---------------------------------------\n` +
      `📋 *Folio de Atención:* ${folio}\n` +
      `👤 *Nombre del Cliente:* ${STATE.userData.fullName}\n` +
      `⚡ *Servicio:* ${STATE.userData.service}\n` +
      `🔑 *Código de Usuario / Abonado:* ${STATE.userData.userCode}\n` +
      `📅 *Meses a consultar / pagar:* ${STATE.userData.months}\n` +
      `💡 *Información de Deuda:* TOTALMENTE GRATIS\n` +
      `💵 *Tarifa de Servicio Personal al Pagar:* 5 Bs extra (varios meses por solo 5 Bs)\n` +
      `🛡️ *Garantía:* Pago 100% Seguro y Personal (NO CON BOT)\n` +
      `🏢 *Tecnología:* MultiRed by Síntesis - Cobija\n` +
      `---------------------------------------\n` +
      `Por favor indícame mi deuda actual y coordinemos el pago 100% seguro. ¡Muchas gracias!`;

    const encoded = encodeURIComponent(text);
    const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encoded}`;
    window.open(waUrl, '_blank');
  }

  /**
   * Muestra el modal con el Ticket Digital
   */
  function showTicketModal(folio) {
    if (!dom.ticketModal) return;

    dom.ticketModalBody.innerHTML = `
      <div class="digital-ticket-card">
        <div class="ticket-brand">
          <div>
            <div class="ticket-brand-name">SERVIS PANDO</div>
            <div style="font-size:0.75rem; color:#64748B;">Asesor Autorizado: Ariel Saavedra &bull; Tel: ${CONFIG.whatsappFormatted}</div>
          </div>
          <span class="ticket-folio">${folio}</span>
        </div>

        <div class="ticket-rows">
          <div class="ticket-row">
            <span class="label">Fecha y Hora:</span>
            <span class="value">${new Date().toLocaleDateString('es-BO')} - ${getCurrentTimeString()}</span>
          </div>
          <div class="ticket-row">
            <span class="label">Cliente:</span>
            <span class="value">${STATE.userData.fullName}</span>
          </div>
          <div class="ticket-row">
            <span class="label">Servicio Básico:</span>
            <span class="value">${STATE.userData.service}</span>
          </div>
          <div class="ticket-row">
            <span class="label">Código de Usuario:</span>
            <span class="value">${STATE.userData.userCode}</span>
          </div>
          <div class="ticket-row">
            <span class="label">Período de Facturación:</span>
            <span class="value">${STATE.userData.months}</span>
          </div>
          <div class="ticket-row">
            <span class="label">Consulta de Deuda:</span>
            <span class="value" style="color:#059669;">TOTALMENTE GRATIS</span>
          </div>
          <div class="ticket-row">
            <span class="label">Tipo de Atención:</span>
            <span class="value" style="color:#0056D2;">100% Personal (No con Bot)</span>
          </div>
          <div class="ticket-row">
            <span class="label">Plataforma Oficial:</span>
            <span class="value">MultiRed by Síntesis</span>
          </div>
          <div class="ticket-row total-row">
            <span class="label">Tarifa al Pagar:</span>
            <span class="value">5.00 Bs</span>
          </div>
        </div>

        <div class="ticket-footer-note">
          * INFORMACIÓN DE DEUDAS TOTALMENTE GRATIS &bull; Pagos 100% seguros ya que es personal con Ariel Saavedra (+591 74758244), no con bot. Tarifa al pagar: 5 Bs extra por servicio del día (pueden ser varios meses en uno solo el cual solo es 5 Bs).
        </div>
      </div>
    `;

    dom.ticketModalFooter.innerHTML = `
      <button class="btn btn-whatsapp-direct" id="modal-wa-send-btn" style="margin-top:0;">
        <svg class="icon-wa" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 18.06c-1.49 0-2.95-.4-4.22-1.16l-.3-.18-3.13.82.84-3.05-.2-.31a8.04 8.04 0 0 1-1.23-4.27c0-4.47 3.64-8.11 8.11-8.11 2.17 0 4.2 0.85 5.73 2.38a8.07 8.07 0 0 1 2.38 5.73c0 4.47-3.64 8.11-8.11 8.11zm4.44-6.07c-.24-.12-1.45-.72-1.68-.8-.23-.08-.39-.12-.56.12-.17.24-.65.8-.8 1-.14.17-.29.19-.53.07-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.45-1.36-1.69-.14-.24-.01-.37.11-.49.11-.11.24-.29.36-.43.12-.14.17-.24.25-.4.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.23.9 2.42 1.02 2.59.12.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.45-.59 1.66-1.16.2-.57.2-1.06.14-1.16-.06-.1-.23-.16-.47-.28z"/>
        </svg>
        <span>Mandar Información al WhatsApp +591 74758244</span>
      </button>
      <button class="btn btn-outline" id="modal-cancel-btn">
        Cerrar
      </button>
    `;

    document.getElementById('modal-wa-send-btn').addEventListener('click', () => {
      sendToWhatsApp(folio);
    });

    document.getElementById('modal-cancel-btn').addEventListener('click', () => {
      dom.ticketModal.close();
    });

    dom.ticketModal.showModal();
  }

  // =========================================================================
  // 5. ENTRADA DE TEXTO Y ENVÍO SEGURO (IME-Safe Enter Submit)
  // Conforme a la guía oficial de modern-web-guidance
  // =========================================================================
  function submitCurrentInput() {
    const val = dom.chatUserInput.value.trim();
    if (!val) return;

    if (STATE.chatStep === 0) {
      handleUserNameSubmit(val);
    } else if (STATE.chatStep === 1) {
      handleServiceSelect('otros', val);
    } else if (STATE.chatStep === 2) {
      handleCodeSubmit(val);
    } else if (STATE.chatStep === 3) {
      handleMonthsSubmit(val);
    } else {
      appendMessage('user', val);
      dom.chatUserInput.value = '';
      setTimeout(() => {
        appendMessage('bot', `
          Hola <strong>${STATE.userData.fullName || 'amigo(a)'}</strong>. Si deseas procesar un nuevo pago o consultar tu deuda gratis de ENDE, EPSA o ENTEL, puedes presionar <strong>"Reiniciar"</strong> o escribir a Ariel Saavedra directamente al <strong>${CONFIG.whatsappFormatted}</strong>.
        `);
      }, 500);
    }
  }

  // =========================================================================
  // 6. EVENT LISTENERS
  // =========================================================================
  function setupEventListeners() {
    // Formulario de chat
    dom.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitCurrentInput();
    });

    // IME-Safe enter-to-submit
    dom.chatUserInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();

        // Evita envío prematuro si el usuario está componiendo caracteres (IME)
        if (event.isComposing || event.keyCode === 229) {
          return;
        }

        dom.chatForm.requestSubmit();
      }
    });

    // Botón de reinicio
    dom.chatResetBtn.addEventListener('click', () => {
      if (confirm('¿Deseas reiniciar la conversación de asesoría?')) {
        startChat();
      }
    });

    // Botón de sonido
    dom.chatSoundToggle.addEventListener('click', () => {
      CONFIG.soundEnabled = !CONFIG.soundEnabled;
      dom.soundIcon.textContent = CONFIG.soundEnabled ? '🔔' : '🔕';
      dom.chatSoundToggle.title = CONFIG.soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos';
      if (CONFIG.soundEnabled) {
        playTone('receive');
      }
    });

    // Botones de acción rápida en header y hero
    dom.openChatBtn.addEventListener('click', () => {
      const chatSec = document.getElementById('chat-section');
      if (chatSec) {
        chatSec.scrollIntoView({ behavior: 'smooth' });
        dom.chatUserInput.focus();
      }
    });

    // Menú móvil
    dom.mobileToggle.addEventListener('click', () => {
      const isOpen = dom.navMenu.classList.toggle('open');
      dom.mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        dom.navMenu.classList.remove('open');
        dom.mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Pestañas de la guía de código ("¿Dónde está mi código?")
    dom.helperTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        dom.helperTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        dom.helperPanels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const targetId = tab.getAttribute('data-tab');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });

    // Floating Chat Toggle & Bubble
    dom.floatingChatToggle.addEventListener('click', () => {
      const chatSec = document.getElementById('chat-section');
      if (chatSec) {
        chatSec.scrollIntoView({ behavior: 'smooth' });
        dom.chatUserInput.focus();
      }
    });

    if (dom.bubbleTrigger) {
      dom.bubbleTrigger.addEventListener('click', () => {
        const chatSec = document.getElementById('chat-section');
        if (chatSec) {
          chatSec.scrollIntoView({ behavior: 'smooth' });
          dom.chatUserInput.focus();
        }
        dom.floatingBubble.style.display = 'none';
      });
    }

    if (dom.bubbleCloseBtn) {
      dom.bubbleCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.floatingBubble.style.display = 'none';
      });
    }

    // Modal close
    if (dom.modalCloseBtn) {
      dom.modalCloseBtn.addEventListener('click', () => {
        dom.ticketModal.close();
      });
    }

    // Mostrar el bubble flotante después de 3 segundos para llamar la atención
    setTimeout(() => {
      if (dom.floatingBubble) {
        dom.floatingBubble.style.display = 'block';
      }
    }, 3000);
  }

  // =========================================================================
  // 7. FUNCIÓN GLOBAL PARA INICIAR SERVICIO DESDE CUALQUIER PARTE DE LA WEB
  // =========================================================================
  window.selectServiceAndChat = function (serviceKey, serviceLabel) {
    const chatSection = document.getElementById('chat-section');
    if (chatSection) {
      chatSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Si el usuario aún no tiene nombre, pedimos nombre y pre-cargamos el servicio
    if (!STATE.userData.fullName) {
      startChat();
      setTimeout(() => {
        appendMessage('bot', `
          Veo que te interesa consultar/pagar <strong>${serviceLabel}</strong>. ¡Con gusto te atenderé personalmente! Recuerda que <strong>la información de deuda es TOTALMENTE GRATIS</strong>. Para iniciar, ¿cuál es tu nombre completo?
        `);
      }, 700);
    } else {
      handleServiceSelect(serviceKey, serviceLabel);
    }
  };

  // =========================================================================
  // 8. INICIALIZACIÓN
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    startChat();
  });

})();
