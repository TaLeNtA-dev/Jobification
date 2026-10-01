import { useContext, useEffect } from "react";
import { useNavigate,Outlet } from "react-router-dom";
import { AuthContext } from "./AuthProvider";
export default function ProtectRoute(){
    const {isSigned,AuthLoading} = useContext(AuthContext);
    const nav = useNavigate();
    
    useEffect(()=>{
        if(!isSigned && !AuthLoading){
            nav("/login",{replace:true})
        }
    },[nav,isSigned,AuthLoading])
    
    return(<Outlet/>);
}