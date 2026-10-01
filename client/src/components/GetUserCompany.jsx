import { useQuery } from "@tanstack/react-query"
import { getMyCompany } from "../utiles/localStorage"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function GetUserCompany(){
    const nav = useNavigate()
    const {data,isLoading,isSuccess}=useQuery({
        queryKey:["myCompany"],
        queryFn:getMyCompany,
        
    })
    useEffect(()=>{
        if(isSuccess&&data?.companyURL) nav(`/company/${data?.companyURL}`)
    },[data,isSuccess])
    return(
        <h1>LOADING...</h1>
    )
}