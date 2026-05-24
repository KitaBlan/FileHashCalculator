function e(e,t,n=`text/plain`){let r=new Blob([e],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=t,a.style.display=`none`,document.body.appendChild(a),a.click(),document.body.removeChild(a),setTimeout(()=>URL.revokeObjectURL(i),100)}function t(e,t=!0){let n=`文件哈希计算结果 / File Hash Results
`+`=`.repeat(50)+`

`;return t&&(n+=`生成时间 / Generated: ${new Date().toLocaleString()}\n\n`),e.forEach(e=>{n+=`文件名 / File: ${e.filename}\n大小 / Size: ${e.size}\n`,Object.entries(e.hashValues).forEach(([e,t])=>{n+=`${e.toUpperCase()}: ${t}\n`}),n+=`
`}),n}function n(e){let t=new Set;e.forEach(e=>Object.keys(e.hashValues).forEach(e=>t.add(e)));let n=[`Filename`,`Size`,...[...t].map(e=>e.toUpperCase())].join(`,`)+`
`;return e.forEach(e=>{let r=[`"${e.filename}"`,`"${e.size}"`,...[...t].map(t=>e.hashValues[t]||``)];n+=r.join(`,`)+`
`}),n}function r(e){return JSON.stringify(e,null,2)}export{e as downloadFile,n as exportAsCsv,r as exportAsJson,t as exportAsTxt};
//# sourceMappingURL=download-GULkJhka.js.map