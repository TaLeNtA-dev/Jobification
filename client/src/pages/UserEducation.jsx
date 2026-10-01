import { useParams } from "react-router-dom";
import Styles from "./Home.module.css";
import { useState, useContext } from "react";
import { profileInfo, getEducation } from "../utiles/localStorage";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AuthContext } from "../utiles/AuthProvider";
import { jwtDecode } from "jwt-decode";
import InfiniteScroll from "react-infinite-scroll-component";
import PostEducation from "../components/postingEducation";
import PInfo from "../components/PInfo";

export default function UserEducation() {
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
      enabled:isOwner
  });

  const limit = 9;
  const {
    data:education,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["exper"],
    queryFn: ({ pageParam = 1 }) => getEducation(userName, limit, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage?.length === limit) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });
  const allPosts = education?.pages.flat() ?? [];
  const[postingEducation,setPostingEducation]=useState(false)

  return (
    <>
    <InfiniteScroll style={{textAlign:"center",padding:"5px"}} dataLength={allPosts.length} hasMore={hasNextPage} next={fetchNextPage}>
        <div className={Styles.tab} >
            {isOwner&&<button className={Styles.add} onClick={()=>setPostingXP(true)}>+</button>}
            {allPosts&&allPosts.map((e,i,a)=>{return(
                <div key={e.user_id}>
                    <PInfo howOld={false} img ={e.logo} title={e.school}  desc={`${e.degree} ${e.field}`} date={timestamp(e.started_at,e.ended_at)}/>
                    {i!=a.length-1&&<hr style={{width:"100%",filter:"opacity:60%" ,hight:"1px"}}/>}
                </div>
                )})}
        </div>
    </InfiniteScroll>
    <PostEducation postingEducation={postingEducation} setPostingEducation={setPostingEducation}/>
    </>
  )
}