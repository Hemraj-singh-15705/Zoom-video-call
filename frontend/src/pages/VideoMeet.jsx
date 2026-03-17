import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment';
import { toast } from 'react-toastify';

const server_url = server;

// var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();
    let connectionsRef = useRef({});

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState(true);

    let [audio, setAudio] = useState(true);

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])
    let [pinnedId, setPinnedId] = useState(null);
    const [page, setPage] = useState(0);
    const USERS_PER_PAGE = 9;

    const chatEndRef = useRef(null);

    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        console.log("HELLO")
        getPermissions();

    }, [])

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };


    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
        getUserMedia(videoAvailable, audioAvailable);
    }




    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connectionsRef.current) {
            if (id === socketIdRef.current) continue

            window.localStream.getTracks().forEach(track => connectionsRef.current[id].addTrack(track, window.localStream))

            connectionsRef.current[id].createOffer().then((description) => {
                console.log(description)
                connectionsRef.current[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connectionsRef.current[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connectionsRef.current) {
                window.localStream.getTracks().forEach(track => connectionsRef.current[id].addTrack(track, window.localStream))

                connectionsRef.current[id].createOffer().then((description) => {
                    connectionsRef.current[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connectionsRef.current[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let getUserMedia = (requestedVideo = video, requestedAudio = audio) => {
        if ((requestedVideo && videoAvailable) || (requestedAudio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: requestedVideo, audio: requestedAudio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }





    let getDislayMediaSuccess = (stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connectionsRef.current) {
            if (id === socketIdRef.current) continue

            window.localStream.getTracks().forEach(track => connectionsRef.current[id].addTrack(track, window.localStream))

            connectionsRef.current[id].createOffer().then((description) => {
                connectionsRef.current[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connectionsRef.current[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connectionsRef.current[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (connectionsRef.current[fromId].iceQueue) {
                        connectionsRef.current[fromId].iceQueue.forEach(ice => {
                            connectionsRef.current[fromId].addIceCandidate(ice).catch(e => console.log(e));
                        });
                        connectionsRef.current[fromId].iceQueue = [];
                    }
                    if (signal.sdp.type === 'offer') {
                        connectionsRef.current[fromId].createAnswer().then((description) => {
                            connectionsRef.current[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connectionsRef.current[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                if (connectionsRef.current[fromId].remoteDescription) {
                    connectionsRef.current[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
                } else {
                    if (!connectionsRef.current[fromId].iceQueue) connectionsRef.current[fromId].iceQueue = [];
                    connectionsRef.current[fromId].iceQueue.push(new RTCIceCandidate(signal.ice));
                }
            }
        }
    }




    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href, username)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((prevVideos) => {
                    const leavingUser = prevVideos.find(v => v.socketId === id);
                    if (leavingUser) {
                        toast.info(`${leavingUser.username || "A user"} left the call`);
                    }
                    return prevVideos.filter((video) => video.socketId !== id);
                });

                if (connectionsRef.current[id]) {
                    connectionsRef.current[id].close();
                    delete connectionsRef.current[id];
                }
            })

            socketRef.current.on('user-joined', (id, participants) => {
                const joinedUser = participants.find(p => p.id === id);
                if (joinedUser && id !== socketIdRef.current) {
                    toast.success(`${joinedUser.username} joined the call`);
                }

                participants.forEach((p) => {
                    const socketListId = p.id;
                    const socketListUsername = p.username;

                    if (connectionsRef.current[socketListId]) return;
                    if (socketIdRef.current === socketListId) return;

                    connectionsRef.current[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connectionsRef.current[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connectionsRef.current[socketListId].ontrack = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let stream = event.streams[0];

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                username: socketListUsername,
                                stream: stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        window.localStream.getTracks().forEach(track => connectionsRef.current[socketListId].addTrack(track, window.localStream))
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        window.localStream.getTracks().forEach(track => connectionsRef.current[socketListId].addTrack(track, window.localStream))
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connectionsRef.current) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            window.localStream.getTracks().forEach(track => connectionsRef.current[id2].addTrack(track, window.localStream))
                        } catch (e) { }

                        connectionsRef.current[id2].createOffer().then((description) => {
                            connectionsRef.current[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connectionsRef.current[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = async () => {
        let videoState = !video;
        setVideo(videoState);

        if (videoState) {
            // Turning ON: Get new track and replace it in all connections
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newTrack = stream.getVideoTracks()[0];
                
                // Update local stream
                const oldTrack = window.localStream.getVideoTracks()[0];
                if (oldTrack) {
                    window.localStream.removeTrack(oldTrack);
                }
                window.localStream.addTrack(newTrack);
                
                // Update all active peer connections
                for (let id in connectionsRef.current) {
                    const senders = connectionsRef.current[id].getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                    if (videoSender) {
                        videoSender.replaceTrack(newTrack);
                    }
                }
                
                if (localVideoref.current) {
                    localVideoref.current.srcObject = window.localStream;
                }
            } catch (e) {
                console.error("Error restarting video:", e);
            }
        } else {
            // Turning OFF: Stop the track to turn off the hardware light
            window.localStream.getVideoTracks().forEach(track => {
                track.stop();
            });
        }
    }

    let handleAudio = async () => {
        let audioState = !audio;
        setAudio(audioState);

        if (audioState) {
            // Turning ON
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const newTrack = stream.getAudioTracks()[0];
                
                const oldTrack = window.localStream.getAudioTracks()[0];
                if (oldTrack) {
                    window.localStream.removeTrack(oldTrack);
                }
                window.localStream.addTrack(newTrack);
                
                for (let id in connectionsRef.current) {
                    const senders = connectionsRef.current[id].getSenders();
                    const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
                    if (audioSender) {
                        audioSender.replaceTrack(newTrack);
                    }
                }
            } catch (e) {
                console.error("Error restarting audio:", e);
            }
        } else {
            // Turning OFF
            window.localStream.getAudioTracks().forEach(track => {
                track.stop();
            });
        }
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/"
    }

    let openChat = () => {
        setModal(!showModal);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }


    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }



    return (
        <div>

            {askForUsername === true ?

                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyBox}>
                        <h2>Join Meeting</h2>

                        <video ref={localVideoref} autoPlay muted playsInline className={styles.videoPreview}></video>

                        <div className={styles.inputContainer}>
                            <TextField
                                id="outlined-basic"
                                label="Username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                variant="outlined"
                                InputLabelProps={{ style: { color: '#b0b3b8' } }}
                                InputProps={{ style: { color: 'white' } }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: '#4a4d52' },
                                        '&:hover fieldset': { borderColor: '#b0b3b8' },
                                        '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                                    }
                                }}
                            />
                            <Button variant="contained" onClick={connect} size="large">Connect</Button>
                        </div>
                    </div>
                </div> :

                <div className={styles.meetVideoContainer}>

                    <div className={styles.blurWrapper}>
                        <div className={styles.sidePanelContainer}>
                            {showModal && (
                                <div className={styles.chatRoom}>
                                    <h1>Chat</h1>
                                    <div className={styles.chattingDisplay}>
                                        {messages.length !== 0 ? messages.map((item, index) => (
                                            <div style={{ marginBottom: "20px" }} key={index}>
                                                <p style={{ fontWeight: "bold", color: "#ff4d4d" }}>{item.sender}</p>
                                                <p style={{ color: "white" }}>{item.data}</p>
                                            </div>
                                        )) : <p style={{ color: "rgba(255,255,255,0.5)" }}>No Messages Yet</p>}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className={styles.chattingArea}>
                                        <TextField
                                            fullWidth
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            id="outlined-basic"
                                            label="Enter Your chat"
                                            variant="outlined"
                                            InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
                                            InputProps={{ style: { color: 'white' } }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                                                    '&.Mui-focused fieldset': { borderColor: '#ff4d4d' },
                                                },
                                                '& .MuiInputLabel-root.Mui-focused': { color: '#ff4d4d' }
                                            }}
                                        />
                                        <Button variant='contained' onClick={sendMessage} style={{ backgroundColor: "#ff4d4d" }}>Send</Button>
                                    </div>
                                </div>
                            )}

                        </div>


                        <div className={styles.buttonContainers}>
                            <IconButton onClick={handleVideo} style={{ color: "white" }}>
                                {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                                <CallEndIcon />
                            </IconButton>
                            <IconButton onClick={handleAudio} style={{ color: "white" }}>
                                {audio === true ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>

                            {screenAvailable === true ?
                                <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                    {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                                </IconButton> : <></>}

                            <Badge badgeContent={newMessages} max={999} color='orange'>
                                <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                                    <ChatIcon />
                                </IconButton>
                            </Badge>

                        </div>


                        <div className={styles.conferenceView}>
                            {(() => {
                                const allParticipants = [
                                    { socketId: 'local', stream: localVideoref.current?.srcObject, isLocal: true },
                                    ...videos
                                ];

                                const start = page * USERS_PER_PAGE;
                                const visibleParticipants = allParticipants.slice(start, start + USERS_PER_PAGE);

                                return visibleParticipants.map((participant) => (
                                    <div
                                        key={participant.socketId}
                                        className={`${styles.videoContainer} ${pinnedId === participant.socketId ? styles.pinned : ''}`}
                                        onClick={() => setPinnedId(pinnedId === participant.socketId ? null : participant.socketId)}
                                    >
                                        {participant.isLocal ? (
                                            video ? (
                                                <video
                                                    ref={localVideoref}
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                ></video>
                                            ) : (
                                                <div className={styles.videoPlaceholder}>Camera Off</div>
                                            )
                                        ) : (
                                            <video
                                                data-socket={participant.socketId}
                                                ref={ref => {
                                                    if (ref && participant.stream) {
                                                        ref.srcObject = participant.stream;
                                                    }
                                                }}
                                                autoPlay
                                                playsInline
                                            ></video>
                                        )}
                                        <div className={styles.participantName}>
                                            {participant.isLocal ? "You (Me)" : (participant.username || `${participant.socketId.substring(0, 5)}...`)}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>

                        {videos.length + 1 > USERS_PER_PAGE && (
                            <div className={styles.paginationControls}>
                                <Button
                                    disabled={page === 0}
                                    onClick={() => setPage(page - 1)}
                                    variant="contained"
                                    style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "20px" }}
                                >
                                    Previous
                                </Button>
                                <span style={{ color: "white", alignSelf: "center" }}>
                                    Page {page + 1} of {Math.ceil((videos.length + 1) / USERS_PER_PAGE)}
                                </span>
                                <Button
                                    disabled={(page + 1) * USERS_PER_PAGE >= videos.length + 1}
                                    onClick={() => setPage(page + 1)}
                                    variant="contained"
                                    style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "20px" }}
                                >
                                    Next
                                </Button>
                            </div>
                        )}

                    </div>

                </div>

            }

        </div>
    )
}
