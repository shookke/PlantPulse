import './App.css';
import SideMenu from './components/SideMenu';
import AppRouter from './routes/AppRouter';

function App() {
  const menuItems = [
    { label: 'My Plants', href: '/' },
    { label: 'Tasks', href: '/tasks' },
    { label: 'Devices', href: '/devices' },
    { label: 'Settings', href: '/contact' },
  ];

  if (module.hot) {
    module.hot.accept();
  }
  
  return (
    <>
      <div className='flex min-h-screen'>
        <SideMenu items={menuItems}/>
        <AppRouter />
      </div>
    </>
  );
}

export default App;
