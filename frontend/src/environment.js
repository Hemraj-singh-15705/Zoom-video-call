const IS_PROD = window.location.hostname !== "localhost";

const server = IS_PROD ?
    "https://linkupbackend-p4kd.onrender.com" :
    "http://localhost:8000";

export default server;