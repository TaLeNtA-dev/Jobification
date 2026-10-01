import styles from "./Pskill.module.css"



function Pskill ({title,compName,compPFP}){
    
    
    return(
        <div className={styles.container}>
            <h3 style={{textAlign:"left"}}>{title}</h3>
            <div className={styles.skills}>
            {compName&&<div className={styles.line}>
                {compPFP&&<img src={compPFP} className={styles.img}/>}
                <p>{compName}</p>
            </div>}
            </div>
            {/*<div className={styles.line}>
                <img src={PImg} className={styles.img}/>
                <p>{PName}</p>
            </div>*/}

        </div>
    )
}

export default Pskill