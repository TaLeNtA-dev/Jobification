import { useParams } from "react-router-dom";
import Styles from "./Home.module.css";
import { useState, useContext } from "react";
import { profileInfo, getSkill } from "../utiles/localStorage";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AuthContext } from "../utiles/AuthProvider";
import { jwtDecode } from "jwt-decode";
import InfiniteScroll from "react-infinite-scroll-component";
import PostSkill from "../components/postSkill";
import Pskill from "../components/Pskill";
export default function UserSkills() {
  function timestamp(start,end){
        if (end===null) return`${start.slice(0,4)}/Present`
        if (start.slice(0,4)===end.slice(0,4))return`${start.slice(0,10)}/${end.slice(0,10)}`
        return `${start.slice(0,4)}/${end.slice(0,4)}`
    }
  const { token } = useContext(AuthContext);
  const {userName}=useParams()
  let myUserName = null;
  let id = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      myUserName = decoded.myUserName;
      id = decoded.sub
    } catch (error) {
      console.warn("Invalid token", error);
    }
  }
  const isOwner= userName ===myUserName;
  const { data:profile, isLoading:pLoading,} = useQuery({
      queryKey: ['profielInfo', myUserName],
      queryFn: () => profileInfo(myUserName),
      enabled:isOwner && !!myUserName,
  });

  const limit = 9;
  const {
    data:educatiom,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["exper"],
    queryFn: ({ pageParam = 1 }) => getSkill(userName, limit, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage?.length === limit) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });
  const allPosts = educatiom?.pages.flat() ?? [];


   const[postingSkill,setPostingSkill]=useState(false)

  return (
    <>
    <InfiniteScroll style={{textAlign:"center",padding:"5px"}} dataLength={allPosts.length} hasMore={hasNextPage} next={fetchNextPage}>
        <div className={Styles.tab} >
            {isOwner&&<button className={Styles.add} onClick={()=>setPostingXP(true)}>+</button>}
            {allPosts&&allPosts.map((e,i,a)=>{return(
            <div key={e.id}>
                <Pskill title={e.title} compName={e.compName} compPFP={e?.compPFP} />
                {i!=a.length-1&&<hr style={{width:"100%",filter:"opacity:60%" ,hight:"1px"}}/>}
            </div>
            )})}
        </div>
    </InfiniteScroll>
    <PostSkill postingSkill={postingSkill} setPostingSkill={setPostingSkill}/>
    </>
  )
}