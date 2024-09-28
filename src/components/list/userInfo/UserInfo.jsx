import "./userInfo.css";
import { useUserStore } from "../../../lib/userStore";
import { auth } from "../../../lib/firebase";

const UserInfo = () => {
  const { currentUser } = useUserStore();

  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser.avatar || "./avatar.png"} alt="avatar" />
        <h2>{currentUser.username}</h2>
      </div>
      <div className="icon">
        <button className="logout" onClick={() => auth.signOut()}>
          Log Out
        </button>
        {/*   <img src="./more.png" alt="more" /> */}
        {/*   <img src="./video.png" alt="more" /> */}
        {/*   <img src="./edit.png" alt="more" /> */}
      </div>
    </div>
  );
};

export default UserInfo;
