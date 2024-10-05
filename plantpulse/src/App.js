import './App.css';
import SideMenu from './components/SideMenu';
import AppRouter from './routes/AppRouter';

function App() {
  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <div className="App flex">
      <AppRouter />
      <SideMenu items={menuItems}/>
    </div>
  );
}

export default App;
