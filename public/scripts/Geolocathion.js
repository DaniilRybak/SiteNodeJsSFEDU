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
          console.log(latitude, longitude);
      });
    } else {
      console.log("Geolocation не поддерживается вашим браузером.");
    }
  };
  
  getLocation();

