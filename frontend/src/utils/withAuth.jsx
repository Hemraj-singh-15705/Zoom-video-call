import { useEffect } from "react";
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../contexts/AuthContext";
import { useContext } from "react";

const withAuth = (WrappedComponent ) => {
    const AuthComponent = (props) => {
        const { userData } = useContext(AuthContext);
        const router = useNavigate();

        useEffect(() => {
            if (!userData && !localStorage.getItem("token")) {
                router("/auth");
            }
        }, [userData, router]);

        return <WrappedComponent {...props} />
    }

    return AuthComponent;
}

export default withAuth;