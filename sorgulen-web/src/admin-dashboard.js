// Avansert admin dashboard med statistikk og filtrering
class AdminDashboard {
  constructor() {
    this.orders = [];
    this.filteredOrders = [];
    this.init();
  }

  init() {
    this.setupFilters();
    this.setupEventListeners();
  }

  setupFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const serviceFilter = document.getElementById('serviceFilter');
    const searchFilter = document.getElementById('searchFilter');

    [statusFilter, serviceFilter, searchFilter].forEach(filter => {
      if (filter) {
        filter.addEventListener('change', () => this.applyFilters());
        filter.addEventListener('input', () => this.applyFilters());
      }
    });
  }

  setupEventListeners() {
    // Lyt etter når bestillinger lastes inn
    document.addEventListener('ordersLoaded', (event) => {
      this.orders = event.detail.orders;
      this.updateStatistics();
      this.applyFilters();
    });
  }

  updateStatistics() {
    const stats = this.calculateStatistics();
    
    // Oppdater statistikk-kort med animasjon
    this.animateNumber('totalOrders', stats.total);
    this.animateNumber('newOrders', stats.new);
    this.animateNumber('inProgressOrders', stats.inProgress);
    this.animateNumber('completedOrders', stats.completed);
  }

  calculateStatistics() {
    const stats = {
      total: this.orders.length,
      new: this.orders.filter(o => o.status === 'new').length,
      inProgress: this.orders.filter(o => o.status === 'in_progress').length,
      completed: this.orders.filter(o => o.status === 'done').length,
      cancelled: this.orders.filter(o => o.status === 'cancelled').length
    };

    return stats;
  }

  animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000; // 1 sekund
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutQuart);
      
      element.textContent = currentValue;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  applyFilters() {
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const serviceFilter = document.getElementById('serviceFilter')?.value || '';
    const searchFilter = document.getElementById('searchFilter')?.value.toLowerCase() || '';

    this.filteredOrders = this.orders.filter(order => {
      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesService = !serviceFilter || order.service_type === serviceFilter;
      const matchesSearch = !searchFilter || 
        order.customer_name.toLowerCase().includes(searchFilter) ||
        order.address.toLowerCase().includes(searchFilter) ||
        order.email.toLowerCase().includes(searchFilter) ||
        order.id.toLowerCase().includes(searchFilter);

      return matchesStatus && matchesService && matchesSearch;
    });

    this.renderFilteredOrders();
    this.updateFilterStats();
  }

  renderFilteredOrders() {
    const tbody = document.querySelector('#ordersTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.filteredOrders.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
          <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">📭</div>
          <div>Ingen bestillinger funnet med gjeldende filtre</div>
        </td>
      `;
      tbody.appendChild(tr);
      return;
    }

    this.filteredOrders.forEach((order, index) => {
      const tr = document.createElement('tr');
      tr.style.animationDelay = `${index * 0.05}s`;
      tr.style.animation = 'fadeInUp 0.5s ease-out both';
      
      const ref = order.id.slice(0, 8);
      const serviceClass = `service-${order.service_type}`;
      const serviceName = this.getServiceDisplayName(order.service_type);
      
      tr.innerHTML = `
        <td><span class="order-ref">${ref}</span></td>
        <td>
          <div style="font-weight: 600;">${order.customer_name}</div>
          <div style="font-size: 0.8rem; color: #666;">📧 ${order.email}</div>
          <div style="font-size: 0.8rem; color: #666;">📱 ${order.phone}</div>
        </td>
        <td><span class="service-badge ${serviceClass}">${serviceName}</span></td>
        <td style="font-size: 0.9rem;">📍 ${order.address}</td>
        <td style="font-size: 0.9rem;">${new Date(order.created_at).toLocaleString('nb-NO')}</td>
        <td></td>
      `;

      // Status celle med forbedret select
      const statusCell = tr.querySelector('td:last-child');
      const sel = document.createElement('select');
      sel.className = `status status-${order.status}`;
      
      const statusOptions = [
        { value: 'new', label: '🆕 Ny', class: 'status-new' },
        { value: 'in_progress', label: '⚡ Pågår', class: 'status-in_progress' },
        { value: 'done', label: '✅ Ferdig', class: 'status-done' },
        { value: 'cancelled', label: '❌ Avbrutt', class: 'status-cancelled' }
      ];

      statusOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        if (option.value === order.status) {
          opt.selected = true;
        }
        sel.appendChild(opt);
      });

      sel.addEventListener('change', async () => {
        const newStatus = sel.value;
        const oldStatus = order.status;
        
        // Optimistisk oppdatering
        order.status = newStatus;
        sel.className = `status status-${newStatus}`;
        
        try {
          await this.updateOrderStatus(order.id, newStatus);
          
          // Vis suksess-feedback
          this.showStatusUpdateFeedback(tr, 'success');
          
          // Oppdater statistikk
          this.updateStatistics();
          
        } catch (err) {
          console.error(err);
          
          // Tilbakestill ved feil
          order.status = oldStatus;
          sel.value = oldStatus;
          sel.className = `status status-${oldStatus}`;
          
          // Vis feil-feedback
          this.showStatusUpdateFeedback(tr, 'error');
        }
      });

      statusCell.appendChild(sel);
      tbody.appendChild(tr);
    });

    // Legg til CSS for animasjon hvis den ikke finnes
    if (!document.querySelector('#fadeInUp-style')) {
      const style = document.createElement('style');
      style.id = 'fadeInUp-style';
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  async updateOrderStatus(orderId, newStatus) {
    const token = await this.getAccessToken();
    if (!token) throw new Error('Ingen tilgang');
    
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${API_BASE}/v1/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!res.ok) throw new Error('Oppdatering feilet');
  }

  async getAccessToken() {
    // Denne funksjonen må implementeres i admin.js
    if (window.getAccessToken) {
      return await window.getAccessToken();
    }
    return null;
  }

  showStatusUpdateFeedback(row, type) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      padding: 0.25rem 0.5rem;
      border-radius: 5px;
      font-size: 0.8rem;
      font-weight: bold;
      z-index: 1000;
      animation: fadeInOut 2s ease-out;
    `;
    
    if (type === 'success') {
      feedback.textContent = '✓ Oppdatert';
      feedback.style.background = '#4caf50';
      feedback.style.color = 'white';
    } else {
      feedback.textContent = '✗ Feil';
      feedback.style.background = '#f44336';
      feedback.style.color = 'white';
    }
    
    row.style.position = 'relative';
    row.appendChild(feedback);
    
    setTimeout(() => {
      feedback.remove();
    }, 2000);
    
    // Legg til CSS for fadeInOut animasjon
    if (!document.querySelector('#fadeInOut-style')) {
      const style = document.createElement('style');
      style.id = 'fadeInOut-style';
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-50%) scale(0.8); }
          20% { opacity: 1; transform: translateY(-50%) scale(1); }
          80% { opacity: 1; transform: translateY(-50%) scale(1); }
          100% { opacity: 0; transform: translateY(-50%) scale(0.8); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  updateFilterStats() {
    const adminMsg = document.getElementById('adminMelding');
    if (!adminMsg) return;

    if (this.filteredOrders.length === this.orders.length) {
      adminMsg.textContent = '';
    } else {
      adminMsg.className = 'success';
      adminMsg.textContent = `📊 Viser ${this.filteredOrders.length} av ${this.orders.length} bestillinger`;
    }
  }

  getServiceDisplayName(serviceType) {
    const names = {
      'brøyting': 'Brøyting',
      'plenklipping': 'Plenklipping',
      'trefelling': 'Trefelling',
      'diverse': 'Diverse'
    };
    return names[serviceType] || serviceType;
  }
}

// Start dashboard når siden lastes
document.addEventListener('DOMContentLoaded', () => {
  new AdminDashboard();
});