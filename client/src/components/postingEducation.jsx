import Overlay from "./Overlay";
import {z} from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query";
import { postEducation } from "../utiles/localStorage";
import {useForm  } from "react-hook-form"
import toast from 'react-hot-toast';
import { useEffect, useState } from "react";




export default function PostEducation({postingEducation=false,setPostingEducation}){
    const MAX_FILE_SIZE = 5 * 1024 * 1024; 
    const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
    const schema = z.object({
        school:z.string().max(50,"School name must not exceed 50 characters").min(1,"please fill this field"),
        degree:z.string().max(100,"Dield must not exceed a 100 character").min(1,"please fill this field"),
        field:z.string().max(100,"Field must not exceed a 100 character").min(1,"please fill this field"),
        logo: z.instanceof(FileList).optional().refine((files) => {
            if (!files || files.length === 0) return true; return files[0].size <= MAX_FILE_SIZE;}, "Logo must be less than 5MB")
            .refine((files) => {if (!files || files.length === 0) return true;return ACCEPTED_IMAGE_TYPES.includes(files[0].type);}, "Logo must be PNG, JPEG, or WEBP"),
        startedAt:z.string().date("Must be a valid date"),
        endedAt: z.preprocess((val) => (val === "" ? null : val),z.string().date("Must be a valid date").optional().nullable()),
    }) .superRefine((data, ctx) => {const today = new Date();const startDate = new Date(data.startedAt);
    if (startDate >= today) {
      ctx.addIssue({code: z.ZodIssueCode.custom,message: "Started date must be before today",path: ["startedAt"],});}
    if (data.endedAt) {const endDate = new Date(data.endedAt);
      if (endDate >= today) {ctx.addIssue({code: z.ZodIssueCode.custom,message: "Ended date must be before today",path: ["endedAt"],});}
      if (endDate <= startDate) {ctx.addIssue({code: z.ZodIssueCode.custom,message: "Started date must be before ended date",path: ["endedAt"],});}}});

    const {register , handleSubmit ,reset, setError,watch, formState:{errors , isSubmitting }} = useForm({resolver: zodResolver(schema),});
    const logo = watch('logo');
    const [logoPre, setLogoPre] = useState(null);
    useEffect(() => {
        if (logo && logo.length > 0) {
            const objectUrl = URL.createObjectURL(logo[0]);
            setLogoPre(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);  
        } else {
            setLogoPre(null); 
        }
        }, [logo]);

    const mutate = useMutation({
        mutationFn:(data)=> postEducation(data),
        onSuccess: () => {
            reset();
            setPostingEducation(false);
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
    const posting = async (data) => {
    const formData = new FormData();
    formData.append('school', data.school);
    formData.append('field', data.field);
    formData.append('degree', data.degree);
    formData.append('startedAt', data.startedAt);
    formData.append('endedAt', data.endedAt);
    if (data.logo?.[0]) formData.append('logo', data.logo[0]);
    console.log("submiting")
    mutate.mutate(formData);
    };


    return(
        <Overlay  isOpen={postingEducation} onClose={()=> setPostingEducation(false)}>
            <form className="popupForm" onSubmit={handleSubmit(posting)}>
                <label className="label">School Name</label>
                <input type="textarea" {...register("school")} className="input" placeholder="School Name"/>
                <span className="error">{errors.school?.message} </span>

                <label className="label">Degree</label>
                <input type="textarea" {...register("degree")} className="input" placeholder="Degree"/>
                <span className="error">{errors.degree?.message} </span>

                <label className="label">Field</label>
                <input type="textarea" {...register("field")} className="input" placeholder="Field"/>
                <span className="error">{errors.field?.message} </span>

                <label className='label'>Logo</label>
                {logoPre &&<img src={logoPre} className='preview'/>}
                <div className="fileInput">
                    <input accept="image/png, image/jpeg, image/webp" {...register("logo")} type="file" placeholder="Logo"></input>
                </div>

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