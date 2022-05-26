const jwt=require("jsonwebtoken");//(package to generate token)

const authenticate=async function(req,res,next){
    try{
        const token = req.header('Authorization', 'Bearer Token')       

        if(!token) return res.status(403).send({status:false,msg:"Token is required"})
        
        let T = token.split(' ')

        let decodedToken =jwt.verify(T[1], "productmanagment-26",{ignoreExpiration:true})//error 500//.verify(decode and validat too)=.decode(only decode)
        
        // 
        if(!decodedToken){
            return res.status(403).send({status:false,message:"Invalid authentication"})
        }
        
        let exptoken=decodedToken.exp
        if((exptoken*1000)<Date.now())return res.status(400).send({status:false,msg:"token exp"})
        req.userId=decodedToken.userId//error 400
            
            next()
    }
    
catch(err){
    return res.status(500).send({msg:err.message})
}
}

module.exports ={authenticate}