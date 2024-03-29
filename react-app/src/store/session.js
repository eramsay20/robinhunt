// USER AUTH STATE


// Constants --------------------
const SET_USER = 'session/SET_USER';
const REMOVE_USER = 'session/REMOVE_USER';



// Action Creators --------------------
const setUser = user => ({ type: SET_USER, payload: user })
const removeUser = () => ({ type: REMOVE_USER })



// Thunks --------------------
// authenticate user
export const authenticate = () => async (dispatch) => {
    const response = await fetch('/api/auth/', { 
        headers: { 'Content-Type':'application/json' }
    })
    const data = await response.json();
    if (data.errors) return;
    dispatch(setUser(data))
}

// login user
export const login = (email, password) => async (dispatch) => {
    const response = await fetch('api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.errors) return data;
    dispatch(setUser(data));
    return {};
}

// logout user
export const logout = () => async (dispatch) => {
    const response = await fetch('/api/auth/logout', {
        headers: { 'Content-Type': 'application/json' },
    })

    await response.json(); // wait until finished removing on backend 
    dispatch(removeUser()) // then remove from state
}

// create new user account
export const signup = (username, email, password) => async (dispatch) => {
    const response = await fetch('api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    const data = await response.json(); // once created...
    dispatch(setUser(data)); // set user on state
}



// User Authentication Reducer --------------------
const initialState = { user: null };

export default function reducer(state = initialState, action) {
    switch(action.type) {
        case SET_USER:
            return { user : action.payload };
        case REMOVE_USER:
            return { user: null };
        default: 
            return state;
    }
}