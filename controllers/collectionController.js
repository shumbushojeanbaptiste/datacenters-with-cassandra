const client = require("../models/cassandraClient");
const { v4: uuidv4 } = require("uuid");

// Create a collection
async function createCollection(req, res) {
  const { farmer_name, station_id, weight, price } = req.body;
  const collection_id = uuidv4();
  const created_at = new Date();

  const query = `INSERT INTO collections (collection_id, farmer_name, station_id, weight, price, created_at)
                 VALUES (?, ?, ?, ?, ?, ?)`;

  try {
    await client.execute(query, [collection_id, farmer_name, station_id, weight, price, created_at], { prepare: true });
    res.json({ message: "Collection created", collection_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create collection" });
  }
}

// List all collections
async function getCollections(req, res) {
  const query = `SELECT * FROM collections`;
  try {
    const result = await client.execute(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
}

module.exports = { createCollection, getCollections };
