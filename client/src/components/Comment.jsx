import Pcut from "../utiles/Pcut";
import Styles from "./Comment.module.css";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../utiles/AuthProvider";
import { jwtDecode } from "jwt-decode";
import PropTypes from "prop-types";
import { useFloating, autoUpdate, offset, flip, shift,useDismiss,useInteractions } from '@floating-ui/react';
import { useState, useContext,useRef } from 'react';
import {useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteComment,editComment } from "../utiles/localStorage";
import useClickOutside from "../utiles/ClickOutside";
import { timeAgo } from "../utiles/dateUtils";

export default function Comment({comment_id,user_id = null,pfp = "https://i.pinimg.com/originals/74/a3/b6/74a3b6a8856b004dfff824ae9668fe9b.jpg",profile_name = null,date,content = null,url = null,post_id}) {
    const queryClient = useQueryClient();
    //authentication
    const createTime= timeAgo(date)
    const { token } = useContext(AuthContext);
    let id = null;
    if (token) {
    try {
        const decoded = jwtDecode(token);
        id =parseInt(decoded?.sub,10);
    } catch (error) {
        console.warn("Invalid token", error);
    }
    }
    const isOwner = user_id === id;
    //delete
    const deleteMutation=useMutation({
        mutationFn:["comment delete"],
        mutationFn:()=>deleteComment(comment_id),
        onSuccess:()=>{queryClient.invalidateQueries(["comments",post_id])},
        onError:(err)=>{console.log(err)}
    })

    //edit
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(content || "");

    const editMutation = useMutation({
    mutationFn: (content) => editComment(comment_id, content),
    onSuccess: (data) => {
    queryClient.setQueryData(['comments', post_id], (old) => {
            if (!old) return old;
            const updatedPages = old.pages.map((page) =>
            page.map((comment) =>
                comment.id === data.comment.id ? data.comment : comment
            )
            );
            return {
            ...old,
            pages: updatedPages,
            };
        });
        setIsEditing(false);
    },
    onError:(err)=>{console.log(err)},
    });
    const handleSave = () => {
        if (!editedContent?.trim() || editMutation.isPending) {console.log("failed");return;}
        if(editedContent?.trim()===content||editedContent?.trim()==="") return
        editMutation.mutate(editedContent.trim());
    };

    const handleCancel = () => {
        setEditedContent(content);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    	const editContainerRef = useRef(null);

	const exitEditMode = () => {
		if (isEditing) {
			setEditedContent(content); 
			setIsEditing(false);
		}
	};
	useClickOutside(editContainerRef, exitEditMode);

    //options menu
    const [menuOpen, setMenuOpen] = useState(false);
    const { refs, floatingStyles, context } = useFloating({
    open: menuOpen,
    onOpenChange: setMenuOpen,
    placement: 'bottom-start', 
    middleware: [offset(6), flip(), shift()],
    whileElementsMounted: autoUpdate,
    });
    const dismiss = useDismiss(context);
    const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

    return (
    <div className={Styles.container}>
        <div className={Styles.header}>
        <NavLink style={{ height: "min-content" }} to={url}>
            <img className={Styles.img} src={pfp} alt={profile_name} />
        </NavLink>
        <div className={Styles.info}>
            <NavLink style={{ height: "min-content" }} to={url}>
            <h4 className={Styles.h4}>{profile_name}</h4>
            </NavLink>
            {createTime && <h5 className={`${Styles.pale} ${Styles.h5}`}>{createTime}</h5>}
        </div>

        <button ref={refs.setReference} className={Styles.options} onClick={() => setMenuOpen(!menuOpen)}>⋮</button>

        {menuOpen && (
            <div
            ref={refs.setFloating}
            style={{...floatingStyles,background: 'white',border: '1px solid #ccc',borderRadius: '8px',padding: '8px 0',boxShadow: '0 4px 12px rgba(0,0,0,0.15)',zIndex: 1000,minWidth: '100px',}}>
            {isOwner ? (
                <>
                <h5 onClick={() => {setIsEditing(true);setMenuOpen(false)}} style={{ padding: '2px 8px', cursor: 'pointer' }}>Edit</h5>
                <h5 onClick={()=>{if(!deleteMutation.isPending) deleteMutation.mutate()}} style={{ padding: '2px 8px', cursor: 'pointer', color: 'red' }}> Delete</h5>
                </>
            ) : (
                <h5 style={{ padding: '2px 8px', cursor: 'pointer', color: 'red' }}>Report</h5>
            )}
            </div>
        )}
        </div>
        <div className={Styles.content}>
        {isEditing ? (
            <div ref={editContainerRef} className={Styles.editContainer}>
                <input type="text" value={editedContent}onChange={(e) => setEditedContent(e.target.value)}onKeyDown={handleKeyDown}autoFocus className={Styles.editInput}/>
                <button className={Styles.editSave} onClick={handleSave} disabled={editMutation.isPending}>{editMutation.isPending ? 'Saving...' : 'Save'}</button>
                <button className={Styles.editCancel} onClick={handleCancel} disabled={editMutation.isPending}>Cancel</button>
            </div>
        ) : (<Pcut text={content} />   )}
        </div>
    </div>
    );
}

Comment.propTypes = {
  comment_id: PropTypes.number.isRequired,
  post_id: PropTypes.number.isRequired,
  img: PropTypes.string,
  profile_name: PropTypes.string.isRequired,
  createTime: PropTypes.string,
  url: PropTypes.string,
  content: PropTypes.string,
  user_id: PropTypes.number,
};