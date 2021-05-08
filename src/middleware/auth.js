const jwt = require('jsonwebtoken')
const User = require('../db/models/user')

const auth = async ( req , res , next )=>{
   
    try {

        const token = req.header('Authorization').replace('Bearer ' ,'')
        const verifyToken = jwt.verify( token , process.env.TOKEN_PASSWORD )


        const user = await User.findOne({ _id: verifyToken._id , 'tokens.token': token })

        if ( !user ) {
            throw new Error()
        }

        req.token = token
        req.user = user 
        next()

    } catch (error) {

        res.status(401).send({ error:'Please authenticate!' })
        
    }
}



module.exports = auth