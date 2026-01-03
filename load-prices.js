// load-prices.js - Versión optimizada con filas completas clickables
document.addEventListener('DOMContentLoaded', function() {
    // Configuración
    const CONFIG = {
        jsonFile: 'herramientas.json',
        containerId: 'pricing-table-container',
        summaryId: 'price-summary',
        totalToolsId: 'total-herramientas'
    };

    // Elementos DOM
    const container = document.getElementById(CONFIG.containerId);
    const summaryContainer = document.getElementById(CONFIG.summaryId);
    const totalToolsElement = document.getElementById(CONFIG.totalToolsId);

    // Formateador de moneda
    const formatter = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    // Datos globales
    let herramientas = [];
    let imageModal = null;

    // Cargar datos
    async function loadToolData() {
        try {
            showLoading();
            
            const response = await fetch(CONFIG.jsonFile);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
            const data = await response.json();
            herramientas = data.herramientas;
            renderPricingTable();
            updateSummary();
            createImageModal();
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            showError();
        }
    }

    // Mostrar carga
    function showLoading() {
        container.innerHTML = `
            <div class="table-loading">
                <div class="loading-spinner"></div>
                <p>Cargando precios de renta...</p>
            </div>`;
    }

    // Mostrar error
    function showError() {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error cargando precios</h3>
                <p>Contacta directamente para consultar disponibilidad.</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>`;
    }

    // Calcular precio semanal con descuento redondeado
    function calculateWeeklyPrice(dailyPrice, discountPercentage) {
        const weeklyPriceWithoutDiscount = dailyPrice * 7;
        const discountAmount = weeklyPriceWithoutDiscount * discountPercentage;
        const weeklyPriceWithDiscount = weeklyPriceWithoutDiscount - discountAmount;
        
        return {
            weekly: Math.round(weeklyPriceWithDiscount),
            discount: Math.round(discountAmount),
            percentage: Math.round(discountPercentage * 100)
        };
    }

    // Clase CSS para categoría
    function getCategoryClass(category) {
        const categoryMap = {
            'herramientas': 'category-herramientas',
            'equipo': 'category-equipo',
            'jardineria': 'category-jardineria',
            'limpieza': 'category-limpieza'
        };
        return categoryMap[category] || 'category-herramientas';
    }

    // Texto para categoría
    function getCategoryText(category) {
        const categoryText = {
            'herramientas': 'HERRAMIENTA',
            'equipo': 'EQUIPO',
            'jardineria': 'JARDINERÍA',
            'limpieza': 'LIMPIEZA'
        };
        return categoryText[category] || 'HERRAMIENTA';
    }

    // Crear modal para imágenes
    function createImageModal() {
        imageModal = document.createElement('div');
        imageModal.className = 'image-modal';
        imageModal.innerHTML = `<div class="image-modal active">
              <div class="modal-overlay"></div>
              <div class="modal-content">
                <button class="modal-close">&times;</button>
                <div class="modal-image-container">
                  <img id="modal-image" src="" alt="Herramienta en tamaño completo">
                  <button class="btn btn-whatsapp modal-rent-btn">
                    <i class="fab fa-whatsapp"></i> RENTAR AHORA
                  </button>
                  <div class="modal-info">
                    <span id="modal-title"></span>
                    <span id="modal-price-day"></span>
                  </div>
                </div>
              </div>
            </div>`;
        
        document.body.appendChild(imageModal);
        
        // Event listeners
        const closeBtn = imageModal.querySelector('.modal-close');
        const overlay = imageModal.querySelector('.modal-overlay');
        
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // Botón rentar
        const rentBtn = imageModal.querySelector('.modal-rent-btn');
        rentBtn.addEventListener('click', function() {
            const toolName = document.getElementById('modal-title').textContent;
            const whatsappUrl = `https://wa.me/5216311681816?text=Hola%20José,%20quiero%20rentar:%20${encodeURIComponent(toolName)}.%20¿Disponible?`;
            window.open(whatsappUrl, '_blank');
            closeModal();
        });
        
        // Cerrar con ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && imageModal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    // Mostrar modal
    function showModal(toolData, calculations) {
        const modalImg = document.getElementById('modal-image');
        const modalTitle = document.getElementById('modal-title');
        const modalPriceDay = document.getElementById('modal-price-day');
        //const modalPriceWeek = document.getElementById('modal-price-week');
        
        const imagePath = toolData.image ? `images/${toolData.image}` : 'images/default-tool.jpg';
        
        modalImg.src = imagePath;
        modalImg.alt = toolData.nombre;
        modalTitle.textContent = toolData.nombre;
        modalPriceDay.textContent = `${formatter.format(toolData.precio_diario)} por día`;
        //modalPriceWeek.textContent = `Semana: ${formatter.format(calculations.weekly)} (${calculations.percentage}% descuento)`;
        
        imageModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Asegurar que la imagen se cargue correctamente
        modalImg.onload = function() {
            // Forzar reflow para asegurar scroll
            modalImg.parentElement.scrollTop = 0;
        };
    }

    // Cerrar modal
    function closeModal() {
        imageModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Renderizar catálogo con diseño de tarjetas premium
    function renderPricingTable() {
        // Ordenar por precio
        herramientas.sort((a, b) => a.precio_diario - b.precio_diario);
        
        let html = '';
        
        herramientas.forEach((herramienta, index) => {
            const calculations = calculateWeeklyPrice(
                herramienta.precio_diario, 
                herramienta.porcentaje_descuento_semanal
            );
            
            const categoryClass = getCategoryClass(herramienta.categoria);
            const categoryText = getCategoryText(herramienta.categoria);
            
            html += `
                <div class="table-row dynamic-row clickable-row" 
                     style="animation-delay: ${index * 0.1}s"
                     data-index="${index}"
                     role="button"
                     tabindex="0"
                     aria-label="Ver detalles de ${herramienta.nombre}">
                    
                    <div class="equipo-info">
                        <div class="equipo-icon">
                            <i class="${herramienta.icono || 'fas fa-tools'}"></i>
                        </div>
                        <div class="equipo-details">
                            <div class="equipo-name">${herramienta.nombre}</div>
                            <div class="category-badge ${categoryClass}">
                                ${categoryText}
                            </div>
                        </div>
                    </div>

                    <div class="price-container">
                        <div class="price-col">
                            <span class="price-label">Renta por día</span>
                            <div class="price">${formatter.format(herramienta.precio_diario)}</div>
                        </div>
                        
                        <div class="price-col">
                            <span class="price-label">Renta por semana</span>
                            <div class="price">${formatter.format(calculations.weekly)}</div>
                        </div>

                        <div class="save-badge">
                            <span class="save-amount">¡Ahorras ${formatter.format(calculations.discount)}!</span>
                            <span class="save-percent">${calculations.percentage}% OFF</span>
                        </div>
                    </div>
                </div>`;
        });

        container.innerHTML = html;
        
        // Event listeners para filas clickables
        setTimeout(() => {
            document.querySelectorAll('.clickable-row').forEach(row => {
                row.addEventListener('click', function(e) {
                    if (e.target.closest('a')) return;
                    
                    const index = parseInt(this.getAttribute('data-index'));
                    const toolData = herramientas[index];
                    const calculations = calculateWeeklyPrice(
                        toolData.precio_diario, 
                        toolData.porcentaje_descuento_semanal
                    );
                    showModal(toolData, calculations);
                });
                
                row.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const index = parseInt(this.getAttribute('data-index'));
                        const toolData = herramientas[index];
                        showModal(toolData, calculateWeeklyPrice(toolData.precio_diario, toolData.porcentaje_descuento_semanal));
                    }
                });
            });
        }, 100);
    }

    // Actualizar resumen
    function updateSummary() {
        const totalTools = herramientas.length;
        if (totalToolsElement) totalToolsElement.textContent = totalTools;
        
        if (summaryContainer) {
            // Limpiar estadísticas previas si existen (excepto el primer item que es estático en HTML pero aquí se suma)
            // En el nuevo diseño el sumario es más simple
        }
    }

    // Update modal render for the new styles
    function showModal(toolData, calculations) {
        const modalImg = document.getElementById('modal-image');
        const modalTitle = document.getElementById('modal-title');
        const modalPriceDay = document.getElementById('modal-price-day');
        
        const imagePath = toolData.image ? `images/${toolData.image}` : 'images/jose-maquina.jpg';
        
        modalImg.src = imagePath;
        modalImg.alt = toolData.nombre;
        modalTitle.textContent = toolData.nombre;
        modalPriceDay.textContent = `${formatter.format(toolData.precio_diario)} / día`;
        
        imageModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Update WhatsApp button in modal
        const rentBtn = imageModal.querySelector('.modal-rent-btn');
        rentBtn.onclick = function() {
            const whatsappUrl = `https://wa.me/5216311681816?text=Hola%20Renta%20y%20Reparaciones%20de%20la%20Bahía,%20me%20interesa%20rentar:%20${encodeURIComponent(toolData.nombre)}`;
            window.open(whatsappUrl, '_blank');
        };
    }

    // Inicializar
    loadToolData();
});