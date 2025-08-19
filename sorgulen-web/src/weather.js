// Smart værwidget som gir arbeidsanbefalinger
class WeatherService {
  constructor() {
    this.apiKey = 'demo'; // I produksjon: bruk ekte API-nøkkel
    this.location = 'Sørgulen';
    this.init();
  }

  async init() {
    await this.loadWeatherData();
    this.startAutoUpdate();
  }

  async loadWeatherData() {
    try {
      // Simulerer værdata (i produksjon: bruk ekte API som OpenWeatherMap)
      const mockWeatherData = this.generateMockWeather();
      this.updateWeatherDisplay(mockWeatherData);
      this.generateWorkRecommendation(mockWeatherData);
    } catch (error) {
      console.error('Kunne ikke hente værdata:', error);
      this.showWeatherError();
    }
  }

  generateMockWeather() {
    const conditions = [
      { temp: 15, desc: '☀️ Solskinn', wind: 5, humidity: 45, good: true },
      { temp: 8, desc: '⛅ Delvis skyet', wind: 12, humidity: 60, good: true },
      { temp: 3, desc: '🌧️ Lett regn', wind: 18, humidity: 85, good: false },
      { temp: -2, desc: '❄️ Snø', wind: 8, humidity: 70, good: false },
      { temp: 22, desc: '🌤️ Pent vær', wind: 3, humidity: 40, good: true }
    ];
    
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    return {
      temperature: randomCondition.temp,
      description: randomCondition.desc,
      windSpeed: randomCondition.wind,
      humidity: randomCondition.humidity,
      goodForWork: randomCondition.good,
      timestamp: new Date()
    };
  }

  updateWeatherDisplay(data) {
    const tempEl = document.getElementById('temperature');
    const descEl = document.getElementById('description');
    
    if (tempEl && descEl) {
      tempEl.textContent = `${data.temperature}°C`;
      descEl.textContent = data.description;
      
      // Animasjon ved oppdatering
      tempEl.style.transform = 'scale(1.1)';
      setTimeout(() => {
        tempEl.style.transform = 'scale(1)';
      }, 200);
    }
  }

  generateWorkRecommendation(data) {
    const recommendationEl = document.getElementById('workRecommendation');
    if (!recommendationEl) return;

    let recommendation = '';
    let bgColor = '';

    if (data.temperature < 0) {
      recommendation = '❄️ Perfekt for brøyting og vinterarbeid!';
      bgColor = 'rgba(33, 150, 243, 0.2)';
    } else if (data.temperature > 20 && data.goodForWork) {
      recommendation = '🌱 Ideelt vær for plenklipping og hagearbeid!';
      bgColor = 'rgba(76, 175, 80, 0.2)';
    } else if (data.windSpeed > 15) {
      recommendation = '🌪️ Sterk vind - perfekt for trefelling (sikker avstand)';
      bgColor = 'rgba(255, 152, 0, 0.2)';
    } else if (!data.goodForWork) {
      recommendation = '🏠 Innendørs planlegging og vedlikehold anbefales';
      bgColor = 'rgba(158, 158, 158, 0.2)';
    } else {
      recommendation = '✅ Gode arbeidsforhold for de fleste tjenester!';
      bgColor = 'rgba(76, 175, 80, 0.2)';
    }

    recommendationEl.textContent = recommendation;
    recommendationEl.style.background = bgColor;
    recommendationEl.style.display = 'block';
    
    // Fade-in animasjon
    recommendationEl.style.opacity = '0';
    setTimeout(() => {
      recommendationEl.style.transition = 'opacity 0.5s ease';
      recommendationEl.style.opacity = '1';
    }, 100);
  }

  showWeatherError() {
    const tempEl = document.getElementById('temperature');
    const descEl = document.getElementById('description');
    
    if (tempEl && descEl) {
      tempEl.textContent = '--°C';
      descEl.textContent = '🌐 Værdata ikke tilgjengelig';
    }
  }

  startAutoUpdate() {
    // Oppdater værdata hver 10. minutt
    setInterval(() => {
      this.loadWeatherData();
    }, 600000);
  }
}

// Start værservice når siden lastes
document.addEventListener('DOMContentLoaded', () => {
  new WeatherService();
});

// Legg til interaktive effekter
document.addEventListener('DOMContentLoaded', () => {
  // Parallax effekt på scroll (hvis siden blir lengre)
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.container');
    if (parallax) {
      const speed = scrolled * 0.5;
      parallax.style.transform = `translateY(${speed}px)`;
    }
  });

  // Hover effekt på værwidget
  const weatherWidget = document.getElementById('weatherWidget');
  if (weatherWidget) {
    weatherWidget.addEventListener('mouseenter', () => {
      weatherWidget.style.transform = 'scale(1.02)';
      weatherWidget.style.transition = 'transform 0.3s ease';
    });
    
    weatherWidget.addEventListener('mouseleave', () => {
      weatherWidget.style.transform = 'scale(1)';
    });
  }
});