const express = require("express"); //import express
const router = express.Router(); //used express to create route handlers
const {createUser} = require("../controller/usercontroller")

//user APIs
router.post('/register', createUser)


//export router
module.exports = router;