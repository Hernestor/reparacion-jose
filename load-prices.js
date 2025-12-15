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

    // Renderizar tabla con filas clickables
    // Renderizar tabla con filas clickables
    function renderPricingTable() {
        // Ordenar por precio
        herramientas.sort((a, b) => a.precio_diario - b.precio_diario);
        
        // Detect if we're on a small viewport (mobile)
        const isSmallViewport = window.innerWidth <= 768; // Adjust breakpoint as needed
        
        let html = '';
        
        // Only add header row if NOT small viewport
        if (!isSmallViewport) {
            html += `
                <div class="table-header">
                    <div class="header-item">Equipo</div>
                    <div class="header-item">Precio por Día</div>
                    <div class="header-item">Precio por Semana</div>
                    <div class="header-item">¡AHORRA!</div>
                </div>`;
        }

        herramientas.forEach((herramienta, index) => {
            const calculations = calculateWeeklyPrice(
                herramienta.precio_diario, 
                herramienta.porcentaje_descuento_semanal
            );
            
            const categoryClass = getCategoryClass(herramienta.categoria);
            const categoryText = getCategoryText(herramienta.categoria);
            
            // For small viewports, remove data-labels and simplify structure
            html += `
                <div class="table-row dynamic-row clickable-row" 
                     style="animation-delay: ${index * 0.1}s"
                     data-index="${index}"
                     role="button"
                     tabindex="0"
                     aria-label="Ver detalles de ${herramienta.nombre}">
                    <div class="table-cell" ${isSmallViewport ? '' : 'data-label="Equipo"'}>
                        <div class="equipo-info">
                            <div class="equipo-icon">
                                <i class="${herramienta.icono || 'fas fa-tools'}"></i>
                            </div>
                            <div class="equipo-details">
                                <div class="equipo-name">${herramienta.nombre}</div>
                                <div class="category-badge ${categoryClass}">
                                    <span class="badge-text">${categoryText}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="table-cell" ${isSmallViewport ? '' : 'data-label="Precio por Día"'}>
                        <div class="price">
                            ${formatter.format(herramienta.precio_diario)} 
                            <span class="price-period">/día</span>
                        </div>
                    </div>
                    <div class="table-cell" ${isSmallViewport ? '' : 'data-label="Precio por Semana"'}>
                        <div class="price">
                            ${formatter.format(calculations.weekly)} 
                            <span class="price-period">/semana</span>
                        </div>
                    </div>
                    <div class="table-cell" ${isSmallViewport ? '' : 'data-label="¡Ahorras!"'}>
                        <div class="save-amount">
                            ¡Ahorras ${formatter.format(calculations.discount)}!
                        </div>
                        <div class="save-percent">
                            (${calculations.percentage}% de descuento)
                        </div>
                    </div>
                </div>`;
        });

        container.innerHTML = html;
        
        // Event listeners para filas clickables
        setTimeout(() => {
            document.querySelectorAll('.clickable-row').forEach(row => {
                // Click
                row.addEventListener('click', function(e) {
                    // Evitar si se hizo clic en un enlace dentro de la fila
                    if (e.target.closest('a')) return;
                    
                    const index = parseInt(this.getAttribute('data-index'));
                    const toolData = herramientas[index];
                    const calculations = calculateWeeklyPrice(
                        toolData.precio_diario, 
                        toolData.porcentaje_descuento_semanal
                    );
                    showModal(toolData, calculations);
                });
                
                // Keyboard support (Enter/Space)
                row.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const index = parseInt(this.getAttribute('data-index'));
                        const toolData = herramientas[index];
                        const calculations = calculateWeeklyPrice(
                            toolData.precio_diario, 
                            toolData.porcentaje_descuento_semanal
                        );
                        showModal(toolData, calculations);
                    }
                });
                
                // Hover effects
                row.addEventListener('mouseenter', function() {
                    this.style.cursor = 'pointer';
                });
            });
        }, 100);
    }

    // Actualizar resumen
    function updateSummary() {
        const totalTools = herramientas.length;
        const avgDailyPrice = Math.round(
            herramientas.reduce((sum, h) => sum + h.precio_diario, 0) / totalTools
        );
        const avgDiscount = Math.round(
            herramientas.reduce((sum, h) => sum + h.porcentaje_descuento_semanal * 100, 0) / totalTools
        );
        
        if (totalToolsElement) {
            totalToolsElement.textContent = totalTools;
        }
        
        if (summaryContainer) {
            const statsHtml = `
                <div class="summary-item">
                    <i class="fas fa-chart-line"></i>
                    <span>Precio promedio: <strong>${formatter.format(avgDailyPrice)}/día</strong></span>
                </div>
                <div class="summary-item">
                    <i class="fas fa-tags"></i>
                    <span>Descuento promedio: <strong>${avgDiscount}%</strong> por semana</span>
                </div>`;
            
            summaryContainer.insertAdjacentHTML('beforeend', statsHtml);
        }
    }

    // Inicializar
    loadToolData();
});