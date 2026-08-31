import express from 'express'
import { loginUser, registerUser, googleLogin } from '../controllers/userController.js'
import verifyCaptcha from '../middleware/verifyCaptcha.js'

const userRouter = express.Router();

userRouter.post('/register', verifyCaptcha, registerUser)
userRouter.post('/login', verifyCaptcha, loginUser)
userRouter.post("/google-login", googleLogin);

export default userRouter;
