'use strict'

const express = require('express');
const app = express();
const wallet = require('./wallet')

const server = app.listen(process.argv[2], function () {

  const host = server.address().address;
  const port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);

});

app.get('/test', function (req, res) {
  // res.json(2);
  res.status(400);
  res.send('None shall pass');
});

app.get('/create-account', function (req, res) {
  wallet.createAccountFromMaster(res)
})

app.get('/create-account-use-channel', function (req, res) {
  wallet.createAccountFromChannel(req, res)
})