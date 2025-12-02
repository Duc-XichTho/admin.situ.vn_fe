import React, { createContext, useEffect, useState } from "react";
import { getCurrentUserLogin, getAllUser } from "./apis/userService.jsx";


const MyContext = createContext();

const MyProvider = ({ children }) => {

    const [currentUser, setCurrentUser] = useState(null);
    const [userList, setUserList] = useState([]);
    const [loadQuiz, setLoadQuiz] = useState(false);

    const fetchCurrentUser = async () => {
        const user = await getCurrentUserLogin();
        setCurrentUser(user.data);
        return user;
    };

    const fetchAllUser = async () => {
        try {
            const users = await getAllUser();
            const usersWithNickname = users.result?.map(user => ({
                ...user,
            }));
            setUserList(usersWithNickname);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchAllData = async () => {
        try {
            await Promise.all([

                fetchCurrentUser(),
            ]);
        } catch (error) {
            // console.error("Lỗi khi lấy dữ liệu: ", error);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);


    return (
        <MyContext.Provider
            value={{
                currentUser,
                setCurrentUser,
                fetchCurrentUser,
                userList,
                fetchAllUser,
                loadQuiz, setLoadQuiz
            }}
        >
            {children}
        </MyContext.Provider>
    );
};

export { MyContext, MyProvider };
