require('../db/mongoose')
const Task = require('../db/models/task')
const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')

// Method: POST
// Action: Create A New Task
router.post( '/tasks' , auth , async ( req , res )=>{

    // const task = new Task({
    //     description: req.body.description,
    //     completed:   req.body.completed
    // })

    try {

        const task = new Task({
            ...req.body,
            owner: req.user._id
        })

        const newTask = await task.save()

        res.status( 201 ).send({ newTask })
        
    } catch (error) {

        res.status( 500 ).send({ error })
        
    }
})



// Method: PATCH
// Action: Update A Task By ID
router.patch( '/tasks/:id' , auth , async ( req , res )=>{

    const updates = Object.keys( req.body )

    const allowedFields = [ 'description' , 'completed' ]

    const isAllowed = updates.every( ( update )=>{
        return allowedFields.includes( update )
    })

    if ( !isAllowed ){
        return res.status( 400 ).send({ error:'Wrong inputs.' })
    }

    try {

        //// Due to using middleware we must change to use save() method
        //const task = await Task.findByIdAndUpdate( req.params.id , req.body , { new:true , runValidators: true })
        const task = await Task.findOne({ _id: req.params.id , owner: req.user._id })
        //const task = await Task.findById( req.params.id )


        if ( ! task ) {
            return res.status( 404 ).send({ error: 'Task not found.' })
        }

        updates.forEach(( update ) => {
            task[ update ] = req.body[ update ]
        })

        await task.save()


        res.status( 200 ).send({ task })
        
    } catch (error) {

        res.status( 500 ).send({ error })
        
    }
})

// Method: GET
// Action: Get All Tasks
// Example 1 = http://localhost:3000/tasks?completed=true&limit=2&skip=2
// Example 2 = http://localhost:3000/tasks?sortBy=completed:asc
// Example 2 = http://localhost:3000/tasks?sortBy=createdAt:asc
router.get( '/tasks' , auth , async ( req , res )=>{

    const match={}
    const sort = {}

    if ( req.query.completed ) {
        match.completed = req.query.completed === 'true'
    }

    if ( req.query.sortBy ) {
        const parts = req.query.sortBy.split(':')
        
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try{

        //const tasks = await Task.find({})
        //await req.user.populate('userTasks').execPopulate()
        //console.log('tasks: ', tasks);

        // if ( !tasks ) {

        //     return res.status( 401 ).send({ error:'User Not Defined.' })

        // }


        await req.user.populate({
            path:'userTasks',
            match,
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
            
        }).execPopulate()

        res.status( 200 ).send({ tasks: req.user.userTasks })
        
        } catch (error) {

            res.status( 400 ).send({ error })
            
        }
})

// Method: GET 
// Action: Get Task By ID
router.get('/tasks/:id' , auth , async ( req , res )=>{

    const _id = req.params.id

    try {

        //const task = await Task.findById({ _id })
        const task = await Task.findOne({ _id ,  owner: req.user._id })

        if ( !task ) {

            return res.status( 401 ).send()

        }

        res.status( 200 ).send({ task })
        
    } catch ( error ) {
        
        res.status( 400 ).send({ error })

    }
})


// Method: DELETE 
// Action: Delete Task By ID
router.delete('/tasks/:id' , auth , async ( req , res )=>{

    const _id = req.params.id

    try {

        //const task = await Task.findByIdAndDelete({ _id })
        const task = await Task.findOne({ _id , owner: req.user._id }).findOneAndDelete()
        //await task.findOneAndDelete()
        
        if ( !task ) {

            return res.status( 404 ).send({ error:'Task Not Found.' })

        }

        res.status( 200 ).send({ task })
        
    } catch ( error ) {
        
        res.status( 400 ).send({ error })

    }
})



module.exports = router