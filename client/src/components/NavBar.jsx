import { NavLink, Outlet, useLocation,useNavigate,useParams } from "react-router-dom";
import styles from "./NavBar.module.css"
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "../utiles/AuthProvider";
import { useContext, useEffect, useRef, useState} from "react";
import { useQuery } from "@tanstack/react-query";
import { profileInfo } from "../utiles/localStorage";
function NavBar(){
    const {token,isSigned} = useContext(AuthContext);
    let userName = null;
    if (token) {
        try {
        const decoded = jwtDecode(token);
        userName = decoded.userName;
        } catch (error) {
        console.error("Invalid token:", error);
        }
    }

    //fetch profile data
    const{data:p, isLoading:pLoading}=useQuery({
        queryKey:["profileInfo",userName],
        queryFn: ()=>profileInfo(userName),
        enabled:!!userName,
    })

    //links handle
    let inHome = useParams()
    inHome = Number(inHome.id)
    const link = useLocation()
    const nav = useNavigate()

    //popup setup
    const [pfpPopUp,setPfpPopUp]=useState(false)
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const popupRef = useRef(null);
    const pfpRef = useRef(null);

    useEffect(() => {
    if (!pfpPopUp) return;

    const handleClick = (e) => {
        const target = e.target;

        if (
        popupRef.current &&
        !popupRef.current.contains(target) &&
        pfpRef.current &&
        !pfpRef.current.contains(target)
        ) {
        setPfpPopUp(false);
        }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
    }, [pfpPopUp]);
    useEffect(() => {
    const updatePosition = () => {
        if (pfpRef.current) {
        const rect = pfpRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, left: rect.left - 100 });
        }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => {
        window.removeEventListener('resize', updatePosition);
    };
    }, [pfpRef, pLoading]);
return (
    <>
        <div className={styles.container}>
            <NavLink className={styles.Nav} to="">HOME</NavLink>
            <NavLink className={styles.Nav} to={!inHome ? "/jobs/1" : link.pathname}>JOBS</NavLink>
            <NavLink className={styles.Nav} to="contacts">CONTACTS</NavLink>
            {!pLoading&&<img ref={pfpRef} className={styles.logo} src={p.pfp} onClick={()=>setPfpPopUp(!pfpPopUp)}/>}
                {pfpPopUp &&<div ref={popupRef} style={{position: 'fixed',top: pos.top,left: pos.left,}} className={styles.popupMenu}>
                    <div className={styles.popupProfile} onClick={()=>nav(`/${userName}`)}>
                        <img className={styles.popupLogo} src={p.pfp}/>
                        <div className={styles.popupTitle}>
                            <h4 style={{fontWeight:"bold",margin:"5px"}}>{p.profile_name}</h4>
                            <h4 style={{fontWeight:"lighter",margin:"5px"}}>{p.bio}</h4>
                        </div>
                    </div>
                    <hr style={{margin:"5px 5%",opacity:"60%",border:"none",borderTop:"1px solid grey"}}/>
                    <NavLink to="Company"><h5 className={styles.popupText}>Company</h5></NavLink>
                    <NavLink to="/login"><h5 className={styles.popupText}>{isSigned?"Logout":"LogIn"}</h5></NavLink>
                </div>}

        </div>
        <Outlet/>
    </>
);
}
export default NavBar