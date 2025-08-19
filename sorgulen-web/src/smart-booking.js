// Smart booking system med AI-drevet prisberegning og værintegrasjon
class SmartBookingSystem {
  constructor() {
    this.form = document.getElementById('bestillSkjema');
    this.progressFill = document.getElementById('progressFill');
    this.estimatedPrice = document.getElementById('estimatedPrice');
    this.weatherIntegration = document.getElementById('weatherIntegration');
    
    this.basePrices = {
      'brøyting': { base: 800, perHour: 450, weatherMultiplier: 1.2 },
      'plenklipping': { base: 400, perHour: 300, weatherMultiplier: 0.8 },
      'trefelling': { base: 1200, perHour: 600, weatherMultiplier: 1.5 },
      'diverse': { base: 500, perHour: 400, weatherMultiplier: 1.0 }
    };
    
    this.init();
  }

  init() {
    this.setupFormListeners();
    this.updateProgress();
    this.setupRealTimeValidation();
  }

  setupFormListeners() {
    const inputs = this.form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.updateProgress();
        this.calculateSmartPrice();
        this.updateWeatherRecommendation();
      });
      
      input.addEventListener('focus', () => {
        input.style.transform = 'translateY(-2px)';
      });
      
      input.addEventListener('blur', () => {
        input.style.transform = 'translateY(0)';
      });
    });
  }

  updateProgress() {
    const requiredFields = this.form.querySelectorAll('[required]');
    const filledFields = Array.from(requiredFields).filter(field => field.value.trim() !== '');
    const progress = (filledFields.length / requiredFields.length) * 100;
    
    this.progressFill.style.width = `${progress}%`;
    
    // Endre farge basert på fremgang
    if (progress < 30) {
      this.progressFill.style.background = 'linear-gradient(45deg, #f44336, #ff5722)';
    } else if (progress < 70) {
      this.progressFill.style.background = 'linear-gradient(45deg, #ff9800, #ffc107)';
    } else {
      this.progressFill.style.background = 'linear-gradient(45deg, #4caf50, #8bc34a)';
    }
  }

  calculateSmartPrice() {
    const serviceType = document.getElementById('tjeneste').value;
    const address = document.getElementById('adresse').value;
    const datetime = document.getElementById('dato').value;
    const extraInfo = document.getElementById('tilleggsinfo').value;
    
    if (!serviceType) {
      this.estimatedPrice.textContent = 'Velg tjeneste for prisberegning...';
      return;
    }

    const basePrice = this.basePrices[serviceType];
    if (!basePrice) return;

    let totalPrice = basePrice.base;
    let factors = [];

    // Værfaktor
    const weatherFactor = this.getWeatherPriceFactor(serviceType, datetime);
    totalPrice *= weatherFactor.multiplier;
    if (weatherFactor.multiplier !== 1) {
      factors.push(weatherFactor.reason);
    }

    // Kompleksitetsfaktor basert på beskrivelse
    const complexityFactor = this.analyzeComplexity(extraInfo);
    totalPrice *= complexityFactor.multiplier;
    if (complexityFactor.multiplier !== 1) {
      factors.push(complexityFactor.reason);
    }

    // Avstandsfaktor (simulert)
    const distanceFactor = this.calculateDistanceFactor(address);
    totalPrice += distanceFactor.addition;
    if (distanceFactor.addition > 0) {
      factors.push(distanceFactor.reason);
    }

    // Tidsfaktor
    const timeFactor = this.getTimePriceFactor(datetime);
    totalPrice *= timeFactor.multiplier;
    if (timeFactor.multiplier !== 1) {
      factors.push(timeFactor.reason);
    }

    // Vis pris med forklaring
    const priceText = `${Math.round(totalPrice)} kr`;
    const factorText = factors.length > 0 ? ` (${factors.join(', ')})` : '';
    
    this.estimatedPrice.innerHTML = `
      <div>${priceText}</div>
      <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 0.5rem;">
        ${factorText || 'Basispris for valgt tjeneste'}
      </div>
    `;

    // Animasjon ved prisoppdatering
    this.estimatedPrice.style.transform = 'scale(1.05)';
    setTimeout(() => {
      this.estimatedPrice.style.transform = 'scale(1)';
    }, 200);
  }

  getWeatherPriceFactor(serviceType, datetime) {
    if (!datetime) return { multiplier: 1, reason: '' };

    const date = new Date(datetime);
    const month = date.getMonth();
    const hour = date.getHours();

    // Sesongfaktorer
    if (serviceType === 'brøyting' && (month >= 10 || month <= 2)) {
      return { multiplier: 1.3, reason: 'høysesong for brøyting' };
    }
    
    if (serviceType === 'plenklipping' && month >= 4 && month <= 8) {
      return { multiplier: 1.1, reason: 'vekstsesong for gress' };
    }

    // Tidsfaktorer
    if (hour < 7 || hour > 18) {
      return { multiplier: 1.2, reason: 'arbeid utenom normal arbeidstid' };
    }

    return { multiplier: 1, reason: '' };
  }

  analyzeComplexity(description) {
    if (!description) return { multiplier: 1, reason: '' };

    const complexWords = [
      'stor', 'mange', 'vanskelig', 'komplisert', 'høy', 'tung', 
      'farlig', 'spesiell', 'ekstra', 'mye', 'omfattende'
    ];
    
    const urgentWords = ['haster', 'akutt', 'raskt', 'øyeblikkelig', 'nødsituasjon'];
    
    const lowerDesc = description.toLowerCase();
    
    const complexCount = complexWords.filter(word => lowerDesc.includes(word)).length;
    const urgentCount = urgentWords.filter(word => lowerDesc.includes(word)).length;
    
    if (urgentCount > 0) {
      return { multiplier: 1.4, reason: 'hastearbeid' };
    }
    
    if (complexCount >= 3) {
      return { multiplier: 1.3, reason: 'høy kompleksitet' };
    } else if (complexCount >= 1) {
      return { multiplier: 1.15, reason: 'økt kompleksitet' };
    }
    
    return { multiplier: 1, reason: '' };
  }

  calculateDistanceFactor(address) {
    if (!address) return { addition: 0, reason: '' };

    // Simulert avstandsberegning basert på adresse
    const farAreas = ['oslo', 'bergen', 'trondheim', 'stavanger'];
    const lowerAddress = address.toLowerCase();
    
    const isFarArea = farAreas.some(area => lowerAddress.includes(area));
    
    if (isFarArea) {
      return { addition: 300, reason: 'reisekostnader for lang avstand' };
    }
    
    return { addition: 0, reason: '' };
  }

  getTimePriceFactor(datetime) {
    if (!datetime) return { multiplier: 1, reason: '' };

    const date = new Date(datetime);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();

    // Helgetillegg
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { multiplier: 1.25, reason: 'helgetillegg' };
    }

    // Kveldstillegg
    if (hour >= 18 || hour < 7) {
      return { multiplier: 1.2, reason: 'kveldstillegg' };
    }

    return { multiplier: 1, reason: '' };
  }

  updateWeatherRecommendation() {
    const serviceType = document.getElementById('tjeneste').value;
    const datetime = document.getElementById('dato').value;
    
    if (!serviceType || !datetime) {
      this.weatherIntegration.innerHTML = '<div>🌤️ Værbasert anbefaling vil vises her når du velger tjeneste og dato</div>';
      return;
    }

    const date = new Date(datetime);
    const recommendations = this.getWeatherRecommendations(serviceType, date);
    
    this.weatherIntegration.innerHTML = `
      <div style="margin-bottom: 0.5rem;">
        <strong>🤖 AI Væranalyse for ${this.getServiceName(serviceType)}</strong>
      </div>
      <div style="font-size: 0.9rem;">
        ${recommendations.join(' • ')}
      </div>
    `;
    
    // Animasjon
    this.weatherIntegration.style.transform = 'scale(1.02)';
    setTimeout(() => {
      this.weatherIntegration.style.transform = 'scale(1)';
    }, 300);
  }

  getWeatherRecommendations(serviceType, date) {
    const month = date.getMonth();
    const hour = date.getHours();
    const recommendations = [];

    switch (serviceType) {
      case 'brøyting':
        if (month >= 10 || month <= 2) {
          recommendations.push('❄️ Optimal sesong for brøyting');
          recommendations.push('🌡️ Kaldt vær gir bedre arbeidsforhold');
        } else {
          recommendations.push('☀️ Ikke brøytesesong - vurder andre tjenester');
        }
        break;
        
      case 'plenklipping':
        if (month >= 3 && month <= 9) {
          recommendations.push('🌱 Vekstsesong - perfekt for plenklipping');
          if (hour >= 8 && hour <= 16) {
            recommendations.push('☀️ Ideelt tidspunkt på dagen');
          }
        } else {
          recommendations.push('🍂 Utenfor vekstsesong - begrenset effekt');
        }
        break;
        
      case 'trefelling':
        if (month >= 10 || month <= 3) {
          recommendations.push('🌳 Optimal sesong - trær er i hvile');
          recommendations.push('💨 Mindre vind om vinteren gir tryggere arbeid');
        }
        if (hour >= 9 && hour <= 15) {
          recommendations.push('🌞 Beste lysforhold for sikker trefelling');
        }
        break;
        
      case 'diverse':
        recommendations.push('🔧 Fleksibel tjeneste - tilpasses værforhold');
        if (hour >= 8 && hour <= 17) {
          recommendations.push('⏰ Normal arbeidstid gir best tilgjengelighet');
        }
        break;
    }

    return recommendations.length > 0 ? recommendations : ['📊 Analyserer værdata for optimal timing'];
  }

  getServiceName(serviceType) {
    const names = {
      'brøyting': 'Brøyting',
      'plenklipping': 'Plenklipping', 
      'trefelling': 'Trefelling',
      'diverse': 'Diverse tjenester'
    };
    return names[serviceType] || serviceType;
  }

  setupRealTimeValidation() {
    const inputs = this.form.querySelectorAll('input[required], select[required]');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateField(input);
      });
      
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) {
          this.validateField(input);
        }
      });
    });
  }

  validateField(field) {
    const isValid = field.checkValidity() && field.value.trim() !== '';
    
    if (isValid) {
      field.style.borderColor = '#4caf50';
      field.classList.remove('error');
      // Legg til suksess-ikon
      this.addValidationIcon(field, '✓', '#4caf50');
    } else {
      field.style.borderColor = '#f44336';
      field.classList.add('error');
      // Legg til feil-ikon
      this.addValidationIcon(field, '✗', '#f44336');
    }
  }

  addValidationIcon(field, icon, color) {
    // Fjern eksisterende ikon
    const existingIcon = field.parentNode.querySelector('.validation-icon');
    if (existingIcon) {
      existingIcon.remove();
    }
    
    // Legg til nytt ikon
    const iconEl = document.createElement('span');
    iconEl.className = 'validation-icon';
    iconEl.textContent = icon;
    iconEl.style.cssText = `
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: ${color};
      font-weight: bold;
      pointer-events: none;
      z-index: 10;
    `;
    
    field.parentNode.style.position = 'relative';
    field.parentNode.appendChild(iconEl);
  }
}

// Start smart booking system når siden lastes
document.addEventListener('DOMContentLoaded', () => {
  new SmartBookingSystem();
});