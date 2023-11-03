const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port= process.env.PORT || 5000
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')


// middleware
app.use(cors({
  origin: [
      'http://localhost:5173',
      // 'https://cars-doctor-6c129.web.app',
      // 'https://cars-doctor-6c129.firebaseapp.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// create middleware for cookise
const logger = (req, res, next) => {
  console.log('log:info', req.url, req.method); 
  next();
}

const verifytoken = (req, res, next)=> {
  const token = req?.cookies?.token;
  console.log("modelware in token", token);
  next()
}


// mongo db

const uri = `mongodb+srv://${process.env.DB_CARS_USER}:${process.env.DB_CARS_PASS}@cluster0.clf7ui5.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
     // Get the database and collection on which to run the operation
     const database = client.db("carsdoctor");
     const servicesCollection = database.collection("services");
     const checkoutCollection = database.collection("checkout");
    //  auth related api
    app.post("/jwt", async(req, res)=> {
      const user = req.body;
      console.log("use for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:"48hr"});
      res.cookie("cars-doctor-token", token, {
        httpOnly:true,
        secure: true,
        sameSite: "none"
      })
        .send({success:true})
    })
    // clear cookie
    app.post("/logout", async(req, res)=> {
      const user = req.body;
      console.log("loging out", user);
      res.clearCookie("cars-doctor-token", {maxAge: 0})
      .send({success:true})
    })
    //  services start
    //  get function for services
    app.get("/services", async(req, res)=> {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })
    // get function for services Id
    app.get("/services/:id", async(req, res)=> {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const options = {
        // Include only the `title` and `imdb` fields in the returned document
        projection: {  title: 1, price: 1, service_id:1, img:1 },
      };
      const result = await servicesCollection.findOne(query, options);
      res.send(result);
    })
    // services finished
    // checkout start
    // checkout get or booking
    app.get("/checkout", logger,  async(req, res)=> {
      console.log(req.query.email);
      // console.log("cok cok cok cookies", req.cookies);
      let query = {};
      if (req.query?.email) {
        query= {email: req.query.email}
      }
      const cursor = checkoutCollection.find(query);
      const result = await cursor.toArray();
      res.send(result)
    })
    // checkout post
    app.post("/checkout", async(req, res)=> {
      const checkout = req.body;
      console.log(checkout);
      const result = await checkoutCollection.insertOne(checkout);
      res.send(result);
    })
    // checkout delete
    app.delete("/checkout/:id", async(req, res)=> {
      const id = req.params.id;
      console.log(id);
      const query = {_id: new ObjectId(id)};
      const result = await checkoutCollection.deleteOne(query);
      res.send(result);
    })
    // checkout put
    app.put("/checkout/:id", async(req, res)=> {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const updateBooking = req.body;
      console.log(updateBooking);
      const updateDoc = {
        $set: {
          status: updateBooking.status
        }
      };
      const result = await checkoutCollection.updateOne(query, updateDoc);
      res.send(result)
    })
    // checkout finished
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// check running port
app.get("/",(req, res)=> {
  res.send("Doctor is running")
})
app.listen(port, ()=> {
  console.log(`server is running on port ${port}`);
})