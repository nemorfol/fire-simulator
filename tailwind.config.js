 /** @type {import('tailwindcss').Config} */
 export default {
   content: [
     "./index.html",
     "./src/**/*.{vue,js,ts,jsx,tsx}",
   ],
   safelist: [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-400',
    'bg-green-400',
  ],
   theme: {
     extend: {},
   },
   plugins: [],
 }