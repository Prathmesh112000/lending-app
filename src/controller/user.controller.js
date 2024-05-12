const asyncHandler= require("../utils/asyncHandler.js")
const {ApiError} =require("../utils/apiError.js")
const User =require("../models/user.model.js") 
const {uploadOnCloudinary}= require("../utils/cloudinary.js")
const {ApiResponse}=require("../utils/apiResponse.js")
const jwt =require("jsonwebtoken")
const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
       await user.save({
            validateBeforeSave:false
        })
        return {
            accessToken,
            refreshToken
        }   
    } catch (error) {
        return new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}
const registerUser= asyncHandler(async(req,res) => {
    const {fullName,email,username,password}=req.body
    if([fullName,email,username,password].some(field=> field?.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }
    const existedUser=await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        console.log("user exist")
        throw new ApiError("User already exists")
    }
    const avtarLocalPath=req.files?.avtar[0]?.path
    const coverImageLocalPath=req.files?.coverImage[0]?.path
    if(!avtarLocalPath){
        throw new ApiError(400,"Avtar file is required")
    }
    const avatar= await uploadOnCloudinary(avtarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avtar file is required ")
    }

    const user=await User.create({
        fullname:fullName,
        avtar:avatar?.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName:username
    })
    const createdUser=await User.findById(
        user._id
    ).select("-password -refreshToken")

    if (!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user ")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser,"User Registerd Successfully")
    )
});

const loginUser=asyncHandler(async(req,res)=>{
   
    try {
        const {username,email,password}=req.body
        if(!username && !email ){
            return new ApiError(404,"Username or email is required")
        }
    
       const user=await User.findOne({
            $or:[{username},{email}]
        })
        console.log("user",user)
        if(!user){
            console.log("here 101")
           throw new ApiError(401,"User Does Not Exist")
        }
    
       const isPasswordvalid=  user.isPasswordCorrect(user.password)

       if(!isPasswordvalid){
        throw new ApiError(401,"Please Enter Valid Credentials")
        }
        const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
    console.log("accessToken,refreshToken",accessToken,refreshToken)
        const loggedInUser= await User.findById(user._id).select("-password -refreshToken")
    
        const options={
            httpOnly:true,
            secure:true
        }
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(200,
            {
            user:loggedInUser,
            accessToken,
            refreshToken
        },"User Logged In Successfully"))
    } catch (error) {
        throw new ApiError(500,error?.message || "Some Error Occured")
    }
})

const logoutUser=asyncHandler(async(req,res)=>{
try {
    User.findByIdAndUpdate(
     await req.user._id,
        {
            $set:{
                refreshToken:undefined
            },
        }, {
            new:true
        }
    )

    const options ={
        httpOnly:true,
        secure:true
    }

    return res.status(200).clearCookie("accessToken").clearCookie("refreshToken").json(new ApiResponse(200,{},"User Logged Out Successfully"))
} catch (error) {
    return new ApiError(500,"Some Error Occured")
}
})
const testRoute=asyncHandler(async(req,res)=>{
    res.end("This is test route")
})
const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.body.refreshToken || req.headers.refreshToken || req.cookies.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"unautorized request")
    }
    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        console.log("decodedToken",decodedToken)
        const user=await User.findOne({
            _id:decodedToken._id
        })
        if(!user){
            throw new ApiError(401,"invalid refresh token")
        }
        if(user.refreshAccessToken !== incomingRefreshToken){
            throw new ApiError(401,"invalid refresh token 2")
        }
    
        const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
        const options={
            httpOnly:true,
            secure:true
        }
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(200,
            {
            accessToken,
            refreshToken
        },"Access Token Created Successfully"))
    } catch (error) {
        throw new ApiError(401,error?.message || "Something Went Wrong")
    }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user= await User.findById(req.user?._id)
    const isPassowordCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPassowordCorrect){
        throw new ApiError(400,"Invalid Old Password")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(new ApiResponse(200,{},"Password Updated Successfully"))
})
const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"Current user fetched successfully")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{
            fullName,
            email
        }},
        {new: true}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avtar file is missing")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user= await User.findByIdAndUpdate(
        req.user._id,
        {
        $set:{avtar:avatar.url}
        },{
            new:true
        }).select("-password")

        return res.status(200).json(new ApiResponse(200,user,"User Avtar Updated Successfully"))
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"cover Image file is missing")
    }

    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user= await User.findByIdAndUpdate(
        req.user._id,
        {
        $set:{coverImage:coverImage.url}
        },{
            new:true
        }).select("-password")

        return res.status(200).json(new ApiResponse(200,user,"Cover Image Updated Successfully"))
})
module.exports={
    testRoute,
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    updateAccountDetails
}