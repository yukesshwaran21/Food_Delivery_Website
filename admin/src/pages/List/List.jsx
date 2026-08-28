/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from 'react'
import './List.css'
import axios from 'axios'
import { toast } from 'react-toastify';

const List = ({url}) => {

  const [list, setList] = useState([]);
  
  const getImageUrl = (image) => {
    if (!image) return '';

    // Keep uploads on the configured API origin so HTTPS admin pages do not request HTTP images.
    try {
      const imageUrl = new URL(image, `${url}/`);
      if (imageUrl.pathname.includes('/uploads/')) {
        return `${url.replace(/\/$/, '')}${imageUrl.pathname}`;
      }
      return imageUrl.href;
    } catch {
      return `${url.replace(/\/$/, '')}/uploads/${image.replace(/^\/+/, '')}`;
    }
  };

  const fetchList = useCallback(async () =>{
    const response = await axios.get(`${url}/api/food/list`)
   
    if(response.data.success){
      setList(response.data.data)
    }
    else{
      toast.error("Error")
    }
  }, [url])

  const removeFood = async (foodId) =>{

    try {
      const response = await axios.post(`${url}/api/food/remove`, { id: foodId });
      await fetchList();
      
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        throw new Error(response.data.message || 'Error occurred while removing food.');
      }
    } catch (error) {
      console.log(error);
      
      // Check if the error has a message and display it in the toast.
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
    }
    
  }

  useEffect(()=>{
    fetchList();
  },[fetchList])
  return (
    <div className='list'>
      <p>All Foods List</p>
      <div className="list-table">
        <div className="list-table-format title">
            <b>Image</b>
            <b>Name</b>
            <b>Category</b>
            <b>Price</b>
            <b>Action</b>
        </div>
        {list.map((item,index)=>{
          return(
            <div key={index} className="list-table-format">
              <img 
                src={getImageUrl(item.image)} 
                alt={item.name}
                onError={(e) => {
                  console.error('Food image failed to load', { item, src: e.currentTarget.src });
                }} 
              />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>${item.price}</p>
              <p onClick={()=> removeFood(item._id)} className='cursor'>X</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default List