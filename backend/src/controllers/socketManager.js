import { Server } from "socket.io"
import { ExpiredMeeting } from "../models/expiredMeeting.model.js"


let connections = {}
let messages = {}
let timeOnline = {}
let expiredMeetings = new Set()

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });


    io.on("connection", (socket) => {

        console.log("SOMETHING CONNECTED")

        socket.on("join-call", async (path, username) => {

            if (expiredMeetings.has(path)) {
                io.to(socket.id).emit("meeting-expired");
                return;
            }
            
            try {
                const expiredMeetingRecord = await ExpiredMeeting.findOne({ meetingCode: path });
                if (expiredMeetingRecord) {
                    expiredMeetings.add(path); // cache in memory
                    io.to(socket.id).emit("meeting-expired");
                    return;
                }
            } catch (err) {
                console.log("Error checking expired meeting:", err);
            }

            if (connections[path] === undefined) {
                connections[path] = []
            }
            connections[path].push(socket.id)

            timeOnline[socket.id] = new Date();

            // Store username and initial focus count
            socket.username = username;

            for (let a = 0; a < connections[path].length; a++) {
                const participants = connections[path].map(id => {
                    const s = io.sockets.sockets.get(id);
                    return { id, username: s ? s.username : "Unknown" };
                });
                io.to(connections[path][a]).emit("user-joined", socket.id, participants);
            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
                }
            }

        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("chat-message", (data, sender) => {

            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {


                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }

                    return [room, isFound];

                }, ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                console.log("message", matchingRoom, ":", sender, data)

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }

        })

        socket.on("focus-changed", (focusData) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("focus-changed", {
                        socketId: socket.id,
                        username: focusData.username,
                        focusLossCount: focusData.focusLossCount
                    });
                });
            }
        })

        socket.on("raise-hand", (username) => {
            const [matchingRoom, found] = Object.entries(connections).reduce(([room, isFound], [roomKey, roomValue]) => {
                if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                return [room, isFound];
            }, ['', false]);

            if (found === true) {
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("hand-raised", socket.id, username)
                })
            }
        })

        socket.on("end-meeting", async () => {
            const [matchingRoom, found] = Object.entries(connections).reduce(([room, isFound], [roomKey, roomValue]) => {
                if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                return [room, isFound];
            }, ['', false]);

            if (found === true) {
                expiredMeetings.add(matchingRoom);
                
                try {
                    const existingRecord = await ExpiredMeeting.findOne({ meetingCode: matchingRoom });
                    if (!existingRecord) {
                        const newExpired = new ExpiredMeeting({ meetingCode: matchingRoom });
                        await newExpired.save();
                    }
                } catch (err) {
                    console.log("Error saving expired meeting:", err);
                }

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("meeting-ended")
                })
                // Clean up entire room from server memory
                delete connections[matchingRoom];
                delete messages[matchingRoom];
            }
        })

        socket.on("disconnect", () => {

            var diffTime = Math.abs(timeOnline[socket.id] - new Date())

            var key

            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {

                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k

                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id)
                        }

                        var index = connections[key].indexOf(socket.id)

                        connections[key].splice(index, 1)


                        if (connections[key].length === 0) {
                            delete connections[key]
                        }
                    }
                }

            }


        })


    })


    return io;
}


