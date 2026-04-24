import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
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
import PanToolIcon from '@mui/icons-material/PanTool';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import PictureInPictureAltIcon from '@mui/icons-material/PictureInPictureAlt';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import SubtitlesOffIcon from '@mui/icons-material/SubtitlesOff';
import PeopleIcon from '@mui/icons-material/People';
import server from '../environment';
import { toast } from 'react-toastify';

const server_url = server;

// var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" },
        { "urls": "stun:stun1.l.google.com:19302" },
        { 
            "urls": "turn:openrelay.metered.ca:80",
            "username": "openrelayproject",
            "credential": "openrelayproject"
        },
        { 
            "urls": "turn:openrelay.metered.ca:443",
            "username": "openrelayproject",
            "credential": "openrelayproject"
        },
        { 
            "urls": "turn:openrelay.metered.ca:443?transport=tcp",
            "username": "openrelayproject",
            "credential": "openrelayproject"
        }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();
    let connectionsRef = useRef({});
    let recognitionRef = useRef(null);

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState(true);

    let [audio, setAudio] = useState(true);

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(false);
    let [showParticipantsPanel, setShowParticipantsPanel] = useState(false);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");
    let [isHost, setIsHost] = useState(false);

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])
    let [pinnedId, setPinnedId] = useState(null);
    let [raisedHands, setRaisedHands] = useState([]);
    const [page, setPage] = useState(0);
    const USERS_PER_PAGE = 9;

    let [devices, setDevices] = useState([]);
    let [selectedCamera, setSelectedCamera] = useState('');
    let [selectedMic, setSelectedMic] = useState('');
    let [activeEmojis, setActiveEmojis] = useState([]);
    let [showEmojiPicker, setShowEmojiPicker] = useState(false);

    let [isCaptionsOn, setIsCaptionsOn] = useState(false);
    let [currentCaption, setCurrentCaption] = useState(null);

    const chatEndRef = useRef(null);

    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        console.log("HELLO")
        getPermissions();
        
        try {
            const pathParts = window.location.href.split("/");
            const currentCode = pathParts[pathParts.length - 1];
            let owned = JSON.parse(localStorage.getItem('ownedMeetings') || '[]');
            if (owned.includes(currentCode)) {
                setIsHost(true);
            }
        } catch(e) {}

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
            const devs = await navigator.mediaDevices.enumerateDevices();
            setDevices(devs);
            const videoDevices = devs.filter(d => d.kind === 'videoinput');
            const audioDevices = devs.filter(d => d.kind === 'audioinput');
            if (videoDevices.length > 0) setSelectedCamera(videoDevices[0].deviceId);
            if (audioDevices.length > 0) setSelectedMic(audioDevices[0].deviceId);

            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoStream) {
                setVideoAvailable(true);
                videoStream.getTracks().forEach(track => track.stop());
                console.log('Video permission granted');
            }

            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioStream) {
                setAudioAvailable(true);
                audioStream.getTracks().forEach(track => track.stop());
                console.log('Audio permission granted');
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


    const changeDevice = async (type, deviceId) => {
        if (type === 'videoinput') setSelectedCamera(deviceId);
        else setSelectedMic(deviceId);

        if (localVideoref.current) {
            const currentVideo = type === 'videoinput' ? deviceId : selectedCamera;
            const currentAudio = type === 'audioinput' ? deviceId : selectedMic;
            
            const constraints = {
                video: videoAvailable ? (currentVideo ? { deviceId: { exact: currentVideo } } : true) : false,
                audio: audioAvailable ? (currentAudio ? { deviceId: { exact: currentAudio } } : true) : false
            };
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                window.localStream = stream;
                localVideoref.current.srcObject = stream;
            } catch (e) {
                console.error("Error changing device", e);
            }
        }
    };

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        
        const constraints = {
            video: videoAvailable ? (selectedCamera ? { deviceId: { exact: selectedCamera } } : true) : false,
            audio: audioAvailable ? (selectedMic ? { deviceId: { exact: selectedMic } } : true) : false
        };

        if (!window.localStream) {
            navigator.mediaDevices.getUserMedia(constraints)
                .then((stream) => {
                    window.localStream = stream;
                    if (localVideoref.current) localVideoref.current.srcObject = stream;
                    connectToSocketServer();
                })
                .catch((e) => {
                    let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                    window.localStream = blackSilence();
                    if (localVideoref.current) localVideoref.current.srcObject = window.localStream;
                    connectToSocketServer();
                });
        } else {
            connectToSocketServer();
        }
    }




    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        if (localVideoref.current) localVideoref.current.srcObject = stream

        for (let id in connectionsRef.current) {
            if (id === socketIdRef.current) continue

            let senders = connectionsRef.current[id].getSenders();
            window.localStream.getTracks().forEach(track => {
                let sender = senders.find(s => s.track && s.track.kind === track.kind);
                if (sender) {
                    sender.replaceTrack(track);
                } else {
                    connectionsRef.current[id].addTrack(track, window.localStream);
                }
            });
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

            let senders = connectionsRef.current[id].getSenders();
            window.localStream.getTracks().forEach(track => {
                let sender = senders.find(s => s.track && s.track.kind === track.kind);
                if (sender) {
                    sender.replaceTrack(track);
                } else {
                    connectionsRef.current[id].addTrack(track, window.localStream);
                }
            });
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

            socketRef.current.on('hand-raised', (id, senderUsername) => {
                setRaisedHands(prev => [...prev, id]);
                toast.info(`${senderUsername} raised their hand ✋`);
                setTimeout(() => {
                    setRaisedHands(prev => prev.filter(userId => userId !== id));
                }, 5000);
            });

            socketRef.current.on('kicked', () => {
                toast.error("You have been kicked from the meeting by the host.");
                setTimeout(() => {
                    handleEndCall();
                }, 2000);
            });

            socketRef.current.on('mute-all-participants', () => {
                setAudio(false);
                if (window.localStream) {
                    window.localStream.getAudioTracks().forEach(track => {
                        track.stop();
                    });
                }
                toast.info("The host has muted everyone.");
            });

            socketRef.current.on('emoji-received', (id, emoji) => {
                const newEmoji = { id: Date.now(), emoji, socketId: id };
                setActiveEmojis(prev => [...prev, newEmoji]);
                setTimeout(() => {
                    setActiveEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
                }, 4000);
            });

            socketRef.current.on('caption-received', (captionData) => {
                if (captionData.senderId !== socketIdRef.current) {
                    setCurrentCaption(captionData);
                    setTimeout(() => {
                        setCurrentCaption(null);
                    }, 4000);
                }
            });

            socketRef.current.on('meeting-ended', () => {
                toast.error("Host has ended the meeting for all participants.");
                setTimeout(() => {
                    handleEndCall();
                }, 2000);
            });

            socketRef.current.on('meeting-expired', () => {
                toast.error("This meeting link has expired.");
                setTimeout(() => {
                    handleEndCall();
                }, 2000);
            });

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
                        let stream = event.streams[0];

                        if (!stream) {
                            stream = new MediaStream([event.track]);
                        }

                        setVideos(prevVideos => {
                            let videoExists = prevVideos.find(video => video.socketId === socketListId);
                            let updatedVideos;

                            if (videoExists) {
                                // Update the stream of the existing video
                                updatedVideos = prevVideos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: stream } : video
                                );
                            } else {
                                // Create a new video
                                let newVideo = {
                                    socketId: socketListId,
                                    username: socketListUsername,
                                    stream: stream,
                                    autoplay: true,
                                    playsinline: true
                                };
                                updatedVideos = [...prevVideos, newVideo];
                            }
                            
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
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

    let handleRaiseHand = () => {
        socketRef.current.emit('raise-hand', username);
        setRaisedHands(prev => [...prev, socketIdRef.current]);
        setTimeout(() => {
            setRaisedHands(prev => prev.filter(userId => userId !== socketIdRef.current));
        }, 5000);
    }
    
    let handleEndForAll = () => {
        socketRef.current.emit('end-meeting');
        handleEndCall();
    }
    
    let handleMuteAll = () => {
        if (isHost) {
            socketRef.current.emit('mute-all-participants');
            toast.success("Muted all participants.");
        }
    }

    let handleKick = (participantId, e) => {
        if (e) e.stopPropagation();
        if (isHost) {
            socketRef.current.emit('kick-participant', participantId);
            toast.success("Kicked participant.");
        }
    }

    let sendEmoji = (emoji) => {
        socketRef.current.emit('send-emoji', emoji);
        // Also show locally
        const newEmoji = { id: Date.now(), emoji, socketId: socketIdRef.current };
        setActiveEmojis(prev => [...prev, newEmoji]);
        setTimeout(() => {
            setActiveEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
        }, 4000);
        setShowEmojiPicker(false);
    }
    
    let toggleCaptions = () => {
        if (isCaptionsOn) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsCaptionsOn(false);
            toast.info("Captions turned off.");
        } else {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                toast.error("Your browser does not support Speech Recognition.");
                return;
            }
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                socketRef.current.emit('send-caption', { username: username || "You", text: transcript });
                setCurrentCaption({ username: "You", text: transcript });
                setTimeout(() => {
                    setCurrentCaption(null);
                }, 4000);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
            };

            recognition.onend = () => {
                if (recognitionRef.current) {
                    try { recognitionRef.current.start(); } catch(e){}
                }
            };

            recognitionRef.current = recognition;
            try {
                recognition.start();
                setIsCaptionsOn(true);
                toast.success("Captions turned on.");
            } catch(e) {
                console.error("Failed to start recognition:", e);
            }
        }
    }

    let togglePiP = async (e, id) => {
        e.stopPropagation();
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                const videoEl = document.querySelector(`video[data-socket="${id}"]`);
                if (videoEl) {
                    await videoEl.requestPictureInPicture();
                }
            }
        } catch (err) {
            toast.error("PiP not supported or failed");
        }
    }
    
    let handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                socketRef.current.emit('chat-message', { type: 'file', content: event.target.result, fileName: file.name, fileType: file.type }, username);    
            };
            reader.readAsDataURL(file);
        }
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
        if (message.trim().length === 0) return;
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username);
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

                        <video ref={localVideoref} autoPlay muted playsInline className={styles.videoPreview} style={{ transform: "scaleX(-1)" }}></video>

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
                                    },
                                    marginBottom: '15px'
                                }}
                            />
                            
                            <FormControl fullWidth sx={{ marginBottom: '15px' }}>
                                <InputLabel style={{ color: '#b0b3b8' }}>Camera</InputLabel>
                                <Select
                                    value={selectedCamera}
                                    onChange={(e) => changeDevice('videoinput', e.target.value)}
                                    label="Camera"
                                    sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: '#4a4d52' } }}
                                >
                                    {devices.filter(d => d.kind === 'videoinput').map((device) => (
                                        <MenuItem key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${device.deviceId.substring(0,5)}`}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth sx={{ marginBottom: '20px' }}>
                                <InputLabel style={{ color: '#b0b3b8' }}>Microphone</InputLabel>
                                <Select
                                    value={selectedMic}
                                    onChange={(e) => changeDevice('audioinput', e.target.value)}
                                    label="Microphone"
                                    sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: '#4a4d52' } }}
                                >
                                    {devices.filter(d => d.kind === 'audioinput').map((device) => (
                                        <MenuItem key={device.deviceId} value={device.deviceId}>{device.label || `Mic ${device.deviceId.substring(0,5)}`}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Button variant="contained" onClick={connect} size="large" fullWidth>Connect</Button>
                        </div>
                    </div>
                </div> :

                <div className={styles.meetVideoContainer}>

                    <div className={styles.blurWrapper}>
                        <Dialog open={showModal} onClose={closeChat} fullWidth maxWidth="sm" PaperProps={{ style: { backgroundColor: '#1a1c1e', color: 'white', borderRadius: '16px' } }}>
                            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                Chat
                                <IconButton onClick={closeChat} sx={{ color: 'white' }}>
                                    <CloseIcon />
                                </IconButton>
                            </DialogTitle>
                            <DialogContent sx={{ display: 'flex', flexDirection: 'column', height: { xs: '70vh', sm: '60vh' }, padding: '24px' }}>
                                <div className={styles.chattingDisplay} style={{ flexGrow: 1 }}>
                                    {messages.length !== 0 ? messages.map((item, index) => (
                                        <div style={{ marginBottom: "20px" }} key={index}>
                                            <p style={{ fontWeight: "bold", color: "#ff4d4d", margin: "0 0 5px 0" }}>{item.sender}</p>
                                            {typeof item.data === 'string' ? (
                                                <p style={{ color: "white", margin: 0, wordWrap: "break-word" }}>{item.data}</p>
                                            ) : item.data.type === 'file' ? (
                                                item.data.fileType.startsWith('image/') ? 
                                                <img src={item.data.content} alt="attachment" style={{maxWidth: '100%', borderRadius: '5px', marginTop: '5px'}}/>
                                                : <a href={item.data.content} download={item.data.fileName} style={{color: '#ff4d4d', textDecoration: 'underline'}}>Download {item.data.fileName}</a>
                                            ) : (
                                                <p style={{ color: "white", margin: 0, wordWrap: "break-word" }}>{item.data.content}</p>
                                            )}
                                        </div>
                                    )) : <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: "20px" }}>No Messages Yet</p>}
                                    <div ref={chatEndRef} />
                                </div>
                            </DialogContent>
                            <DialogActions sx={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <div className={styles.chattingArea} style={{ width: '100%', borderTop: 'none', padding: 0 }}>
                                    <input
                                        accept="image/*,.pdf,.txt"
                                        style={{ display: 'none' }}
                                        id="raised-button-file"
                                        type="file"
                                        onChange={handleFileUpload}
                                    />
                                    <label htmlFor="raised-button-file">
                                        <IconButton component="span" style={{ color: "white", marginRight: "10px" }}>
                                            <AttachFileIcon />
                                        </IconButton>
                                    </label>
                                    <TextField
                                        fullWidth
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                sendMessage();
                                            }
                                        }}
                                        id="outlined-basic"
                                        label="Enter Your chat"
                                        variant="outlined"
                                        size="small"
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
                                    <Button variant='contained' onClick={sendMessage} style={{ backgroundColor: "#ff4d4d", marginLeft: '10px' }}>Send</Button>
                                </div>
                            </DialogActions>
                        </Dialog>


                        <div className={styles.buttonContainers}>
                            <IconButton onClick={handleVideo} style={{ color: "white" }}>
                                {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                            <IconButton onClick={handleEndCall} style={{ color: "red" }} title="Leave Meeting">
                                <CallEndIcon />
                            </IconButton>
                            {isHost && (
                                <IconButton onClick={handleEndForAll} style={{ color: "red", backgroundColor: "rgba(255,0,0,0.1)", marginLeft: "5px" }} title="End Meeting for All">
                                    <CancelPresentationIcon />
                                </IconButton>
                            )}
                            <IconButton onClick={handleAudio} style={{ color: "white" }}>
                                {audio === true ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>
                            <IconButton onClick={handleRaiseHand} style={{ color: raisedHands.includes(socketIdRef.current) ? "#4caf50" : "white" }} title="Raise Hand">
                                <PanToolIcon />
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

                            {isHost && (
                                <IconButton onClick={handleMuteAll} style={{ color: "orange", backgroundColor: "rgba(255,165,0,0.1)", marginLeft: "5px" }} title="Mute All Participants">
                                    <VolumeOffIcon />
                                </IconButton>
                            )}

                            <IconButton onClick={toggleCaptions} style={{ color: isCaptionsOn ? "#4caf50" : "white", marginLeft: "5px" }} title="Toggle Captions">
                                {isCaptionsOn ? <SubtitlesIcon /> : <SubtitlesOffIcon />}
                            </IconButton>

                            <IconButton onClick={() => setShowParticipantsPanel(!showParticipantsPanel)} style={{ color: showParticipantsPanel ? "#1976d2" : "white", marginLeft: "5px" }} title="Participants">
                                <PeopleIcon />
                            </IconButton>

                            <div style={{ position: 'relative' }}>
                                <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ color: "white", marginLeft: "5px" }} title="Send Reaction">
                                    <EmojiEmotionsIcon />
                                </IconButton>
                                {showEmojiPicker && (
                                    <div style={{
                                        position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)',
                                        backgroundColor: 'rgba(26, 28, 30, 0.9)', padding: '10px', borderRadius: '10px',
                                        display: 'flex', gap: '10px', zIndex: 100, border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {['👍', '❤️', '😂', '👏', '🎉'].map(emoji => (
                                            <span key={emoji} onClick={() => sendEmoji(emoji)} style={{ cursor: 'pointer', fontSize: '1.5rem', transition: 'transform 0.2s' }} onMouseEnter={e => e.target.style.transform='scale(1.2)'} onMouseLeave={e => e.target.style.transform='scale(1)'}>
                                                {emoji}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

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
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                    style={{ transform: "scaleX(-1)" }}
                                                    ref={ref => {
                                                        localVideoref.current = ref;
                                                        if (ref && window.localStream && ref.srcObject !== window.localStream) {
                                                            ref.srcObject = window.localStream;
                                                        }
                                                    }}
                                                ></video>
                                            ) : (
                                                <div className={styles.videoPlaceholder}>Camera Off</div>
                                            )
                                        ) : (
                                            <video
                                                data-socket={participant.socketId}
                                                ref={ref => {
                                                    if (ref && participant.stream && ref.srcObject !== participant.stream) {
                                                        ref.srcObject = participant.stream;
                                                    }
                                                }}
                                                autoPlay
                                                playsInline
                                            ></video>
                                        )}
                                        {!participant.isLocal && (
                                            <IconButton
                                                style={{ position: 'absolute', top: '10px', right: '10px', color: 'white', backgroundColor: 'rgba(0,0,0,0.5)' }}
                                                onClick={(e) => togglePiP(e, participant.socketId)}
                                                size="small"
                                            >
                                                <PictureInPictureAltIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                        {!participant.isLocal && isHost && (
                                            <IconButton
                                                style={{ position: 'absolute', top: '10px', right: '50px', color: '#ff4d4d', backgroundColor: 'rgba(0,0,0,0.5)' }}
                                                onClick={(e) => handleKick(participant.socketId, e)}
                                                size="small"
                                                title="Kick Participant"
                                            >
                                                <PersonRemoveIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                        {raisedHands.includes(participant.socketId) && (
                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '3rem', zIndex: 10 }}>
                                                ✋
                                            </div>
                                        )}
                                        {activeEmojis.filter(e => e.socketId === participant.socketId).map(emojiObj => (
                                            <div key={emojiObj.id} style={{ 
                                                position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)', 
                                                fontSize: '4rem', zIndex: 20,
                                                animation: 'floatUpAndFade 4s ease-out forwards'
                                            }}>
                                                {emojiObj.emoji}
                                            </div>
                                        ))}
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

                        {currentCaption && (
                            <div style={{
                                position: 'absolute', bottom: '150px', left: '50%', transform: 'translateX(-50%)',
                                backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px 20px',
                                borderRadius: '10px', fontSize: '1.2rem', zIndex: 500, textAlign: 'center',
                                maxWidth: '80%', wordWrap: 'break-word', backdropFilter: 'blur(5px)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <strong style={{ color: '#ff4d4d' }}>{currentCaption.username}:</strong> {currentCaption.text}
                            </div>
                        )}

                    </div>

                    {showParticipantsPanel && (
                        <div style={{
                            position: 'absolute', top: 0, right: 0, width: '320px', height: '100vh',
                            backgroundColor: '#1a1c1e', zIndex: 1100, borderLeft: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
                            animation: 'slideIn 0.3s ease-out'
                        }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: 'white' }}>Participants ({videos.length + 1})</h3>
                                <IconButton onClick={() => setShowParticipantsPanel(false)} style={{ color: 'white' }}>
                                    <CloseIcon />
                                </IconButton>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                                {[{ socketId: socketIdRef.current, username: username || "You", isLocal: true }, ...videos].map(p => (
                                    <div key={p.socketId} style={{ 
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                        marginBottom: '15px', color: 'white', padding: '10px',
                                        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#1976d2', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                                                {(p.username || "?").charAt(0).toUpperCase()}
                                            </div>
                                            <span>{p.isLocal ? "You (Me)" : p.username}</span>
                                        </div>
                                        {!p.isLocal && isHost && (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <IconButton size="small" style={{ color: '#ff4d4d' }} onClick={() => handleKick(p.socketId)} title="Kick">
                                                    <PersonRemoveIcon fontSize="small" />
                                                </IconButton>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

            }

        </div>
    )
}
