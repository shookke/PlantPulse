import { useState } from 'react';
import { MenuIcon, ChevronLeftIcon } from '@heroicons/react/outline';

const SideMenu = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className={`flex ${isOpen ? 'w-64' : 'w-16'} h-full bg-gray-800 text-white transition-width duration-300`}>
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between p-4">
          <button onClick={toggleMenu} className="text-white">
            {isOpen ? (
              <ChevronLeftIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
        </div>
        {isOpen && (
          <nav className="flex flex-col flex-grow">
            {items.map((item, index) => (
              <a href={item.href} key={index} className="p-4 hover:bg-gray-700">
                {item.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};

export default SideMenu;
