import express from 'express'
import { addFood, listFood, removeFood } from '../controllers/foodController.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const foodRouter = express.Router();

const uploadsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');

// Image Storage Engine

const storage = multer.diskStorage({
    destination:uploadsDirectory,
    filename: (req,file,cb)=>{
        return cb(null,`${Date.now()}${file.originalname}`)
    }
})

const upload = multer({storage:storage})
foodRouter.post('/add',upload.single('image'),addFood)
foodRouter.get('/list',listFood)
foodRouter.post('/remove', removeFood)

export default foodRouter;