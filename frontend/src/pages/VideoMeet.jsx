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

    let [audio, setAudio] = useState();

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
    let [focusLossCount, setFocusLossCount] = useState(0);
    let [participantsFocus, setParticipantsFocus] = useState({});
    let [showDashboard, setShowDashboard] = useState(false);
    let [showScreenshotOverlay, setShowScreenshotOverlay] = useState(false);

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

            connectionsRef.current[id].addStream(window.localStream)

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
                connectionsRef.current[id].addStream(window.localStream)

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

            connectionsRef.current[id].addStream(window.localStream)

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
                connectionsRef.current[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
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

            socketRef.current.on('focus-changed', (data) => {
                setParticipantsFocus(prev => ({
                    ...prev,
                    [data.socketId]: {
                        username: data.username,
                        count: data.focusLossCount
                    }
                }));
            });

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
                setParticipantsFocus((prev) => {
                    const updated = { ...prev };
                    delete updated[id];
                    return updated;
                });
                if (connectionsRef.current[id]) {
                    connectionsRef.current[id].close();
                    delete connectionsRef.current[id];
                }
            })

            socketRef.current.on('user-joined', (id, participants) => {
                participants.forEach((p) => {
                    const socketListId = p.id;

                    // Sync focus count if we already have data for this participant
                    setParticipantsFocus(prev => ({
                        ...prev,
                        [socketListId]: {
                            username: p.username,
                            count: prev[socketListId]?.count || 0
                        }
                    }));

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
                    connectionsRef.current[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
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
                        connectionsRef.current[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connectionsRef.current[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connectionsRef.current) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connectionsRef.current[id2].addStream(window.localStream)
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

    let handleVideo = () => {
        setVideo(!video);
        if (window.localStream) {
            const videoTrack = window.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !video;
            }
        }
    }
    let handleAudio = () => {
        setAudio(!audio)
        if (window.localStream) {
            const audioTrack = window.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audio;
            }
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
        if (!askForUsername) {
            const handleFocusLoss = () => {
                setShowScreenshotOverlay(true);
                setFocusLossCount(prev => {
                    const newCount = prev + 1;
                    if (socketRef.current) {
                        socketRef.current.emit("focus-changed", {
                            username: username,
                            focusLossCount: newCount
                        });
                    }
                    return newCount;
                });
            };

            const handleScreenshotAttempt = (e) => {
                if (e.key === "PrintScreen") {
                    setShowScreenshotOverlay(true);
                }
            };

            window.addEventListener("blur", handleFocusLoss);
            window.addEventListener("keydown", handleScreenshotAttempt);
            document.addEventListener("visibilitychange", () => {
                if (document.hidden) {
                    handleFocusLoss();
                }
            });

            return () => {
                window.removeEventListener("blur", handleFocusLoss);
                window.removeEventListener("keydown", handleScreenshotAttempt);
                document.removeEventListener("visibilitychange", handleFocusLoss);
            };
        }
    }, [askForUsername, username]);

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
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(e => {
                console.log("Fullscreen request failed:", e);
            });
        }
    }



    return (
        <div>

            {askForUsername === true ?

                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyBox}>
                        <h2>Join Meeting</h2>

                        <video ref={localVideoref} autoPlay muted className={styles.videoPreview}></video>

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

                    {showScreenshotOverlay && (
                        <div className={styles.screenshotOverlay} onClick={() => setShowScreenshotOverlay(false)}>
                            <div className={styles.overlayContent}>
                                <h2>Looks like you're trying to take a screenshot!</h2>
                                <p>Click anywhere to return to the conversation</p>
                            </div>
                        </div>
                    )}

                    <div className={`${styles.blurWrapper} ${showScreenshotOverlay ? styles.screenshotBlur : ""}`}>
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

                            {showDashboard && (
                                <div className={styles.dashboardPanel}>
                                    <div className={styles.statusSection}>
                                        <h2 className={styles.statusHeader}>Meeting Status</h2>
                                        <div className={styles.statusText}>
                                            <span>Total Members</span>
                                            <span>{Object.keys(participantsFocus).length + 1}</span>
                                        </div>
                                    </div>
                                    <div className={styles.dashboardContent}>
                                        <h3>User status</h3>
                                        <div className={`${styles.statRow} ${styles.activeUser}`}>
                                            <span>{username} (You)</span>
                                            <span>{focusLossCount} losses</span>
                                        </div>
                                        {Object.entries(participantsFocus).map(([id, data]) => (
                                            id !== socketIdRef.current && (
                                                <div key={id} className={styles.statRow}>
                                                    <span>{data.username}</span>
                                                    <span>{data.count} losses</span>
                                                </div>
                                            )
                                        ))}
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

                            <Button
                                variant="contained"
                                onClick={() => setShowDashboard(!showDashboard)}
                                style={{ marginLeft: "10px", backgroundColor: showDashboard ? "#ff4d4d" : "#1976d2" }}
                            >
                                User status
                            </Button>

                        </div>


                        <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

                        <div className={styles.conferenceView}>
                            {videos.map((video) => (
                                <div key={video.socketId}>
                                    <video

                                        data-socket={video.socketId}
                                        ref={ref => {
                                            if (ref && video.stream) {
                                                ref.srcObject = video.stream;
                                            }
                                        }}
                                        autoPlay
                                    >
                                    </video>
                                </div>

                            ))}

                        </div>

                    </div>

                </div>

            }

        </div>
    )
}
