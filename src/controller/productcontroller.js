const productModel = require('../model/productmodel')
const validator = require('../Validator/validators')
const currencySymbol = require("currency-symbol-map")
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


const createProduct = async (req, res) => {
    try {
        const requestBody = req.body;

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid params received in request body' })
        }

        const { title, description, price, currencyId, isFreeShipping, style, availableSizes, installments } = requestBody;

        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: 'Title is required' })
        }

        const isTitleAlreadyUsed = await productModel.findOne({ title });

        if (isTitleAlreadyUsed) {
            return res.status(400).send({ status: false, message: 'Title is already used.' })
        }

        if (!validator.isValid(description)) {
            return res.status(400).send({ status: false, message: 'Description is required' })
        }

        if (!validator.isValid(price)) {
            return res.status(400).send({ status: false, message: 'Price is required' })
        }

        if (!(!isNaN(Number(price)))) {
            return res.status(400).send({ status: false, message: `Price should be a valid number` })
        }
        if (price <= 0) {
            return res.status(400).send({ status: false, message: `Price should be a valid number` })
        }

        if (!validator.isValid(currencyId)) {
            return res.status(400).send({ status: false, message: 'CurrencyId is required' })
        }

        if (!(currencyId == "INR")) {
            return res.status(400).send({ status: false, message: 'currencyId should be INR' })
        }

        if (installments) {
            if (!validator.validInstallment(installments)) {
                return res.status(400).send({ status: false, message: "installments can't be a decimal number & must be greater than equalto zero " })
            }
        }

        if (validator.isValid(isFreeShipping)) {

            if (!((isFreeShipping === "true") || (isFreeShipping === "false"))) {
                return res.status(400).send({ status: false, message: 'isFreeShipping must be a boolean value' })
            }
        }

        let productImage = req.files;
        if (!(productImage && productImage.length > 0)) {
            return res.status(400).send({ status: false, msg: "productImage is required" });
        }

        let productImageUrl = await uploadFile(productImage[0]);
        

        const newProductData = {

            title,
            description,
            price,
            currencyId,
            currencyFormat: currencySymbol(currencyId),
            isFreeShipping,
            style,
            installments,
            productImage: productImageUrl
        }

        if (!validator.isValid(availableSizes)) {
            return res.status(400).send({ status: false, message: 'available Sizes is required' })
        }

        if (availableSizes) {
            let array = availableSizes.split(",").map(x => x.trim())

            for (let i = 0; i < array.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(array[i]))) {
                    return res.status(400).send({ status: false, message: `Available Sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                }
            }

            if (Array.isArray(array)) {
                newProductData['availableSizes'] = array
            }
        }

        const saveProductDetails = await productModel.create(newProductData)
        res.status(201).send({ status: true, message: "Success", data: saveProductDetails })

    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, data: error });
    }
}



module.exports={createProduct}