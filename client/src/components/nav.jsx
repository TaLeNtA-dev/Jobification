import { useParams,NavLink} from "react-router-dom"
import styles from "./nav.module.css"
function Nav ({pages}){
    let page = useParams()
    page =  Number(page.jobsP)
    const navs = []
    let start = page -2 >0?page-2:1 , end = page +2 <=pages?page +2:pages;
    for (let i = start;  i<= end   ; i++ ){
        navs.push(i.toString())
    }

    if(page-start<2){
    for (let i = end+1;  navs.length<5&&i<=pages   ; i++){
        navs.push(i.toString())
    }}
    if(pages-end<2){
    for (let i = start-1;  i>0&&navs.length<5   ; i--,start-- ){
        navs.push(i.toString())
    }}
    navs.sort((a, b) => a - b);
    
    


    return(
        (pages > 0) &&(
            <div className={styles.container}>
                {page != 1 && <NavLink className={styles.a} to= {`/jobs/${(page-1)}`} >{"<<"}</NavLink>}
                {navs.map((e) => {
                return<NavLink  key={e} to = {`/jobs/${(e)}`} className={`${({isActive}) => isActive? styles.active : styles.notActive} ${styles.a} ${e == page ? styles.Selected : styles.notSelected}`} >{(e)}</NavLink>
                })}
                {page < pages && <NavLink className={styles.a} to= {`/jobs/${(page+1)}`} >{">>"}</NavLink>}
            </div>
        )
    )
}
export default Nav