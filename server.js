const express = require("express")
require("dotenv").config()
const cors = require("cors")
//const multer = require("multer");

//express app
const app = express()

// ---- middleware ----:
//get the path and method:
app.use((req, res, next) => {
    console.log(`path: ${req.path}, method: ${req.method}`)
    next()
})

// Middleware to enable CORS:
app.use(cors(
    {
        origin: [
            //"http://localhost:3000",
            "https://bdev-herolist.vercel.app"], credentials: true,
    } //server accepts requests from static site
))

// // Middleware to enable multipart:
// const upload = multer();
// app.use(upload.any()); // Handle multipart form data

// access req data:
app.use(express.json())//body parsing middleware for body
app.use(express.urlencoded({ extended: true }));//body parsing middleware for formUrlEncoded
//-----------------------

//---- Routes ----:
app.get("/test", (req, res) => {
    res.json({ mssg: "welcome to the app" })
})

const descriptionsRoutes = require("./routes/descriptions.js")
app.use("/api/descriptions", descriptionsRoutes)

const heroesRoutes = require("./routes/heroes.js")
app.use("/api/heroes", heroesRoutes)



//listen for requests:
app.listen(process.env.PORT, () => {
    console.log(`Listening on PORT ${process.env.PORT}`)
})