import { useState } from "react"
import {useForm  } from "react-hook-form"
import styles from "./Offer.module.css"
import { offerJob } from "../utiles/localStorage"
import { z} from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query";

function Offer ({id}) {
    const today = new Date().toISOString().split("T")[0];
    const schema =z.object({
        title: z.string().min(1,"please fill this field"),
        location: z.string().min(1,"please fill this field"),
        salary: z.coerce.number("Not a Number").min(1,"too small"),
        type: z.string().min(1, "type is required"),
        category: z.string().min(1,"please fill this field"),
        experienceLevel: z.string().min(1,"please fill this field"),
        description: z.string().min(1,"please fill this field"),
        requirements:z.string().min(1,"please fill this field"),
        responsibilities:z.string().min(1,"please fill this field"),
        website: z.string().url("Please enter a valid website URL"),
        deadline:z.string().regex(/^\d{4}-\d{2}-\d{2}$/,{message:"date not valid"}).refine(d => d >= today, {message: "Date cannot be in the past",})
    })
    const {register , handleSubmit ,reset, setError , formState:{errors , isSubmitting }} = useForm({resolver: zodResolver(schema),})    
    
    const onsubmit = async (data) =>{
        data.id= id;
        await offerJob(data)
        reset()
    }
    return(
        
        <form className="popupForm" onSubmit={handleSubmit(onsubmit)}>


            <label className='label'>Title</label>
            <input className="input" defaultValue={null} type="text" {...register("title")} placeholder="Title"></input>
            <span className="error">{errors.title?.message} </span>

            <label className='label'>Location</label>
            <input className="input" defaultValue={null} type="text" {...register("location")} placeholder="Location"></input>
            <span className="error">{errors.location?.message} </span>

            <label className='label'>Salary</label>
            <input className="input" defaultValue={null} type="number"  {...register("salary")} placeholder="Salary"></input>
            <span className="error">{errors.salary?.message} </span>
            
            <label className='label'>type</label>
            <input className="input" defaultValue={null} type="text" {...register("type")} placeholder="type"></input>
            <span className="error">{errors.type?.message} </span>

            <label className='label'>Category</label>
            <input className="input" defaultValue={null} type="text" {...register("category")} placeholder="Category"></input>
            <span className="error">{errors.category?.message} </span>

            <label className='label'>Experience Level</label>
            <input className="input" defaultValue={null} type="text" {...register("experienceLevel")} placeholder="Experience Level"></input>
            <span className="error">{errors.experienceLevel?.message} </span>

            <label className='label'>Description</label>
            <input className="input" defaultValue={null} type="text" {...register("description")} placeholder="Description"></input>
            <span className="error">{errors.description?.message} </span>

            <label className='label'>Requirements</label>
            <input className="input" defaultValue={null} type="text" {...register("requirements")} placeholder="Requirements"></input>
            <span className="error">{errors.requirements?.message} </span>

            <label className='label'>Responsibilities</label>
            <input className="input" defaultValue={null} type="text" {...register("responsibilities")} placeholder="Responsibilities"></input>
            <span className="error">{errors.responsibilities?.message} </span>

            <label className='label'>Applying Website</label>
            <input className="input" defaultValue={null} type="url" {...register("website")} placeholder="Applying Website"></input>
            <span className="error">{errors.website?.message} </span>

            <label className='label'>Deadline</label>
            <input className="input" defaultValue={null} type="date" {...register("deadline")} placeholder="Deadline"></input>
            <span className="error">{errors.deadline?.message} </span>

            <button className="submit">{isSubmitting? "Offering..." : "Offer"}</button>
        </form>
    )
}
export default Offer

