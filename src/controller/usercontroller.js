const aws = require("aws-sdk");
const userModel = require("../model/userModel");
const validator = require("../Validator/validators");
const bcrypt = require("bcrypt")
const saltRounds = 10;
// const jwt = require("jsonwebtoken");

//....................AWS S3 PART.............................

aws.config.update({
    accessKeyId: "AKIAY3L35MCRUJ6WPO6J",
    secretAccessKey: "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",
    region: "ap-south-1",
});

const uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        const s3 = new aws.S3({ apiVersion: "2006-03-01" });

        const uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket", //A bucket is a container for objects to store an object in Amazon S3.
            Key: "Group26/" + new Date() + file.originalname,
            Body: file.buffer,
        };

        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ error: err });
            }
            return resolve(data.Location);
        });
    });
};
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
        //Extract body
        let { fname, lname, email, phone, password, address, profileImage } =
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

        if (address.shipping) {
            if (address.shipping.street) {
                if (!validator.isValidRequestBody(address.shipping.street)) {
                    return res.status(400).send({
                        status: false,
                        message: "Invalid request parameter, please provide street",
                    });
                } else {
                    return res.status(400).send({
                        status: false,
                        message:
                            " Invalid request parameters. Shipping street cannot be empty",
                    });
                }
            }
            if (address.shipping.city) {
                if (!validator.isValidRequestBody(address.shipping.city)) {
                    return res.status(400).send({
                        status: false,
                        message: "Invalid request parameter, please provide city",
                    });
                } else {
                    return res.status(400).send({
                        status: false,
                        message:
                            " Invalid request parameters. Shipping city cannot be empty",
                    });
                }
            }
            if (address.shipping.pincode) {
                if (!validator.isValidRequestBody(address.shipping.pincode)) {
                    return res.status(400).send({
                        status: false,
                        message: "Invalid request parameter, please provide pincode",
                    });
                } else {
                    return res.status(400).send({
                        status: false,
                        message:
                            " Invalid request parameters. Shipping pincode cannot be empty",
                    });
                }
            } else
                return res.status(400).send({
                    status: false,
                    message:
                        " Invalid request parameters. Shipping address cannot be empty",
                });
        }
        if (address.billing) {
            if (address.billing.street) {
                if (!validator.isValidRequestBody(address.billing.street)) {
                    return res.status(400).send({
                        status: false,
                        message: "Invalid request parameter, please provide street",
                    });
                }
            } else {
                return res.status(400).send({
                    status: false,
                    message:
                        " Invalid request parameters. billing street cannot be empty",
                });
            }
            if (address.billing.city) {
                if (!validator.isValidRequestBody(address.billing.city)) {
                    return res.status(400).send({
                        status: false,
                        message: "Invalid request parameter, please provide city",
                    });
                } else {
                    return res.status(400).send({
                        status: false,
                        message:
                            " Invalid request parameters. billing city cannot be empty",
                    });
                }
            }
            if (address.billing.pincode) {
                if (!validator.isValidRequestBody(address.billing.pincode)) {
                    return res.status(400).send({
                        status: false,
                        message: "Invalid request parameter, please provide pincode",
                    });
                } else {
                    return res.status(400).send({
                        status: false,
                        message:
                            " Invalid request parameters. billing pincode cannot be empty",
                    });
                }
            }
        }
        profileImage = await uploadFile(files[0]);
        password = await bcrypt.hash(password, saltRounds);
           
       // const finalBody = { fname, lname, email, phone, password, address, profileImage }

        let   user = await userModel.create(requestBody)
        res.status(201).send({status:true , message : "user Created successfully" , data: user})
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
};


module.exports ={createUser}