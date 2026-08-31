import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import foodModel from '../models/foodModel.js'

const uploadsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');

//add food item

const addFood = async (req,res) =>{

    let image_filename = `${req.file.filename}`;

    const food = new foodModel({
        name: req.body.name,
        description:req.body.description,
        price:req.body.price,
        category:req.body.category,
        image:image_filename
    })

    try {
        await food.save();
        res.json({success:true,message:'Food Added'})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:'Error'})
    }
}

// All food list

const listFood = async (req,res) =>{
    try {
        const foods = await foodModel.find({});
        const forwardedProtocol = req.get('x-forwarded-proto')?.split(',')[0].trim();
        const protocol = forwardedProtocol || req.protocol;
        const url = `${protocol}://${req.get('host')}`.replace(/\/$/, '');
        const foodsWithImageUrl = foods.map(food => ({
            ...food._doc,
            image: `${url}/uploads/${food.image}`
        }));
        res.json({success:true,data:foodsWithImageUrl})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:'Error'})
    }
}

// remove food item

const removeFood = async (req,res)=>{
    try {
        const food = await foodModel.findById(req.body.id);
        fs.unlink(path.join(uploadsDirectory, food.image),()=>{})

        await foodModel.findByIdAndDelete(req.body.id)
        res.json({success:true,message:'Food Removed'})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:'Error'})
    }
}

export {addFood, listFood, removeFood}