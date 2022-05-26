const userModel = require("../model/userModel");
const validator = require("../Validator/validators");
const bcrypt = require("bcrypt")
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const aws = require("aws-sdk");


aws.config.update({
    accessKeyId: "AKIAY3L35MCRUJ6WPO6J",
    secretAccessKey: "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",
    region: "ap-south-1"
  })

const uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {

        const s3 = new aws.S3({ apiVersion: "2006-03-01" })

        const uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "Group 26/" + new Date() + file.originalname,
            Body: file.buffer,
        }

        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            return resolve(data.Location)
        })
    })
}

//..................................................................
const createUser = async function (req, res) {
    try {
        let files = req.files;

        let requestBody = req.body;

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({
                status: false,
                message: "Invalid request parameter, please provide user Detaills",
            });
        }
                // !Validator.isvalidrequestbody

        //Extract body
        let { fname, lname, email, phone, password, address } =
            requestBody;

        //-------Validation Starts-----------

        if (!validator.isValid(fname)) {
            return res.status(400).send({
                status: false,
                message: "Invalid request parameter, please provide fname",
            });
        }
        if (!validator.isValid(lname)) {
            return res.status(400).send({
                status: false,
                message: "Invalid request parameter, please provide lname",
            });
        }

        if (!validator.isValid(email)) {
            return res.status(400).send({
                status: false,
                message: "Invalid request parameter, please provide email",
            });
        }

        //validating email using RegEx.
        email = email.trim();
        if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
            return res.status(400).send({
                status: false,
                message: `Email should be a valid email address`,
            });
        }

        let isEmailAlredyPresent = await userModel.findOne({ email: email });
        if (isEmailAlredyPresent) {
            return res
                .status(400)
                .send({ status: false, message: "Email Already Present" });
        }
        phone = phone.trim();
        if (!validator.isValid(phone)) {
            return res.status(400).send({
                status: false,
                message: "Invalid request parameter, please provide Phone",
            });
        }
        //validating phone number of 10 digits only.
        if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone)) {
            return res
                .status(400)
                .send({ status: false, message: "Mobile should be a valid number" });
        }
        let isPhoneAlredyPresent = await userModel.findOne({ phone: phone });
        if (isPhoneAlredyPresent) {
            return res
                .status(400)
                .send({ status: false, message: "Phone Number Already Present "});
        }
        if (!validator.isValid(password)) {
            return res.status(400).send({
                status: false,
                message: "Invalid request parameter, please provide password",
            });
        }
        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({
                status: false,
                message: "Password should be Valid min 8 and max 15 ",
            });
        }

        if (!validator.isValid(address)) {
            return res
                .status(400)
                .send({ status: false, message: "Address is required" });
        }

        if(requestBody.address){
            const address=JSON.parse(requestBody.address)
            requestBody.address=address;

        if (address.shipping) {
            if (address.shipping.street) {
                if (!validator.isValidRequestBody(address.shipping.street)) {
                    return res.status(400).send({
                        status: false,
                        message: "Invalid request parameter, please provide street",
                    });
                
                }
            }
            if (address.shipping.city) {
                if (!validator.isValidRequestBody(address.shipping.city)) {
                    return res.status(400).send({
                        status: false,
                        message: "Invalid request parameter, please provide city",
                    });
                } 
                }
          
            if (address.shipping.pincode) {
                if (!validator.isValidRequestBody(address.shipping.pincode)) {
                    return res.status(400).send({
                        status: false,
                        message: "Invalid request parameter, please provide pincode",
                    });
                } 
                }
            }
                  if (address.shipping) {
                    if (address.shipping.pincode) {
                      if (!validator.isValidPincode.test(address.shipping.pincode)) {
                        return res
                          .status(400)
                          .send({ status: false, message: "enter valid pincode" });
                      }
                    }
                  }

        if (address.billing) {
            if (address.billing.street) {
                if (!validator.isValidRequestBody(address.billing.street)) {
                    return res.status(400).send({
                        status: false,
                        message: "Invalid request parameter, please provide street",
                    });
                }
            } 
            }
            if (address.billing.city) {
                if (!validator.isValidRequestBody(address.billing.city)) {
                    return res.status(400).send({
                        status: false,
                        message: "Invalid request parameter, please provide city",
                    });
                } }
                
            
            if (address.billing.pincode) {
                if (!validator.isValidRequestBody(address.billing.pincode)) {
                    return res.status(400).send({
                        status: false,
                        message: "Invalid request parameter, please provide pincode",
                    });
                } 
            }
        }
        
        const profileImage = await uploadFile(files[0]);
        password = await bcrypt.hash(password, saltRounds);
        console.log(profileImage)
       // const finalBody = { fname, lname, email, phone, password, address, profileImage }
         
        let obj = requestBody
        obj.profileImage = profileImage
        obj.password = password
        let   user = await userModel.create(obj)
        res.status(201).send({status:true , message : "user Created successfully" , data: user})
        }catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
};



const login = async (req, res) => {

    try {
        const requestBody = req.body;

        // Extract params

        const { email, password } = requestBody;

        // Validation starts

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, msg: "Please enter login credentials" });
        }

        if (!validator.isValid(email)) {
            res.status(400).send({ status: false, msg: "Enter an email" });
            return;
        }
        //email = email.trim()
        if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
            return res.status(400).send({ status: false, message: `Email should be a valid email address` });
        }

        if (!validator.isValid(password)) {
            res.status(400).send({ status: false, msg: "enter a password" });
            return;
        }

        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, message: "Password should be Valid min 8 and max 15 " })
        }
        // Validation ends
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(401).send({ status: false, message: `Invalid login credentials` });
        }

        let hashedPassword = user.password

        const encryptedPassword = await bcrypt.compare(password, hashedPassword)

        if (!encryptedPassword) return res.status(401).send({ status: false, message: `Invalid login credentials` });

        const token = jwt.sign({
            userId: user._id,
           
        },"productmanagment-26",
        { expiresIn: "24hr" })

        res.header("BearerToken", token);

        res.status(200).send({ status: true, msg: "successful login", data: { userId: user._id, token: token , } });
    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, msg: error.message });
    }
}


const getUserProfile = async (req, res) => {

    try {
        const userId = req.params.userId
        // const userIdFromToken = req.userId



        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." })
        }


        const findUserProfile = await userModel.findOne({ _id: userId })
        if (!findUserProfile) {
            return res.status(400).send({
                status: false, message: `User doesn't exists by ${userId}`
            })
        }
      
    
        return res.status(200).send({ status: true, message: "Profile found successfully.", data: findUserProfile })
    } catch (err) {
        return res.status(500).send({
            status: false,
            message: "Error is: " + err.message
        })
    }
}

const updateUser = async function (req, res) {
    try {
      let data = req.body;
      const userId = req.params.userId

      const findUserProfile = await userModel.findOne({ _id: userId })
      if (!findUserProfile) {
          return res.status(400).send({
              status: false, message: `User doesn't exists by ${userId}`
          })
      }
      const userIdFromToken = req.userId
      if (userIdFromToken != userId) {
            return res.status(403).send({
                status: false,
                message: "Unauthorized access."
            })
        }

      if (!validator.isValidRequestBody(data)) {
        return res
          .status(400)
          .send({ status: false, message: "Please provide input" });
      }
  
      const files = req.files;
  
      if (!validator.isValid(files)) {
        return res
        .status(400)
        .send({ status: false, message: "Please provide file" });
      }
        const profilePicture = await uploadFile(files[0]);
  
        data.profileImage = profilePicture;

     

      const { fname, lname, email, phone, password } = data;
      if (email) {
        const isEmailAlreadyExist = await userModel.findOne({ email: email });
  
        if (isEmailAlreadyExist) {
          return res
            .status(400)
            .send({ status: false, message: `${email} is already exist` });
        }
      }
  
      if (phone) {
        const isPhoneAlreadyExist = await userModel.findOne({ phone: phone });
  
        if (isPhoneAlreadyExist) {
          return res
            .status(400)
            .send({ status: false, message: `${phone} is already exist` });
        }
      }
  
      if (!validator.isValid(password)) {
        res.status(400).send({ status: false, msg: "enter a password" });
        return;
    }

    if (!(password.length >= 8 && password.length <= 15)) {
        return res.status(400).send({ status: false, message: "Password should be Valid min 8 and max 15 " })
    }
      // let address = JSON.parse(JSON.stringify(data));
      if (data.address) {
        const address = JSON.parse(data.address);
        data.address = address;
        const shipping = address.shipping;
        if (shipping) {
          if (shipping.pincode) {
            if (!validator.isValidPincode.test(shipping.pincode)) {
              return res
                .status(400)
                .send({ status: false, message: "enter valid pincode" });
            }
          }
        }

        const billing = address.billing;
        if (billing) {
          if (billing.pincode) {
            if (!validator.isValidPincode.test(shipping.pincode)) {
              return res
                .status(400)
                .send({ status: false, message: "enter valid pincode" });
            }
          }
        }
      }

      const newData = { fname, lname, email, phone, password };

      const updatedUser = await userModel.findOneAndUpdate(
        { _id: req.userId },
        newData,
        { new: true }
      );

      if (data.address) {
        const shipping = data.address.shipping;
        if (shipping) {
          if (shipping.street) {
            updatedUser.address.shipping.street = shipping.street;
          } if(!shipping.street){   return res .status(400).send({ status: false, message: "enter valid shipping street" }) }
          if (shipping.city) {
            updatedUser.address.shipping.city = shipping.city;
            if(!shipping.city){   return res .status(400).send({ status: false, message: "enter valid shipping city" }) }
          }
          if (shipping.pincode) {
            updatedUser.address.shipping.pincode = shipping.pincode;
            if(!shipping.pincode){   return res .status(400).send({ status: false, message: "enter valid shipping pincode" }) }
          }
        }
  
        const billing = data.address.billing;
        if (billing) {
          if (billing.street) {
            updatedUser.address.billing.street = billing.street;
            if(!billing.street){   return res .status(400).send({ status: false, message: "enter valid billing street" }) }
    }
          if (billing.city) {
            updatedUser.address.billing.city = billing.city;
            if(!billing.city){   return res .status(400).send({ status: false, message: "enter valid billing city" }) }

          }
          if (billing.pincode) {
            updatedUser.address.billing.pincode = billing.pincode;
            if(!billing.pincode){   return res .status(400).send({ status: false, message: "enter valid billing pincode" }) }

          }
        }
      }
  
      updatedUser.save();

      return res.status(200).send({
        status: true,
        message: "User profile updated",
        data: updatedUser,
      });
    } 
    catch (err) {
      return res.status(500).send({ status: false, message: err.message });
    }
  };


module.exports ={createUser,login,getUserProfile,updateUser}