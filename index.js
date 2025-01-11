require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 3000;
const app = express();

// Middlewares
app.use(
  cors({
    origin: ["http://localhost:5173", "https://eleven-lab-restaurant.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized Access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.30scn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    console.log("Connected to MONGODB successfully");

    // MY DATABASE
    const db = client.db("eleven-lab-restaurant");
    const foodsCollection = db.collection("foods");
    const purchaseCollection = db.collection("purchase");

    // Generate JWT API & Auth Related API
    app.post("/jwt", async (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      console.log(token);
      res.cookie('token', token, { 
        httpOnly: true,
        secure: false, 
    });
      res.send({success: true});
      
    });

    app.post("/logout", (req, res) => {
        res.clearCookie('token',{
            httpOnly: true,
            secure: false
        }).send({success: true});
    })

    

    // Add Foods Api
    app.post("/add-food", async (req, res) => {
      const food = req.body;
      const result = await foodsCollection.insertOne(food);
      res.send(result);
    });

    // Get All Foods Api
    app.get("/all-foods", async (req, res) => {
      const result = await foodsCollection.find({}).toArray();
      res.send(result);
    });

    // Get Single Food Api
    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    // API FOR ONLY 12 FOODS
    app.get("/top-foods", async (req, res) => {
      const query = { purchase_count: { $gt: 0 } };
      const result = await foodsCollection
        .find(query)
        .sort({ purchase_count: -1 })
        .limit(12)
        .toArray();
      res.send(result);
    });

    //   Implement Search Api
    app.get("/search", async (req, res) => {
      const search = req.query.search || "";
      const query = { name: { $regex: search.toString(), $options: "i" } };
      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    });

    //   My Foods Api Filtered by Email
    app.get("/my-foods/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "addedBy.email": email };  
      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    });

    //  Update Foods Api
    app.put("/update-food/:id", async (req, res) => {
      const id = req.params.id;
      const food = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: food.name,
          price: food.price,
          category: food.category,
          image: food.imageUrl,
          description: food.description,
          quantity: food.quantity,
          origin: food.origin,
        },
      };
      const result = await foodsCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // Foood Purchase APi
    app.post("/food-purchase", async (req, res) => {
      const purchase = req.body;
      const { foodId, quantity } = purchase;
      const food = await foodsCollection.findOne({ _id: new ObjectId(foodId) });
      // Parse quantity to float
      const parsedQuantity = parseFloat(quantity);

      // Check if the food quantity is available
      if (food.quantity <= 0 || food.quantity < parsedQuantity) {
        return res.status(400).json({ message: "Insufficient food quantity" });
      }
      const result = await purchaseCollection.insertOne(purchase);

      // Food Data Increment Purchase Count
      const foodData = req.body;

      // 2. Increase the bid count in the job collection
      const filter = { _id: new ObjectId(foodData.foodId) };
      const update = {
        $inc: { purchase_count: 1 },
      };
      const updateBidCount = await foodsCollection.updateOne(filter, update);
      res.send(result);
    });

    // Get Food Purchase Api by Email
    app.get("/food-purchase/:email", async (req, res) => {
      const email = req.params.email;
      const query = { buyerEmail: email };
      const result = await purchaseCollection.find(query).toArray();
      res.send(result);
    });

    // Delete MyOrder Api
    app.delete("/my-order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await purchaseCollection.deleteOne(query);
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
