
const mongoose = require("mongoose");
const {DB_NAME}= require("../constant.js")
const connectDb=async()=>{
    try {
        console.log("process.env.MONGODB_URI",process.env.MONGODB_URI,DB_NAME)
       const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log("connectionInstance",connectionInstance.connection.host)
    } catch (error) {
        console.log("Database Connection Error",error)
        process.exit(1)
    }
}

module.exports=connectDb