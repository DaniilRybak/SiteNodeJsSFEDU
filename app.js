const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');
const crypto = require('crypto');
const session = require('express-session');
const http = require('http');


const secretKey = crypto.randomBytes(64).toString('hex');

const hostname = '194.67.88.76'; //  Замените на ваш IP-адрес или домен
const port = 22; // Замените на желаемый порт

// Настройка сессии

app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false
}));


// Настройки подключения к базе данных
const dbConfig = {
  host: '79.174.88.28',
  user: 'user1',
  port: '17576',
  password: 'exte`dfZXQd7AmeH/3zeFcCP',
  database: 'user1'
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
  res.sendFile(__dirname + '/index.html');
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

// вход
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

// Обработка запроса на вход
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Получение хешированного пароля из базы данных
  const query = 'SELECT password FROM users WHERE username = ?';
  connection.query(query, [username], async (error, results) => {
    if (error) {
      console.error('Ошибка получения данных из базы данных: ' + error.stack);
      res.status(500).json({ error: 'Ошибка сервера' });
      return;
    }

    if (results.length === 0) {
      res.status(402).json({ error: 'Неверный логин или пароль' });
      return;
    }

    if (password != results[0].password) {
      res.status(401).json({ error: 'Неверный логин или пароль' });
      return;
    }

    // Создание сессии для залогиненного пользователя
    req.session.username = username;
    res.json({ message: 'Успешный вход' });
  });
});

// Проверка авторизации для доступа к специальным функциям
const isLoggedIn = (req, res, next) => {
  if (!req.session.username) {
    return res.redirect('/'); 
  }
  next();
};


// Защита специальных функций проверкой авторизации
app.get('/map', isLoggedIn, (req, res) => {
  
  res.sendFile(__dirname + '/map.html');
});

app.get('/geo', isLoggedIn, (req, res) => {
  
  res.sendFile(__dirname + '/Geolocathion.html');
});

// Новый маршрут для проверки авторизации
app.get('/isLoggedIn', (req, res) => {
  if (req.session.username) {
    res.status(200).send(); // Отправляем пустой ответ, если пользователь авторизован
  } else {
    res.status(401).send(); // Отправляем ошибку 401, если пользователь не авторизован
  }
});


const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Привет из Node.js!');
});

app.listen(port, () => {
  console.log('Server running at http://${hostname}:${port}/');
});