const fs = require('fs');
let code = fs.readFileSync('src/components/CricketScoreboardThemes.tsx', 'utf-8');

// Classic
code = code.replace(/<div className="flex items-center border-l border-white\/20 pl-6 space-x-4 hidden md:flex">/, '<div className="flex items-center border-l border-white/20 pl-3 sm:pl-6 space-x-2 sm:space-x-4">');
code = code.replace(/<div className="flex items-center border-l border-white\/20 pl-6 hidden lg:flex">/, '<div className="flex items-center border-l border-white/20 pl-3 sm:pl-6">');
// Change w-24 to smaller on mobile
code = code.replace(/"font-bold truncate w-24"/g, '"font-bold truncate w-16 sm:w-24 text-xs sm:text-base"');
code = code.replace(/"truncate w-24"/g, '"truncate w-16 sm:w-24 text-xs sm:text-base"');
code = code.replace(/"font-bold mr-2 truncate w-20"/g, '"font-bold mr-2 truncate w-16 sm:w-20 text-xs sm:text-base"');

// IPL
code = code.replace(/<div className="flex items-center px-6 py-2 relative z-10 border-l border-white\/10 flex-1 justify-end space-x-6 hidden md:flex">/, '<div className="flex items-center px-3 sm:px-6 py-2 relative z-10 border-l border-white/10 flex-1 justify-end space-x-2 sm:space-x-6">');
code = code.replace(/<div className="flex items-center w-40">/g, '<div className="flex items-center w-28 sm:w-40">');
code = code.replace(/<div className="flex items-center w-40 opacity-70 ml-4">/g, '<div className="flex items-center w-28 sm:w-40 opacity-70 ml-2 sm:ml-4">');
code = code.replace(/<div className="border-l border-white\/10 pl-6 flex flex-col space-y-1">/g, '<div className="border-l border-white/10 pl-2 sm:pl-6 flex flex-col space-y-1">');
code = code.replace(/font-bold flex-1 truncate tracking-wide/g, "font-bold flex-1 truncate tracking-wide text-[10px] sm:text-sm");
code = code.replace(/font-bold mr-3 truncate w-24 tracking-wide/g, "font-bold mr-1 sm:mr-3 truncate w-16 sm:w-24 tracking-wide text-[10px] sm:text-sm");


// Modern
code = code.replace(/<div className="hidden md:flex items-center space-x-6 text-sm">/, '<div className="flex items-center space-x-2 sm:space-x-6 text-[10px] sm:text-sm">');
code = code.replace(/<div className="flex space-x-4">/g, '<div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4">');
code = code.replace(/<div className="flex justify-between w-36">/g, '<div className="flex justify-between w-24 sm:w-36">');
code = code.replace(/<div className="border-l border-slate-700 pl-6 flex items-center">/, '<div className="border-l border-slate-700 pl-2 sm:pl-6 flex flex-col sm:flex-row items-start sm:items-center">');
code = code.replace(/"text-slate-400 mr-2 truncate w-24"/g, '"text-slate-400 mr-1 sm:mr-2 truncate w-20 sm:w-24"');

fs.writeFileSync('src/components/CricketScoreboardThemes.tsx', code);
