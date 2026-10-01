import { Link, useParams } from "react-router-dom";
import Styles from './jobDisplay.module.css';
import { bookmark, getJob, unbookmark } from "../utiles/localStorage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark as faBookmarkSolid} from "@fortawesome/free-solid-svg-icons";
import { faBookmark } from "@fortawesome/free-regular-svg-icons";



function JobDisplay() {
  const { jobId } = useParams();
  const { data: job, isLoading,refetch } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId)
  });
  
  const bookmarkMutation = useMutation({
    mutationFn: () => bookmark(jobId),
    onSuccess:()=>refetch(),
    onError: (err) => {
      console.log("Couldn't bookmark: ", err);
    }
  });

  const unbookmarkMutation = useMutation({
    mutationFn: () => unbookmark(jobId),
    onSuccess:()=>refetch(),
    onError: (err) => {
      console.log("Couldn't unbookmark: ", err);
    }
  });

  const bookmarking = () => {
    if (!job) return;
    if (bookmarkMutation.isPending || unbookmarkMutation.isPending ||isLoading) return;
    if (job.bookmarked) {
      unbookmarkMutation.mutate();
    } else {
      bookmarkMutation.mutate();
    }
  };
  if (isLoading) return <h1>Loading...</h1>;
  if (!job) return <h1>Job not found</h1>;

  return (
    <div className={Styles.container}>
      <img className={Styles.img} src={job.pfp} alt={job.company} />
      <div className={Styles.text}>
        <h1 className={Styles.title}>{job.title}</h1>
        <div className={Styles.info}><h2 className={Styles.h2}>company:</h2> <h3 className={Styles.h3}>{job.companyName} Lorem ipsum dolor sit amet consectetur adipisicing elit. Nesciunt et vero totam, impedit voluptate repellat cumque eligendi aspernatur eius, ipsam atque unde illo alias! Fuga velit nemo eaque sit aspernatur.</h3></div>
        <div className={Styles.info}><h2 className={Styles.h2}>location:</h2> <h3 className={Styles.h3}>{job.location}</h3></div>
        <div className={Styles.info}><h2 className={Styles.h2}>salary: </h2> <h3 className={Styles.h3}>{job.salary}</h3></div>
        <div className={Styles.info}><h2 className={Styles.h2}>type:</h2> <h3 className={Styles.h3}>{job.type}</h3></div>
        <div className={Styles.info}><h2 className={Styles.h2}>category:</h2> <h3 className={Styles.h3}>{job.category}</h3></div>
        <div className={Styles.info}><h2 className={Styles.h2}>experience Level: </h2> <h3 className={Styles.h3}>{job.experienceLevel}</h3></div>
        <div className={Styles.info}><h2 className={Styles.h2}>description:</h2> <h3 className={Styles.h3}>{job.description}</h3></div>
        <div className={Styles.info}><h2 className={Styles.h2}>requirements:</h2> <h3 className={Styles.h3}>{job.requirements}</h3></div>
        <div className={Styles.info}><h2 className={Styles.h2}>responsibilities:</h2> <h3 className={Styles.h3}>{job.responsibilities}</h3></div>
        <div className={Styles.info}><h2 className={Styles.h2}>deadline:</h2> <h3 className={Styles.h3}>{job.deadline}</h3></div>
        <div className={Styles.info}><h2 className={Styles.h2}>postedAt:</h2> <h3 className={Styles.h3}>{job.postedAt}</h3></div>
        <div className={Styles.actions}>
          <Link className={Styles.applyButton} target="_blank" to={job.application_website}>Apply</Link>
          <div style={{display:"flex",alignItems:"center"}} onClick={bookmarking}>
            {/*Fontawsome sucks ass >:(*/}
            {job?.bookmarked ? <FontAwesomeIcon style={{cursor:"pointer"}} icon={faBookmarkSolid} /> : <FontAwesomeIcon style={{cursor:"pointer"}} icon={faBookmark} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDisplay;