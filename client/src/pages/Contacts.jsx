import Styles from "./Contacts.module.css"
import { useNavigate } from 'react-router-dom';

export default function Contacts(){
    const nav = useNavigate()
    return(
        <div className={Styles.container}>
            <h1 className={Styles.text}>Sorry. Page under Construction 😵</h1>
            <button className={Styles.button} onClick={()=>nav(-1)}>Go Back</button>
        </div>
    )
}