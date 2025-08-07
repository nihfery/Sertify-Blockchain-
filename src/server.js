const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // default XAMPP
  database: 'certified_blockchain'
});

db.connect((err) => {
  if (err) throw err;
  console.log('MySQL connected');
});

app.post('/save', (req, res) => {
  const { hash, author, timestamp, txHash } = req.body;
  const sql = 'INSERT INTO certificates (hash, author, timestamp, txHash) VALUES (?, ?, ?, ?)';
  db.query(sql, [hash, author, timestamp, txHash], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ status: 'error', error: err });
    }
    res.send({ status: 'success', data: result });
  });
});

app.get('/verify-by-tx/:txHash', (req, res) => {
  const { txHash } = req.params;
  const sql = 'SELECT * FROM certificates WHERE txHash = ?';
  db.query(sql, [txHash], (err, rows) => {
    if (err) return res.status(500).send(err);
    if (rows.length === 0) return res.status(404).send({ message: "Data tidak ditemukan" });
    res.send(rows[0]);
  });
});


app.get('/certificates', (req, res) => {
  db.query('SELECT * FROM certificates', (err, rows) => {
    if (err) return res.status(500).send(err);
    res.send(rows);
  });
});

app.listen(3000, () => console.log('Backend (MySQL) running on port 3000'));
