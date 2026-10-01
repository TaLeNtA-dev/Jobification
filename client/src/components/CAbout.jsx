import styles from "../pages/Profile.module.css"
import { useContext } from "react"
import { CompContext } from "../pages/CompProfile"
function PAbout (){
    const {comp,isLoading}= useContext(CompContext);
    console
    return(
        <div className={styles.tab}>
            <h2>Over View</h2>
            <p>{!isLoading&&comp?.bio}</p>
            <h2>website</h2>
            <a target="_blank" href={!isLoading?comp?.website:undefined}>{comp?.website}</a>
            <h2>Industry</h2>
            <h4 style={{fontWeight:"normal"}}>{!isLoading&&comp?.industry}</h4>
            <h2>Company size</h2>
            <h4 style={{fontWeight:"normal"}}>{!isLoading&&comp?.company_size}</h4>
            <h2>Headquarters</h2>
            <h4 style={{fontWeight:"normal"}}>{!isLoading&&comp?.location}</h4>
            <h2>Type</h2>
            <h4 style={{fontWeight:"normal"}}>{!isLoading&&comp?.company_type}</h4>
            <h2>Founded</h2>
            <h4 style={{fontWeight:"normal"}}>{!isLoading&&comp?.founding_year}</h4>
            <h2>Specialties</h2>
        </div>
    )
}


export default PAbout