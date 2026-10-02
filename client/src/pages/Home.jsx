import { NavLink } from "react-router-dom";
import Styles from "./Home.module.css";
import PostCard from "../components/PostCard";
import { useState, useContext } from "react";
import Posting from "../components/Posting";
import { profileInfo, Posts } from "../utiles/localStorage";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AuthContext } from "../utiles/AuthProvider";
import { jwtDecode } from "jwt-decode";
import InfiniteScroll from 'react-infinite-scroll-component';

export default function Home() {
  const { token } = useContext(AuthContext);

  let userName = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userName = decoded.userName;
    } catch (error) {
      console.warn("Invalid token", error);
    }
  }
  const { data:profile, isLoading:pLoading,} = useQuery({
      queryKey: ['profielInfo', userName],
      queryFn: () => profileInfo(userName),
      enabled:!!userName,
  });

  const limit = 9;

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: ({ pageParam = 1 }) =>Posts(null, limit, pageParam),
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
      <div className={Styles.tab}>
        <div className={Styles.postingC}>
          {token ? (
            <>
              <NavLink to={`/${userName}`}><img className={Styles.pfp} src={!pLoading?profile.pfp:undefined} alt="profile" /></NavLink>
              <button className={Styles.postingButton}onClick={() => setIsPosting(true)}>Start a Post</button>
            </>
          ) : (
            <NavLink to="/login"><p className={Styles.loginPrompt}>Log in to post and see your profile</p></NavLink>
          )}
        </div>
        {false&&token && (
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
          </div>
        )}
      </div>

      {!isLoading && (
        <InfiniteScroll style={{textAlign:"center",padding:"5px"}} dataLength={allPosts.length} hasMore={hasNextPage} next={fetchNextPage} endMessage="you've reached the end!!!">
          <div className={Styles.posts}>
            {allPosts.map((p) => (
              <PostCard key={p?.id} post={p} width="40vw" />
            ))}
          </div>
        </InfiniteScroll>)}

      {token && (
        <Posting isPosting={isPosting} setIsPosting={setIsPosting} />
      )}
    </>
  );
}