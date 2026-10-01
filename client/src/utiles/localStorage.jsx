import axios from "axios";
export const api = axios.create({
baseURL: 'http://localhost:3000',
timeout: 10000,
withCredentials: true
})
export const offerJob = (data) => api.post("/offer",data).then(res => res.data).catch(err => {throw {
status: err.response?.status || 500,
message: err.response?.data || "An unknown error occurred",};})

export const getJobs = (page = 1, limit = 9,filter=undefined,category="title") => {return api.get('/jobs', { params: { page, limit,filter,category } }).then(res => res.data).catch(err => {throw err.response;});};

export const getJob =(jobId) => api.get(`/job/${jobId}`).then(res => res.data).catch(err => {throw err.response;});

export const login= (user) => api.post(`/login`,user).then(res => res.data).catch(err => {throw err.response;});

export const getToken =()=> api.get(`/api/refresh`).then(res => res.data).catch(err => {throw err.response;});

export const signUp= (user) => api.post(`/signUp`,user).then(res => res.data).catch(err => {throw err.response;});

export const post= (post) => api.post(`/profile/post`,post).then(res => res.data).catch(err => {throw err.response;});

export const Posts= (compid=null,limit=1,page=1,userid=null) => api.get(`/posts`, { params: {page, limit,compid,userid} }).then(res => res.data).catch(err => {throw err.response;});;

export const userPosts= (limit=1,page=1,userName) => api.get(`/posts/${userName}`, { params: {page, limit} }).then(res => res.data).catch(err => {throw err.response;});;

export const userInfo= (userName)=> api.get(`/info/${userName}`).then(res => res.data).catch(err => {throw err.response;});

export const profileInfo= (userName)=> api.get(`/${userName}`).then(res => res.data).catch(err => {throw err.response;});

export const getPfp= (id)=> {  const config = id ? { params: { id } } : {};return api.get('/pfp', config).then(res => res.data).catch(err => {throw err.response;});};

export const postLikes= (id)=> api.get(`/posts/likes`, {params:{id}}).then(res => res.data).catch(err => {throw err.response;});

export const likePost= (id)=> api.post(`/posts/likes`,null, {params:{id}}).then(res => res.data).catch(err => {throw err.response;});

export const dislikePost= (id)=> api.delete(`/posts/likes`, {params:{id}}).then(res => res.data).catch(err => {throw err.response;});

export const createCompany= (company)=> api.post(`/c/create`,company).then(res => res.data).catch(err => {throw err.response;});

export const companyInfo= (compURL)=> api.get(`/c/${compURL}`).then(res => res.data).catch(err => {throw err.response;});

export const getMyCompany = () => api.get(`/c/user/myCompany/`).then(res => res.data).catch(err => {throw err.response;});

export const getCompanyJobs = (id,limit=1, page=1) => api.get(`/c/jobs/${id}`, { params: {page,limit}}).then(res => res.data).catch(err => {throw err.response;});

export const follow = (userId = null, companyId = null) => api.post('/profile/follow', {userId,companyId}).then(res => res.data).catch(err => {throw err.response;});

export const unfollow = (userId = null, companyId = null) => api.delete('/profile/unfollow', {params:{ userId, companyId}}).then(res => res.data).catch(err => {throw err.response;});

export const getFollowers = (userId = null, companyId = null) => api.get('/profile/followers', {params:{userId,companyId }}).then(res => res.data).catch(err => {throw err.response;});

export const bookmark = (jobId) => api.post('/bookmark', {jobId}).then(res => res.data).catch(err => {throw err.response;});

export const unbookmark = (jobId) => api.delete('/bookmark', { params: {jobId} }).then(res => res.data).catch(err => {throw err.response;});

/*export const getBookmarked = (userName, limit = 9, page = 1) => api.get(`/${userName}/bookmarked`, { params: { page, limit } }).then(res => res.data).catch(err => {throw err.response;});*/

export const getComments = (postId, limit = 10, page = 1) =>api.get(`/posts/${postId}/comments`, { params: { page, limit } }).then(res => res.data).catch(err => {throw err.response;});

/* export const getReplies = (commentId) =>api.get(`/comments/${commentId}/replies`).then(res => res.data).catch(err => {throw err.response;});*/

export const addComment = (postId, comment, parentCommentId = null) =>api.post('/comments', { postId, parentCommentId, comment }).then(res => res.data).catch(err => {throw err.response;});

export const deleteComment = (commentId) =>api.delete(`/comments/${commentId}`).then(res => res.data).catch(err => {throw err.response;});

export const editComment = (commentId, newContent) =>api.put(`/comments/${commentId}`, { comment: newContent }).then(res => res.data).catch(err => {throw err.response;});

export const postExperience = (userName,companyName,title,desc,startedAt,endedAt)=>api.post("/experience/post",{userName,companyName,title,desc,startedAt,endedAt}).then(res => res.data).catch(err => {throw err.response;});

export const getExperience= (userName,limit=3,page=1)=>api.get('/experience/get',{params:{userName,limit,page}}).then(res => res.data).catch(err => {throw err.response;});

export const postEducation = (education)=>api.post("/education/post",education).then(res => res.data).catch(err => {throw err.response;});

export const getEducation= (userName,limit=3,page=1)=>api.get('/education/get',{params:{userName,limit,page}}).then(res => res.data).catch(err => {throw err.response;});

export const postSkill=(title,compName)=>api.post("/skill/post",{title,compName}).then(res => res.data).catch(err => {throw err.response;});

export const getSkill=(userName,limit=3,page=1)=>api.get("/skill/get",{params:{userName,limit,page}}).then(res => res.data).catch(err => {throw err.response;});

