import Styles from "../pages/Profile.module.css"
import PostCard from "./PostCard"
import JobCard from "./JobCard"
import { NavLink } from "react-router-dom"
import Pcut from "../utiles/Pcut"
import { useQuery } from "@tanstack/react-query"
import { getCompanyJobs, Posts } from "../utiles/localStorage"
import { useContext } from "react"
import { CompContext } from "../pages/CompProfile"
function PHome() {
const {comp,isLoading} = useContext(CompContext)
const{data:jobs,isLoading:jobsLoading}=useQuery({
    queryKey:["3 companyJobs"],
    queryFn:()=>getCompanyJobs(comp.id,3),
     enabled:!!comp?.id
})

const{data:myPosts,isLoading:postsLoading}=useQuery({
    queryKey:["3 posts",comp?.id],
    queryFn:()=>Posts(comp.id,3),
    enabled:!!comp?.id
})
return(
<>
    <div className={`${Styles.aboutTab} ${Styles.tab}`}>
        <h1>ABOUT US</h1>
        <Pcut text={!isLoading?comp.bio:""} />
        <NavLink to={"./about"}>
            <div className={Styles.more}>
                <h3>See More ...</h3>
            </div>
        </NavLink>
    </div>
    <div className={Styles.tab}>
        <h1>JOB OFFERS</h1>
        <div className={Styles.jobs}>
            {!jobsLoading&&jobs?.map((j)=>{return <JobCard job = {j} key={j.id}/>})}
        </div>
        <NavLink to={"./jobs"}>
            <div className={Styles.more}>
                <h3>See More ...</h3>
            </div>
        </NavLink>
    </div>

    <div className={Styles.tab} >
        <h1 style={{margin: 20 + 'px'}}>NEW POSTS</h1>
        <div className={Styles.posts}>
            {!postsLoading&&myPosts?.map((p)=>{return <PostCard post={p} hight="200px" width="230px" key={p.id}/>})}
        </div>
        <NavLink to={"./posts"}>
            <div className={Styles.more}>
                <h3>See More ...</h3>
            </div>
        </NavLink>
    </div>


</>
)
}
export default PHome