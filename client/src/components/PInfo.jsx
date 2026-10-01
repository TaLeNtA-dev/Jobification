import Styles from "./PInfo.module.css"
import Pcut from "../utiles/Pcut" 
import { timeAgo } from "../utiles/dateUtils"
import { NavLink } from "react-router-dom"
import PropTypes from "prop-types"
function PInfo({img,title,desc,date,location,url=null, howOld=true}){
    if (howOld)date = timeAgo(date)
    
    return(
        <div className={Styles.container}>
            <NavLink to={url}><img className={Styles.img} src={img} /></NavLink>
            <div className={Styles.info}>
                <NavLink to={url}><h3 className={Styles.h3}>{title}</h3></NavLink>
                {date&&<h5 className={`${Styles.pale} ${Styles.h5}`}>{date}</h5>}
                {location&&<h5 className={`${Styles.pale} ${Styles.h5}`}>{location}</h5>}
                {desc&&<Pcut text={desc} length={100}/>}
                
            </div>
        </div>
    )
}

PInfo.propTypes = {
  img: PropTypes.string,
  title: PropTypes.string.isRequired,
  desc: PropTypes.string,
  date: PropTypes.string,
  location: PropTypes.string,
  url: PropTypes.string,
};
export default PInfo
