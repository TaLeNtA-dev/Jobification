import Offer from "../pages/Offer.jsx"
import Styles from "./CJobs.module.css"
import Card from "./JobCard.jsx"
import { useContext,useState } from "react"
import { CompContext } from "../pages/CompProfile"
import { getCompanyJobs } from "../utiles/localStorage.jsx"
import { useInfiniteQuery } from "@tanstack/react-query"
import Overlay from "./Overlay.jsx"
import InfiniteScroll from "react-infinite-scroll-component"

function PJobs(){
    const {comp,isLoading,isOwner}= useContext(CompContext);
    const [isOffering, setIsOffering]=useState(false);

    const limit=5
    const {
      data,
      isLoading:jobsLoading,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    } = useInfiniteQuery({
      queryKey: ['companyJobs', comp?.id],
      queryFn: ({ pageParam = 1 }) => getCompanyJobs(comp?.id, 5, pageParam),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage?.length === limit) {
          return allPages.length + 1;
        }
        return undefined;
      },
      staleTime: 30_000,
      enabled:!!comp
    });
    const jobs = data?.pages.flat() ?? [];


    const combinedLoading = jobsLoading || isLoading;
    return(
      <>

        {!isLoading&&isOwner &&
          <div className={Styles.offering}>
              <button className={Styles.offeringButton} onClick={()=> setIsOffering(true)}>Offer a Job</button>
          </div>
          
        }
        {!combinedLoading&&
        
        <InfiniteScroll style={{textAlign:"center",padding:"5px"}} dataLength={jobs.length} hasMore={hasNextPage} next={fetchNextPage} endMessage="you've reached the end!!!">
        <div className={Styles.container}>
            {jobs.map((j)=>{return <Card key={j.id} job={j}/>})}
        </div>
        </InfiniteScroll>}
        <Overlay isOpen={isOffering} onClose={()=> setIsOffering(false)}>
          <Offer id= {comp?.id}/>
        </Overlay>
      </>
    )
}

export default PJobs