const IS_PROD = typeof window !== 'undefined' && 
                 window.location.hostname !== 'localhost' && 
                 window.location.hostname !== '127.0.0.1';

// Direct production check for Render environment
const server = IS_PROD ?
    "https://linkupbackend-p4kd.onrender.com" :
    "http://localhost:8000";

console.log("Check this log in F12 Console:");
console.log("Environment Detection:", IS_PROD ? "PRODUCTION" : "LOCAL");
console.log("Target Server URL:", server);

export default server;