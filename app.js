const express = require('express');
const app = express();
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const session = require('express-session');
const winston = require('winston');
const nodemailer = require('nodemailer');

const secretKey = crypto.randomBytes(64).toString('hex');

const hostname = '0.0.0.0';
const port = 3000;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dresgeorg539@gmail.com',
    pass: 'Primera12'
  }
});

app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false
}));

const isLoggedIn = (req, res, next) => {
  if (!req.session.username) {
    return res.redirect('/');
  }
  next();
};

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

const dbConfig1 = {
  host: '79.174.88.253',
  user: 'Daniil',
  port: '15552',
  password: 'Primera12.',
  database: 'trash_bins',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool1 = mysql.createPool(dbConfig1);

async function keepAlive() {
  try {
    const connection = await pool1.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    console.log('Keep-alive запрос выполнен успешно');
  } catch (error) {
    console.error('Ошибка keep-alive запроса:', error.message);
  }
}

setInterval(keepAlive, 60000);


pool1.on('connection', connection => {
    console.log(`Новое подключение: threadId ${connection.threadId}`);
    connection.on('error', (err) => {
        console.error('Pool1 connection error:', err.message);
    });
});

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/api/bins', isLoggedIn, async (req, res) => {
  try {
    const connection = await pool1.getConnection();
    const [results] = await connection.query('SELECT * FROM bins');
    connection.release();
    res.json(results);
  } catch (error) {
    console.error('Ошибка получения данных из базы данных:', error.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const connection = await pool1.getConnection();
    const [results] = await connection.execute('SELECT password FROM users WHERE username = ?', [username]);
    if (!results.length || password !== results[0].password) {
      logger.error(`Неудачная попытка входа: ${req.ip} - ${username}`);
      res.status(401).json({ error: 'Неверный логин или пароль' });
    } else {
      req.session.username = username;
      res.json({ message: 'Успешный вход' });
    }
    connection.release();
  } catch (error) {
      console.error('Login Error: ', error.message)
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/map', isLoggedIn, (req, res) => {
  res.sendFile(__dirname + '/map.html');
});

app.get('/isLoggedIn', (req, res) => {
  if (req.session.username) {
    res.status(200).send();
  } else {
    res.status(401).send();
  }
});

app.post('/api/bins', isLoggedIn, async (req, res) => {
  const { latitude, longitude, serialNumber, fullness, chargeLevel } = req.body;
  try {
    const connection = await pool1.getConnection();
    const [checkResults] = await connection.query('SELECT 1 FROM bins WHERE serial_number = ?', [serialNumber]);
    if (checkResults.length > 0) {
      return res.status(400).json({ error: 'Датчик с таким серийным номером уже существует' });
    }
    const [insertResults] = await connection.execute(
      'INSERT INTO bins (latitude, longitude, serial_number, fullness, chargeLevel) VALUES (?, ?, ?, ?, ?)',
      [latitude, longitude, serialNumber, fullness, chargeLevel]
    );
    connection.release();
    res.status(201).json({ message: 'Данные успешно добавлены', id: insertResults.insertId });
  } catch (error) {
    console.error('Ошибка добавления данных', error.message)
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.get('/api/bins/:id', isLoggedIn, async (req, res) => {
  const binId = req.params.id;
  try {
    const connection = await pool1.getConnection();
    const [result] = await connection.execute('SELECT * FROM bins WHERE id = ?', [binId]);
    connection.release();
    if (!result.length) {
      return res.status(404).json({ message: 'Контейнер не найден' });
    }
    res.json(result[0]);
  } catch (error) {
    console.error('Ошибка получения данных:', error.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.put('/api/bins/:id', isLoggedIn, async (req, res) => {
  const binId = req.params.id;
  const { latitude, longitude } = req.body;
  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Неверные данные' });
  }
  try {
    const connection = await pool1.getConnection();
    const [result] = await connection.execute(
      'UPDATE bins SET latitude = ?, longitude = ? WHERE id = ?',
      [latitude, longitude, binId]
    );
    connection.release();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Контейнер не найден' });
    }
    res.json({ message: 'Местоположение обновлено' });
  } catch (error) {
    console.error('Ошибка обновления данных:', error.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});



app.get('/api/bins/:id/on_route', isLoggedIn, async (req, res) => {
    const binId = req.params.id;
    try {
        const connection = await pool1.getConnection();
        const [rows] = await connection.execute('SELECT on_route FROM bins WHERE id = ?', [binId]);
        connection.release();

        if (!rows.length) {
            return res.status(404).json({ message: 'Контейнер не найден' });
        }
        res.json({ on_route: rows[0].on_route });
    } catch (error) {
        console.error('Ошибка при получении статуса маршрута:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});


app.put('/api/bins/:id/on_route', isLoggedIn, async (req, res) => {
    const binId = req.params.id;
    const { on_route } = req.body;

    try {
        const connection = await pool1.getConnection();

        const [result] = await connection.execute(
            'UPDATE bins SET on_route = ? WHERE id = ?',
            [on_route, binId]
        );
        connection.release();


        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Контейнер не найден' });
        }
        res.json({ message: 'Статус маршрута обновлен' });
    } catch (error) {
        console.error('Ошибка при обновлении статуса маршрута:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.listen(port, hostname, () => {
  console.log('Server running');
});