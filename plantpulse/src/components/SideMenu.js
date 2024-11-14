import { useState } from 'react';
import { Bars3Icon, ChevronLeftIcon } from '@heroicons/react/24/outline';

const SideMenu = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className={`flex ${isOpen ? 'w-64' : 'w-16'} min-h-screen bg-green-900 text-white transition-width duration-300`}>
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between p-0">
          <button onClick={toggleMenu} className="text-white">
            {isOpen ? (
              <ChevronLeftIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>
        {isOpen && (
          <nav className="flex min-h-screen flex-col flex-grow">
            {items.map((item, index) => (
              <a href={item.href} key={index} className="p-4 hover:bg-green-950 text-lg font-bold">
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
