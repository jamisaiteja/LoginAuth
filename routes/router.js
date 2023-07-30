const express = require("express");
const router= new express.Router(); // help of Router can create api
const userDb = require("../models/userschema");
const bcrypt = require("bcryptjs");
const authenticate = require("../middleware/authenticate");
const nodemailer = require("nodemailer");
const jwt  = require("jsonwebtoken");

//const secretKey = "srivenkatasaitejamodernmilliones"; 
const secretKey = process.env.SECRET;
const basUrl = process.env.BASE_URL;



// email config

const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.MAIL,
        pass:process.env.PASS
    }
}) 

// for user Registration

router.post("/register",async(req,res)=>{
    //while click in frontend we receive info from body here
    //console.log(req.body);
    const {fname,email,phone,password,cpassword} = req.body;

    if(!fname || !email || !phone || !password || !cpassword){
        res.status(422).json({error:"Fill all the Details"});
    }

    try{
        const preUser = await userDb.findOne({email:email}); //database email:email user entered(find in db whether email is exist or not)
        if(preUser){
            res.status(422).json({error:"This Email is Already Exist"});
        }else if(password !== cpassword){
            res.status(422).json({error:"Passwords do not match"});
        }else{
            const finalUser = new userDb({
                fname:fname,
                email:email,
                phone:phone,
                password:password,
                cpassword:cpassword
            });

            //Hashing the password in router file

            const storeData = await finalUser.save(); // save the data in DB

            //console.log(storeData);

            res.status(201).json({ status: 201, storeData });

        }


    }catch(error){
        res.status(422).json(error);
        console.log(error);
    }
})


//user login

router.post('/login',async(req,res) => {
    //console.log(req.body);

    const {email,password} = req.body;

    if(!email || !password){
        res.status(422).json({error:"Fill all the Details"});
    }
    try{
        //valid email
        const userValid = await userDb.findOne({email: email});

        if(userValid){
            const isMatch = await bcrypt.compare(password,userValid.password); //compare password from DB

            if(!isMatch){
                res.status(422).json({error:"Invalid Details"});
            }else{
                //validating user JWT Token so that we can proceed to Dashboard (for Authentication)
                //token Generate
                const token = await userValid.generateAuthToken();
                //console.log(token);

                // cookie generate
                res.cookie("usercookie",token,{
                    expires:new Date(Date.now()+9000000),//after 15min expiration
                    httpOnly:true
                });

                const result = {
                    userValid,
                    token
                }
                res.status(201).json({status:201,result})
            }

        }

    }catch (error){
        res.status(401).json(error);
        console.log(error);
    }
})

// user valid
router.get("/validuser",authenticate,async(req,res)=>{
    // console.log("done");
    try {
        const ValidUserOne = await userDb.findOne({_id:req.userId});
        res.status(201).json({status:201,ValidUserOne});
    } catch (error) {
        res.status(401).json({status:401,error});
    }
});

//User Logout - autenticate to get token
router.get("/logout",authenticate,async(req,res)=>{
    try {
        req.rootUser.tokens =  req.rootUser.tokens.filter((currElement)=>{
            return currElement.token !== req.token //from DB(checking token) removing matched token
        });

        res.clearCookie("usercookie",{path:"/"});

        req.rootUser.save();

        res.status(201).json({status:201})

    } catch (error) {
        res.status(401).json({status:401,error})
    }
})


// send email link for resetting password
router.post("/sendpasswordlink",async(req,res)=>{
    //console.log(req.body)

    const {email} = req.body;

    if(!email){
        res.status(401).json({status:401,message:"Enter Your Email"})
    }

    try {
        const userFind = await userDb.findOne({email:email});

        // token generate for reset password
        const token = jwt.sign({_id:userFind._id},secretKey,{
            expiresIn:"120s"
        });
        
        //updating the token in DB
        const setUserToken = await userDb.findByIdAndUpdate({_id:userFind._id},{verifyToken:token},{new:true});
        //console.log(setUserToken);

        if(setUserToken){
            const mailOptions = {
                from:"myportfolio064@gmail.com",
                to:email,
                subject:"Link For password Reset",
                text:`This Link Valid For 2 MINUTES ${basUrl}/forgotpassword/${userFind.id}/${setUserToken.verifyToken}`
            }

            transporter.sendMail(mailOptions,(error,info)=>{
                if(error){
                    console.log("error",error);
                    res.status(401).json({status:401,message:"email not send"})
                }else{
                    console.log("Email sent",info.response);
                    res.status(201).json({status:201,message:"Email sent Successfully"})
                }
            })

        }

    } catch (error) {
        console.log("error",error);
        res.status(401).json({status:401,message:"invalid user"})
    }

});


// verify user for forgot password time
router.get("/forgotpassword/:id/:token",async(req,res)=>{
    const {id,token} = req.params;

    try {
        const validUser = await userDb.findOne({_id:id,verifyToken:token});
        //console.log(validUser)
        const verifyTokenn = jwt.verify(token,secretKey); //verifying with secret token
        //console.log(verifyTokenn)

        if(validUser && verifyTokenn._id){
            res.status(201).json({status:201,validUser})
        }else{
            res.status(401).json({status:401,message:"user not exist"})
        }

    } catch (error) {
        res.status(401).json({status:401,error})
    }
});

// change password

router.post("/:id/:token",async(req,res)=>{
    const {id,token} = req.params;

    const {password} = req.body;

    try {
        const validUser = await userDb.findOne({_id:id,verifyToken:token});
        
        const verifyTokenn = jwt.verify(token,secretKey);

        if(validUser && verifyTokenn._id){
            const newPassword = await bcrypt.hash(password,12);

            const setNewUserPass = await userDb.findByIdAndUpdate({_id:id},{password:newPassword});

            setNewUserPass.save();
            res.status(201).json({status:201,setNewUserPass})

        }else{
            res.status(401).json({status:401,message:"user not exist"})
        }
    } catch (error) {
        res.status(401).json({status:401,error})
    }
})

module.exports = router;

//2way connection -encrypting
//12345 --> @#&*@^#() //while register
//@#&*@^#()--> 12345  // while login

//Hashing
//1 way connection
//12345 -->> @#&*@^# //while register
//12345 -->> compare(@#&*@^#,@#&*@^#)==>true //while login --> compares user typed password to actual password from DB