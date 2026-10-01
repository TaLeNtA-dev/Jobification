import Styles from "./CreatCompany.module.css"
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import {useForm  } from "react-hook-form"
import { useMutation } from "@tanstack/react-query";
import { createCompany } from "../utiles/localStorage";
import { useNavigate } from "react-router-dom";

export default function CreatCompany(){
    const nav = useNavigate()

    

const MAX_FILE_SIZE = 5 * 1024 * 1024; 
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

const schema = z.object({
  pageName: z.string().min(1, "Page Name is required").max(100, "Page Name must be 100 characters or less"),
  pageURL: z.string().min(1, "Page URL is required").regex(/^[a-zA-Z0-9-]+$/,"Page URL must only contain letters, numbers, and hyphens"),
  industry: z.string().min(1, "Industry is required"),
  companySize: z.string().min(1, "Company Size is required"),
  companyType: z.string().min(1, "Company Type is required"),
  logo: z.instanceof(FileList).optional().refine((files) => {
      if (!files || files.length === 0) return true; return files[0].size <= MAX_FILE_SIZE;}, "Logo must be less than 5MB")
    .refine((files) => {if (!files || files.length === 0) return true;return ACCEPTED_IMAGE_TYPES.includes(files[0].type);}, "Logo must be PNG, JPEG, or WEBP"),
  banner: z.instanceof(FileList).optional()
    .refine((files) => {if (!files || files.length === 0) return true;return files[0].size <= MAX_FILE_SIZE;}, "Banner must be less than 5MB")
    .refine((files) => {if (!files || files.length === 0) return true;return ACCEPTED_IMAGE_TYPES.includes(files[0].type);}, "Banner must be PNG, JPEG, or WEBP"),
  tagline: z.string().max(120, "Tagline must be 120 characters or less").optional(),
  website: z.string().url("Please enter a valid URL (e.g., https://example.com)").optional().or(z.literal("")), 
  location: z.string().optional(),
  foundingYear: z.string().optional()
  .refine((val) => {
    if (!val) return true;
    const num = Number(val);
    const currentYear = new Date().getFullYear();
    return Number.isInteger(num) && num >= 1900 && num <= currentYear;
  }, `Founding Year must be between 1900 and ${new Date().getFullYear()}`),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address")
});



    const {register , handleSubmit ,reset, setError,watch , formState:{errors , isSubmitting}} = useForm({resolver: zodResolver(schema),})

    const logo = watch('logo');
    const banner = watch('banner');
    const [logoPre, setLogoPre] = useState(null);
    const [bannerPre, setBannerPre] = useState(null);

    const mutate = useMutation({
        mutationFn:(formData)=> createCompany(formData),
        onSuccess:(res)=>{
            nav(`/Company/${res.companyURL}`)
        },
        onError: (err) => {
            const message = err?.data || err.message || "Company creation failed";

            if (message.includes("You already own a company")) {
            setError("root", { message: "You already own a company" });
            } 
            else if (message.includes("Page URL already taken")) {
            setError("pageURL", { message: "Page URL already taken" });
            } 
            else if (message.includes("Email already in use")) {
            setError("email", { message: "Email already in use" });
            } 
            else if (message.includes("Company name already taken")) {
            setError("pageName", { message: "Company name already taken" });
            } 
            else if (message.includes("required")) {
            if (message.includes("Page Name")) setError("pageName", { message: "Page Name is required" });
            else if (message.includes("Page URL")) setError("pageURL", { message: "Page URL is required" });
            else if (message.includes("Email")) setError("email", { message: "Email is required" });
            else if (message.includes("Industry")) setError("industry", { message: "Industry is required" });
            else if (message.includes("Company Size")) setError("companySize", { message: "Company Size is required" });
            else if (message.includes("Company Type")) setError("companyType", { message: "Company Type is required" });
            else setError("root", { message: message });
            }
            else if (message.includes("Invalid email format")) {
            setError("email", { message: "Invalid email format" });
            }
            else {
            setError("root", { message: message || "An unknown error occurred" });
            }
        },
    })

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
    }, [banner])

    const create = async (data) => {
    const formData = new FormData();
    formData.append('pageName', data.pageName);
    formData.append('pageURL', data.pageURL);
    formData.append('email', data.email);
    formData.append('industry', data.industry);
    formData.append('companySize', data.companySize);
    formData.append('companyType', data.companyType);
    if (data.logo?.[0]) formData.append('logo', data.logo[0]);
    if (data.banner?.[0]) formData.append('banner', data.banner[0]);
    if (data.tagline) formData.append('tagline', data.tagline);
    if (data.website) formData.append('website', data.website);
    if (data.location) formData.append('location', data.location);
    if (data.foundingYear) formData.append('foundingYear', data.foundingYear);
        console.log("submiting")
    mutate.mutate(formData);
    };

    return(
        <form className='form'  onSubmit={handleSubmit(create)}>
            <label className='label'>Page Name</label>
            <input {...register("pageName")} type="text" placeholder="Page Name" className='input'></input>
            <span className='error'>{errors.pageName?.message} </span>

            <label className='label'>Page URL</label>
            <input {...register("pageURL")} type="text" placeholder="Page URL" className='input'></input>
            <span className='error'>{errors.pageURL?.message} </span>

            <label className='label'>Email</label>
            <input {...register("email")} type="email" placeholder="Email" className='input'></input>
            <span className='error'>{errors.email?.message} </span>
        
            <label className='label'>Industry</label>
            <input {...register("industry")} type="text" placeholder="Industry" className='input'></input>
            <span className='error'>{errors.industry?.message} </span>
        
            <label className='label'>Company Size</label>
            <input {...register("companySize")} type="text" placeholder="Company Size" className='input'></input>
            <span className='error'>{errors.companySize?.message} </span>
        
            <label className='label'>Company Type</label>
            <input {...register("companyType")} type="text" placeholder="Company Type" className='input'></input>
            <span className='error'>{errors.companyType?.message} </span>

            <label className='label'>Logo</label>
            {logoPre &&<img src={logoPre} className='preview'/>}
            <div className="fileInput">
                <input accept="image/png, image/jpeg, image/webp" {...register("logo")} type="file" placeholder="Logo"></input>
            </div>
            <span className='error'>{errors.logo?.message} </span>

            <label className='label'>Banner</label>
            {bannerPre &&<img src={bannerPre} className='preview'/>}
            <div className="fileInput">
                <input accept="image/png, image/jpeg, image/webp" {...register("banner")} type="file" placeholder="Banner"></input>
            </div>
            
            <span className='error'>{errors.banner?.message} </span>

            <label className='label'>Tagline</label>
            <input {...register("tagline")} type="text" placeholder="Tagline" className='input'></input>
            <span className='error'>{errors.tagline?.message} </span>

            <label className='label'>Website</label>
            <input {...register("website")} type="url" placeholder="Website" className='input'></input>
            <span className='error'>{errors.website?.message} </span>

            <label className='label'>Location</label>
            <input {...register("location")} type="text" placeholder="Location" className='input'></input>
            <span className='error'>{errors.location?.message} </span>

            <label className='label'>Founding Year</label>
            <input {...register("foundingYear")} type="number" placeholder="Founding Year" className='input'></input>
            <span className='error'>{errors.foundingYear?.message} </span>

            <button className='submit' disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Company"}</button>
            <span className="error">{errors.root?.message} </span>

        </form>
    )

}