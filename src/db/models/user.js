const mongoose = require('mongoose')
const validator = require('validator')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')



const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        dropDups: true,
        required: true,
        index:true,
        trim: true,
        lowercase: true,
        validate( value ) {
            if ( !validator.isEmail( value ) ) {
                throw new Error('Email is not valid.')
            }
        }
    },
    password: {
        type: String,
        required:true,
        trim: true,
        validate( value ) {
            if ( value.length <= 6 ) {
                throw new Error('Minimum length for password must be bigger than 6 character.')
            } else if ( value.toLowerCase().includes( 'password' ) ) {
                throw new Error('You can not use "password", please enter another word.')
            }
        }
    },
    age:{
        type: Number,
        trim: true,
        default: 0,
        validate( value ) {

            if ( value < 0 )  {
                throw new Error('Age can not be a negative number.')
            }
            
        }
    },
    tokens:[{
        token:{
            type: String,
            required:true
        }
    }],
    avatar:{
        type: Buffer
    }
    
},{timestamps: true})

//Virtual Relationship with task

userSchema.virtual( 'userTasks' , {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})



//Public user information
userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.age
    delete userObject.avatar
    delete userObject.tokens
    delete userObject.__v 

    return userObject
}
// userSchema.methods.getPublicProfile = function() {
//     const user = this
//     const userObject = user.toObject()
//     delete userObject.password
//     delete userObject.age
//     delete userObject._id
//     delete userObject.tokens
//     delete userObject.__v

//     return userObject
// }

//Generate User Token
userSchema.methods.generateAuthToken = async function() {

    const user = this

    const token = jwt.sign({ _id: user._id.toString() , email: user.email.toString() } , process.env.TOKEN_PASSWORD )

    //Save in tokens array of objects
    user.tokens = user.tokens.concat({ token })

    await user.save()

    return token
}


//Login
userSchema.statics.findByCredentials = async ( email , password ) => {

    const user = await User.findOne({ email })

    if ( !user ) {
        throw ('There is not a user with this email address.' )
       // res.status( 404 ).send({ error: 'There is not user with this email address.' })
    }

    const isMatch = await bcryptjs.compare( password , user.password )

    if ( !isMatch ) {
        throw ('Invalid password! try again.' )
    }

    return user
}


//Hash user password before saving
userSchema.pre('save' , async function( next ) {
    const user = this
    
    if ( user.isModified('password') ) {
        user.password = await bcryptjs.hash( user.password , 8 )
    }

    next()
})



//Delete user tasks before deleting user
userSchema.pre( 'remove' , async function( next ) {
    const user = this

    await Task.deleteMany({ owner: user._id})

    next()
})


const User = mongoose.model('User' , userSchema , 'users')


module.exports = User