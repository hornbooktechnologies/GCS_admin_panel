import React from "react";
import UsersList from "../components/dashboard/UsersList";

const Users = () => {
  return (
    <div>
      {/* Decorative gradient orbs for mesh effect */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-indigo-200/25 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-sky-200/20 rounded-full blur-3xl"></div>
      </div> */}
      <div className="relative z-10">
        <UsersList />
      </div>
    </div>
  );
};

export default Users;
