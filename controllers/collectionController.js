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
    const data = await CollectionArea.find()
      .populate("userId", "name profile")
      .sort({ _id: -1 });
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch collection areas" });
  }
};

// DELETE - remove a collection area
exports.deleteCollectionArea = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CollectionArea.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Collection area not found" });
    }

    res.status(200).json({ message: "Collection area removed successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to remove collection area" });
  }
};
