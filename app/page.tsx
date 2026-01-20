'use client'; 

import Navbar from "./components/Navbar";
import Button from "./components/Button";
import Input from "./components/Input";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");

  return (
    <main className="min-h-screen bg-gray-50">
     
      <Navbar />

      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Dobrodošli!
        </h1>
        
        <p className="text-gray-600 mb-6 text-center">
          test komponenti
        </p>

       
        <form className="space-y-4">
          <Input 
            label="Email" 
            name="email" 
            placeholder="ime@primer.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input 
            label="Lozinka" 
            name="password" 
            type="password" 
            placeholder="********" 
          />

         
          <Button 
            label="Započni Trening" 
            fullWidth={true} 
            onClick={() => alert(`Uneli ste email: ${email}`)} 
          />
        </form>
      </div>
    </main>
  );
}