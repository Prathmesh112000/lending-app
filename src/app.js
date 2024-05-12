const cookieParser = require("cookie-parser");
const express=require("express")
const cors=require("cors")
const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN
}));
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())

// Routes Initiated
const userRouter = require("./routes/user.routes.js")

app.use("/api/v1/users",userRouter)

module.exports=app