const express = require("express"); //import express
const router = express.Router(); //used express to create route handlers
const {createUser,login,getUserProfile,updateUser} = require("../controller/usercontroller")
const {createProduct,filterProduct,productById,deleteProductbyid}=require("../controller/productcontroller")
const {authenticate}=require("../middleware/middleware")

//user APIs
router.post('/register', createUser)
router.post('/login', login)
router.get('/user/:userId/profile',authenticate, getUserProfile)
router.put("/user/:userId/profile", authenticate,updateUser);
//product APIs
router.post("/products", createProduct)
router.get("/products", filterProduct)
router.get("/products/:productId",productById)
router.delete("/products/:productId",deleteProductbyid)



//----------------if api is invalid OR wrong URL-------------------------
router.all("/**", function (req, res) {
    res
      .status(404)
      .send({ status: false, msg: "The api you request is not available" });
  });


//export router
module.exports = router;