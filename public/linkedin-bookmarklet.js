/**
 * LinkedIn Cookie Extraction Bookmarklet
 * This is a minified version that users can add as a bookmark
 * After logging into LinkedIn, user clicks the bookmarklet to extract and send cookies
 */

javascript:(function(){
  function extractCookies(){
    const cookies=[];
    const cookieString=document.cookie;
    if(!cookieString)return cookies;
    cookieString.split(';').forEach(pair=>{
      const trimmed=pair.trim();
      const equalIndex=trimmed.indexOf('=');
      if(equalIndex>0){
        cookies.push({
          name:trimmed.substring(0,equalIndex).trim(),
          value:trimmed.substring(equalIndex+1).trim(),
          domain:window.location.hostname
        });
      }
    });
    return cookies;
  }
  const cookies=extractCookies();
  if(cookies.length===0){
    alert('No cookies found. Please ensure you are logged into LinkedIn.');
    return;
  }
  const message={
    type:'LINKEDIN_SESSION_CAPTURED',
    source:'linkedin-bookmarklet',
    data:{
      cookies:cookies,
      url:window.location.href,
      isLoggedIn:true,
      timestamp:new Date().toISOString()
    }
  };
  if(window.opener&&!window.opener.closed){
    window.opener.postMessage(message,window.location.origin);
    alert('Session cookies sent! Check the Lead Stitch application.');
  }else{
    const cookieData=JSON.stringify(cookies,null,2);
    const newWindow=window.open('','_blank');
    newWindow.document.write('<html><head><title>LinkedIn Cookies</title></head><body><h1>LinkedIn Session Cookies</h1><p>Copy the cookies below and paste them in the Lead Stitch application:</p><textarea style="width:100%;height:300px;">'+cookieData+'</textarea><p><button onclick="window.close()">Close</button></p></body></html>');
  }
})();

