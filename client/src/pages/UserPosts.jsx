import { NavLink, useParams } from "react-router-dom";
import Styles from "./Home.module.css";
import PostCard from "../components/PostCard";
import { useState, useContext } from "react";
import Posting from "../components/Posting";
import { profileInfo, userPosts } from "../utiles/localStorage";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AuthContext } from "../utiles/AuthProvider";
import { jwtDecode } from "jwt-decode";
import InfiniteScroll from "react-infinite-scroll-component";

export default function UserPosts() {
  const { token } = useContext(AuthContext);
  const {userName}=useParams()
  let myUserName = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      myUserName = decoded.myUserName;
    } catch (error) {
      console.warn("Invalid token", error);
    }
  }
  const isOwner= userName ===myUserName;
  const { data:profile, isLoading:pLoading,} = useQuery({
      queryKey: ['profielInfo', myUserName],
      queryFn: () => profileInfo(myUserName),
      enabled:isOwner && !!myUserName
  });
  const limit = 9;
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts",userName],
    queryFn: ({ pageParam = 1 }) => userPosts(limit, pageParam,userName),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage?.length === limit) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });
  const allPosts = data?.pages.flat() ?? [];
  const [isPosting, setIsPosting] = useState(false);

  return (
    <>
       {isOwner&&<div className={Styles.tab}>
       <>
        <div className={Styles.postingC}>    
            <NavLink to={`/${myUserName}`}><img className={Styles.pfp} src={!pLoading?profile.pfp:"https://i.pinimg.com/originals/74/a3/b6/74a3b6a8856b004dfff824ae9668fe9b.jpg"} alt="profile" /></NavLink>
            <button className={Styles.postingButton}onClick={() => setIsPosting(true)}>Start a Post</button>
        </div>
          <div className={Styles.postingC}>
            <button className={Styles.postMediaButton}>
              <i className="fa-solid fa-image"></i>
              <h3>Picture</h3>
            </button>
            <button className={Styles.postMediaButton}>
              <i className="fa-solid fa-play"></i>
              <h3>Video</h3>
            </button>
            <button className={Styles.postMediaButton}>
              <i className="fa-solid fa-newspaper"></i>
              <h3>Article</h3>
            </button>
          </div></>
        
      </div>}

      {!isLoading && (
        <InfiniteScroll style={{textAlign:"center",padding:"5px"}} dataLength={allPosts.length} hasMore={hasNextPage} next={fetchNextPage} endMessage="you've reached the end!!!">
          <div className={Styles.posts} style={{paddingTop:"30px"}}>
            {allPosts.map((p) => (
              <PostCard key={p?.id} post={p} width="40vw" />
            ))}
          </div>
        </InfiniteScroll>
      )}

      {token && (
        <Posting isPosting={isPosting} setIsPosting={setIsPosting} />
      )}
    </>
  );
}