/*
   FRUTOPIA - PREMIUM ECO-TOURISM JAVASCRIPT
   Handles Map, Step Form, Price Calculator, Telegram Notifier & Confetti Celebration.
*/

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 🗺️ 1. INTERACTIVE MAP CONTROLLER
    // ==========================================
    const STATIONS_DATA = {
        1: {
            badge: 'Estación 1',
            title: 'El Sendero del Sol (Cítricos)',
            content: 'Iniciamos nuestra aventura en un huerto soleado donde reinan los cítricos. Aquí podrás probar mandarinas dulces, limones gigantes y naranjas cosechadas en el acto. Nuestro guía te enseñará cómo los polinizadores y el abono natural logran esta dulzura.',
            fruit: '🍊 Mandarina, Naranja & Limón',
            image: 'assets/station_1.png'
        },
        2: {
            badge: 'Estación 2',
            title: 'El Invernadero Orgánico',
            content: 'Adéntrate en nuestro centro biológico. En esta estación verás la reproducción de plántulas de fresa, uvas de montaña y árboles exóticos en crecimiento. Aprenderás sobre lombricompostaje y técnicas rústicas de riego inteligente.',
            fruit: '🍓 Fresas & Exóticos',
            image: 'assets/station_2.png'
        },
        3: {
            badge: 'Estación 3',
            title: 'La Casa de Mermeladas',
            content: '¡El corazón culinario de la finca! Una cabaña de madera rústica donde el aroma a fruta cocida inunda el ambiente. Aquí realizamos el taller de cocción artesanal y envasado de conservas. Podrás degustar pan recién horneado con jalea.',
            fruit: '🍯 Jaleas & Dulces Rústicos',
            image: 'assets/station_3.png'
        },
        4: {
            badge: 'Estación 4',
            title: 'El Mirador del Bosque',
            content: 'El punto más alto del circuito. Una terraza panorámica con vistas espectaculares al valle y los huertos frutales. Descansa bajo la sombra de guayabos y disfruta de una degustación premium de jugos naturales helados de la temporada.',
            fruit: '🥭 Guayaba, Mango & Jugos Fríos',
            image: 'assets/station_4.png'
        }
    };

    const mapPins = document.querySelectorAll('.map-pin');
    const panelImg = document.getElementById('station-img');
    const panelBadge = document.getElementById('station-badge');
    const panelTitle = document.getElementById('station-title');
    const panelContent = document.getElementById('station-content');
    const panelFruit = document.getElementById('station-fruit');
    const stationPanel = document.getElementById('station-panel');

    mapPins.forEach(pin => {
        pin.addEventListener('click', () => {
            // Remove active class from all pins
            mapPins.forEach(p => p.classList.remove('active'));
            // Add active class to clicked pin
            pin.classList.add('active');

            const id = pin.getAttribute('data-station');
            const data = STATIONS_DATA[id];

            if (data) {
                // Smooth cross-fade transition
                stationPanel.style.opacity = 0;
                stationPanel.style.transform = 'translateY(8px)';
                
                setTimeout(() => {
                    if (panelImg) panelImg.src = data.image;
                    panelBadge.textContent = data.badge;
                    panelTitle.textContent = data.title;
                    panelContent.textContent = data.content;
                    panelFruit.textContent = data.fruit;
                    
                    stationPanel.style.opacity = 1;
                    stationPanel.style.transform = 'translateY(0)';
                }, 200);
            }
        });
    });

    // Style helper for panel smooth load
    stationPanel.style.transition = 'opacity 0.25s ease, transform 0.25s ease';


    // ==========================================
    // ⚙️ 2. RESERVATION CONFIG & PRICING SYSTEM
    // ==========================================
    // TELEGRAM CONFIGURATION
    // Leer valores guardados de localStorage si existen; en caso contrario, usar fallbacks por defecto.
    const savedToken = localStorage.getItem('frutopia_bot_token');
    const savedChatId = localStorage.getItem('frutopia_admin_chat_id');

    const TELEGRAM_CONFIG = {
        botToken: savedToken || '8975657809:AAHSbDBP5cjXyQNhouWie3itzmJLHRRtRjY',
        chatId: savedChatId || '8265798792'
    };

    let botUsername = 'FrutopiaBookingBot'; // Fallback por defecto

    async function fetchBotUsername(customToken = null) {
        try {
            const tokenToUse = customToken || TELEGRAM_CONFIG.botToken;
            const res = await fetch(`https://api.telegram.org/bot${tokenToUse}/getMe`);
            if (res.ok) {
                const data = await res.json();
                if (data.ok && data.result && data.result.username) {
                    botUsername = data.result.username;
                    console.log('Bot Username cargado dinámicamente:', botUsername);
                    if (typeof updateAdminDeepLink === 'function') {
                        updateAdminDeepLink();
                    }
                }
            }
        } catch (e) {
            console.warn('No se pudo obtener el nombre de usuario del bot, usando fallback.', e);
        }
    }
    fetchBotUsername();

    let selectedTour = 'basic';
    let tourPriceAdult = 15;
    let tourPriceChild = 8;
    let adultsCount = 1;
    let childrenCount = 0;
    let selectedDate = '';
    let selectedTime = '09:00 AM';

    const experienceOptions = document.querySelectorAll('.experience-option');
    const timeSlots = document.querySelectorAll('.time-slot');
    const tourDateInput = document.getElementById('tour-date');

    // Experience Card Selection
    experienceOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            experienceOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');

            selectedTour = opt.getAttribute('data-tour');
            tourPriceAdult = parseFloat(opt.getAttribute('data-price-adult'));
            tourPriceChild = parseFloat(opt.getAttribute('data-price-child'));

            const tourTitle = opt.querySelector('h4').textContent;
            document.getElementById('sum-tour').textContent = tourTitle;

            calculateTotal();
        });
    });

    // Date & Time Picker Sincronización
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    tourDateInput.setAttribute('min', today);

    tourDateInput.addEventListener('change', (e) => {
        selectedDate = e.target.value;
        updateSummaryDateTime();
    });

    timeSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            timeSlots.forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
            selectedTime = slot.getAttribute('data-time');
            updateSummaryDateTime();
        });
    });

    function updateSummaryDateTime() {
        const sumDate = document.getElementById('sum-date');
        if (selectedDate) {
            const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            sumDate.textContent = `${formattedDate} a las ${selectedTime}`;
        } else {
            sumDate.textContent = `Selecciona fecha y hora`;
        }
    }

    // Visitors Counter Handler
    const valAdult = document.getElementById('val-adult');
    const valChild = document.getElementById('val-child');

    document.getElementById('btn-adult-plus').addEventListener('click', () => {
        if (adultsCount + childrenCount < 30) {
            adultsCount++;
            valAdult.textContent = adultsCount;
            calculateTotal();
        }
    });

    document.getElementById('btn-adult-minus').addEventListener('click', () => {
        if (adultsCount > 1) {
            adultsCount--;
            valAdult.textContent = adultsCount;
            calculateTotal();
        }
    });

    document.getElementById('btn-child-plus').addEventListener('click', () => {
        if (adultsCount + childrenCount < 30) {
            childrenCount++;
            valChild.textContent = childrenCount;
            calculateTotal();
        }
    });

    document.getElementById('btn-child-minus').addEventListener('click', () => {
        if (childrenCount > 0) {
            childrenCount--;
            valChild.textContent = childrenCount;
            calculateTotal();
        }
    });

    // Dynamic Price Calculator
    function calculateTotal() {
        const baseTotal = (adultsCount * tourPriceAdult) + (childrenCount * tourPriceChild);
        const totalVisitors = adultsCount + childrenCount;
        
        let discount = 0;
        let isGroupDiscount = false;

        // Group discount rule: 10% discount for 5 or more total people
        if (totalVisitors >= 5) {
            discount = baseTotal * 0.10;
            isGroupDiscount = true;
        }

        const grandTotal = baseTotal - discount;

        // Update Summary Elements
        document.getElementById('sum-visitors').textContent = 
            `${adultsCount} Adulto${adultsCount > 1 ? 's' : ''}${childrenCount > 0 ? `, ${childrenCount} Niño${childrenCount > 1 ? 's' : ''}` : ''}`;
        
        document.getElementById('sum-val-base').textContent = `$${baseTotal.toFixed(2)}`;
        
        const sumRowDiscount = document.getElementById('sum-row-discount');
        const sumValDiscount = document.getElementById('sum-val-discount');
        const discountNotice = document.getElementById('discount-notice');

        if (isGroupDiscount) {
            sumRowDiscount.style.display = 'flex';
            sumValDiscount.textContent = `-$${discount.toFixed(2)}`;
            discountNotice.style.display = 'block';
        } else {
            sumRowDiscount.style.display = 'none';
            discountNotice.style.display = 'none';
        }

        document.getElementById('sum-total').innerHTML = `$${grandTotal.toFixed(2)} <span style="font-size:0.9rem;">USD</span>`;
    }


    // ==========================================
    // 🚶 3. FORM STEP-BY-STEP FLOW
    // ==========================================
    let currentStep = 1;
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const progressLine = document.getElementById('steps-progress');

    btnNext.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            if (currentStep < 4) {
                currentStep++;
                showStep(currentStep);
            } else {
                // Submit Form (Final Step)
                submitBooking();
            }
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    });

    function showStep(step) {
        // Display correct step container
        document.querySelectorAll('.booking-step').forEach((s, idx) => {
            s.classList.toggle('active', idx + 1 === step);
        });

        // Update Nav steps status
        for (let i = 1; i <= 4; i++) {
            const node = document.getElementById(`node-${i}`);
            node.classList.toggle('active', i === step);
            node.classList.toggle('completed', i < step);
        }

        // Update progress bar width
        const progressWidths = { 1: '0%', 2: '33%', 3: '66%', 4: '100%' };
        progressLine.style.width = progressWidths[step];

        // Toggle buttons visibility and text
        btnPrev.style.visibility = step === 1 ? 'hidden' : 'visible';
        
        if (step === 4) {
            btnNext.textContent = 'Confirmar Reserva 🍊';
            btnNext.classList.remove('btn-primary');
            btnNext.classList.add('btn-accent');
        } else {
            btnNext.textContent = 'Siguiente';
            btnNext.classList.remove('btn-accent');
            btnNext.classList.add('btn-primary');
        }
    }

    // Step Validation
    function validateStep(step) {
        if (step === 2) {
            if (!selectedDate) {
                alert('Por favor, selecciona una fecha válida para tu visita antes de continuar.');
                return false;
            }
        }
        if (step === 4) {
            const name = document.getElementById('client-name').value.trim();
            const phone = document.getElementById('client-phone').value.trim();
            const email = document.getElementById('client-email').value.trim();

            if (!name || !phone || !email) {
                alert('Por favor, completa los campos requeridos (Nombre, Teléfono y Correo).');
                return false;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Por favor, ingresa un correo electrónico válido.');
                return false;
            }
        }
        return true;
    }


    // ==========================================
    // 📢 4. TELEGRAM NOTIFICATION DISPATCHER
    // ==========================================
    async function sendTelegramAlert(name, phone, email, comments, grandTotal) {
        const tourName = document.getElementById('sum-tour').textContent;
        const formattedDateText = document.getElementById('sum-date').textContent;
        
        const esc = (t) => (t || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // HTML Formatted text for Telegram Client Alert
        const fullMessage = `🍊 <b>NUEVA RESERVA - FRUTOPIA</b> 🍊
━━━━━━━━━━━━━━━━━━
👤 <b>Cliente:</b> ${esc(name)}
📧 <b>Correo:</b> ${esc(email)}
📞 <b>Teléfono:</b> ${esc(phone)}

📅 <b>Fecha y Hora:</b> ${esc(formattedDateText)}
🎫 <b>Experiencia:</b> ${esc(tourName)}
👥 <b>Grupo:</b> ${adultsCount} Adultos, ${childrenCount} Niños
💰 <b>Total a Pagar:</b> $${grandTotal.toFixed(2)} USD
${comments ? `\n📝 <b>Notas:</b> <i>${esc(comments)}</i>` : ''}
━━━━━━━━━━━━━━━━━━
<i>Acción requerida: Contactar al cliente para confirmación e instrucciones de llegada.</i>`;

        const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CONFIG.chatId,
                    text: fullMessage,
                    parse_mode: 'HTML'
                })
            });
            const data = await response.json();
            console.log('Telegram Dispatch Status:', response.status, data);
        } catch (error) {
            // Resilient UX fallback: Log error but do not block user completion
            console.warn('Telegram Notification error:', error);
        }
    }


    // ==========================================
    // 🎊 5. SUBMIT & SUCCESS CELEBRATION
    // ==========================================
    const successOverlay = document.getElementById('success-overlay');
    const successMessage = document.getElementById('success-message');
    const btnCloseSuccess = document.getElementById('btn-close-success');

    // Referencias a los controles del Client Telegram Card
    const tgQrImg = document.getElementById('client-qr-img');
    const qrLoading = document.getElementById('qr-loading');
    const btnClientTgDirect = document.getElementById('btn-client-tg-direct');
    const inputClientChatId = document.getElementById('client-chat-id');
    const btnActivateClientTg = document.getElementById('btn-activate-client-tg');
    const tgSyncBodyPanel = document.getElementById('tg-sync-body-panel');
    const tgSyncSuccessState = document.getElementById('tg-sync-success-state');

    let currentBookingData = null; // Guardar datos para vinculación del cliente

    function submitBooking() {
        const name = document.getElementById('client-name').value;
        const phone = document.getElementById('client-phone').value;
        const email = document.getElementById('client-email').value;
        const comments = document.getElementById('client-comments').value;

        // Calculate grand total for notification
        const baseTotal = (adultsCount * tourPriceAdult) + (childrenCount * tourPriceChild);
        const discount = (adultsCount + childrenCount >= 5) ? baseTotal * 0.1 : 0;
        const grandTotal = baseTotal - discount;

        const bookingId = `FRU-${Math.floor(100000 + Math.random() * 900000)}`;
        const tourName = document.getElementById('sum-tour').textContent;
        const formattedDateText = document.getElementById('sum-date').textContent;

        // Guardar para el vinculador de cliente
        currentBookingData = {
            bookingId, name, phone, email, comments, grandTotal, tourName, formattedDateText
        };

        // 1. Dispatch Telegram Alert asíncronamente
        sendTelegramAlert(name, phone, email, comments, grandTotal);

        // 2. Configure dynamic celebration details
        successMessage.innerHTML = `Muchas gracias por reservar, <b>${name}</b>. Tu solicitud se ha procesado exitosamente. Te enviamos los detalles de cobro al correo <b>${email}</b>.`;

        // 3. Generar Código QR y Enlaces para @userinfobot (para obtener el ID de usuario)
        const tgLink = `https://t.me/userinfobot`;
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tgLink)}`;
        
        qrLoading.style.display = 'flex';
        tgQrImg.style.opacity = '0';
        tgQrImg.src = qrApiUrl;
        
        tgQrImg.onload = () => {
            qrLoading.style.display = 'none';
            tgQrImg.style.opacity = '1';
        };

        btnClientTgDirect.href = tgLink;

        // 4. Open Success Celebration screen
        successOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // block page scroll
        
        // 5. Start Falling Confetti/Fruits
        startConfettiAnimation();
    }

    // Vincular al cliente cuando ingresa su Chat ID
    btnActivateClientTg.addEventListener('click', async () => {
        const clientChatId = inputClientChatId.value.trim();
        if (!clientChatId) {
            alert('Por favor, ingresa tu Chat ID de Telegram para vincular.');
            return;
        }

        btnActivateClientTg.disabled = true;
        btnActivateClientTg.textContent = 'Enviando...';

        const success = await sendClientTelegramTicket(
            clientChatId,
            currentBookingData.bookingId,
            currentBookingData.name,
            currentBookingData.phone,
            currentBookingData.email,
            currentBookingData.comments,
            currentBookingData.grandTotal,
            currentBookingData.tourName,
            currentBookingData.formattedDateText
        );

        btnActivateClientTg.disabled = false;
        btnActivateClientTg.textContent = 'Activar';

        if (success) {
            // Notificar al administrador con el enlace de chat directo al cliente
            sendAdminClientLinkedAlert(
                currentBookingData.bookingId,
                currentBookingData.name,
                clientChatId
            );

            // Animar transición a pantalla de éxito
            tgSyncBodyPanel.style.opacity = '0';
            setTimeout(() => {
                tgSyncBodyPanel.style.display = 'none';
                tgSyncSuccessState.style.display = 'block';
                tgSyncSuccessState.style.opacity = '1';
            }, 300);
        } else {
            alert('Error al enviar el Ticket. Asegúrate de haber iniciado conversación con nuestro bot primero, y que tu ID sea correcto.');
        }
    });

    btnCloseSuccess.addEventListener('click', () => {
        // Reset steps & forms
        currentStep = 1;
        document.getElementById('booking-form').reset();
        
        // Reset default states
        adultsCount = 1;
        childrenCount = 0;
        valAdult.textContent = 1;
        valChild.textContent = 0;
        selectedDate = '';
        tourDateInput.value = '';
        
        // Reset experience to default
        selectedTour = 'basic';
        tourPriceAdult = 15;
        tourPriceChild = 8;
        experienceOptions.forEach((o, i) => {
            o.classList.toggle('selected', i === 0);
        });
        document.getElementById('sum-tour').textContent = 'Tour Cosecha & Sendero';
        
        // Reset Telegram Card
        inputClientChatId.value = '';
        tgSyncBodyPanel.style.display = 'grid';
        tgSyncBodyPanel.style.opacity = '1';
        tgSyncSuccessState.style.display = 'none';
        currentBookingData = null;
        
        updateSummaryDateTime();
        calculateTotal();
        showStep(1);

        // Close Overlay
        successOverlay.classList.remove('active');
        document.body.style.overflow = 'auto'; // restore scroll
        
        // Stop Confetti Animation
        stopConfetti();
    });


    // ==========================================
    // ✨ 6. CONFETTI & PARTICLES ENGINE
    // ==========================================
    const canvas = document.getElementById('success-canvas');
    const ctx = canvas.getContext('2d');
    let confettiActive = false;
    let confettiArray = [];
    let animationId;

    const colors = [
        '#E87722', // Mandarin
        '#1E5E3A', // Forest green
        '#F5B301', // Gold
        '#689F38', // Lime
        '#FF5722'  // Orange red
    ];

    const fruitEmojis = ['🍊', '🍋', '🍓', '🥭', '🍒', '🍃'];

    class ConfettiParticle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * -canvas.height;
            this.size = Math.random() * 8 + 6;
            this.type = Math.random() > 0.85 ? 'emoji' : 'circle';
            this.emoji = fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.speedY = Math.random() * 3 + 2;
            this.speedX = Math.random() * 2 - 1;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 4 - 2;
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.rotation += this.rotationSpeed;

            if (this.y > canvas.height) {
                this.y = -20;
                this.x = Math.random() * canvas.width;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);

            if (this.type === 'emoji') {
                ctx.font = '22px sans-serif';
                ctx.fillText(this.emoji, -11, 11);
            } else {
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            }
            ctx.restore();
        }
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', () => {
        if (confettiActive) resizeCanvas();
    });

    function startConfettiAnimation() {
        resizeCanvas();
        confettiActive = true;
        confettiArray = [];
        
        // Spawn particles
        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
            confettiArray.push(new ConfettiParticle());
        }

        animateConfetti();
    }

    function animateConfetti() {
        if (!confettiActive) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        confettiArray.forEach(p => {
            p.update();
            p.draw();
        });

        animationId = requestAnimationFrame(animateConfetti);
    }

    function stopConfetti() {
        confettiActive = false;
        cancelAnimationFrame(animationId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }


    // ==========================================
    // 📢 7. CLIENT TELEGRAM MESSAGER
    // ==========================================
    async function sendClientTelegramTicket(clientChatId, bookingId, name, phone, email, comments, grandTotal, tourName, formattedDate) {
        const esc = (t) => (t || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        const welcomeMessage = `🌿 <b>¡HOLA, ${esc(name).toUpperCase()}!</b> 🌿
🔔 <i>Has vinculado con éxito tus notificaciones de Frutopia.</i>

🎫 <b>TICKET DIGITAL - RESERVA ${bookingId}</b>
━━━━━━━━━━━━━━━━━━
🌳 <b>Lugar:</b> Finca Frutopia, Valle Verde, Costa Rica
🎫 <b>Experiencia:</b> ${esc(tourName)}
📅 <b>Fecha y Hora:</b> ${esc(formattedDate)}
👥 <b>Grupo:</b> ${adultsCount} Adulto${adultsCount > 1 ? 's' : ''}${childrenCount > 0 ? `, ${childrenCount} Niño${childrenCount > 1 ? 's' : ''}` : ''}
💰 <b>Monto Total:</b> $${grandTotal.toFixed(2)} USD

🎒 <b>RECOMENDACIONES PARA TU VISITA:</b>
1. 🥾 Trae calzado cómodo y cerrado para caminar en senderos.
2. 🧢 Usa gorra o sombrero y protector solar orgánico.
3. 🧺 Te daremos tu cesta de cosecha, pero trae bolsas reutilizables por si quieres llevar más frutas de nuestra tienda.
4. 📍 Descarga tu mapa offline antes de subir a la montaña (la señal de red es inestable).

━━━━━━━━━━━━━━━━━━
<i>Te enviaremos un recordatorio 24 horas antes de tu visita. ¡Nos vemos pronto en el paraíso frutal! 🍊🍃</i>`;

        const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: clientChatId,
                    text: welcomeMessage,
                    parse_mode: 'HTML'
                })
            });
            const data = await response.json();
            return data.ok;
        } catch (error) {
            console.error('Error sending client Telegram ticket:', error);
            return false;
        }
    }

    async function sendAdminClientLinkedAlert(bookingId, name, clientChatId) {
        const esc = (t) => (t || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        const alertMessage = `🔗 <b>VINCULACIÓN DE TELEGRAM - FRUTOPIA</b> 🍊
━━━━━━━━━━━━━━━━━━
👤 <b>Cliente:</b> ${esc(name)}
🎫 <b>Reserva:</b> ${esc(bookingId)}
📞 <b>Chat ID del Cliente:</b> <code>${clientChatId}</code>

💬 <b>Chat Directo con el Cliente:</b> <a href="tg://user?id=${clientChatId}">Abrir Chat en Telegram</a>

━━━━━━━━━━━━━━━━━━
<i>El cliente ha completado la vinculación y ya ha recibido su Ticket Digital.</i>`;

        const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
        
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CONFIG.chatId,
                    text: alertMessage,
                    parse_mode: 'HTML'
                })
            });
        } catch (error) {
            console.error('Error notifying admin of client linking:', error);
        }
    }


    // ==========================================
    // ⚙️ 8. ADMINISTRATOR DASHBOARD CONTROLLER
    // ==========================================
    const adminTrigger = document.getElementById('btn-admin-panel');
    const adminOverlay = document.getElementById('admin-modal-overlay');
    const btnCloseAdmin = document.getElementById('btn-close-admin');
    
    const adminViewAuth = document.getElementById('admin-view-auth');
    const adminViewConfig = document.getElementById('admin-view-config');
    
    const adminAuthForm = document.getElementById('admin-auth-form');
    const adminPassInput = document.getElementById('admin-pass');
    const adminAuthError = document.getElementById('admin-auth-error');
    
    const adminConfigForm = document.getElementById('admin-config-form');
    const adminTokenInput = document.getElementById('admin-token');
    const adminChatInput = document.getElementById('admin-chat');
    
    const btnTestBot = document.getElementById('btn-test-bot');
    const adminTestStatus = document.getElementById('admin-test-status');

    // Elementos de Vinculación Rápida
    const adminDeepLink = document.getElementById('btn-admin-deep-link');
    const btnDetectAdmin = document.getElementById('btn-detect-admin');

    // Función para actualizar dinámicamente el deep link de Telegram para el administrador
    function updateAdminDeepLink() {
        if (!adminDeepLink) return;
        const currentToken = adminTokenInput.value.trim() || TELEGRAM_CONFIG.botToken;
        const link = `https://t.me/${botUsername}?start=admin_frutopia2026`;
        adminDeepLink.href = link;
    }

    // Escuchar cambios en el token del bot para refrescar el bot username y el deep link
    let botQueryTimeout = null;
    adminTokenInput.addEventListener('input', () => {
        updateAdminDeepLink();
        
        // Debounce de consulta getMe para verificar si ingresaron un nuevo token válido
        const token = adminTokenInput.value.trim();
        if (token.includes(':') && token.length > 30) {
            clearTimeout(botQueryTimeout);
            botQueryTimeout = setTimeout(() => {
                fetchBotUsername(token);
            }, 1000);
        }
    });

    // Abrir Modal de Administración
    adminTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        adminPassInput.value = '';
        adminAuthError.style.display = 'none';
        
        adminViewAuth.classList.add('active');
        adminViewConfig.classList.remove('active');
        
        adminOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Cerrar Modal
    btnCloseAdmin.addEventListener('click', () => {
        adminOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Cerrar al hacer clic fuera de la tarjeta
    adminOverlay.addEventListener('click', (e) => {
        if (e.target === adminOverlay) {
            adminOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Validar Contraseña (frutopia2026)
    adminAuthForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pass = adminPassInput.value;
        
        if (pass === 'frutopia2026') {
            adminAuthError.style.display = 'none';
            adminViewAuth.classList.remove('active');
            
            // Cargar datos actuales en los campos
            adminTokenInput.value = TELEGRAM_CONFIG.botToken;
            adminChatInput.value = TELEGRAM_CONFIG.chatId;
            
            updateAdminDeepLink();
            
            // Refrescar el username del bot al entrar por seguridad
            if (TELEGRAM_CONFIG.botToken) {
                fetchBotUsername(TELEGRAM_CONFIG.botToken);
            }
            
            adminViewConfig.classList.add('active');
        } else {
            adminAuthError.style.display = 'block';
            adminPassInput.focus();
        }
    });

    // Guardar Configuración de Telegram
    adminConfigForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newToken = adminTokenInput.value.trim();
        const newChat = adminChatInput.value.trim();
        
        if (newToken && newChat) {
            localStorage.setItem('frutopia_bot_token', newToken);
            localStorage.setItem('frutopia_admin_chat_id', newChat);
            
            TELEGRAM_CONFIG.botToken = newToken;
            TELEGRAM_CONFIG.chatId = newChat;
            
            fetchBotUsername(newToken);
            
            adminTestStatus.style.display = 'block';
            adminTestStatus.style.backgroundColor = 'rgba(30, 94, 58, 0.1)';
            adminTestStatus.style.color = 'hsl(var(--primary))';
            adminTestStatus.textContent = '✔️ Configuración guardada exitosamente';
            
            setTimeout(() => {
                adminTestStatus.style.display = 'none';
                adminOverlay.classList.remove('active');
                document.body.style.overflow = 'auto';
            }, 1500);
        }
    });

    // Detectar Vinculación de Admin mediante getUpdates de Telegram
    if (btnDetectAdmin) {
        btnDetectAdmin.addEventListener('click', async () => {
            const token = adminTokenInput.value.trim();
            if (!token) {
                alert('Por favor, ingresa el Bot Token primero para realizar la detección.');
                return;
            }

            btnDetectAdmin.disabled = true;
            btnDetectAdmin.textContent = 'Buscando...';
            adminTestStatus.style.display = 'none';

            try {
                // Consultar getUpdates para el bot actual con límite de 100 mensajes recientes
                const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-20&limit=100`);
                if (!response.ok) {
                    throw new Error('Error al conectar con la API de Telegram. Verifica tu Bot Token.');
                }
                const data = await response.json();
                
                if (data.ok && data.result && data.result.length > 0) {
                    let foundUpdate = null;
                    
                    // Recorremos los updates de forma inversa (más recientes primero)
                    for (let i = data.result.length - 1; i >= 0; i--) {
                        const update = data.result[i];
                        if (update.message && update.message.text) {
                            const msgText = update.message.text.trim();
                            // Buscar comando /start admin_frutopia2026, /start frutopia2026, o similares
                            if (
                                msgText.includes('admin_frutopia2026') || 
                                msgText.includes('frutopia2026') || 
                                msgText.includes('admin')
                            ) {
                                foundUpdate = update;
                                break;
                            }
                        }
                    }

                    if (foundUpdate) {
                        const detectedChatId = foundUpdate.message.chat.id;
                        const firstName = foundUpdate.message.from.first_name || 'Admin';
                        
                        // Rellenar campo
                        adminChatInput.value = detectedChatId;
                        
                        // Mostrar estado de éxito en pantalla
                        adminTestStatus.style.display = 'block';
                        adminTestStatus.style.backgroundColor = 'rgba(30, 94, 58, 0.1)';
                        adminTestStatus.style.color = 'hsl(var(--primary))';
                        adminTestStatus.textContent = `✔️ ¡Admin detectado! Vinculado a "${firstName}" (ID: ${detectedChatId})`;
                        
                        // Resaltar visualmente el campo Chat ID
                        adminChatInput.style.transition = 'border-color 0.3s ease';
                        adminChatInput.style.borderColor = 'hsl(var(--primary))';
                        setTimeout(() => {
                            adminChatInput.style.borderColor = '';
                        }, 2000);
                    } else {
                        adminTestStatus.style.display = 'block';
                        adminTestStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        adminTestStatus.style.color = '#ef4444';
                        adminTestStatus.textContent = '❌ No se detectó inicio de sesión de Admin reciente. Abre el Bot, presiona "Iniciar" e inténtalo de nuevo.';
                    }
                } else {
                    adminTestStatus.style.display = 'block';
                    adminTestStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                    adminTestStatus.style.color = '#ef4444';
                    adminTestStatus.textContent = '❌ El bot no tiene interacciones recientes. Abre el bot e inicia una conversación.';
                }
            } catch (e) {
                console.error(e);
                adminTestStatus.style.display = 'block';
                adminTestStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                adminTestStatus.style.color = '#ef4444';
                adminTestStatus.textContent = '❌ Error al consultar la API de Telegram. Asegúrate de que el Bot Token sea correcto.';
            } finally {
                btnDetectAdmin.disabled = false;
                btnDetectAdmin.textContent = '🔄 Detectar ID';
            }
        });
    }

    // Probar Conexión del Bot
    btnTestBot.addEventListener('click', async () => {
        const token = adminTokenInput.value.trim();
        const chat = adminChatInput.value.trim();
        
        if (!token || !chat) {
            alert('Por favor, completa ambos campos para probar la conexión.');
            return;
        }

        btnTestBot.disabled = true;
        btnTestBot.textContent = 'Enviando...';
        adminTestStatus.style.display = 'none';

        const testMsg = `🔔 <b>FRUTOPIA ADMIN:</b>\n¡Conexión establecida con éxito! Tu Bot está configurado correctamente para despachar alertas en tiempo real. 🍊🌳`;
        const url = `https://api.telegram.org/bot${token}/sendMessage`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chat,
                    text: testMsg,
                    parse_mode: 'HTML'
                })
            });
            const data = await response.json();
            
            adminTestStatus.style.display = 'block';
            if (data.ok) {
                adminTestStatus.style.backgroundColor = 'rgba(30, 94, 58, 0.1)';
                adminTestStatus.style.color = 'hsl(var(--primary))';
                adminTestStatus.textContent = '✔️ ¡Conexión exitosa! Revisa tu Telegram.';
            } else {
                adminTestStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                adminTestStatus.style.color = '#ef4444';
                adminTestStatus.textContent = `❌ Error: ${data.description || 'Verifica los campos'}`;
            }
        } catch (e) {
            adminTestStatus.style.display = 'block';
            adminTestStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            adminTestStatus.style.color = '#ef4444';
            adminTestStatus.textContent = '❌ Error de red al contactar la API.';
        } finally {
            btnTestBot.disabled = false;
            btnTestBot.textContent = 'Probar Conexión';
        }
    });
});
