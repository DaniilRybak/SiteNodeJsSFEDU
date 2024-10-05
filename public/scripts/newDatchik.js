function openAddSensorModal() {
    document.getElementById('addSensorModal').style.display = 'block';
}

function closeAddSensorModal() {
    document.getElementById('addSensorModal').style.display = 'none';
}

document.getElementById('addSensorForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const serialNumber = document.getElementById('serialNumber').value;
    const sensorCode = document.getElementById('sensorCode').value;

    // Валидация координат
    if (validateCoordinates(latitude, longitude)) {
        alert('Пожалуйста, введите корректные координаты.');
        return;
    }

    // Валидация кода датчика
    if (sensorCode !== '22031') {
        alert('Неверный код датчика!');
        return;
    }

    const sensorData = {
        latitude: latitude,
        longitude: longitude,
        serialNumber: serialNumber,
        fullness: 0,
        chargeLevel: 100
    };

    fetch('/api/bins', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sensorData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Sensor added:', data);
        closeAddSensorModal();

        // Обновление карты после добавления маркера
        updateMapData(); 

        // Дополнительные действия (необязательно):
        // - Очистить форму
        // - Вывести сообщение об успешном добавлении
    })
    .catch(error => {
        console.error('Error adding sensor:', error);
        alert('Ошибка добавления датчика. Пожалуйста, попробуйте еще раз.');
    });
});

function validateCoordinates(latitude, longitude) {
    // Проверка на числовой тип данных
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false;
    }
  
    // Проверка диапазона широты
    if (latitude < -90 || latitude > 90) {
      return false;
    }
  
    // Проверка диапазона долготы
    if (longitude < -180 || longitude > 180) {
      return false;
    }
  
    // Координаты корректны
    return true;
  }

const modal = document.getElementById('addSensorModal');

// Обработчик клика на все окно (включая область за модальным окном)
window.onclick = function(event) {
    // Проверяем, клик был по самому модальному окну или нет
    if (event.target == modal) {
        closeAddSensorModal();
    }
}