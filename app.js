const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const collectionRoute = require("./routes/collectionRoute");
app.use("/api", collectionRoute);

app.listen(3001, () => {
  console.log("Backend running on port 3001");
});
