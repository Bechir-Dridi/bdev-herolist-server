const express = require("express")
const router = express.Router()
const { createHero, delHero, delImg, updateHero, like, dislike, delDesc, isHeroFunc, isVillainFunc } = require("../controllers/heroController.js");
const { requireAuth, authRoles } = require("../middleware/requireAuth.js");
//Multer:
const multer = require('multer');
const upload = multer();


//--------------------- Middleware: ---------------
router.use(requireAuth)

//-----------------------------------------------


//CREATE a hero: 
router.post('/', upload.single('img'), authRoles(['ADMIN']), createHero);

//DELETE a hero: 
router.delete("/:id", authRoles(["ADMIN"]), delHero)
//DELETE an img: 
//router.delete("/:id/images/:img", authRoles(["ADMIN"]), delImg)
//DELETE a desc: 
//router.delete("/:id/descriptions/:desc", authRoles(["ADMIN"]), delDesc)

//UPDATE a hero: 
router.put("/:id", upload.single('img'), authRoles(["ADMIN"]), updateHero)
//LIKE a hero: 
router.put("/:id/like", authRoles(["ADMIN", "USER"]), like)
//DISLIKE a hero: 
router.put("/:id/dislike", authRoles(["ADMIN", "USER"]), dislike)
//DISLIKE a hero: 
router.put("/:id/hero", authRoles(["ADMIN", "USER"]), isHeroFunc)
//DISLIKE a hero: 
router.put("/:id/villain", authRoles(["ADMIN", "USER"]), isVillainFunc)

//GET a hero: 
//router.get("/:id", )


module.exports = router