const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');

// Настройки подключения к базе данных
const dbConfig = {
  host: 'localhost',
  user: 'root',
  port: '3306',
  password: '1234',
  database: 'trash_bins'
};

// Создание подключения к базе данных
const connection = mysql.createConnection(dbConfig);

// Обработка ошибок подключения
connection.connect(error => {
  if (error) {
    console.error('Ошибка подключения к базе данных: ' + error.stack);
    return;
  }
  console.log('Подключение к базе данных успешно установлено');
});

app.use(express.static('public'));
app.use(express.json()); // Для парсинга JSON в теле запроса

// Главная страница с картой
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/map.html');
});

// API endpoint для получения данных о мусорных баках
app.get('/api/bins', (req, res) => {
  const query = 'SELECT * FROM bins';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Ошибка получения данных из базы данных: ' + error.stack);
      res.status(500).json({ error: 'Ошибка сервера' });
      return;
    }
    res.json(results);
  });
});

// API endpoint для обновления данных о мусорном баке
app.put('/api/bins/:id', (req, res) => {
  const binId = req.params.id;
  const { fullness, chargeLevel } = req.body;
  const query = `UPDATE bins SET fullness = ?, chargeLevel = ? WHERE id = ?`;
  connection.query(query, [fullness, chargeLevel, binId], (error, results) => {
    if (error) {
      console.error('Ошибка обновления данных в базе данных: ' + error.stack);
      res.status(500).json({ error: 'Ошибка сервера' });
      return;
    }
    res.json({ message: 'Данные успешно обновлены' });
  });
});
//gds
app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});