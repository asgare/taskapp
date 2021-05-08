require('../db/mongoose')
const User = require('../db/models/user')
const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const {sendWelcomeEmail , sendLoginEmail } = require('../emails/account')


// Method: POST 
// Action: Create A New User
router.post('/users' , async ( req , res ) =>{

    const user = new User( req.body )

    try {

       await user.save()
       const token = await user.generateAuthToken()
       const email = await sendWelcomeEmail( user.email , user.name)
       res.status( 201 ).send({ user , token , email })

    } catch (error) {

        res.status(400).send({ error })

    }

})



// Method: POST 
// Action: Login
router.post( '/users/login' , async ( req , res ) =>{
    try {

        const user = await User.findByCredentials( req.body.email , req.body.password )
        const token = await user.generateAuthToken()
        const email = await sendLoginEmail( user.email , user.name)
        //res.status( 200 ).send({ user: user.getPublicProfile() , token })
        res.status( 200 ).send({ user , token , email })
        
    } catch ( error ) {

        res.status(400).send({ error })
        
    }
})



// Method: POST 
// Action: Logout
router.post( '/users/logout' , auth , async ( req , res ) =>{
    try {

        req.user.tokens = req.user.tokens.filter( ( token )=>{
            return token.token !== req.token
        })

        req.user.save()

        res.status(200).send({ success: 'You are successfully logged out.' })
        
    } catch (error) {
        
        res.status(500).send()

    }
})


// Method: POST 
// Action: Logout All Devices
router.post( '/users/logoutall' , auth , async ( req , res ) =>{
    try {

        req.user.tokens = []

        await req.user.save()

        res.status(200).send({ success: 'You are successfully logged out from all devices.' })
        
    } catch (error) {
        
        res.status(500).send()

    }
})

// Method: PATCH 
// Action: Update User By ID
router.patch('/users/me' , auth , async ( req , res ) =>{

    const updates = Object.keys( req.body )

    const allowedFields = [ 'name' , 'email' , 'password' , 'age' ]

    const isAllowed = updates.every( ( update )=>{
        return allowedFields.includes( update )
    })

    if ( !isAllowed ){
        return res.status( 400 ).send({ error:'Wrong inputs.' })
    }

    try {

        // Due to using middleware we must change to use save() method
       //const user = await User.findByIdAndUpdate( req.params.id , req.body , { new: true , runValidators: true })

       //const user = await User.findById({ _id: req.user._id })

       updates.forEach( ( update ) =>{
            req.user[ update ] = req.body[update]
       })

       await req.user.save()

    //    if ( !user ) {

    //     return res.status( 401 ).send({ error:'User Not Defined.' })

    // }
       res.status( 200 ).send({ user: req.user })

    } catch (error) {

        res.status(400).send({ error })

    }

})

// Method: GET 
// Action: Get All Users
router.get('/users' , auth , async ( req , res )=>{

    try {

        const users = await User.find({})

        if ( !users ) {

            return res.status( 401 ).send({ error:'User Not Defined.' })

        }

        res.status( 200 ).send({ users })
        
    } catch (error) {

        res.status( 400 ).send({ error })
        
    }
})


// Method: GET 
// Action: Get User Profile
router.get('/users/me' , auth , async ( req , res )=>{

    res.status( 200 ).send({ user: req.user })
})


// Method: GET 
// Action: Get User By ID
router.get('/users/:id' , async ( req , res )=>{

    const _id = req.params.id

    try {

        const user = await User.findById({ _id })

        if ( !user ) {

            return res.status( 401 ).send({ error:'User Not Found.' })

        }

        res.status( 201 ).send({ user })
        
    } catch ( error ) {
        
        res.status( 400 ).send({ error })

    }
})


// Method: DELETE 
// Action: Delete A User By ID
router.delete('/users/me' , auth , async ( req , res )=>{


    try {

        // const user = await User.findByIdAndDelete( req.user._id )

        // if ( !user ) {

        //     return res.status( 404 ).send({ error:'User Not Found.' })

        // }

        const user = await req.user.remove()

        res.status( 200 ).send({ user })
        
    } catch ( error ) {
        
        res.status( 500 ).send({ error })

    }
})



// Method: POST 
// Action: Upload User Avatar To Avatar Directory
const avatar = multer({
    //dest:'avatar',
    limits:{
        fileSize: 1000000 // 1 MB
    },
    fileFilter( req , file , callback ){
        if ( !file.originalname.endsWith('.jpg') ) {
            return callback('File must be JPG!')
        }
        callback( undefined , true )
    }
})

router.post( '/users/me/avatar' , auth , avatar.single('avatar') , async( req , res ) =>{
    try {

        const buffer = await sharp( req.file.buffer ).resize({ width: 250 , height:250 }).png().toBuffer()
        //req.user.avatar = req.file.buffer

        req.user.avatar = buffer
        await req.user.save()

        res.status( 200 ).send()
        
    } catch (error) {

        res.status( 500 ).send({ error })        
    }


}, ( error , req , res , next )=>{
    res.status( 400 ).send({error})
})




// Method: DELETE 
// Action: Delete User Avatar
router.delete('/users/me/avatar' , auth , async ( req , res )=>{


    try {

        req.user.avatar = undefined
        await req.user.save()

        res.status( 200 ).send({ message: 'Avatar deleted successfully.'})
        
    } catch ( error ) {
        
        res.status( 500 ).send({ error })

    }
})


// Method: GET 
// Action: Get User By ID
router.get('/users/:id/avatar' , async ( req , res )=>{

    const _id = req.params.id
    try {

        const user = await User.findById({ _id })

        if ( !user || !user.avatar ) {

            return res.status( 401 ).send()

        }

        res.set('Content-Type' , 'image/png')
        res.status( 201 ).send(user.avatar )
        
    } catch ( error ) {
        
        res.status( 400 ).send({ error })

    }
})

module.exports = router