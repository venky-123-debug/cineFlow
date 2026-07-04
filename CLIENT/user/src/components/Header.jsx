import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Header({ selectedCity, onCityChange, searchQuery, onSearchChange }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/theatres/cities', {
          headers: { 'access-token': token },
        });
        if (res.data.success && res.data.data?.length > 0) {
          setCities(res.data.data);
          // Set default city if not set
          if (!selectedCity && onCityChange) {
            onCityChange(res.data.data[0]);
          }
        } else {
          // Fallback cities
          setCities(['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune']);
          if (!selectedCity && onCityChange) {
            onCityChange('Bangalore');
          }
        }
      } catch (err) {
        console.error('Failed to fetch cities', err);
        setCities(['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune']);
        if (!selectedCity && onCityChange) {
          onCityChange('Bangalore');
        }
      }
    };
    fetchCities();
  }, []);

  const handleLogout = () => {
    dispatch({ type: 'auth/logout' });
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Brand & City Pin */}
      <div className="flex items-center justify-between md:justify-start gap-6">
        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent tracking-wider hover:opacity-90 transition-opacity">
          CINEFLOW
        </Link>
        
        {/* City Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 text-sm text-gray-300">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <select 
            value={selectedCity || ''} 
            onChange={(e) => onCityChange && onCityChange(e.target.value)}
            className="bg-transparent border-none text-white focus:outline-none cursor-pointer pr-4"
          >
            {cities.map((city) => (
              <option key={city} value={city} className="bg-slate-900 text-white">
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      {onSearchChange !== undefined && (
        <div className="flex-1 max-w-md mx-0 md:mx-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for movies, genres, languages..."
            className="w-full bg-slate-900/60 border border-slate-800 text-white pl-10 pr-4 py-2 rounded-full focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-gray-500 transition-all text-sm"
          />
        </div>
      )}

      {/* Nav Links & Actions */}
      <div className="flex items-center gap-4 text-sm">
        <Link 
          to="/my-bookings" 
          className="text-gray-300 hover:text-indigo-400 transition-colors font-medium flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
          </svg>
          My Bookings
        </Link>

        <div className="h-4 w-[1px] bg-slate-800 hidden md:block"></div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-white font-medium text-xs">{user?.name}</span>
            <span className="text-gray-500 text-[10px] uppercase font-bold">{user?.role}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-full hover:bg-slate-800 text-gray-400 hover:text-red-400 transition-colors"
            title="Sign Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
