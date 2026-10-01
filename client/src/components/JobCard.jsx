import Styles from "./jobCard.module.css"
import { useNavigate } from "react-router-dom";
import { timeAgo } from "../utiles/dateUtils"
import Pcut from "../utiles/Pcut";

function Card({job}){
  const navigate = useNavigate();
  const date = timeAgo(job.postedAt)
  console.log(job)
  return(
    job && (
        <div className={Styles.Card} onClick={()=>navigate(`/job/${job.id}`)}>
            <img className={Styles.img} src={job.pfp} alt={`${job.company} logo`} />
            <h3 className= {Styles.cardTitle}>{job.title}</h3>
            {job?.companyName&&<h4 className={Styles.companyName}>{job.companyName}</h4>}
            <h4 className={Styles.h4}>{job.location} lo ({job?.type.trim()})</h4>
            <h5 className={Styles.h4}>{date}</h5>
        </div>
    )
  )
}
export default Card
