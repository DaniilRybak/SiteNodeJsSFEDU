const express = require('express');
const app = express();
const mysql = require('mysql2');
const crypto = require('crypto');
const session = require('express-session');


const secretKey = crypto.randomBytes(64).toString('hex');

const port = 3000; // Замените на желаемый порт

// Настройка сессии

app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false
}));

// Проверка авторизации для доступа к специальным функциям
const isLoggedIn = (req, res, next) => {
  if (!req.session.username) {
    return res.redirect('/'); 
  }
  next();
};


// Настройки подключения к базе данных
const dbConfig1 = {
  host: '79.174.88.253',
  user: 'Daniil',
  port: '15552',
  password: 'Primera12.',
  database: 'trash_bins'
};

const dbConfig = {
  host: 'localhost',
  user: 'root',
  port: '3306',
  password: '1234',
  database: 'trash_bins'
};

// Создание подключения к базе данных
const connection = mysql.createConnection(dbConfig1);

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
app.get('/api/bins', isLoggedIn, (req, res) => {
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

// Защита специальных функций проверкой авторизации
app.get('/map', isLoggedIn, (req, res) => {
  
  res.sendFile(__dirname + '/map.html');
});

// Новый маршрут для проверки авторизации
app.get('/isLoggedIn', (req, res) => {
  if (req.session.username) {
    res.status(200).send(); // Отправляем пустой ответ, если пользователь авторизован
  } else {
    res.status(401).send(); // Отправляем ошибку 401, если пользователь не авторизован
  }
});


/////////////
app.post('/api/bins', isLoggedIn, (req, res) => {
  const { latitude, longitude, serialNumber, fullness, chargeLevel } = req.body;

  // Проверка существования серийного номера
  const checkQuery = `SELECT 1 FROM bins WHERE serial_number = ?`;
  connection.query(checkQuery, [serialNumber], (checkError, checkResults) => {
    if (checkError) {
      console.error('Ошибка проверки серийного номера:', checkError);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }

    if (checkResults.length > 0) {
      // Серийный номер уже существует
      return res.status(400).json({ error: 'Датчик с таким серийным номером уже существует' });
    }

    // Если серийный номер уникален, добавляем датчик
    const insertQuery = `INSERT INTO bins (latitude, longitude, serial_number, fullness, chargeLevel) VALUES (?, ?, ?, ?, ?)`;
    connection.query(insertQuery, [latitude, longitude, serialNumber, fullness, chargeLevel], (insertError, insertResults) => {
      if (insertError) {
        console.error('Ошибка добавления данных:', insertError);
        return res.status(500).json({ error: 'Ошибка сервера' });
      }
      res.status(201).json({ message: 'Данные успешно добавлены', id: insertResults.insertId });
    });
  });
});
//////////ОБНОВЛЕНИЕ МЕСТОПОЛОЖЕНИЯ

app.get('/api/bins/:id', isLoggedIn, (req, res) => {
  const binId = req.params.id;

  const sql = `SELECT * FROM bins WHERE id = ?`;
  connection.query(sql, [binId], (err, result) => {
    if (err) {
      console.error('Ошибка получения данных:', err);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Контейнер не найден' });
    }

    res.json(result[0]); // Возвращаем найденный контейнер
  });
});


app.put('/api/bins/:id', isLoggedIn, (req, res) => {
  const binId = req.params.id;
  const { latitude, longitude } = req.body;

  // Валидация данных (необязательно, но рекомендуется)
  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Неверные данные' });
  }

  const sql = `UPDATE bins SET latitude = ?, longitude = ? WHERE id = ?`;
  connection.query(sql, [latitude, longitude, binId], (err, result) => {
    if (err) {
      console.error('Ошибка обновления данных:', err);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Контейнер не найден' });
    }
    res.json({ message: 'Местоположение обновлено' });
  });
});
/////////МАРШРУТ/////////////
app.get('/api/bins/:id/on_route', isLoggedIn, (req, res) => {
  const binId = req.params.id;

  const sql = `SELECT * FROM bins WHERE id = ?`;
  connection.query(sql, [binId], (err, result) => {
    if (err) {
      console.error('Ошибка получения данных:', err);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Контейнер не найден' });
    }

    res.json(result[0]); // Возвращаем найденный контейнер
  });
});

app.put('/api/bins/:id/on_route', isLoggedIn, (req, res) => {
  const binId = req.params.id;
  const { on_route } = req.body;

  const sql = `UPDATE bins SET on_route = ? WHERE id = ?`;
  connection.query(sql, [on_route, binId], (err, result) => {
    if (err) {
      console.error('Ошибка обновления данных:', err);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Контейнер не найден' });
    }
    res.json({ message: 'Местоположение обновлено' });
  });
});
////////////

app.listen(port, () => {
  console.log('Server running');
});