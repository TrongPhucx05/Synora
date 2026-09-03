export function themeInitScript(storageKey: string) {
  return `(function(){try{var t=localStorage.getItem('${storageKey}');var d=document.documentElement;var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=t==='dark'||((t==='system'||!t)&&m);if(isDark){d.classList.add('dark');d.style.colorScheme='dark';}else{d.style.colorScheme='light';}}catch(e){}})();`;
}