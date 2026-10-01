
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Jobs from "./pages/Jobs";
import JobDisplay from "./pages/jobDisplay";
import NavBar from "./components/NavBar";
import LogIn from "./pages/LogIn";
import CompProfile from "./pages/CompProfile";
import PHome from "./components/CHome";
import PAbout from "./components/CAbout";
import PPosts from "./components/CPosts";
import CJobs from "./components/CJobs";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import ProtectRoute from "./utiles/ProtectedRoute";
import SignUp from "./pages/SignUp";
import { AuthContext } from "./utiles/AuthProvider";
import { useContext } from "react";
import CreatCompany from "./pages/creatCompany";
import GetUserCompany from "./components/getUserCompany";
import { Toaster } from 'react-hot-toast';
import Contacts from "./pages/Contacts";
import UserPosts from "./pages/UserPosts";
import UserExperience from "./pages/UserExperience";
import UserSkills from "./pages/UserSkills";
import UserEducation from "./pages/UserEducation";

function App() {
  const {AuthLoading} = useContext(AuthContext)
  const router = createBrowserRouter([
    {path:"login", element:<LogIn/>},
    {path:"signUp", element:<SignUp/>},
    {
      path: "/",
      element:<NavBar />,
      children: [
        {element:<ProtectRoute/>,children:[
        { index: true, element: <Home/> },
        {path: "Company", element:<GetUserCompany/>},
        {path: "company/create" , element:<CreatCompany/>},
        {path: "Company/:companyURL" , element:<CompProfile/>,
          children:[
            {index: true , element: <PHome/>},
            {path:"about" , element: <PAbout/>},
            {path:"posts", element:<PPosts/>},
            {path: "jobs" , element:<CJobs/>},
          ]
        },
        {path: "Contacts", element:<Contacts/>},
        {path:":userName", element:<Profile/>, children:[
          {index: true , element: <PHome/>},
          {path:"about" , element: <PAbout/>},
          
        ]},
        {path:":userName/posts", element:<UserPosts/>},
        {path:":userName/experience" , element: <UserExperience/>},
        {path:":userName/education" , element: <UserEducation/>},
        {path:":userName/skills" , element: <UserSkills/>},


        { path: "job/:jobId", element: <JobDisplay /> },
        { path: "jobs/:jobsP", element: <Jobs /> },
        
      ]}]
      
    },
    
  ]);
  return (
    <>
      <Toaster containerStyle={{ zIndex: 999999 }}/> 
      {!AuthLoading?<RouterProvider router={router}/>:<h1>Is Loading...</h1>}
    </>
  )
}
export default App;
