// Получение данных о погоде с сервера weatherapi
const fetchWeather = async (lat, lon) => {
    const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=63320051cbf548609ac115617240806&q=${lat},${lon}`);
    const data = await response.json();
    return data;
  };

  // Вызов функции для получения данных о скорости ветра в текущем местоположении
  const getLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        const weatherData = await fetchWeather(latitude, longitude);
        const windSpeed = weatherData.current.wind_kph; // Получение скорости ветра в км/ч
        const isRaining = weatherData.current.is_day === 0; // Проверка, идет ли сейчас дождь
        const isHailing = weatherData.current.condition.text.includes("Град"); // Проверка, идет ли сейчас град
        const isSnowing = weatherData.current.condition.text.includes("Снег"); // Проверка, идет ли сейчас снег

        var coordinatesDiv = document.getElementById('coordinates');
        coordinatesDiv.innerText = 'Latitude: ' + latitude + ', Longitude: ' + longitude;

        // Отображение информации о дожде на странице
        const rainInfoElement = document.getElementById("weather-info");
        if (isRaining || isSnowing || isHailing || windSpeed > 32) {
            rainInfoElement.textContent = "На данный момент нежелательные погодные условия. Отложите полёт.";
        } else {
            rainInfoElement.textContent = "Удачного полёта!";                
        }
      });
    } else {
      alert("Geolocation не поддерживается вашим браузером.");
    }
  };
  
  getLocation();

