import { createContext, useContext, useEffect, useState } from "react";
import { authContext } from "./AuthContext";
import toast from "react-hot-toast";


export const ChatContext=createContext()

export const ChatProvider=({children})=>{

    const [messages,setMessages]=useState([])
    const [users,setUsers]=useState([])
    const [selectedUser, setSelectedUser]=useState(null)
    const [unseenMessages,setUnseenMessages]=useState({})

    const {axios,socket}=useContext(authContext)

    const getUsers=async()=>{
      try {
        console.log("Fetching users...");
        const {data}=await axios.get('/api/messages/users')
        console.log("Users API response:", data);
        if(data.success){
          setUsers(data.users)
          setUnseenMessages(data.unseenMessages)
        }else {
console.log("API success=false");
}
      } catch (error) {
        console.error("getUsers error:", error);
        toast.error(error.message)
      }
    }

    const getMessages = async (userId) => {
  try {
    const { data } = await axios.get(`/api/messages/${userId}`)
    if (data.success) {
      setMessages(data.messages || [])

      // ✅ RESET unseen count for this user
      setUnseenMessages((prev) => ({
        ...prev,
        [userId]: 0
      }))
    }
  } catch (error) {
    toast.error(error.message)
    setMessages([])
  }
}

    const sendMessage=async(messageData)=>{
      try {
        const {data}= await axios.post(`/api/messages/send/${selectedUser._id}`, messageData)
        if(data.success){
          setMessages((prevMessages)=>[...prevMessages, data.newMessage])
        }else{
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.message)
      }
    }

    const subscribeToMessages=async()=>{
      if(!socket)return;
      socket.on('newMessage', (newMessage)=>{
          if(selectedUser && newMessage.senderId === selectedUser._id){
            newMessage.seen=true;
            setMessages((prevMessages)=>[...prevMessages,newMessage])
            axios.put(`/api/messages/mark/${newMessage._id}`)
          }
          else{
            setUnseenMessages((prevUnseenMessages)=>({
              ...prevUnseenMessages,[newMessage.senderId]:
              prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId]+1: 1
            }))
          }
      })
    }

    const unsubscribeFromMessages=()=>{
      if(socket) socket.off('newMessage')
    }

    useEffect(()=>{
        subscribeToMessages()
        return ()=>unsubscribeFromMessages();
    },[socket, selectedUser])

   const value={
    messages, users, selectedUser, getUsers, getMessages, sendMessage, setSelectedUser, unseenMessages, setUnseenMessages, 
    
   }
   return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
   )
}