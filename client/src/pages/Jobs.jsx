import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Card from "../components/JobCard";
import { getJobs } from "../utiles/localStorage";
import styles from "./Jobs.module.css";
import useDelay from "../utiles/delay";
import InfiniteScroll from "react-infinite-scroll-component";

export default function Jobs() {
  const [filter, setFilter] = useState("");
  const deFilter=useDelay(filter,500) ;
  const limit = 9;
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching
  } = useInfiniteQuery({
    queryKey: ["jobs",deFilter],
    queryFn: ({ pageParam = 1 }) => getJobs(pageParam, limit,deFilter),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length==limit) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });
  const allJobs = data?.pages.flat() ?? [];
  



     

  return (
    <div className={styles.container}>
      
      <input
        className={styles.input}
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by title"
      />
      <InfiniteScroll style={{textAlign:"center",padding:"5px"}} dataLength={allJobs.length} hasMore={hasNextPage} next={fetchNextPage} endMessage="you've reached the end!!!">
        <div className={styles.jobPage}>
          {allJobs.map((job) => (
            <Card key={job.id} job={job} />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
}