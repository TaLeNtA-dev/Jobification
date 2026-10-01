
import types from "prop-types"
import { useState } from "react"


function Pcut({text = "",length=300}){
    const [expanded, setExpanded] = useState(false)
    function cutText(e){
        e =  e.slice(0 , length)
        e = e.slice(0 , e.lastIndexOf(" "))
        return(`${e}`)
    }
    text = text===null?"":text
    return(
    <p style={{
        overflowWrap: 'break-word',
        wordWrap: 'break-word',  
        whiteSpace: 'normal',
        overflow: 'visible',
        }}>
        {(text.length > length && expanded==false) ? cutText(text) : text}{text.length > length && <span style={{ opacity: 0.6, cursor: "pointer" }} onClick={()=>setExpanded(!expanded)}>{expanded==false ? "  ...show more":"  show less"}</span>}
    </p>
    )
}
Pcut.proptypes= {
    text : types.string,
    length : types.number
}

export default Pcut
