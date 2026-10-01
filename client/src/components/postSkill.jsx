import Overlay from "./Overlay";
import {optional, z} from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query";
import { postSkill } from "../utiles/localStorage";
import {useForm  } from "react-hook-form"
import toast from 'react-hot-toast';
import { useParams } from "react-router-dom";




export default function PostSkill({postingSkill=false,setPostingSkill}){
    const schema = z.object({
        title:z.string().max(50,"title must not exceed 50 characters").min(1,"please fill this field"),
        compName:z.string().max(50,"Company name must not exceed 50 characters").nullable().optional()
    }) 

    const {register , handleSubmit ,reset, setError, formState:{errors , isSubmitting }} = useForm({resolver: zodResolver(schema),});

    const mutate = useMutation({
        mutationFn:({title,compName})=> postSkill(title,compName),
        onSuccess: () => {
            reset();
            setPostingSkill(false);
        },
        
        onError: (error) => {
            console.log(error)
            if (error?.status && error?.data) {
                const status = error.status;
                const data = error.data;
                let message = "Something went wrong.";
                if (typeof data === "string") message = data;
                else if (data?.message) message = data.message;

                if (status === 500) {
                toast.error("Server error. Please try again later.");
                } else {toast.error(message);}
            } 
            else if (error instanceof Error && error.message === "Network Error") {
                toast.error("Network error. Check your internet connection.");
            }else {toast.error("An uneSkillected error occurred.");}
        }
    })
    const posting = (data)=>{
        mutate.mutate(data)
    }


    return(
        <Overlay  isOpen={postingSkill} onClose={()=> setPostingSkill(false)}>
            <form className="popupForm" onSubmit={handleSubmit(posting)}>
                <label className="label">Title</label>
                <input type="textarea" {...register("title")} className="input" placeholder="Title"/>
                <span className="error">{errors.title?.message} </span>

                <label className="label">Company Name</label>
                <input type="textarea" {...register("compName")} className="input" placeholder="Company Name"/>
                <span className="error">{errors.compName?.message} </span>

                <button className="submit" disabled={isSubmitting}>{isSubmitting ? 'Posting...' : 'Submit'}</button>
            </form>
        </Overlay>
    )
}