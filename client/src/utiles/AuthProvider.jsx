import axios from "axios";
import {createContext, useLayoutEffect,useState,useEffect,useCallback } from "react";
import { getToken, api } from "./localStorage";


export const AuthContext = createContext();

export default function AuthProvider({children}){
    const[token,setToken]=useState();
    const[isSigned,setIsSigned]=useState(false);
    const[AuthLoading,setAuthLoading]=useState(true);
    //add token examin security logic
    const storeToken= useCallback((newToken)=>{
        setToken(newToken);
        setIsSigned(true);
    })


    useEffect(()=>{
        async function startupAuth() {
            try{
                const respons =await getToken();
                storeToken(respons.accessToken)
            }catch{
                setToken(null)
            } 
            setAuthLoading(false);
        }
        startupAuth()
    },[])

    useLayoutEffect(()=>{
        const authInterceptor = axios.interceptors.request.use((config)=>{
            config.headers.Authorization=!config._retry&&token?
                `Bearer ${token}`:
                config.headers.Authorization;
            return config
        })
        return(()=> axios.interceptors.request.eject(authInterceptor));
    },[token])

    useLayoutEffect(()=>{
        const refreshInterceptor = axios.interceptors.response.use((res)=>res,async (err)=>{
            const ogRequest = err.config
            if(err.response.status==401 && !ogRequest._retry){
                async function refreshToken() {
                    try{
                        const respons =await getToken();
                        storeToken(respons.accessToken);
                        ogRequest.headers.Authorization=`Bearer ${respons.accessToken}`;
                        ogRequest._retry=true;
                        return api(ogRequest);
                    }catch{
                        setToken(null)
                        //set logout function
                        return Promise.reject(err)
                    }
                }
                return refreshToken();
            }
            
        })
        return(()=> axios.interceptors.response.eject(refreshInterceptor));
    },[token])

    return(
        <AuthContext.Provider value={{storeToken,isSigned,AuthLoading,token}}>
            {children}
        </AuthContext.Provider>
    )
    
}