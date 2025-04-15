import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    const response = await fetch('http://localhost:5050/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token); // save login token
      navigate('/dashboard');
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="flex bg-slate-900 w-screen h-screen ">
        <section className="intro w-1/2 h-full">
            <div className="rounded-xl p-2 bg-cover h-full">
                <img className="rounded-xl w-full h-full object-cover" src="/images/bg-login.jpg" />
            </div>
        </section>
        <section className="login flex w-1/2 h-full mx-auto p-10 items-center justify-center">
            <div className="w-full">
                <h2 className="font-bold text-2xl text-white text-center">Sign in Chnage</h2>
                <form className="space-y-4 md:space-y-6">
                    <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-white">Username</label>
                        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-white">Password</label>
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                    </div>
                    <button onClick={handleLogin} className="bg-blue-700 text-black w-full rounded-md p-2 font-semibold">Login</button>
                </form> 
            </div>         
        </section>
    </div>
  );
}

export default LoginPage;
