import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";


export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${server}/api/v1/users`,
    withCredentials: true
});

console.log("Axios Client Initialized with BaseURL:", `${server}/api/v1/users`);


export const AuthProvider = ({ children }) => {

    const authContext = useContext(AuthContext);


    const [userData, setUserData] = useState(null);


    const router = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await client.get("/me");
                if (response.status === httpStatus.OK) {
                    setUserData(response.data);
                }
            } catch (err) {
                console.log("Not logged in");
                localStorage.removeItem("token");
            }
        };
        checkAuth();
    }, []);

    const handleRegister = async (name, username, password, email, mobile) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password,
                email: email,
                mobile: mobile
            })


            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    }

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });

            console.log(username, password)
            console.log(request.data)

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                setUserData(request.data.user);
                router("/home")
            }
        } catch (err) {
            throw err;
        }
    }

    const handleLogout = async () => {
        try {
            await client.post("/logout");
            localStorage.removeItem("token");
            setUserData(null);
            router("/auth");
        } catch (err) {
            console.error("Logout failed", err);
        }
    }

    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity");
            return request.data
        } catch
         (err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await client.post("/add_to_activity", {
                meeting_code: meetingCode
            });
            return request
        } catch (e) {
            throw e;
        }
    }


    const data = {
        userData, setUserData, addToUserHistory, getHistoryOfUser, handleRegister, handleLogin, handleLogout
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )

}
