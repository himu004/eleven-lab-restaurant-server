const express = require("express");
const cors = require("cors");
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());


app.listen(port, () => {
  console.log(`Eleven Lab Restaurant Backend listening on port ${port}`);
});