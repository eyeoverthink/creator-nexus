const KEY='starter-agent-ollama',DEF={endpoint:'http://localhost:11434',model:''};
export const loadOllama=()=>{try{return {...DEF,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{return DEF;}};
export const saveOllama=v=>localStorage.setItem(KEY,JSON.stringify(v));