import Styles from "./SignUp.module.css"
import {useNavigate } from "react-router-dom"
import {signUp } from "../utiles/localStorage"
import {Mutation, useMutation } from '@tanstack/react-query';
import {useContext, useState, useEffect } from "react";
import {z} from "zod"
import {zodResolver } from "@hookform/resolvers/zod"
import {useForm  } from "react-hook-form"
import {AuthContext } from "../utiles/AuthProvider";


export default function SignUp(){
    const nav = useNavigate();
    const {storeToken}=useContext(AuthContext)


    const schema = z.object({
        name: z .string().min(3, 'Name must at least have 3 characters').max(100, 'Name too long'),
        userName:z.string().min(3,"User name must at least have 3 characters").max(20,"User name must not exceed 20 characters").regex(/^[^\s'"\\]+$/, "No quotes or backslashes allowed"),
        email:z.string().email(),
        password:z.string().min(6,"password must at least have 6 characters").max(20,"password must not exceed 20 characters").regex(/^[^\s'"\\]+$/, "No spaces, quotes, or backslashes allowed"),
        phoneNumber:z.preprocess((val) => (val === '' ? undefined : val),z.string().regex(/^(0[5-7]\d{8}|\+213[5-7]\d{8})$/,'Invalid phone number – use 0XXXXXXXXX or +213XXXXXXXXX').nullable().optional()),
        logo: z.instanceof(FileList).refine(files => files.length <= 1, 'Only one logo allowed').refine(files => !files[0] || files[0].size <= 2 * 1024 * 1024,'Logo must be under 2MB').refine(
            files =>
                !files[0] ||
                ['image/jpeg', 'image/png', 'image/webp'].includes(files[0].type),'Logo must be JPEG, PNG, or WebP').optional(),

        banner: z.instanceof(FileList).refine(files => files.length <= 1, 'Only one banner allowed').refine(files => !files[0] || files[0].size <= 5 * 1024 * 1024,'Banner must be under 5MB').refine(
            files =>
                !files[0] ||
                ['image/jpeg', 'image/png', 'image/webp'].includes(files[0].type),'Banner must be JPEG, PNG, or WebP').optional(),

        website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
        bio: z.string().max(500, 'Bio must be under 500 characters').optional().or(z.literal('')),
        location: z.string().max(200, 'location must be under 200 characters').optional().or(z.literal('')),
    })
    const {register , handleSubmit ,reset, setError , watch ,formState:{errors , isSubmitting }} = useForm({resolver: zodResolver(schema),});

    const logo = watch('logo');
    const banner = watch('banner');
    const [logoPre, setLogoPre] = useState(null);
    const [bannerPre, setBannerPre] = useState(null);

    useEffect(() => {
    if (logo && logo.length > 0) {
        const objectUrl = URL.createObjectURL(logo[0]);
        setLogoPre(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);  
    } else {
        setLogoPre(null); 
    }
    }, [logo]);

    useEffect(() => {
    if (banner && banner.length > 0) {
        const objectUrl = URL.createObjectURL(banner[0]);
        setBannerPre(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    } else {
        setBannerPre(null);
    }
    }, [banner]);

    const mutate =useMutation({
        mutationFn:(user) => signUp(user),
        onSuccess: (data) => {
            storeToken(data.accessToken)
            reset();
            nav("/");
        },
        onError: (err) => {
            const message = err?.data || err.message || "Registration failed";

            if (message.includes("UserName already taken")) {
                setError("userName", { message: "Username already taken" });
                return;
            }
            
            if (message.includes("Email already in use")) {
                setError("email", { message: "Email already in use" });
                return;
            }
            
            if (message.includes("UserName is missing")) {
                setError("userName", { message: "Username is required" });
                return;
            }
            
            if (message.includes("Name is missing")) {
                setError("name", { message: "Name is required" });
                return;
            }
            
            if (message.includes("Password is missing")) {
                setError("password", { message: "Password is required" });
                return;
            }
            
            if (message.includes("Email is missing")) {
                setError("email", { message: "Email is required" });
                return;
            }
            
            if (message.includes("Invalid email format")) {
                setError("email", { message: "Please enter a valid email address" });
                return;
            }

            console.error("Signup error:", err);
            setError("root", { message: message });
            }
    })
    const signing= async(data)=>{
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('userName', data.userName);
        formData.append('email', data.email);
        formData.append('password', data.password); 
        if (data.phoneNumber) formData.append('phoneNumber', data.phoneNumber);
        if (data.logo?.[0]) formData.append('logo', data.logo[0]);
        if (data.banner?.[0]) formData.append('banner', data.banner[0]);
        if (data.website) formData.append('website', data.website);
        if (data.bio) formData.append('bio', data.bio);

        if(!mutate.isPending) mutate.mutate(formData)
   }
    return(
        <form className="form" onSubmit={handleSubmit(signing)}>
            <h1 >Sign up</h1>

            <p style={{margin:"10px 50px 20px",textAlign:"center"}}>Disclaimer*: your informations are being stored so don't enter your real credentials</p>

            <label className="label">User name</label>
            <input  {...register("userName")} type="text" placeholder="user name" className="input"></input>
            <span className="error">{errors.userName?.message} </span>
            
            <label className="label">Name</label>
            <input {...register("name")} type="text" placeholder="Name" className="input"></input>
            <span className="error">{errors.name?.message} </span>

            <label className="label">Email</label>
            <input {...register("email")} type="text" placeholder="Email" className="input"></input>
            <span className="error">{errors.email?.message} </span>

            <label className="label">Password</label>
            <input  {...register("password")} type="password" placeholder="Password" className="input"></input>
            <span className="error">{errors.password?.message} </span>

            <label className="label">Logo</label>
            {logoPre &&<img src={logoPre} className="preview"/>}
            <div className="fileInput">
                <input accept="image/png, image/jpeg, image/webp" {...register("logo")} type="file" placeholder="Logo" ></input>
            </div>
            
            <span className="error">{errors.logo?.message} </span>

            <label className="label">Banner</label>
            {bannerPre &&<img src={bannerPre} className="preview"/>}
            <div className="fileInput">
                <input accept="image/png, image/jpeg, image/webp" {...register("banner")} type="file" placeholder="Banner" ></input>
            </div>
            <span className="error">{errors.banner?.message} </span>

            <label className="label">Bio</label>
            <input {...register("bio")} type="text" placeholder="Bio" className="input"></input>
            <span className="error">{errors.bio?.message} </span>

            <label className="label">Website</label>
            <input {...register("website")} type="text" placeholder="Website" className="input"></input>
            <span className="error">{errors.website?.message} </span>

            <label className="label">Phone number</label>
            <input  {...register("phoneNumber")} type="text" placeholder="phone number" className="input"></input>
            <span className="error">{errors.phoneNumber?.message} </span>

            <button className="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing up...' : 'Submit'}</button>
            <span className="error">{errors.root?.message} </span>
            <button type="button" className="submit" disabled={isSubmitting||mutate.isPending} onClick={()=> nav("/login")}>use an existing acount</button>
        </form>
    )
}