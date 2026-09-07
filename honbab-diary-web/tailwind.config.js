/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f5',
          100: '#e5ede8',
          200: '#ceddd3',
          300: '#adc6b6',
          400: '#8ca996',
          500: '#708f7b',
          600: '#577261',
          700: '#465b4e',
          800: '#3a4a40',
          900: '#323e37',
        },
        forest: {
          700: '#1e3d32',
          800: '#162c24',
          850: '#12241d',
          900: '#0e1c16',
          950: '#0a1410',
        },
        avocado: {
          50: '#f6f8f0',
          100: '#ebf1dd',
          200: '#d7e2bd',
          300: '#bcca94',
          400: '#9fb16d',
          500: '#7e934a',
          600: '#627536',
          700: '#4c5826', // DMC 936 Very Dark Avocado Green
          800: '#3c4720',
          900: '#272e14', // Deep container surface
          950: '#14180a',
        },
        yellowGreen: {
          50: '#f5f8f2',
          100: '#e8f0e2',
          200: '#d2e2c7',
          300: '#b4cea5',
          400: '#93b580',
          500: '#71935c', // DMC 3347 Medium Yellow Green
          600: '#587645',
          700: '#435a34',
          800: '#35472a',
          900: '#2c3b24',
          950: '#161e12',
        },
        luxury: {
          green: '#1B4731',      // 메인 컬러 (60%) 딥 그린
          greenDark: '#133624',  // 컨테이너/헤더 베이스
          greenDeep: '#0D2418',  // 다크모드/인풋 베이스
          cream: '#FDFBF4',      // 서브 컬러 (30%) 크림 화이트
          creamMuted: '#EAE5D5',
          gold: '#D4AF37',       // 포인트 컬러 (10%) 골드
          goldHover: '#C49F2C',
          goldLight: '#F3E5AB',
        },
      },
    },
  },
  plugins: [],
}
