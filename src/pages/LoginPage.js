import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token); // save login token
      navigate('/');
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="flex bg-black w-screen h-screen ">
        <section className="intro w-1/2 h-full">
            <div className="rounded-xl p-2 bg-cover h-full">
                <img className="rounded-xl w-full h-full object-cover" src="/images/bg-login.jpg" />
            </div>
        </section>
        <section className="login flex w-1/2 h-full mx-auto p-10 px-28 items-center justify-center">
            <div className="w-full">
                <h2 className="font-bold text-2xl text-white text-center">Sign In</h2>
                <form className="space-y-4 md:space-y-6" onSubmit={(e) => {e.preventDefault(); handleLogin()}}>
                    <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-white">Username</label>
                        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="bg-transparent border-2 border-gray-300 text-white rounded-lg focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 block w-full p-2.5" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-white">Password</label>
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="bg-transparent border-2 border-gray-300 text-white rounded-lg focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 block w-full p-2.5" />
                    </div>
                    <div className='mt-4'>
                      <button type="submit" className="bg-white text-black w-full rounded-md px-2 py-3 font-semibold">Login</button>
                    </div>
                    
                </form> 
            </div>         
        </section>
    </div>
  );
}

export default LoginPage;
