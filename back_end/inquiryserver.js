const express = require('express');
const { MongoClient, ObjectID } = require('mongodb');
const cors = require('cors');

const redis = require('redis');
const redisClient = redis.createClient({ host: process.env.REDIS_HOST || 'localhost' });

const auth = 'dfw:dfw123';
const dbName = '667Final';
const url = `mongodb+srv://${auth}@cluster0.gefuv.mongodb.net/?retryWrites=true&w=majority`;
const inquiryCollectionName = 'Inquiries';

const dbClient = new MongoClient(url);

const app = express();
app.use(express.json());
app.use(cors());

dbClient.connect((error) => {
  if (error) {
    console.log('error! can\'t connect to DB instance');
    console.log(error);
    process.exit(1);
  }

  console.log("Connected!");

  const db = dbClient.db(dbName);
  const inquiryCollection = db.collection(inquiryCollectionName);


  app.get('/api/inquiryserver/inquiries', (req, res) => {
    inquiryCollection.find({})
      .toArray()
      .then((docs) => {
        res.send({ inquiries: docs })
      })
      .catch((e) => {
        console.log("error: ", e);
        res.send('FAILED');
      });
  });

  app.post('/api/inquiryserver/inquiry', (req, res) => {
    const newInquiry = req.body.inquiry;
    newInquiry.timestamp = new Date();
    inquiryCollection.insertOne(newInquiry, (err, dbRes) => {
      if (err) {
        console.log('error! can\'t insert newInquiry');
        console.log('newInquiry: ', newInquiry);
        console.log(err);
        res.status(500).send({ 'message': 'error: cant insert inquiry' });
      }

      console.log('inserted newInquiry: ', newInquiry);
      res.send({ 'insertedId': dbRes.insertedId });
    });
  });

  app.delete('/api/inquiryserver/:inquiry_id', (req, res) => {
    const del_id = req.params.inquiry_id;
    let query = { "_id": ObjectID(del_id) };
    inquiryCollection.deleteOne(query, function (err, dbRes) {
      if (err) {
        console.log('error cannot delete inquiry');
        console.log('inquiryID: ', del_id);
        console.log(err);
        res.status(500).send({ 'message': 'error: cannot delete inquiry' });
      }
      console.log(dbRes);
    });
  });

  app.post('/api/inquiryserver/editinquiry', (req, res) => {
    const newInquiry = req.body.inquiry;
    inquiryCollection.updateOne({ "_id": ObjectID(req.body.inquiry.inquiry_id) }, newInquiry, (err, dbRes) => {
      if (err) {
        console.log('error! can\'t insert newInquiry');
        console.log('newInquiry: ', newInquiry);
        console.log(err);
        res.status(500).send({ 'message': 'error: cant insert inquiry' });
      }

      console.log('inserted newInquiry: ', newInquiry);
      res.send({ 'insertedId': dbRes.insertedId });
    });
  });

  //  for pushing a new message into the message array on mongoDB
  app.post('/api/inquiryserver/reply', (req, res) => {
    const data = req.body.body;
    const chat_id = data._id;
    let query = { "_id": ObjectID(chat_id) };
    const formattedMessage = `${data.userName} : ${data.message}`;
    inquiryCollection.updateOne(query, { $push: { message: formattedMessage } }, (err, dbRes) => {
      if (err) {
        console.log('Error: could not send the message');
        console.log('inquiryID: ', chat_id);
        console.log(err);
        res.status(500).send({ 'message': 'Error: could not send the message' });
      } else {
        console.log('Inside /api/inquiryserver/reply');
        redisClient.publish('wsMessage', JSON.stringify({ 'message': 'chatMessageSent', '_id': chat_id, 'reply': formattedMessage }));
      }
      console.log(dbRes.result);
    });
  });

  app.get('/api/inquiryserver/sentInquiries/:current_user', (req, res) => {
    const current_user = req.params.current_user;
    inquiryCollection.find({buyerId: current_user})
      .toArray()
      .then((docs) => {
        res.send({ sentInquiries: docs })
      })
      .catch((e) => {
        console.log("error: ", e);
        res.send('FAILED');
      });
  });

  app.get('/api/inquiryserver/recievedInquiries/:current_user', (req, res) => {
    const current_user = req.params.current_user;
    inquiryCollection.find({sellerId: current_user})
      .toArray()
      .then((docs) => {
        res.send({ recievedInquiries: docs })
      })
      .catch((e) => {
        console.log("error: ", e);
        res.send('FAILED');
      });
  });

  app.listen(5050, () => console.log('App listening on port 5050'));
});