// load-prices.js - Carga dinámica de precios desde JSON

document.addEventListener('DOMContentLoaded', function() {
    // Configuración
    const CONFIG = {
        jsonFile: 'herramientas.json',
        containerId: 'pricing-table-container',
        summaryId: 'price-summary',
        totalToolsId: 'total-herramientas',
        refreshButtonId: 'refresh-prices'
    };

    // Elementos del DOM
    const container = document.getElementById(CONFIG.containerId);
    const summaryContainer = document.getElementById(CONFIG.summaryId);
    const totalToolsElement = document.getElementById(CONFIG.totalToolsId);
    const refreshButton = document.getElementById(CONFIG.refreshButtonId);

    // Formateador de moneda
    const formatter = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    // Cargar datos de herramientas
    async function loadToolData() {
        try {
            showLoading();
            
            const response = await fetch(CONFIG.jsonFile);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            renderPricingTable(data);
            updateSummary(data);
            
        } catch (error) {
            console.error('Error cargando los datos:', error);
            showError(error);
        }
    }

    // Mostrar estado de carga
    function showLoading() {
        container.innerHTML = `
            <div class="table-loading">
                <div class="loading-spinner"></div>
                <p>Cargando precios de renta...</p>
            </div>
        `;
    }

    // Mostrar error
    function showError(error) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error cargando precios</h3>
                <p>No se pudieron cargar los precios de renta. Por favor, contacta directamente para consultar disponibilidad.</p>
                <p class="error-detail">${error.message}</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

    // Calcular precio semanal con descuento
    function calculateWeeklyPrice(dailyPrice, discountPercentage) {
        const weeklyPriceWithoutDiscount = dailyPrice * 7;
        const discountAmount = weeklyPriceWithoutDiscount * discountPercentage;
        const weeklyPriceWithDiscount = weeklyPriceWithoutDiscount - discountAmount;
        
        return {
            weekly: Math.round(weeklyPriceWithDiscount),
            discount: Math.round(discountAmount),
            percentage: (discountPercentage * 100).toFixed(1)
        };
    }

    // Obtener clase CSS para categoría
    function getCategoryClass(category) {
        const categoryMap = {
            'herramientas': 'category-herramientas',
            'equipo': 'category-equipo',
            'jardineria': 'category-jardineria',
            'limpieza': 'category-limpieza'
        };
        return categoryMap[category] || 'category-herramientas';
    }

    // Obtener texto para categoría
    function getCategoryText(category) {
        const categoryText = {
            'herramientas': 'Herramienta',
            'equipo': 'Equipo',
            'jardineria': 'Jardinería',
            'limpieza': 'Limpieza'
        };
        return categoryText[category] || 'Herramienta';
    }

    // Renderizar la tabla de precios
    function renderPricingTable(data) {
        const herramientas = data.herramientas;
        const config = data.config || {};
        
        let html = `
            <div class="pricing-table">
                <div class="table-header">
                    <div class="header-item">Equipo</div>
                    <div class="header-item">Precio por Día</div>
                    <div class="header-item">Precio por Semana</div>
                    <div class="header-item">¡AHORRA!</div>
                </div>
        `;

        // Ordenar herramientas por precio diario
        herramientas.sort((a, b) => a.precio_diario - b.precio_diario);

        herramientas.forEach((herramienta, index) => {
            const calculations = calculateWeeklyPrice(
                herramienta.precio_diario, 
                herramienta.porcentaje_descuento_semanal
            );
            
            const categoryClass = getCategoryClass(herramienta.categoria);
            const categoryText = getCategoryText(herramienta.categoria);
            const rowClass = `table-row dynamic-row`;
            const delay = index * 0.1;
            
            html += `
                <div class="${rowClass}" style="animation-delay: ${delay}s">
                    <div class="table-cell">
                        <div class="equipo-name">
                            <i class="${herramienta.icono || 'fas fa-tools'}"></i>
                            ${herramienta.nombre}
                        </div>
                        <div class="category-badge ${categoryClass}">
                            ${categoryText}
                        </div>
                    </div>
                    <div class="table-cell price-cell">
                        <div class="price">
                            ${formatter.format(herramienta.precio_diario)} 
                            <span class="price-period">/día</span>
                        </div>
                    </div>
                    <div class="table-cell price-cell">
                        <div class="price">
                            ${formatter.format(calculations.weekly)} 
                            <span class="price-period">/semana</span>
                        </div>
                        <div class="price-note">(7 días)</div>
                    </div>
                    <div class="table-cell save-cell">
                        <div class="save-amount">
                            ¡Ahorras ${formatter.format(calculations.discount)}!
                        </div>
                        <div class="save-percent">
                            (${calculations.percentage}% de descuento)
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    // Actualizar resumen
    function updateSummary(data) {
        const herramientas = data.herramientas;
        const config = data.config || {};
        
        // Calcular estadísticas
        const totalTools = herramientas.length;
        const avgDailyPrice = Math.round(
            herramientas.reduce((sum, h) => sum + h.precio_diario, 0) / totalTools
        );
        const avgDiscount = Math.round(
            herramientas.reduce((sum, h) => sum + h.porcentaje_descuento_semanal * 100, 0) / totalTools
        );
        
        // Actualizar contador
        if (totalToolsElement) {
            totalToolsElement.textContent = totalTools;
        }
        
        // Añadir estadísticas al resumen
        if (summaryContainer) {
            const statsHtml = `
                <div class="summary-item">
                    <i class="fas fa-chart-line"></i>
                    <span>Precio promedio: <strong>${formatter.format(avgDailyPrice)}/día</strong></span>
                </div>
                <div class="summary-item">
                    <i class="fas fa-tags"></i>
                    <span>Descuento promedio: <strong>${avgDiscount}%</strong> por semana</span>
                </div>
            `;
            
            summaryContainer.insertAdjacentHTML('beforeend', statsHtml);
        }
    }

    // Evento para botón de actualizar
    if (refreshButton) {
        refreshButton.addEventListener('click', loadToolData);
    }

    // Cargar datos inicialmente
    loadToolData();
});