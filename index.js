const express = require('express');
const mongoose = require('mongoose');
const bcrypt =require('bcrypt')
const jwt = require('jsonwebtoken')
const app=express();
const port=8000;

mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName:"userData",
}).then(()=>console.log("Database is Connected")).catch((e)=>console.log(e))

app.use(express.urlencoded({extended:true}) )
app.use(express.json())

const contactSchema=new mongoose.Schema({
    personalPhoneNo:String,
    secondryNo:String
})

const Contact = mongoose.model("Contact",contactSchema);

const addressSchema=new mongoose.Schema({
    houseName:String,
    streetNo:String,
    landmark:String
})
const Address = mongoose.model('Address',addressSchema)

const userSchema=new mongoose.Schema({
    name: String,
    email: String,
    dateOfBirth: Date,
    username: String,
    password: String,
   
})


const User=mongoose.model('User',userSchema);

const userDetailsSchema= new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    address:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
    },
    contact:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Contact",
    }
})

const UserDetail = mongoose.model('UserDetail',userDetailsSchema)

app.post('/user/registration', async(req,res)=>{
    const {name,email,dateOfBirth,username,password}=req.body
    const hashedPassword = await bcrypt.hash(password,10)
    const newUser = new User({name, email, dateOfBirth, username ,password: hashedPassword});
    try {
      await  newUser.save();
      res.json({message:"user created"})
    } catch (error) {
        res.status(500).json({message:"user not created"})
    }
})

app.post('/user/userInfo',async(req,res)=>{
    const {user,address,contact}=req.body
    const newUserInfo = new UserDetail({user,address,contact});
    try {
        await newUserInfo.save();
        res.json({message:"saved"})
    } catch (error) {
        res.status(500).json({message:"user not created"})
    }

})

app.post('/user/address',async(req,res)=>{
    const { houseName,streetNo,landmark}= req.body;
    const newAddress =new Address({houseName,streetNo,landmark});
    try {
        await  newAddress.save();
        res.json({message:"Address saved"})
    } catch (error) {
        res.status(500).json({message:"internal server error"})
    }
})

app.post('/user/contact',async(req,res)=>{
    const { personalPhoneNo,secondryNo}= req.body;
    const newContact =new Contact({personalPhoneNo,secondryNo});
    try {
        await  newContact.save();
        res.json({message:"Contact saved"})
    } catch (error) {
        res.status(500).json({message:"internal server error"})
    }
})

app.put('/user/updateName',async(req,res)=>{

    const {username,changeName}= req.body;
    const user = await User.findOne({username})
    if(user){
        await User.updateOne({ username }, { $set: { name: changeName } });
        res.json({message:"name updated"})
    }
    else{
        return res.status(401).json({message:"user not found"})
    }

})

app.post('/user/login',async(req,res)=>{
     const{username,password}=req.body;
     const user = await User.findOne({username});
     if(!user){
        return res.status(400).json({message:"user not found"})
     }
     const passwordMatch =await bcrypt.compare(password,user.password)
     if(passwordMatch){
        const token = jwt.sign({username:user.name},'your-secret-key', { expiresIn: '1h' })
        res.json({token,message:"login succesfully"})
     }
     else{
        res.status(400).json({message:"incorrect password"})
     }

})

app.put('/user/changePassword',async(req,res)=>{
   let {username,oldPassword , newPassword}=req.body
    const user=await User.findOne({username})
    if(!user){
        return res.status(401).json({message:"user not found"})
    }
    const passwordMatch= bcrypt.compare(oldPassword,user.password);
    if(passwordMatch){
        const newHashedPassword = await bcrypt.hash(newPassword,10);
        await User.updateOne({ username }, { $set: { password: newHashedPassword } });
        }
    try {
        res.json({message:"password changed"})
    } catch (error) {
        res.status(500).json({message:"password in not changed"})
    }

})

app.get('/user/userDetails',async(req,res)=>{
     try {
        const result=await UserDetail.aggregate([
            
            {
                $lookup:{
                    from: 'users',
                    localField:'user',
                    foreignField:'_id',
                    as:'userInfo',
                },
            },
            {
                $unwind: '$userInfo',
            },
            {
                $lookup:{
                    from: 'addresses',
                    localField:'address',
                    foreignField:'_id',
                    as:'addressInfo',
                },
            },
            {
                $unwind: '$addressInfo',
            },
          
              {
                $lookup: {
                  from: 'contacts',
                  localField: 'contact',
                  foreignField: '_id',
                  as: 'contactInfo',
                },
              },
              {
                $unwind:'$contactInfo'
              }
             
        ]);

    res.json(result);
     } catch (error) {
        res.status(500).json({message:"internal server error"})
     }
})
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });