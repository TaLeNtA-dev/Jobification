import styles from "./PInterest.module.css" 

export default function PInterest(){
    let img="/Erwin-Smith-2.jpg" ,title="No Title",num=0 ,disc="teeeeeeeeeeeeeeeeeeeeese"

    return(
        <div className={styles.container}>
            <img className={styles.img} src={img} />
            <div className={styles.info}>
                <h3 >{title}</h3>
                {disc&&<p>{disc}</p>}
                <h5 style={{opacity: "70%"}}>Followers {num}</h5>
            </div>
        </div>
    )
}

