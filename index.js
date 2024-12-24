
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");


const port = process.env.PORT || 3000;
const app = express();


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.30scn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    console.log('Connected to MONGODB successfully');

    // MY DATABASE
    const db = client.db("eleven-lab-restaurant");
    const foodsCollection = db.collection("foods");

    // Add Foods Api
    app.post('/add-food', async (req, res) => {
      const food = req.body;
      const result = await foodsCollection.insertOne(food);
      res.send(result);
    });

    // Get All Foods Api
    app.get('/all-foods', async (req, res) => {
      const result = await foodsCollection.find({}).toArray();
      res.send(result);
    });

    // Get Single Food Api
    app.get('/food/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await foodsCollection.findOne(query);
        res.send(result);
      });
  
      // Get Top foods by highest purchase count
      app.get('/top-foods', async (req, res) => {
        const query = { purchase_count: { $gt: 0 } };
        const result = await foodsCollection.find(query).sort({ purchaseCount: -1 }).limit(6).toArray();
        res.send(result);
      });
    



  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send("Eleven Lab Restaurant Server is running....");
  });
  
  app.listen(port, () => console.log(`Server running on port ${port}`));