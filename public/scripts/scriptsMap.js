var options = {
enableHighAccuracy: true,
timeout: 5000,
maximumAge: 0,
};

function success(pos) {
var crd = pos.coords;

console.log("Ваше текущее местоположение:");
console.log(`Широта: ${crd.latitude}`);
console.log(`Долгота: ${crd.longitude}`);
console.log(`Плюс-минус ${crd.accuracy} метров.`);
}

function error(err) {
console.warn(`ERROR(${err.code}): ${err.message}`);
}

navigator.geolocation.getCurrentPosition(success, error, options)


function createChart(canvasId, percent) {
    var ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
        datasets: [{
        data: [percent, 100 - percent], // Данные для диаграммы
        backgroundColor: ['#4CAF50', '#f44336'] // Цвета сегментов
        }]
    },
    options: {
        cutoutPercentage: 70, // Размер отверстия в центре
        responsive: false, // Отключаем адаптивность
        legend: {
            display: false // Скрываем легенду
        },
        tooltips: {
            enabled: false // Отключаем всплывающие подсказки
        }
    }
    });
}

function showRouteAlert(message = '') {
    document.getElementById('alert-message').innerText = message;
    document.getElementById('route-alert').style.display = 'block';
}

function closeRouteAlert() {
    document.getElementById('route-alert').style.display = 'none';
}


let myMap;  // Объявляем myMap здесь, чтобы она была доступна в других функциях
let clusterer; // Объявляем clusterer здесь, чтобы он был доступен в других функциях
let mapInitialized = false; 
let placemarkColors = [
    '#4CAF50', // Зеленый
    '#f44336', // Красный
    '#FFA500' // Оранжевый
];
let multiRoute; // Объявляем multiRoute здесь

ymaps.ready(init);

function init() {
    var geolocation = ymaps.geolocation;
    myMap = new ymaps.Map("map", {
        center: [47.214758, 38.914220], // Ваши координаты
        zoom: 14, // Начальный зум
    }, {
        searchControlProvider: 'yandex#search' // Добавляем поиск на карту
    });
   

    clusterer = new ymaps.Clusterer({
        clusterIconLayout: 'default#pieChart',
        clusterIconPieChartRadius: 20,
        clusterIconPieChartCoreRadius: 10,
        clusterIconPieChartStrokeWidth: 3,
        hasBalloon: false
    });

    updateMapData(); // Первоначальная загрузка данных

    // Обновляем данные каждые 10 секунд (10000 миллисекунд)
    setInterval(updateMapData, 5000); 

    myMap.events.add('contextmenu', function (e) {
        var coords = e.get('coords');

        // Создание контента для балуна
        var content = `
            <div class="add-sensor-balloon">
                <p>Добавить датчик в этой точке?</p>
                <button class="Button-all" onclick="addSensorFromBalloon(${coords[0]}, ${coords[1]})">Добавить</button>
            </div>
        `;

        // Открытие балуна
        myMap.balloon.open(coords, {
            contentBody: content,
            closeButton: true
        });
    });

    // Обработчик клика на карту (для скрытия подсказки)
    myMap.events.add('click', function () {
        closeBinInfo(); 
    });


    geolocation.get({
        provider: 'browser',
    }).then(function (result) {
        // Синим цветом пометим положение, полученное через браузер.
        // Если браузер не поддерживает эту функциональность, метка не будет добавлена на карту.
        result.geoObjects.options.set('preset', 'islands#blueCircleIcon');
        myMap.geoObjects.add(result.geoObjects);
    });

        // Наша кнопка "Построить маршрут"
        const myRouteButton = document.getElementById('myRouteButton');
        const nextRouteButton = document.getElementById('NextRoute');

        function addRouteButtonClickHandler(button) {
        button.addEventListener('click', () => {
            if (multiRoute) { 
                myMap.geoObjects.remove(multiRoute);
                multiRoute = null;
            } else {
                buildRoute();
            }
        });
    }

    addRouteButtonClickHandler(myRouteButton);
    addRouteButtonClickHandler(nextRouteButton);
}

function buildRoute() {
    ymaps.geolocation.get({
        provider: 'browser',
        mapStateAutoApply: false
    }).then(function (result) {
        let wayPoints = [result.geoObjects.get(0).geometry.getCoordinates()]; // Начинаем с текущего положения

        // Получаем координаты всех красных и оранжевых маркеров
        clusterer.getGeoObjects().forEach(geoObject => {
            if (geoObject.options.get('iconColor') === placemarkColors[1] ||
                geoObject.options.get('iconColor') === placemarkColors[2]) {
                wayPoints.push(geoObject.geometry.getCoordinates());
            }
        });

        // Если есть хотя бы одна точка для маршрута (кроме начальной)
        if (wayPoints.length > 1) {
        
            // Используем ymaps.route для построения маршрута
            ymaps.route(wayPoints, {
                mapState: { zoom: 15 },
                multiRoute: true,
                routingMode: 'auto'
            }).then(function (route) {
                multiRoute = route;
                myMap.geoObjects.add(multiRoute);

                // Выводим информацию о каждом маршруте
                route.getRoutes().each(function (route) {
                    console.log("Маршрут:");
                    console.log("Длина:", route.getLength()); // Длина маршрута в метрах
                    console.log("Время:", route.getDuration()); // Время в пути в секундах
                });
            });
        } else {
            // Обработка случая, когда нет точек для маршрута
            alert("Нет контейнеров для сбора!");
        }
    });
}


function updateMapData() {
    fetch('/api/bins')
        .then(response => response.json())
        .then(data => {
        let fullBinsCount = 0;
        let lowChargeCount = 0;
        let geoObjects = [];

        // Очищаем карту от старых объектов
        myMap.geoObjects.remove(clusterer);
        clusterer.removeAll(); 

        // Обработка каждого мусорного бака
        data.forEach(bin => {
            let iconColor;

            // Определение цвета маркера
            if (bin.chargeLevel < 20) {
                iconColor = placemarkColors[2]; // Оранжевый, если низкий заряд
                lowChargeCount++;
            } else if(bin.fullness > 80) {
                iconColor = placemarkColors[1];
                fullBinsCount++;
            }
            else{
                iconColor = placemarkColors[0];
            }

            // Создание маркера
            var marker = new ymaps.Placemark([bin.latitude, bin.longitude], {}, {
                iconColor: iconColor
            });

            // Обработчик клика на маркер
            marker.events.add('click', function () {
                // Получаем координаты маркера
                const coords = marker.geometry.getCoordinates();

                // Создаем контент для балуна
                const content = `
                    <div class="bin-info-window">
                        <h2>Контейнер номер: ${bin.serial_number}</h2>
                        <div class="charts">
                            <div class="chart-container">
                                <canvas id="fullnessChart-${bin.id}" width="100" height="100"></canvas>
                                <p>Наполненность: ${bin.fullness}%</p>
                                ${bin.fullness > 80 ? '<p style="color: red;">Контейнер заполнен!</p>' : ''}
                            </div>
                            <div class="chart-container">
                                <canvas id="chargeChart-${bin.id}" width="100" height="100"></canvas>
                                <p>Заряд: ${bin.chargeLevel}%</p>
                                ${bin.chargeLevel < 20 ? '<p style="color: orange;">Требуется зарядка датчика!</p>' : ''}
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="editLatitude-${bin.id}" style="font-size: 18px;">Широта:</label>
                            <input type="text" id="editLatitude-${bin.id}" value="${bin.latitude}" style="font-size: 16px;">
                        </div>
                        <div class="input-group">
                            <label for="editLongitude-${bin.id}"  style="font-size: 18px;">Долгота:</label>
                            <input type="text" id="editLongitude-${bin.id}" value="${bin.longitude}"  style="font-size: 16px;">
                        </div>
                        <div class="buttons">
                            <button class="Button-all" onclick="updateBinLocation(${bin.id})">Изменить местоположение</button>
                            <button class="Button-all" onclick="closeBinInfo()">Закрыть</button>
                        </div>
                    </div>
                `;

                myMap.balloon.open(coords, {
                    contentBody: content,
                    closeButton: false
                }).then(() => {  // Ждем открытия балуна
                    // Создаем графики после открытия балуна
                    createChart(`fullnessChart-${bin.id}`, 100 - bin.fullness);
                    createChart(`chargeChart-${bin.id}`, bin.chargeLevel);
                });
            });

            // Добавление маркера в кластер
            geoObjects.push(marker);
            clusterer.add(marker);
        });

        // Логика для показа уведомлений
        if (fullBinsCount >= 9 && lowChargeCount > 0) {
            showRouteAlert(`Достаточное количество контейнеров заполнены. Необходимо выехать на маршрут для сбора мусора.\n\nНужна зарядка батарей в ${lowChargeCount} датчиках.`);
        } else if (fullBinsCount >= 10) {
            showRouteAlert('Достаточное количество контейнеров заполнены. Необходимо выехать на маршрут для сбора мусора.');
        } else if (lowChargeCount > 0) {
            showRouteAlert(`Необходимо зарядка батареи в ${lowChargeCount} датчиках.`);
        }

        // Добавляем кластер на карту
        myMap.geoObjects.add(clusterer);

        // Установка границ карты (только один раз)
        if (!mapInitialized) {
            myMap.setBounds(clusterer.getBounds(), { checkZoomRange: true });
            mapInitialized = true; 
        }
        })
        .catch(error => console.error('Ошибка при получении данных:', error));
    }

function updateBinLocation(binId) {
    const newLatitude = document.getElementById(`editLatitude-${binId}`).value;
    const newLongitude = document.getElementById(`editLongitude-${binId}`).value;
    
    // Валидация данных (необязательно, но рекомендуется)
    if (!newLatitude || !newLongitude) {
        alert('Введите корректные координаты');
        return;
    }
    
    fetch(`/api/bins/${binId}`, {
        method: 'PUT',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        latitude: newLatitude,
        longitude: newLongitude
        })
    })
    .then(response => {
        if (!response.ok) {
        throw new Error('Ошибка обновления данных');
        }
        return response.json();
    })
    .then(data => {
        // Обработка успешного обновления
        console.log(data.message); // Вывод сообщения с сервера
    
        // Закрываем балун
        closeBinInfo();
    
        // Обновляем данные на карте
        updateMapData(); 
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при обновлении');
    });
    }

function closeBinInfo() {
    myMap.balloon.close();
}

// Функция для добавления датчика из балуна
function addSensorFromBalloon(latitude, longitude) {
    // Закрываем балун
    myMap.balloon.close();

    // Заполняем форму координатами
    document.getElementById('latitude').value = latitude;
    document.getElementById('longitude').value = longitude;

    // Открываем модальное окно
    openAddSensorModal();
}


///список датчиков
function openSensorListModal() {
    document.getElementById('sensorListModal').style.display = 'block';
    loadSensorList(); 
  }

  function closeSensorListModal() {
    document.getElementById('sensorListModal').style.display = 'none';
  }

  function loadSensorList() {
    fetch('/api/bins')
      .then(response => response.json())
      .then(data => {
        const sensorList = document.getElementById('sensorList');
        sensorList.innerHTML = ''; 
  
        data.forEach(bin => {
          const listItem = document.createElement('li');
          listItem.innerHTML = `
            <a href="#" onclick="centerOnSensor(${bin.latitude}, ${bin.longitude})">
              Датчик ${bin.serial_number} 
              <span>${bin.latitude}</span> 
              <span>${bin.longitude}</span> 
            </a>
          `;
          sensorList.appendChild(listItem);
        });
      })
      .catch(error => console.error('Ошибка при загрузке списка датчиков:', error));
  }
  
  function centerOnSensor(latitude, longitude) {
    // Закрываем модальное окно
    closeSensorListModal();
  
    // Центрируем карту на выбранном датчике
    myMap.setCenter([latitude, longitude], 17); // 17 - уровень зума
  }

  const sensorSearchInput = document.getElementById('sensorSearch');
    const sensorList = document.getElementById('sensorList');

    sensorSearchInput.addEventListener('input', () => {
      const searchTerm = sensorSearchInput.value.toLowerCase();
      const listItems = sensorList.getElementsByTagName('li');

      for (let i = 0; i < listItems.length; i++) {
        const sensorSerialNumber = listItems[i].textContent.toLowerCase();
        if (sensorSerialNumber.includes(searchTerm)) {
          listItems[i].style.display = 'block';
        } else {
          listItems[i].style.display = 'none';
        }
      }
    });