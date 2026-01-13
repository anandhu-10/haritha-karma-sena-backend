const CollectionArea = require("../models/collectionArea");

// POST - add new collection area
exports.addCollectionArea = async (req, res) => {
  try {
    const data = await CollectionArea.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add collection area" });
  }
};

// GET - fetch all collection areas
exports.getCollectionAreas = async (req, res) => {
  try {
    const data = await CollectionArea.find().sort({ _id: -1 });
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch collection areas" });
  }
};
