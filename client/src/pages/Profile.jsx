import Styles from "./Profile.module.css"
import PostCard from "../components/PostCard.jsx"
import PInfo from "../components/PInfo.jsx"
import Pcut from "../utiles/Pcut"
import Pskill from "../components/Pskill.jsx"
import PInterest from "../components/PInterest.jsx"
import {profileInfo, getFollowers, follow,unfollow,Posts, getExperience, getEducation, getSkill } from "../utiles/localStorage.jsx"
import { useParams,NavLink } from "react-router-dom"
import { useQuery,useMutation } from "@tanstack/react-query"
import { AuthContext } from "../utiles/AuthProvider";
import { jwtDecode } from "jwt-decode";
import { useContext } from "react"
import { useState } from "react"
import PostExperience from "../components/PostExperience.jsx"
import PostEducation from "../components/postingEducation.jsx"
import PostSkill from "../components/postSkill.jsx"


export default function Profile(){
    function formatCount(num) {
    if (num === undefined || num === null) return '0';
    
    const absNum = Math.abs(num);
    
    if (absNum >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(1) + 'B';
    }
    if (absNum >= 1_000_000) {
        return (num / 1_000_000).toFixed(1) + 'M';
    }
    if (absNum >= 1_000) {
        return (num / 1_000).toFixed(1) + 'K';
    }
    return num.toString();
    }
    function timestamp(start,end){
        if (end===null) return`${start.slice(0,4)}/Present`
        if (start.slice(0,4)===end.slice(0,4))return`${start.slice(0,10)}/${end.slice(0,10)}`
        return `${start.slice(0,4)}/${end.slice(0,4)}`
    }
    let userName = useParams();
    userName = userName.userName;

    const { token } = useContext(AuthContext);

    let myName = null;
    let isOwner=false
    if (token) {
    try {
        const decoded = jwtDecode(token);
        myName = decoded.userName;
        isOwner= myName===userName;
    } catch (error) {
        console.warn("Invalid token", error);
    }
    }

    const { data:profile, isLoading:pLoading,} = useQuery({
        queryKey: ['profielInfo', userName],
        queryFn: () => profileInfo(userName),
        enabled:!!userName,
    });

    const { data:followers, isLoading:followersLoading,refetch:followersRefetch} = useQuery({
        queryKey: ['followers', userName],
        queryFn: () => getFollowers(profile.user_id,null),
        enabled:!!profile
    });

    const followMutate=useMutation({
        mutationFn:() => follow(profile.user_id,null),
        onSuccess: (data) => {
            followersRefetch();
        },
        onError: (error) => {
        console.error('Failed:', error);
        },
        enabled:!!followers
    })
    const unfollowMutate =useMutation({
        mutationFn:() => unfollow(profile.user_id,null),
        onSuccess: (data) => {
        followersRefetch();
        },
        onError: (error) => {
        console.error('Failed:', error);
        },
        enabled:!!followers
    })

    const{data:myPosts,isLoading:postsLoading}=useQuery({
        queryKey:["3 posts",profile?.user_id],
        queryFn:()=>Posts(undefined,3,undefined,profile.user_id),
        enabled:!!profile
    })

    const following=async()=>{
        followers?.isFollowing? unfollowMutate.mutate():followMutate.mutate()
    }

    let followersCount=followers?.followersCount;
    if(followers) followersCount=formatCount(followersCount);

    const {data:experience,isLoading:xpLoading}=useQuery({
        queryKey:["3 xp",userName],
        queryFn:()=>getExperience(userName)
    })
    const {data:education,isLoading:educationLoading}=useQuery({
        queryKey:["3 education",userName],
        queryFn:()=>getEducation(userName)
    })

    const {data:skills,isLoading:skillsLoading}=useQuery({
        queryKey:["3 skills",userName],
        queryFn:()=>getSkill(userName)
    })
   const[postingXP,setPostingXP]=useState(false)
   const[postingEducation,setPostingEducation]=useState(false)
   const[postingSkill,setPostingSkill]=useState(false)
    return(
       <div style={{display: "flex",alignItems: "center",flexDirection: "column"}} >
            <div className={Styles.tab} style={{ padding: "0px" }}>
                <div className={Styles.pics}>
                    <div className={Styles.bannerBox}>
                        <img className={Styles.banner}  src={!pLoading?profile.banner:undefined}></img>
                    </div>
                    <div className={Styles.nameBox}>
                        <img src={!pLoading?profile.pfp:undefined} className={Styles.logo}></img>
                    </div>
                    <div className={Styles.extraBs}>
                        <button className={Styles.extraB}>
                            <i className="fa-solid fa-link"></i>
                        </button>
                    </div>
                </div>
                <div className={Styles.fBody}>
                    <h1 className={Styles.name}>{!pLoading&&profile.profile_name}</h1>
                    <p className={Styles.headline}>{!pLoading&&profile?.headline}</p>
                    <h5 style={{filter:`opacity(80%)`}}>{!followersLoading&&`${followersCount} followers`}</h5>
                    {!isOwner&&<div className={Styles.buttons}>
                        <button className={`${followers?.isFollowing?Styles.otherBfilled:null} ${Styles.otherB}`} onClick={following}>Follow</button>
                        {profile?.website&&<a href={profile.website} target="_blank" rel="noopener"><button className={Styles.otherB}>Website</button></a>}
                        <button className={Styles.otherB}>Message</button>
                    </div>}
                </div>
            </div>

            <div style={{paddingBottom:"20px"}} className={Styles.tab}>
                <h1>About</h1>
                <Pcut text={!pLoading&&profile?.bio}/>
            </div>
            
            {myPosts && <div className={Styles.tab}>
                <h1>Activities</h1>
                <div className={Styles.posts}>
                    {!postsLoading&&myPosts?.map((p)=>{return <PostCard post={p} hight="200px" width="230px" key={p.id}/>})}
                </div>
                {myPosts?.length>=3&&<NavLink to={"./posts"}>
                    <div className={Styles.more}>
                        <h3>See More ...</h3>
                    </div>
                </NavLink>}
            </div>}

            <div className={Styles.tab} >
                {isOwner&&<button className={Styles.add} onClick={()=>setPostingXP(true)}>+</button>}
                <h1>Experience</h1>
                {experience&&experience.map((e,i,a)=>{return(
                    <div key={e.user_id}>
                     <PInfo howOld={false} img ={e.pfp} title={e.title}  desc={e.description} date={timestamp(e.started_at,e.ended_at)}/>
                     {i!=a.length-1&&<hr style={{width:"100%",filter:"opacity:60%" ,hight:"1px"}}/>}
                    </div>
                    )})}
                    {experience?.length>=3&&<NavLink to={"./experience"}>
                    <div className={Styles.more}>
                        <h3>See More ...</h3>
                    </div>
                    </NavLink>}
            </div>

            <div className={Styles.tab} >
                {isOwner&&<button className={Styles.add} onClick={()=>setPostingEducation(true)}>+</button>}
                <h1>Education</h1>
                {education&&education.map((e,i,a)=>{return (
                    <div key={e.user_id}>
                     <PInfo howOld={false} img ={e.logo} title={e.school}  desc={`${e.degree} ${e.field}`} date={timestamp(e.started_at,e.ended_at)}/>
                     {i!=a.length-1&&<hr style={{width:"100%",filter:"opacity:60%" ,hight:"1px"}}/>}
                    </div>
                    )})}
                    {education?.length>=3&&<NavLink to={"./education"}>
                    <div className={Styles.more}>
                        <h3>See More ...</h3>
                    </div>
                </NavLink>}
            </div>

            {/*<div className={Styles.tab} >
                <h1>Liecneces</h1>
                {false && data.map((e)=>{return <PInfo img ={e.pfp} url={e.userName} title={e.profile_name} key={e.user_id}/>})}
            </div>*/}

            <div className={Styles.tab} >
                {isOwner&&<button className={Styles.add} onClick={()=>setPostingSkill(true)}>+</button>}
                <h1>Skills</h1>
                {skills&& skills.map((e,i,a)=>{return (
                    <div key={e.id}>
                     <Pskill title={e.title} compName={e.compName} compPFP={e?.compPFP} />
                     {i!=a.length-1&&<hr style={{width:"100%",filter:"opacity:60%" ,hight:"1px"}}/>}
                    </div>
                    )})}
                    {skills?.length>=3&&<NavLink to={"./skills"}>
                    <div className={Styles.more}>
                        <h3>See More ...</h3>
                    </div>
                    </NavLink>}
            </div>
            {/*<div className={Styles.tab} >
                <h1>Interests</h1>
                {false && interests.voices.map((e)=>{return <PInterest />})}
            </div>*/}
            <PostExperience postingXP={postingXP} setPostingXP={setPostingXP}/>
            <PostEducation postingEducation={postingEducation} setPostingEducation={setPostingEducation}/>
            <PostSkill postingSkill={postingSkill} setPostingSkill={setPostingSkill}/>

        </div>
    )
}
 
