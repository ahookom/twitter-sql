'use strict';
var express = require('express');
var router = express.Router();
var client = require('../db/index');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    // var allTheTweets = tweetBank.list();
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: allTheTweets,
    //   showForm: true
    // });
    client.query('SELECT * FROM tweets JOIN users ON users.id=tweets.user_id', function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    var tweetsForName = client.query('SELECT * FROM tweets JOIN users ON users.id=tweets.user_id AND users.name = $1', [req.params.username], function(err, data) {
    //client.query('SELECT * FROM tweets INNER JOIN users ON users.id=tweets.user_id AND users.name = \'Tom Hanks\'', function(err, data) {

      if (err) return next(err);
    //  console.log('username', req.params.username);
    //  console.log(typeof req.params.username);
    //  console.log('data.rows', data.rows);
    res.render('index', {
      title: 'Twitter.js',
      tweets: data.rows,
      showForm: true,
      username: req.params.username
    });
  });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    client.query('SELECT * FROM tweets JOIN users ON users.id=tweets.user_id AND tweets.id = $1', [req.params.id], function(err, data) {
        if (err) return next(err);
        res.render('index', {
        title: 'Twitter.js',
        tweets: data.rows
        });
    });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
      client.query('SELECT * FROM users WHERE users.name=$1',[req.body.name], function(err,data){
        if(err) return next(err);
        console.log('user check data result is', data.rows);
        if(data.rows.length){
          // console.log('user checked out');
          // console.log('user id is ',data.rows[0].id,' req body is ',req.body);
          client.query('INSERT INTO tweets (user_id,content) VALUES ($1,$2)',[data.rows[0].id,req.body.text],function(){

          } );
        io.sockets.emit('new_tweet', {name: req.body.name, body: req.body.text });
        res.redirect('/');
        }
      });
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
