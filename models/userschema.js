const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// const secretKey = "srivenkatasaitejamodernmilliones"; 
const secretKey = process.env.SECRET;
//console.log(secretKey)
const userSchema = new mongoose.Schema({
    fname:{
        type:String,
        required:true,
        trim:true // trim the string
    },
    email:{
        type:String,
        required:true,
        unique:true,// email should be unique
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid Email");
            }
        }
    },
    phone: {
        type: String,
        required: true,
        unique:true,
        validate(value) {
            // Regular expression for phone number validation
            // Replace with your desired phone number format
            if(!(/^\d{10}$/.test(value))){
                throw new Error("Invalid phone number")
            }
        },
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    cpassword: {
        type: String,
        required: true,
        minlength: 8
    },
    tokens: [
        {
            token: {
                type: String,
                required: true,
            }
        }
    ],
    verifyToken:{
        type: String
    }
})


// api in routes folder

//Hash password

userSchema.pre("save",async function(next){
    if (this.isModified("password")) { //changes only when password is modified
        this.password = await bcrypt.hash(this.password,12); //12-> 12 rounds for hashing
        this.cpassword = await bcrypt.hash(this.cpassword,12);
    }
    next() // forwarding the process to save the data in DB
}) // pre -before saving the data in DB


//token generate
userSchema.methods.generateAuthToken = async function () {
    try {
        let token23 = jwt.sign({ _id: this._id }, secretKey, {
            expiresIn: "1d"
        });

        this.tokens = this.tokens.concat({ token: token23 });
        await this.save();
        return token23;
    } catch (error) {
        // res.status(422).json(error)
        throw error;
    }
}

//creating model
const userDb = new mongoose.model("users",userSchema);


module.exports = userDb;