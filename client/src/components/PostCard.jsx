import Styles from "./PostCard.module.css"
import PInfo from "./PInfo"
import { useMutation, useQuery, useQueryClient,useInfiniteQuery } from "@tanstack/react-query"
import { postLikes,likePost ,dislikePost, getComments, getPfp, addComment} from "../utiles/localStorage"
import Comment from "./comment";
import { useState,useContext } from "react";
import { AuthContext } from "../utiles/AuthProvider";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";

export default function PostCard({post,width = "",hight=""}){
    const { token } = useContext(AuthContext);
    let userName = null;
    let id = null;
    if (token) {
    try {
        const decoded = jwtDecode(token);
        userName = decoded.userName;
        id = decoded?.sub
    } catch (error) {console.warn("Invalid token", error);}}

    const{data:pfp,isLoadig:pfpLoading}=useQuery({
        queryKey:["pfp",id],
        queryFn:()=>getPfp(id)
    })
        
    const nav = useNavigate()
    
    const [openComments,setOpenComments]=useState(false)
    const [myComment,setMyComment]=useState("")

    const queryClient = useQueryClient();
    
    const{data:likes,isLoading:likesLoading}=useQuery({
        queryKey:["likes",post.id],
        queryFn:()=> postLikes(post.id),
    })
    const likeMutation = useMutation({
    mutationKey: ['like', post.id],
    mutationFn: () => likePost(post.id),             
    onError: (err) => console.log(err),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['likes', post.id] });
    },
    });

    const dislikeMutation = useMutation({
    mutationKey: ['dislike', post.id],
    mutationFn: () => dislikePost(post.id),           
    onError: (err) => console.log(err),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['likes', post.id] });
    },
    });

    const clickLike = ()=>{
        if(likesLoading)return
        if((likes?.isLiked)) {dislikeMutation.mutate()}
            else if(!(likes?.isLiked)) {likeMutation.mutate()}
    }
    const limit =10
    const {
        data:comments,
        isLoading:commentsLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch:refetchComments,
    } = useInfiniteQuery({
        queryKey: ["comments",post.id],
        queryFn: ({ pageParam = 1 }) => getComments(post.id, limit, pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
        if (lastPage?.length === limit) {
            return allPages.length + 1;
        }
        return undefined;
        },
        staleTime: 30_000,
        enabled:openComments
    });
    const allcomments = comments?.pages.flat() ?? [];
    const commentMutation=useMutation({
        mutationKey: ['myComment'],
        mutationFn: (myComment) => addComment(post.id,myComment),             
        onError: (err) => console.log(err),
        onSuccess: (data) => {refetchComments();},
    });
    const handleSubmitComment = (e) => {
        e.preventDefault();
        if (!myComment?.trim() || commentMutation.isPending) return;
        commentMutation.mutate(myComment);
        setMyComment("");
    };
    return(
        <div className={Styles.container} style={{ "--w": width,"--h": hight }}>
            <div className={Styles.content}>
                <PInfo img={post.pfp} title={post.profile_name} desc={post?.disc} date={post.created_at} location={post?.location} 
                    url={post?.companyURL? `/company/${post?.companyURL}`:`/${post?.userName}`} hr={false}/>
                <p className={Styles.caption}>{post.caption}</p>
                {post.media && <img className={Styles.media} src={post.media}></img>}
            </div>
            <div className={Styles.interact}>
                <div className={Styles.interactionCount} onClick={clickLike}>
                    <i className={!likesLoading&&likes?.isLiked?"fa-solid fa-thumbs-up":"fa-regular fa-thumbs-up"}></i>
                    {!likesLoading&&<h5>{likes?.likeCount}</h5>}
                </div>
                <div className={Styles.interactionCount} onClick={()=>setOpenComments(!openComments)}>
                    <i className="fa-solid fa-comment"></i>
                </div>
                <div className={Styles.interactionCount}>
                    <i className="fa-solid fa-retweet"></i>
                </div>
                <div className={Styles.interactionCount}>
                    <i className="fa-solid fa-share"></i>
                </div>
            </div>
            
            {openComments&&<div className={Styles.comments}>
                
                <div className={Styles.commentingC}>
                    <img className={Styles.commentingPfp} src={!pfpLoading?pfp:undefined} alt="profile" onClick={()=>nav(`/${userName}`)} />
                    <form className={Styles.commentingBox} onSubmit={handleSubmitComment}>
                        <input type="text" placeholder="Comment" onChange={(c)=>setMyComment(c.target.value)} value={myComment} className={Styles.commentingInput}/>
                        <button type="submit" disabled={!myComment?.trim() || commentMutation.isPending} className={Styles.commentingButton}>Comment</button>
                    </form>
                </div>
                <InfiniteScroll dataLength={allcomments.length} hasMore={hasNextPage} next={fetchNextPage} >
                {allcomments.map((c) => (
                    <Comment key={c.id} post_id={post.id} comment_id={c.id} user_id={c.user_id} pfp={c.pfp} content={c.comment} profile_name={c.profile_name} disc={c?.disc} url={c.userName?c.userName:`/company/${c.company_name}`}></Comment>
                ))}</InfiniteScroll>
                </div>}
        </div>
    )
}
