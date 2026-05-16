"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { UserDetailContext } from "@/context/UserDetailContext";

function Provider({ children }: any) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  const [UserDetail, setUserDetail] = useState(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      CreateNewUser();
    }
  }, [isLoaded, isSignedIn, user]);

  const CreateNewUser = async () => {
    try {
      const token = await getToken();

      if (!token) {
        console.log("No token found");
        return;
      }

      const result = await axios.post(
        "/api/user",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUserDetail(result.data);

    } catch (error) {
      console.error("Create User Error:", error);
    }
  };

  return (
    <UserDetailContext.Provider value={{ UserDetail, setUserDetail }}>
      {children}
    </UserDetailContext.Provider>
  );
}

export default Provider;