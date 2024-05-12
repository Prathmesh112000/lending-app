const {Router} =require("express")
const {registerUser,loginUser,logoutUser,refreshAccessToken,testRoute}=require("../controller/user.controller.js")
const router=Router();
const upload=require("../middlewares/multer.middleware.js");
const { verifyJwt } = require("../middlewares/auth.middleware.js");
router.route("/register").post(
    upload.fields([
        {
            name:"avtar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ])
    ,registerUser)

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJwt,logoutUser)
router.route("/request-refresh-token").post(refreshAccessToken)
router.route("/test").get(testRoute)
module.exports=router