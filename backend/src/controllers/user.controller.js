import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs"

import crypto from "crypto"
import { Meeting } from "../models/meeting.model.js";
const login = async (req, res) => {

    let { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please Provide" })
    }

    username = username.trim().toLowerCase();

    try {
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username },
                { mobile: username }
            ]
        });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" })
        }


        let isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (isPasswordCorrect) {
            let token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();

            res.cookie("token", token, {
                httpOnly: true,
                secure: true, // Always true for SameSite: None, Render provides SSL
                sameSite: "None", // Required for cross-site subdomains on Render
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            return res.status(httpStatus.OK).json({ 
                token: token,
                user: {
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile
                }
            })
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" })
        }

    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` })
    }
}


const register = async (req, res) => {
    let { name, username, password, email, mobile } = req.body;


    try {
        username = username.trim().toLowerCase();
        email = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            $or: [
                { username: username },
                { email: email },
                { mobile: mobile }
            ]
        });

        if (existingUser) {
            let conflictField = "";
            if (existingUser.username === username) conflictField = "Username";
            else if (existingUser.email === email) conflictField = "Email";
            else if (existingUser.mobile === mobile) conflictField = "Mobile number";

            return res.status(httpStatus.FOUND).json({ message: `${conflictField} already exists` });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword,
            email: email,
            mobile: mobile
        });

        await newUser.save();

        res.status(httpStatus.CREATED).json({ message: "User Registered" })

    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }

}


const getUserHistory = async (req, res) => {
    try {
        const meetings = await Meeting.find({ user_id: req.user.username })
        res.json(meetings)
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }
}

const addToHistory = async (req, res) => {
    const { meeting_code } = req.body;

    try {
        const newMeeting = new Meeting({
            user_id: req.user.username,
            meetingCode: meeting_code
        })

        await newMeeting.save();

        res.status(httpStatus.CREATED).json({ message: "Added code to history" })
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }
}


const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(httpStatus.OK).json({ message: "Logged out successfully" });
}

const getUser = async (req, res) => {
    if (req.user) {
        return res.json({
            username: req.user.username,
            name: req.user.name
        });
    }
    res.status(httpStatus.UNAUTHORIZED).json({ message: "Not authenticated" });
}

export { login, register, getUserHistory, addToHistory, logout, getUser }