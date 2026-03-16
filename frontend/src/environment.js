const IS_PROD = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

const server = IS_PROD ?
    "https://linkupbackend-p4kd.onrender.com" :
    "http://localhost:8000";

console.log("Current Server URL:", server);
console.log("Current Hostname:", window.location.hostname);

export default server;