const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
const ObjectID = require('mongodb').ObjectId;
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config()

const port = 5000


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cyf7w.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const serviceCollection = client.db("chitroGolpo").collection("service");
  const orderCollection = client.db("chitroGolpo").collection("orders");
  const reviewCollection = client.db("chitroGolpo").collection("reviews");
  const adminCollection = client.db("chitroGolpo").collection("admin");


  // Add data to database 

  app.post('/addService', (req, res) => {
    const file = req.files.image;
    const name = req.body.name;
    const price = req.body.price;
    const desc = req.body.desc;
    const filePath = `${__dirname}/services/${file.name}`;
    // console.log(file);
    file.mv(filePath, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send({ msg: "Failed to upload image" });
      }
      const newImage = fs.readFileSync(filePath);
      const convertImg = newImage.toString("base64");
 
      const image = {
        contentType: req.files.image.mimetype,
        size: req.files.image.size,
        img: Buffer.from(convertImg, "base64"),
      };
      serviceCollection
        .insertOne({ name, price, desc, image })
        .then((result) => {
          fs.remove(filePath, (error) => {
            if (error) console.log(error);
            res.send(result.insertedCount > 0);
            console.log("Service Added Successfully")
          });
        });
    });
  });


  // Add data to UI 
  app.get('/services', (req, res) => {
    serviceCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  // Catch Single Data For DAtabase
  app.get('/serviceBook/:id', (req, res) => {
    serviceCollection
      .find({ _id: ObjectID(req.params.id) })
      .toArray((err, documents) => {
        res.send(documents[0]);
      });
  });

  // Add DAta OrderCollection
  app.post('/bookOrder', (req, res) => {
    const data = req.body;
    console.log(data);
    orderCollection.insertOne({ data }).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });


  // Get Data From Server 
  app.get('/bookingList', (req, res) => {
    orderCollection.find()
      .toArray((err, items) => {
        res.send(items)
      })
  })


  // Item Add to database 

  app.post('/addReview', (req, res) => {
    const newReview = req.body;
    console.log('adding new review: ', newReview);
    reviewCollection.insertOne(newReview)
      .then(result => {
        console.log('inserted count', result.insertedCount);
        res.send(result.insertedCount > 0)
      })
  })

  // Get Data From Server 
  app.get('/reviewList', (req, res) =>{
    reviewCollection.find()
      .toArray((err, documents) => {
        res.send(documents)
      })
  })


  // Make Admin 
  app.post('/addAdmin', (req, res) => {
    const data = req.body;
    adminCollection.insertOne( data ).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  // Admin Filter 
  app.post('/isAdmin', (req, res) => {
    const email = req.body.email;
    adminCollection.find({ email:email }).toArray((error, documents) => {
      res.send(documents.length > 0);
    });
  });

});




app.get('/', (req, res) => {
  res.send('Hello!! Welcome to Chitro Golpo')
})





app.listen(process.env.PORT || port)