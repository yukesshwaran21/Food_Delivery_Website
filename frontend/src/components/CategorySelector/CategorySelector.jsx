import { useRef } from 'react'
import './CategorySelector.css'
import { menu_list } from '../../assets/assets'

const CategorySelector = ({ category, setCategory }) => {
  const selectorRef = useRef(null)

  const handleCategorySelect = (menuName) => {
    setCategory(prev => prev === menuName ? 'All' : menuName)

    const selectedItem = selectorRef.current?.querySelector(`[data-category="${menuName}"]`)
    if (selectedItem) {
      selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  return (
    <div className="category-selector" ref={selectorRef} role="tablist" aria-label="Food categories">
      <button
        type="button"
        className={`category-button ${category === 'All' ? 'active' : ''}`}
        onClick={() => handleCategorySelect('All')}
        role="tab"
        aria-selected={category === 'All'}
        data-category="All"
      >
        All
      </button>
      {menu_list.map((item) => (
        <button
          type="button"
          key={item.menu_name}
          className={`category-button ${category === item.menu_name ? 'active' : ''}`}
          onClick={() => handleCategorySelect(item.menu_name)}
          role="tab"
          aria-selected={category === item.menu_name}
          data-category={item.menu_name}
        >
          {item.menu_name}
        </button>
      ))}
    </div>
  )
}

export default CategorySelector
