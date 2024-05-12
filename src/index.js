require('dotenv').config({
    path:"./env"
})
const app =require("./app.js")
const connectDb =require("./db/index.js")

connectDb()
.then(res=>{
    app.listen(process.env.PORT||8080,()=>{
        console.log("Server Running On Port",process.env.PORT)
    })
})