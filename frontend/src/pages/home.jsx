import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import MenuIcon from '@mui/icons-material/Menu';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

function HomeComponent() {


    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [scheduledLink, setScheduledLink] = useState("");

    let scheduleMeeting = () => {
        let code = Math.random().toString(36).substring(2, 7) + "-" + Math.random().toString(36).substring(2, 7);
        let link = window.location.origin + "/" + code;
        setScheduledLink(link);
    }

    let handleCopy = () => {
        navigator.clipboard.writeText(scheduledLink);
        toast.success("Meeting link copied to clipboard!");
    }


    const { addToUserHistory } = useContext(AuthContext);
    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return (
        <>

            <div className="navBar">

                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2>LinkUp Video Call</h2>
                </div>

                <div className='mobileMenuIcon'>
                    <IconButton onClick={() => setMenuOpen(!menuOpen)} style={{ color: "black" }}>
                        <MenuIcon />
                    </IconButton>
                </div>

                <div className={`navBarActions ${menuOpen ? 'navBarActionsMobileOpen' : ''}`} style={{ display: "flex", alignItems: "center" }}>
                    <div className="historyButton" onClick={() => navigate("/history")}>
                        <IconButton>
                            <RestoreIcon />
                        </IconButton>
                        <p>History</p>
                    </div>

                    <Button variant="contained" onClick={() => {
                        navigate("/simon-says")
                    }} style={{ marginLeft: "10px" }}>
                        SIMON SAYS
                    </Button>

                    <Button variant="contained" onClick={() => {
                        navigate("/elinkup-maintenance")
                    }} style={{ marginLeft: "10px" }}>
                        E-LinkUp
                    </Button>

                    <Button onClick={() => {
                        localStorage.removeItem("token")
                        toast.success("Logged out successfully")
                        navigate("/auth")
                    }} className="logoutButton">
                        Logout
                    </Button>
                </div>
            </div>


            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>Providing Quality Video Call Just Like Quality Education</h2>

                        <div style={{ display: 'flex', gap: "10px", marginBottom: "20px" }}>

                            <TextField onChange={e => setMeetingCode(e.target.value)} id="outlined-basic" label="Meeting Code" variant="outlined" />
                            <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>

                        </div>

                        <div style={{ display: 'flex', gap: "10px", flexWrap: 'wrap', alignItems: 'center' }}>
                            <Button onClick={scheduleMeeting} variant='outlined'>Schedule Meeting</Button>
                            {scheduledLink && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f0f0f0', padding: '5px 10px', borderRadius: '5px' }}>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{scheduledLink}</p>
                                    <Button onClick={handleCopy} size="small" variant="contained" color="success">Copy Link</Button>
                                    <Button size="small" variant="text" onClick={() => {
                                        addToUserHistory(scheduledLink.split('/').pop());
                                        navigate(`/${scheduledLink.split('/').pop()}`);
                                    }}>Start Now</Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className='rightPanel'>
                    <img srcSet='/logo3.png' alt="" />
                </div>
            </div>
        </>
    )
}


export default withAuth(HomeComponent)