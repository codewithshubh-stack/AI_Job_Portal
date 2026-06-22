import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppRoutes from './routes/Routes';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import { ThemeProvider } from './context/ThemeContext';

function MainLayout() {
  const { user } = useAuth();

  return (
    <div class="flex flex-col min-h-screen bg-slate-950 text-slate-100 dark:bg-slate-950 dark:text-slate-100 light:bg-slate-50 light:text-slate-900 transition-colors duration-300 relative">
      {/* Background glow effects - hidden in light mode for better readability */}
      <div class="absolute top-0 left-[10%] w-[500px] h-[500px] rounded-full bg-glow-indigo pointer-events-none dark:block hidden"></div>
      <div class="absolute bottom-10 right-[5%] w-[450px] h-[450px] rounded-full bg-glow-fuchsia pointer-events-none dark:block hidden"></div>

      {user && <Navbar />}
      
      {/* Main Content Area */}
      <main class={`flex-grow relative z-10 ${user ? 'container mx-auto px-4 md:px-6 py-8' : ''}`}>
        <AppRoutes />
      </main>

      {user && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
