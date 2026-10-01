import style from "./Overlay.module.css"

export default function Overlay ({isOpen,onClose,children}){
    
    if(!isOpen) return null;
    const onClickoutside = (e)=>{
        if(e.target === e.currentTarget){
            onClose();
        }
    }
    return(
        <div className={style.overlay} onClick={onClickoutside}>
            <div className={style.content}>
                <button className={style.exit} onClick={onClose}>X</button>
                {children}
            </div>
        </div>
    )
}