import React from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'
import { IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
export default function LandingPage() {


    const router = useNavigate();
    const [menuOpen, setMenuOpen] = React.useState(false);

    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <h2>LinkUp</h2>
                </div>
                
                <div className='mobileMenuIcon'>
                    <IconButton onClick={() => setMenuOpen(!menuOpen)} style={{ color: "white" }}>
                        <MenuIcon />
                    </IconButton>
                </div>

                <div className={`navlist ${menuOpen ? 'navlistMobileOpen' : ''}`}>
                    <p onClick={() => {
                        router("/aljk23")
                    }}>Join as Guest</p>
                    <p onClick={() => {
                        router("/auth")

                    }}>Register</p>
                    <div onClick={() => {
                        router("/auth")

                    }} role='button'>
                        <p>Login</p>
                    </div>
                </div>
            </nav>


            <div className="landingMainContainer">
                <div>
                    <h1><span style={{ color: "#FF9839" }}>Bringing</span>people closer no matter the distance</h1>

                    <p>through seamless video communication</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>
                <div>

                    <img src="/mobile.png" alt="" />

                </div>
            </div>



        </div>
    )
}
