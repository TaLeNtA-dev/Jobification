import {z} from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {useForm  } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { post } from "../utiles/localStorage"
import { useState,useEffect } from "react"
import Overlay from "./Overlay"
import Styles from "./Posting.module.css"


export default function Posting({isPosting , setIsPosting,id=null}){
    
    const schema = z.object({
        caption:z.string().max(500,"Caption must not exceed 500 characters").nullable().optional(),
        media: z.instanceof(FileList).refine(files => files.length <= 1, 'Only one media allowed').refine(files => !files[0] || files[0].size <= 5 * 1024 * 1024,'media must be under 5MB').refine(
            files =>
                !files[0] ||
                ['image/jpeg', 'image/png', 'image/webp'].includes(files[0].type),'media must be JPEG, PNG, or WebP').optional(),
    }).refine(data => data.caption || (data.media && data.media.length > 0),{message: "Either a caption or media is required",path: ["caption"],});
    
    const {register , handleSubmit ,reset, setError, watch, formState:{errors , isSubmitting }} = useForm({resolver: zodResolver(schema),});
    const media = watch("media")
    const[mediaPre,setMediaPre]=useState();
    useEffect(() => {
        if (media && media.length > 0) {
            const objectUrl = URL.createObjectURL(media[0]);
            setMediaPre(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);  
        } else {
            setMediaPre(null); 
        }
    }, [media]);
    
    const mutate =useMutation({
        mutationFn:(data) => post(data),
        onSuccess: (data) => {
            reset();
            setIsPosting(false);
        },
        onError: (error) => {
        console.error('Failed:', error);
        },
    })

    const posting = (data)=>{
        const formData = new FormData();
        if(data.caption)formData.append("caption",data.caption);
        if(data.media)formData.append("media",data.media[0]);
        if(id)formData.append("compId",id);
        console.log(formData)
        mutate.mutate(formData)
    }
    return(
        <Overlay isOpen ={isPosting}  onClose={()=> setIsPosting(false)}>
            <form className="popupForm" onSubmit={handleSubmit(posting)}>
                <label className="label">Caption</label>
                <input type="textarea" {...register("caption")} className="input" placeholder="Caption"/>
                <span className="error">{errors.caption?.message} </span>

                <label className="label">Media</label>
                {mediaPre &&<img src={mediaPre} className="preview"/>}
                <div className="fileInput">
                    <input type="file" accept="image/png, image/jpeg, image/webp" {...register("media")} placeholder="Caption"/>
                </div>
                <span className="error">{errors.media?.message} </span>

                <button className="submit" disabled={isSubmitting}>{isSubmitting ? 'Posting...' : 'Submit'}</button>
            </form>
         </Overlay>
    )
}