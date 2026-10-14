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
        const foodsWithImageUrl = foods.map(food => {
            const rawImage = String(food.image || '').trim();
            let imageFilename = rawImage;
            if (/^https?:\/\//i.test(rawImage)) {
                try {
                    const parsed = new URL(rawImage);
                    imageFilename = parsed.pathname.replace(/^\/+/, '').replace(/^uploads\/+/, '');
                } catch {
                    imageFilename = rawImage;
                }
            } else {
                imageFilename = rawImage.replace(/^\/+/, '').replace(/^uploads\/+/, '');
            }
            return {
                ...food._doc,
                image: `${url}/uploads/${imageFilename}`
            };
        });
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
        if (!food) {
            return res.status(404).json({success:false, message:'Food not found'})
        }

        const imageFilename = path.basename(String(food.image || ''));
        if (
            !imageFilename ||
            imageFilename !== String(food.image) ||
            !/^[A-Za-z0-9._-]+$/.test(imageFilename)
        ) {
            return res.status(400).json({success:false, message:'Invalid image filename'})
        }

        const uploadsRoot = path.resolve(uploadsDirectory);
        const imagePath = path.resolve(uploadsRoot, path.basename(imageFilename));
        if (!imagePath.startsWith(`${uploadsRoot}${path.sep}`)) {
            return res.status(400).json({success:false, message:'Invalid image path'})
        }

        await fs.promises.unlink(imagePath).catch((error) => {
            if (error.code !== 'ENOENT') {
                throw error
            }
        })

        await foodModel.findByIdAndDelete(req.body.id)
        res.json({success:true,message:'Food Removed'})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:'Error'})
    }
}

export {addFood, listFood, removeFood}