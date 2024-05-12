const {Schema} = require("mongo0se")
const mongoose =require("mongoose")
const subscriptionSchema=new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User" 
    }
},{timestamps:true})

const subscription= mongoose.model("subscription", subscriptionSchema)

module.exports=subscription