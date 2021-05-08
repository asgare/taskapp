require('dotenv').config({ path: './config/dev.env' })
const express = require('express')
const userRouter = require('./routes/user')
const userTask = require('./routes/task')


const app = express()
app.use( express.json() )

app.use( userRouter )
app.use( userTask )


const port = process.env.PORT


app.listen( port , ()=> {
    console.log( 'You are in port ' + port )
})

