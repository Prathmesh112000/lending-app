
const {Schema} =require("mongoose")
const mongoose =require("mongoose")
const jwt =require("jsonwebtoken")
const bcrypt=require("bcrypt")
const userSchema = new Schema({
    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
        trim:true
    },
    fullname:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    avtar:{
        type:String,
        required:true
    },
    coverImage:{
        type:String
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true, "Password is required"]
    },
    refreshToken:{
        type:String
    }

},{
    timestamps:true
})
userSchema.pre("save",async function (next){
    if(!this.isModified("password")) return next()
    this.password=await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect=async function(password){
    return  bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken= function(){
    console.log("process.env.ACCESS_TOKEN_EXPIRY",process.env.ACCESS_TOKEN_EXPIRY)
    console.log("process.env.ACCESS_TOKEN_SECRET",process.env.ACCESS_TOKEN_SECRET)

    const token=jwt.sign({
        _id:this._id,
        email:this.email
      },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
      })
      console.log("token",token)
 return token
}
userSchema.methods.generateRefreshToken= function(){
    return jwt.sign({
        _id:this._id,
        email:this.email
      },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
      })
}
const user=mongoose.model("User",userSchema)
module.exports=user