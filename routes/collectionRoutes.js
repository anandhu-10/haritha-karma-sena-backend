const express = require("express");
const router = express.Router();

const {
  addCollectionArea,
  getCollectionAreas,
} = require("../controllers/collectionController");

router.post("/collectionAreas", addCollectionArea);
router.get("/collectionAreas", getCollectionAreas);

module.exports = router;
