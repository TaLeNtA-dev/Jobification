import Overlay from "./Overlay";
import {z} from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query";
import { postExperience } from "../utiles/localStorage";
import {useForm  } from "react-hook-form"
import toast from 'react-hot-toast';
import { useParams } from "react-router-dom";




export default function PostExperience({postingXP=false,setPostingXP}){
    const {userName}=useParams();
    const schema = z.object({
        title:z.string().max(255,"title must not exceed 255 characters").min(1,"please fill this field"),
        companyName:z.string().max(500,"Caption must not exceed 500 characters").min(1,"please fill this field"),
        desc:z.string().max(500,"Description must not exceed 500 characters").nullable().optional(),
        startedAt:z.string().date("Must be a valid date"),
        endedAt: z.preprocess((val) => (val === "" ? null : val),z.string().date("Must be a valid date").optional().nullable()),
    }) .superRefine((data, ctx) => {const today = new Date();const startDate = new Date(data.startedAt);
    if (startDate >= today) {
      ctx.addIssue({code: z.ZodIssueCode.custom,message: "Started date must be before today",path: ["startedAt"],});}
    if (data.endedAt) {const endDate = new Date(data.endedAt);
      if (endDate >= today) {ctx.addIssue({code: z.ZodIssueCode.custom,message: "Ended date must be before today",path: ["endedAt"],});}
      if (endDate <= startDate) {ctx.addIssue({code: z.ZodIssueCode.custom,message: "Started date must be before ended date",path: ["endedAt"],});}}});

    const {register , handleSubmit ,reset, setError, formState:{errors , isSubmitting }} = useForm({resolver: zodResolver(schema),});

    const mutate = useMutation({
        mutationFn:({companyName,title,desc,startedAt,endedAt})=> postExperience(userName,companyName,title,desc,startedAt,endedAt),
        onSuccess: () => {
            reset();
            setPostingXP(false);
        },
        
        onError: (error) => {
            console.log(error)
            if (error?.status && error?.data) {
                const status = error.status;
                const data = error.data;

                if (status === 404 && data?.field === 'companyName') {
                setError('companyName', {type: 'manual',message: data.message || 'Company does not exist.',});
                return}
                let message = "Something went wrong.";
                if (typeof data === "string") message = data;
                else if (data?.message) message = data.message;

                if (status === 500) {
                toast.error("Server error. Please try again later.");
                } else {toast.error(message);}
            } 
            else if (error instanceof Error && error.message === "Network Error") {
                toast.error("Network error. Check your internet connection.");
            }else {toast.error("An unexpected error occurred.");}
        }
    })
    const posting = (data)=>{
        mutate.mutate(data)
    }


    return(
        <Overlay  isOpen={postingXP} onClose={()=> setPostingXP(false)}>
            <form className="popupForm" onSubmit={handleSubmit(posting)}>
                <label className="label">Title</label>
                <input type="textarea" {...register("title")} className="input" placeholder="Title"/>
                <span className="error">{errors.title?.message} </span>

                <label className="label">Company Name</label>
                <input type="textarea" {...register("companyName")} className="input" placeholder="Company Name"/>
                <span className="error">{errors.companyName?.message} </span>

                <label className="label">Description</label>
                <input type="textarea" {...register("desc")} className="input" placeholder="Description"/>
                <span className="error">{errors.desc?.message} </span>

                <label className="label">Start Date</label>
                <input type="date" {...register("startedAt")} className="input" placeholder="Start Date"/>
                <span className="error">{errors.startedAt?.message} </span>

                <label className="label">End Date</label>
                <input type="date" {...register("endedAt")} className="input" placeholder="End Date"/>
                <span className="error">{errors.endedAt?.message} </span>

        
                <button className="submit" disabled={isSubmitting}>{isSubmitting ? 'Posting...' : 'Submit'}</button>
            </form>
        </Overlay>
    )
}