import { useEffect, useState, useRef } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { db } from "../../lib/firebase";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";

const Chat = () => {
  const [chat, setChat] = useState([]);
  const [openEmoji, setOpenEmoji] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState({
    file: null,
    url: "",
  });
  const [isUploading, setIsUploading] = useState(false); // Track upload status

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();

  const endRef = useRef(null);

  // Auto scroll to the latest message when chat changes
  useEffect(() => {
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Listen for chat changes in Firestore
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  console.log(chat);

  const handleEmoji = (e) => {
    setText(text + e.emoji);
    setOpenEmoji(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImage({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleSend = async () => {
    if (text === "" && !image.file) return;

    let imgUrl = null;

    try {
      setIsUploading(true); // Start blocking the user

      // Upload image if selected
      if (image.file) {
        imgUrl = await upload(image.file);
      }

      // Update chat messages
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }), // Add image URL if available
        }),
      });

      const userIDs = [currentUser.id, user.id];

      // Update user chats for both sender and receiver
      userIDs.forEach(async (id) => {
        const userChatRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();

          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId,
          );

          userChatsData.chats[chatIndex].lastMessage = text;
          userChatsData.chats[chatIndex].isSeen =
            id === currentUser.id ? true : false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatRef, {
            chats: userChatsData.chats,
          });
        }
      });

      // Reset image and text after sending the message
      setImage({
        file: null,
        url: "",
      });
      setText("");
    } catch (error) {
      console.log(error);
    } finally {
      setIsUploading(false); // Allow sending messages again
    }
  };

  // Handle keydown to send message on pressing "Enter"
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isUploading) {
      handleSend(); // Trigger send when "Enter" is pressed
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
          </div>
        </div>
        <div className="icon"></div>
      </div>

      <div className="center">
        {chat?.messages?.map((message) => (
          <div
            className={
              message.senderId === currentUser.id ? "message own" : "message"
            }
            key={message?.createdAt}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="" />}
              <p>{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={endRef}></div>

        {image.url && (
          <div className="message own">
            <div className="texts">
              <img
                src={image.url}
                alt="Preview"
                style={{ maxHeight: "200px", maxWidth: "200px" }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
            disabled={isUploading} // Disable while uploading
          />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "Can't send messages"
              : "Type a message"
          }
          onChange={(e) => {
            setText(e.target.value);
          }}
          value={text}
          onKeyDown={handleKeyDown} // Capture "Enter" key press
          disabled={isCurrentUserBlocked || isReceiverBlocked || isUploading} // Disable while uploading
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpenEmoji(!openEmoji)}
          />
          {openEmoji && (
            <div className="picker">
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={
            isCurrentUserBlocked || isReceiverBlocked || isUploading // Disable while uploading
          }
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
