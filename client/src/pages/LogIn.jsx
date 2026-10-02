import { useNavigate } from "react-router-dom"
import Styles from "./Login.module.css"
import { login } from "../utiles/localStorage"
import { Mutation, useMutation } from '@tanstack/react-query';
import { useContext, useState } from "react";
import { z} from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {useForm  } from "react-hook-form"
import { AuthContext } from "../utiles/AuthProvider";

function LogIn (){
    const nav = useNavigate();
    const {storeToken}=useContext(AuthContext)


    const schema = z.object({
        email:z.string().email(),
        password:z.string().min(6,"password must at least have 6 characters").max(20,"password must not exceed 20 characters").regex(/^[^\s'"\\]+$/, "No spaces, quotes, or backslashes allowed"),
    })
    const {register , handleSubmit ,reset, setError , formState:{errors , isSubmitting }} = useForm({resolver: zodResolver(schema),})

    const mutate =useMutation({
        mutationFn:(user) => login(user),
        onSuccess: (data) => {
        storeToken(data.accessToken)
        nav("/");
        },
        onError: (err) => {
            console.log(err)
            const message = err?.data || err.message || "Login failed";
            if (message.includes("Invalid email")){setError("email",{ message: message });return}
            else if(message.includes("Invalid password")){setError("password",{ message: message });return}
            else if (message.includes("Email or password are required")) {
                if (!email) setError("email", { message: "Email is required" });
                if (!password) setError("password", { message: "Password is required" });
                return
            }else{
            console.error("Login error:", err);
            setError("root",{ message: message });
            }
        }
    })
    const loger= async(user)=>{
       if(!mutate.isPending) mutate.mutate(user)

   }
    return(
        <form className="form" onSubmit={handleSubmit(loger)}>
            <h1 >Login</h1>
            <p style={{margin:"10px 50px 20px",textAlign:"center"}}>Disclaimer*: your informations are being stored so don't enter your real credentials</p>
            <label className="label">Email</label>
            <input {...register("email")} type="text" placeholder="Email" className="input"></input>
            <span className="error">{errors.email?.message} </span>
            <label className="label">Password</label>
            <input {...register("password")} type="password" placeholder="Password" className="input"></input>
            <span className="error">{errors.password?.message} </span>
            <button className="submit" disabled={isSubmitting}>{isSubmitting ? 'Login in...' : 'Login'}</button>
            <span className="error">{errors.root?.message} </span>
            <button type="button" className="submit" disabled={isSubmitting||mutate.isPending} onClick={()=> nav("/Signup")}>Creat a new account</button>
        </form>
    )
}
export default LogIn