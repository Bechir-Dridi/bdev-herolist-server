const express = require("express")
const router = express.Router()
const { getDescription, delDesc } = require("../controllers/descriptionController.js");
const { requireAuth } = require("../middleware/requireAuth.js");


//Middleware:
router.use(requireAuth)


//GET a hero description: 
router.get("/:id", getDescription)


module.exports = router