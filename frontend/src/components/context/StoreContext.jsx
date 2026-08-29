import { createContext, useEffect, useState } from "react";
import axios from 'axios'

export const StoreContext = createContext(null)

// Configure axios defaults
axios.defaults.withCredentials = true;
const StoreContextProvider = (props) => {

    const [cartItems, setCartItems] = useState({});
    const url = import.meta.env.VITE_API_URL || "http://localhost:4000";
    console.log("CURRENT API URL:", url);
    const [token,setToken] = useState("");

    const [food_list, setFoodList] = useState([]);

    const addToCart = async (itemId) => {
    console.log("ADD TO CART CALLED:", itemId);

    const key = String(itemId);

    setCartItems(prev => {
        const updatedCart = {
            ...prev,
            [key]: (prev && prev[key]) ? prev[key] + 1 : 1
        };

        console.log("UPDATED CART:", updatedCart);

        if (!token) {
            localStorage.setItem(
                'guest_cart',
                JSON.stringify(updatedCart)
            );
        }

        return updatedCart;
    });

    if (token) {
        try {
            const response = await axios.post(
                url + '/api/cart/add',
                { itemId },
                { headers: { token } }
            );

            console.log("CART API RESPONSE:", response.data);

            await loadCartData(token);
        } catch (error) {
            console.error(
                "ADD TO CART API ERROR:",
                error.response?.data || error.message
            );
        }
    }
}

    const removeFromCart = async (itemId) => {
        const key = String(itemId);
        setCartItems(prev => {
            if (!prev || !prev[key]) return prev || {};
            const updatedCart = { ...prev, [key]: prev[key] - 1 };
            if (!token) {
                localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
            }
            return updatedCart;
        });
        if(token){
            await axios.post(url+'/api/cart/remove',{itemId},{headers:{token}})
            await loadCartData(token);
        }
    }

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = food_list.find((product) => String(product._id) === item);
                if (itemInfo) {
                    totalAmount += itemInfo.price * cartItems[item];
                }
            }
        }
        return totalAmount;
    }
    
    const getTotalCartItems = () => {
        let totalItems = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                totalItems += cartItems[item];
            }
        }
        return totalItems;
    }

    const fetchFoodList = async () =>{
        const response = await axios.get(url+"/api/food/list");
        setFoodList(response.data.data)
    }

    const loadCartData = async (token) =>{
        try {
            const response = await axios.post(url+"/api/cart/get",{},{headers:{token}})
            setCartItems(response.data.cartData || {});
        } catch (error) {
            console.error('Error loading cart data:', error);
            setCartItems({});
        }
    }

    useEffect(()=>{
        async function loadData(){
            await fetchFoodList();
            if(localStorage.getItem("token")){
                setToken(localStorage.getItem("token"));
                await loadCartData(localStorage.getItem("token"))
            } else if(localStorage.getItem('guest_cart')) {
                try {
                    setCartItems(JSON.parse(localStorage.getItem('guest_cart')) || {});
                } catch (e) {
                    setCartItems({});
                }
            }
        }
        loadData();
    },[])

    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        getTotalCartItems,
        url,
        token,
        setToken
    }

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider;