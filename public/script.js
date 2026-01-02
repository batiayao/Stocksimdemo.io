let currentUser = null;
let portfolioHistory = [];
let stockPrices = {};
const API_KEY = 'YOUR_FMP_API_KEY'; // <-- replace with your API key
const stockSymbols = ['AAPL','TSLA','GOOG','AMZN','MSFT'];

// Fetch live stock prices
async function fetchStockPrices(){
  const symbols = stockSymbols.join(',');
  const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${API_KEY}`);
  const data = await response.json();
  data.forEach(stock => stockPrices[stock.symbol] = stock.price);
  updateStockDropdown();
}

// Update stock dropdown
function updateStockDropdown(){
  const stockSelect = document.getElementById('stockSelect');
  stockSelect.innerHTML='';
  for(let stock in stockPrices){
    stockSelect.innerHTML += `<option value="${stock}">${stock} - $${stockPrices[stock].toFixed(2)}</option>`;
  }
}

// Update prices every 60 sec
setInterval(fetchStockPrices, 60000);
fetchStockPrices();

// Predefined research
const researchData = {
  AAPL:"Apple Inc. — Tech giant, strong balance sheet, innovator.",
  TSLA:"Tesla — EV leader, high growth, volatile stock.",
  GOOG:"Alphabet — Search engine & AI leader.",
  AMZN:"Amazon — E-commerce & cloud computing giant.",
  MSFT:"Microsoft — Software & cloud services."
};
document.getElementById('researchSection').innerHTML = Object.entries(researchData)
  .map(([k,v])=>`<p><strong>${k}</strong>: ${v}</p>`).join('');

// Signup
function signup(){
  const name=document.getElementById('username').value;
  const email=document.getElementById('email').value;
  const password=document.getElementById('password').value;
  const plan=document.getElementById('plan').value;

  fetch('/signup',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name,email,password,plan})
  }).then(r=>r.json()).then(res=>{
    document.getElementById('authMsg').innerText=res.message;
  });
}

// Login
function login(){
  const email=document.getElementById('email').value;
  const password=document.getElementById('password').value;
  fetch('/login',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email,password})
  }).then(r=>r.json()).then(user=>{
    if(user.message){ document.getElementById('authMsg').innerText=user.message; return; }
    currentUser=user;
    document.getElementById('userDisplay').innerText=currentUser.name;
    document.getElementById('balance').innerText=currentUser.balance.toFixed(2);
    document.querySelector('.auth').style.display='none';
    document.querySelector('.dashboard').style.display='block';
    updatePortfolio();
  });
}

// Trade
function trade(type){
  const stock=document.getElementById('stockSelect').value;
  const shares=parseInt(document.getElementById('shares').value);
  const price=stockPrices[stock];
  fetch('/trade',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({email:currentUser.email,stock,type,shares,price})
  }).then(r=>r.json()).then(user=>{
    if(user.message){ alert(user.message); return; }
    currentUser=user;
    updatePortfolio();
  });
}

// Update portfolio
function updatePortfolio(){
  document.getElementById('balance').innerText=currentUser.balance.toFixed(2);
  const table=document.getElementById('portfolioTable');
  table.innerHTML='<tr><th>Stock</th><th>Shares</th><th>Value</th></tr>';
  let total=currentUser.balance;
  for(let s in currentUser.portfolio){
    const val=currentUser.portfolio[s]*stockPrices[s];
    total+=val;
    table.innerHTML+=`<tr><td>${s}</td><td>${currentUser.portfolio[s]}</td><td>$${val.toFixed(2)}</td></tr>`;
  }
  portfolioHistory.push(total);
  const ctx=document.getElementById('portfolioChart').getContext('2d');
  if(window.chart) window.chart.destroy();
  window.chart=new Chart(ctx,{
    type:'line',
    data:{
      labels:portfolioHistory.map((v,i)=>i+1),
      datasets:[{label:'Portfolio Value ($)',data:portfolioHistory,borderColor:'blue',fill:false}]
    },
    options:{responsive:true}
  });
}
