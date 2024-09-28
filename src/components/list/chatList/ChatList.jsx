import { useEffect, useState } from "react";
import "./chatList.css";
import Adduser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { useChatStore } from "../../../lib/chatStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { changeChat, chatId } = useChatStore();

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        const items = res.data().chats;

        const promises = items.map(async (item) => {
          console.log(item.receiverId);

          const userdocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userdocRef);

          const user = userDocSnap.data();

          return { ...item, user };
        });

        const chatData = await Promise.all(promises);
        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      },
    );

    return () => {
      unsub();
    };
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId,
    );
    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.log(err);
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.user.username.toLowerCase().includes(input.toLowerCase()),
  );

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" />
          <input
            type="texts"
            placeholder="Search"
            onChange={(e) => {
              setInput(e.target.value);
            }}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt="plus"
          className="add"
          onClick={() => setAddMode(!addMode)}
        />
      </div>

      {filteredChats.map((chat) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          style={{
            backgroundColor: chat?.isSeen ? "transparent" : "#5181fe",
          }}
        >
          <img
            src={
              chat.user.blocked.includes(currentUser.id)
                ? "./avatar.png"
                : chat.user.avatar || "./avatar.png"
            }
            alt="item"
          />
          <div className="texts">
            <span className="name">
              {chat.user.blocked.includes(currentUser.id)
                ? "User"
                : chat.user.username}
            </span>
            <p className="msg">{chat.lastMessage}</p>
          </div>
        </div>
      ))}
      {addMode && <Adduser />}
    </div>
  );
};

export default ChatList;
