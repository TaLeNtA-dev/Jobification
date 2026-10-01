import PostCard from "./PostCard.jsx";
import Styles from "./CPosts.module.css";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useContext, useState } from "react";
import { CompContext } from "../pages/CompProfile.jsx";
import { Posts } from "../utiles/localStorage.jsx";
import Posting from "./Posting.jsx";
import InfiniteScroll from "react-infinite-scroll-component"

function PPosts() {
  const { comp, isLoading: compLoading,isOwner } = useContext(CompContext);
  const companyId = comp?.id;
  const limit = 9;

  const {
    data,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts", companyId],
    queryFn: ({ pageParam = 1 }) => Posts(companyId, limit, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage?.length === limit) {
        return allPages.length + 1;
      }
      return undefined;
    },
    enabled: !!companyId,
    staleTime: 30_000,
  });

  const allPosts = data?.pages.flat() ?? [];

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const [isPosting, setIsPosting] = useState(false);

  if (compLoading) return <div>Loading company...</div>;
  if (!comp) return <div>Company not found</div>;
  
  return (
    <>
      {isOwner &&<div className={Styles.postingC}>
        <button className={Styles.postingButton} onClick={() => setIsPosting(true)}>Start a Post</button>
      </div>}
      <InfiniteScroll style={{textAlign:"center",padding:"5px"}} dataLength={allPosts.length} hasMore={hasNextPage} next={fetchNextPage} endMessage="you've reached the end!!!">
      <div className={Styles.postTab}>
        {allPosts.map((p) => (<PostCard key={p.id} post={p} width="40vw" />))}
      </div>
      </InfiniteScroll>
      <Posting isPosting={isPosting} setIsPosting={setIsPosting} id={companyId}/>
    </>
  );
}

export default PPosts;