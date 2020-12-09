const initState = () => ({
    userName: '',
    isLoggedIn: false,
});

const userReducer = (state = initState(), action) => {
    switch(action.type){
        case 'USERNAME_SET':
            return {
                ...state, //copies old state
                userName: action.userName, //imports the new username
            };
        case 'USER_SET_LOGGED_IN':
            return {
                ...state,
                isLoggedIn: action.isLoggedIn,
            };
        default:
            return state; //ignores action if no modification
    }
};

export default userReducer;