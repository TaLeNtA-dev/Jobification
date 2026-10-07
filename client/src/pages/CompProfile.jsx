import { NavLink, Outlet, useNavigate ,useParams } from "react-router-dom";
import Styles from "./Profile.module.css";
import { useQuery,useMutation } from "@tanstack/react-query";
import { companyInfo, getFollowers, follow,unfollow, getMyCompany  } from "../utiles/localStorage";
import { createContext,useContext, useEffect, useState } from "react";
import { AuthContext } from "../utiles/AuthProvider";
import { jwtDecode } from "jwt-decode";
export const CompContext = createContext();
function CompProfile() {
  const nav =useNavigate()
  const {token}=useContext(AuthContext)
  const user_id= jwtDecode(token).sub
  const { companyURL } = useParams();
  
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
  const { data, isLoading,error } = useQuery({
    queryKey: ["companyInfo", companyURL],
    queryFn:()=>companyInfo(companyURL),
    retry:!!companyURL
  });

  const isOwner = data?.admins?.some(admin => admin.id == user_id && admin.role == "owner");
  useEffect(()=>{
    if(error){
    console.log(error)
    if(error.status=404&&!isOwner){
      nav("/Company/Create")
    }}
  },[error])

  let compSize=data?.company_size;
  if(data) compSize=formatCount(compSize);

  const { data:followers, isLoading:followersLoading,refetch:followersRefetch} = useQuery({
        queryKey: ['followers', data?.name],
        queryFn: () => getFollowers(null,data.id),
        enabled:!!data
    });

    const followMutate=useMutation({
        mutationFn:() => follow(null,data.id),
        onSuccess: (data) => {
            followersRefetch();
        },
        onError: (error) => {
        console.error('Failed:', error);
        },
      })
    const unfollowMutate =useMutation({
        mutationFn:() => unfollow(null,data.id),
        onSuccess: (data) => {
        followersRefetch();
        },
        onError: (error) => {
        console.error('Failed:', error);
        },
    })

    const following=async()=>{
        followers?.isFollowing? unfollowMutate.mutate():followMutate.mutate()
    }

    let followersCount=followers?.followersCount;
    if(followers) followersCount=formatCount(followersCount);

  if (isLoading) return <div>Loading company...</div>;
  if (!data) return <div>Company not found</div>;
  return (
    <div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
      <div className={Styles.tab} style={{ padding: "0px" }}>
        <div className={Styles.pics}>
          <div className={Styles.bannerBox}>
            <img className={Styles.banner} src={data.banner} alt="banner" />
          </div>
          <div className={Styles.nameBox}>
            <img src={data.pfp||"https://i.pinimg.com/originals/74/a3/b6/74a3b6a8856b004dfff824ae9668fe9b.jpg"} className={Styles.logo} alt="logo" />
          </div>
          <div className={Styles.extraBs}>
            <button className={Styles.extraB}>
              <i className="fa-solid fa-link"></i>
            </button>
          </div>
        </div>
        <div className={Styles.fBody}>
          <h1 className={Styles.name}>{data.name}</h1>
          <h3 className={Styles.metaInfo}>
            {data.industry}, {compSize} employees, {data.location}, {!followersLoading&&`${followersCount} followers`}
          </h3>
          <h5 className={Styles.description}>{data.bio}</h5>
          {!isOwner&&<div className={Styles.buttons}>
            {<button className={` ${Styles.otherB} ${followers?.isFollowing?Styles.otherBfilled:null}`} onClick={following}>Follow</button>}
            {data?.website&&<a href={data?.website} target="_blank" rel="noopener"><button className={Styles.otherB}>website</button></a>}
            <button className={Styles.otherB}>Message</button>
          </div>}
        </div>
        <div className={Styles.nav}>
          <NavLink to="." end>
            <h3>Home</h3>
          </NavLink>
          <NavLink to="./about">
            <h3>About</h3>
          </NavLink>
          <NavLink to="./jobs">
            <h3>Jobs</h3>
          </NavLink>
          <NavLink to="./posts">
            <h3>Posts</h3>
          </NavLink>
        </div>
      </div>
      <CompContext.Provider value={{ comp: data, isLoading,isOwner }}>
        <Outlet />
      </CompContext.Provider>
    </div>
  );
}

export default CompProfile;