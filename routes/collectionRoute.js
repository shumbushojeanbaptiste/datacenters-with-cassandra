const express = require("express");
const router = express.Router();
const { createCollection, getCollections } = require("../controllers/collectionController");

router.post("/collect", createCollection);
router.get("/collect", getCollections);

module.exports = router;
